const CONSTANTS = require('./Util/CONSTANTS.js');
const express = require('express');
const FETCH = require('node-fetch');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const TTV_API_CLAIMS = {
    email:              "Email address of the authorizing user",
    email_verified:     "Email verification state of the authorizing user",
    picture:            "Profile image URL of the authorizing user",
    preferred_username: "Display name of the authorizing user",
    updated_at:         "Date of the last update to the authorizing user’s profile"
};

const TTV_API_SCOPES = {
    "analytics:read:extensions": "View analytics data for your extensions",
    "analytics:read:games": "View analytics data for your game",
    "bits:read": "View Bits information for your channel",
    "channel:edit:commercial": "Run commercials on a channel.",
    "channel:manage:broadcast": "Manage your channel’s broadcast configuration, including updating channel configuration and managing stream markers and stream tags.",
    "channel:manage:extension": "Manage your channel’s extension configuration, including activating extensions.",
    "channel:read:hype_train": "Gets the most recent hype train on a channel.",
    "channel:read:stream_key": "Read an authorized user’s stream key.",
    "channel:read:subscriptions": "Get a list of all subscribers to your channel and check if a user is subscribed to your channel",
    "clips:edit": "Manage a clip object.",
    "user:edit": "Manage a user object.",
    "user:edit:follows": "Edit your follows.",
    "user:read:broadcast": "View your broadcasting configuration, including extension configurations.",
    "user:read:email": "Read an authorized user’s email address."
};

const CONFIG_TEMPLATE = {
    "Bot_User_ID":          "string/integer",
    "Client_ID":            "string",
    "Client_OAuth":         "string",
    "Client_Redirect_Uri":  "URL",
    "Client_Secret":        "string",
    "Scopes":               "array",
    "Claims":               "array",
	"Tokens_Dir":           "path"
};

const TTV_JWK_URL = "https://id.twitch.tv/oauth2/keys";

class TwitchAPI {
    constructor(settings = {}, expressApp, twitchChat, logger) {
        //INIT
        this.Settings = {
            Bot_User: "",
            Bot_User_ID: "",
            Client_ID: "",
            Client_OAuth: "",
            Client_Redirect_Uri: "",
            Client_Secret: "",
            Scopes: [],
            Claims: {  },
            Tokens_Dir: "Tokens/"
        };

        //Ensure settings is an object
        if (typeof settings == "object" && settings.length == undefined) {
            for (let setting in settings) {
                //one time nesting
                if (typeof settings[setting] == "object" && settings[setting].length == undefined) {
                    for (let innerSetting in settings[setting]) {
                        this.Settings[setting][innerSetting] = settings[setting][innerSetting];
                    }
                } else {
                    this.Settings[setting] = settings[setting];
                }
            }
        }

        this.expressApp = expressApp;
        this.twitchChat = twitchChat;

        //LOGGER
        logger.addSources({
            TwitchAPI: {
                display: () => " TwitchAPI ".inverse.magenta
            }
        });
        this.setLogger(logger.TwitchAPI);

        //API Stuff
        this.RateLimits = null;

        this.AppAccessToken = null;
        this.UserAccessToken = null;
        
        if (this.expressApp) {
            //API Routung
            let router = express.Router();
            router.get('/Scopes', async (request, response) => {
                //AUTHENTICATION
                if (true) {
                    //SUCCESS
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        data: {                             //Data
                            scopes: this.Settings.Scopes,
                            claims: this.Settings.Claims,
                            v5: this.Settings.v5
                        }
                    });
                } else {
                    //FAILED
                    response.json({
                        status: CONSTANTS.STATUS_FAILED,   //Sending Failed confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        err: "Authentication Failed"        //error Message
                    });
                }
            });
            router.get('/GetClientID', async (request, response) => {
                response.json({
                    status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                    req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                    data: {                             //Data
                        data: this.Settings.Client_ID
                    }
                });
            });
            router.post('/BotUserTTVLogInPage', async (request, response) => {
                //AUTHENTICATION
                if (true) {
                    //SET SCOPES
                    let claims = this.getClaims();
                    let scopes = this.CombineScopes();

                    response.send(this.generateUserAccessLinkCode(scopes, claims));
                } else {
                    //FAILED
                    response.json({
                        status: CONSTANTS.STATUS_FAILED,   //Sending Failed confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        err: "Authentication Failed"        //error Message
                    });
                }
            });
            router.get('/WebUserTTVLoginPage', async (request, response) => {
                response.json({
                    data: this.generateUserAccessLinkToken({id_token: { preferred_username: null, picture: null }})
                });
            });
            router.post('/auth', async (req, res) => {
                const header = req.headers['authorization'];
                const token = header && header.split(" ")[1];

                if (!token) return res.json({ err: "Authorization missing." });

                try {
                    let user = await this.VerifyTTVJWT(token);
                    return res.json({ data: user });
                } catch (err) {
                    return res.json({ err: err.message });
                }
            });
            this.expressApp.use('/api/TwitchAPI', router);
        }
    }

    //////////////////////////////////////////////////////////////////////
    //                          SETUP
    //////////////////////////////////////////////////////////////////////

    async Init() {
        if (!fs.existsSync(this.Settings.Tokens_Dir)) {
            try {
                fs.mkdirSync(path.resolve(this.Settings.Tokens_Dir));
            } catch (err) {
                console.log(err);
            }
        }

        if (!fs.existsSync(path.resolve(this.Settings.Tokens_Dir + "AppAccess/"))) {
            try {
                fs.mkdirSync(path.resolve(this.Settings.Tokens_Dir + "AppAccess/"));
            } catch (err) {
                console.log(err);
            }
        }

        if (!fs.existsSync(path.resolve(this.Settings.Tokens_Dir + "UserAccess/"))) {
            try {
                fs.mkdirSync(path.resolve(this.Settings.Tokens_Dir + "UserAccess/"));
            } catch (err) {
                console.log(err);
            }
        }

        try {
            await this.updateAppAccessToken();
            this.Logger.info("App Access Token found!".green);
        } catch (err) {
            return Promise.reject(err);
        }

        try {
            await this.updateUserAccessToken();
            this.Logger.info("User Access Token found!".green);
        } catch (err) {
            return Promise.reject(err);
        }
        
        return Promise.resolve();
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWTICH AUTHORIZATION
    //////////////////////////////////////////////////////////////////////

    /// APP ACCESS
    async getAppAccessToken() {
        let URL = "https://id.twitch.tv/oauth2/token?";
        URL += "client_id=" + this.Settings.Client_ID;
        URL += "&client_secret=" + this.Settings.Client_Secret;
        URL += "&grant_type=client_credentials";
        URL += "&scope=";

        for (let scope of this.Settings.Scopes) {
            URL += scope + "+";
        }

        URL = URL.substring(0, URL.length - 1);
        
        let options = {
            method: "POST"
        };
        
        return FETCH(URL, options)
            .then(data => data.json())
            .then(json => {
                if (json && json.access_token) {
                    return Promise.resolve(json);
                } else {
                    return Promise.reject(json);
                }
            })
            .catch(err => Promise.reject(err));
    }
    async updateAppAccessToken() {
        //Current is still valid?
        if (this.AppAccessToken && this.AppAccessToken.access_token) {
            try {
                await this.CheckAccessToken(this.AppAccessToken.access_token)
                return Promise.resolve(this.AppAccessToken);
            } catch (err) {
                this.AppAccessToken = null;
                return this.updateAppAccessToken();
            }
        }
        
        //Check Old Tokens
        let oldTokens = this.readTokensFromFile("AppAccess");

        for (let token of oldTokens) {
            //Is still valid?
            try {
                await this.CheckAccessToken(token.access_token);
                this.AppAccessToken = token;
                return Promise.resolve(token);
            } catch {
                //Invalid -> DELETE
                try {
                    //REVOKE
                    let resp = await this.revoke(token.access_token);
                    this.Logger.warn("Revoked App Access Token:" + resp);

                    if (resp != "200 OK")
                        continue;

                    //Delete OLD
                    this.Logger.warn("Deleting Old App Access Token!");
                    fs.unlinkSync(this.Settings.Tokens_Dir + "AppAccess/" + token.access_token + ".json");
                } catch (err) {
                    this.Logger.error("Revoking/Deleting Old App Access Token FAILED! - " + err.message);
                    continue;
                }
            }
        }

        try {
            //GET NEW
            let newToken = await this.getAppAccessToken();

            //SAVE NEW
            if (newToken && newToken.access_token) {
                this.setExtraTokenDetails(newToken);
                this.saveToken(newToken, "AppAccess");
                this.AppAccessToken = newToken;
                return Promise.resolve(newToken);
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /// USER ACCESS
    generateUserAccessLinkCode(scopes = [], claims) {
        let querry = "https://id.twitch.tv/oauth2/authorize";
        querry += "?client_id=" + this.Settings.Client_ID;
        querry += "&redirect_uri=" + this.Settings.Client_Redirect_Uri;
        querry += "&response_type=code";
        querry += "&scope=";

        for (let scope of scopes) {
            querry += scope + "+";
        }
        
        querry += "openid";

        if (claims) {
            querry += "&claims=" + JSON.stringify(claims);
        }

        querry += "&force_verify=true"

        return querry;
    }
    generateUserAccessLinkToken(claims) {
        let query = "https://id.twitch.tv/oauth2/authorize"
        query += "?client_id=" + this.Settings.Client_ID;
        query += "&redirect_uri=" + this.Settings.Client_Redirect_Uri;
        query += "&response_type=id_token";
        query += "&force_verify=true";
        query += "&scope=openid";

        if (claims) {
            query += "&claims=" + JSON.stringify(claims);
        }

        return query;
    }

    async getUserAccessToken(code) {
        let URL = "https://id.twitch.tv/oauth2/token";
        URL += "?client_id=" + this.Settings.Client_ID;
        URL += "&client_secret=" + this.Settings.Client_Secret;
        URL += "&code=" + code;
        URL += "&grant_type=authorization_code";
        URL += "&redirect_uri=" + this.Settings.Client_Redirect_Uri;

        let options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        };

        return new Promise(async (resolve, reject) => {
            FETCH(URL, options)
                .then(data => {
                    //console.log(data.headers);
                    return data.json();
                })
                .then(json => {
                    if (json && json.access_token) {
                        resolve(json);
                    } else {
                        reject(json);
                    }
                })
                .catch(err => reject(err));
        });
    }
    async createUserAccessToken(code, scopes) {
        return new Promise(async (resolve, reject) => {
            try {
                //GET NEW
                let newToken = await this.getUserAccessToken(code);

                //SAVE NEW
                if (newToken && newToken.access_token) {
                    let userData = await this.OIDCUserInfoEndpoint(newToken.access_token);
                    
                    if (userData.sub != this.Settings.Bot_User_ID) {
                        reject(new Error("This User is not Authorized to log in as the Bot User!"));
                        return;
                    }

                    console.log("[" + "INFO".green + "] " + userData.preferred_username + " just logged in as Bot API User!");

                    this.setExtraTokenDetails(newToken);
                    this.saveToken(newToken, "UserAccess");
                    this.UserAccessToken = newToken;
                    resolve(newToken);
                } else {
                    reject(newToken);
                }
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    }
    async updateUserAccessToken() {
        //Current is still valid?
        if (this.UserAccessToken && this.UserAccessToken.access_token) {
            try {
                await this.CheckAccessToken(this.UserAccessToken.access_token)
                return Promise.resolve(this.UserAccessToken);
            } catch (err) {
                this.UserAccessToken = null;
                return this.updateUserAccessToken();
            }
        }

        //Get all old Tokens
        let oldTokens = this.readTokensFromFile("UserAccess");

        for (let token of oldTokens) {
            //Is still valid?
            try {
                await this.CheckAccessToken(token.access_token);
                this.UserAccessToken = token;
                return Promise.resolve(token);
            } catch {
                //REFRESHABLE?
                try {
                    let resp = await this.refresh(token);
                    if (resp.error || resp.status == 400) {
                        this.Logger.error("Refresh Error: " + resp.message);
                        this.Logger.warn("Deleting Old User Access Token!");
                        fs.unlinkSync(this.Settings.Tokens_Dir + "UserAccess/" + token.access_token + ".json");
                        continue;
                    }
                    this.Logger.info("Refreshed User Access Token!");

                    //set new Token
                    this.setExtraTokenDetails(resp);
                    this.saveToken(resp, "UserAccess");
                    this.UserAccessToken = resp;

                    this.Logger.warn("Deleting Old User Access Token!");
                    fs.unlinkSync(this.Settings.Tokens_Dir + "UserAccess/" + token.access_token + ".json");
                    return Promise.resolve(this.UserAccessToken);
                } catch (err) {
                    this.Logger.error("Refreshing Old User Access Token Failed: " + err.message);
                }
            }
        }

        //ASK FOR NEW LOGIN
        if (!this.UserAccessToken)
            return Promise.reject(new Error("Pls log in again"));
    }
    
    async revoke(token) {
        //ONLY APP ACCESS AND OAuth
        return FETCH("https://id.twitch.tv/oauth2/revoke?client_id=" + this.Settings.Client_ID + "&token=" + token, { method: "POST" })
            .then(async (data) => {
                if (data.status == 200 && data.statusText == "OK") {
                    return Promise.resolve("200 OK");
                } else {
                    return data.json();
                }
            })
            .then(json => Promise.resolve(json))
            .catch(err => Promise.reject(err));
    }
    async refresh(token) {
        //Only UserAccess Token
        if (!token || !token.refresh_token) {
            return Promise.reject(new Error("No Token found."));
        }

        let querry = "?grant_type=refresh_token";
        querry += "&refresh_token=" + encodeURI(token.refresh_token);
        querry += "&client_id=" + this.Settings.Client_ID;
        querry += "&client_secret=" + this.Settings.Client_Secret;

        return FETCH("https://id.twitch.tv/oauth2/token" + querry, { method: "POST" })
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(json);
                } else {
                    return Promise.resolve(json);
                }
            })
            .catch(err => Promise.reject(err));
    }
    async OIDCUserInfoEndpoint(oauth) {
        return await this.request("https://id.twitch.tv/oauth2/userinfo", {
            headers: {
                'Authorization': 'Bearer ' + oauth
            }
        }, json => {
            return json;
        });
    }
    async CheckAccessToken(token) {
        this.Logger.warn("Checking Access Token...");

        //No Scopes/No Params -> using Stream Endpoint
        try {
            let resp = await this.request("https://api.twitch.tv/helix/streams?first=1", {
                headers: {
                    'Client-ID': this.Settings.Client_ID,
                    'Authorization': "Bearer " + token
                }
            }, json => {
                return json;
                });
            
            if (resp && resp.data) {
                return Promise.resolve(true);
            } else {
                return Promise.reject(new Error("No Data Fetched -> Token may be invalid!"));
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async VerifyTTVJWT(token) {
        return new Promise((resolve, reject) => {
            let client = jwksClient({ jwksUri: TTV_JWK_URL });
            function getKey(header, callback) {
                client.getSigningKey(header.kid, function (err, key) {
                    var signingKey = key.publicKey || key.rsaPublicKey;
                    callback(null, signingKey);
                });
            }
            jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, user) => {
                if (err) return reject(err);
                else return resolve(user);
            });
        });
    }


    setExtraTokenDetails(token) {
        //Add created_at
        let date = new Date();
        token.created_at = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

        //Add expires_at
        date = new Date(Date.now() + (token.expires_in * 1000));
        token.expires_at = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    }
    saveToken(token, type) {
        writeFile(this.Settings.Tokens_Dir + type + "/" + token.access_token + ".json", JSON.stringify(token, null, 4));
    }
    readTokensFromFile(type) {
        let files = [];
        let tokens = [];

        try {
            files = fs.readdirSync(this.Settings.Tokens_Dir + type + "/");
        } catch (err) {
            console.log(err);
        }

        for (let file of files) {
            try {
                tokens.push(JSON.parse(readFile(this.Settings.Tokens_Dir + type + "/" + file)));
            } catch(err) {
                console.log(err);
            }
        }

        return tokens;
    }

    getClaims() {
        let output = {

        };

        for (let key in this.Settings.Claims) {
            output[key] = null;
        }

        return { userinfo: output };
    }
    CombineScopes() {
        let output = [];

        for (let scope of this.Settings.Scopes) {
            output.push(scope);
        }

        for (let scope of this.Settings.v5) {
            output.push(scope);
        }

        return output;
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWITCH API
    //////////////////////////////////////////////////////////////////////
    // - Query Parameters in form: { name: value }
    //      Value can be an array -> contents will be connected like this: 
    //       -> ?name=value0&name=value1&...
    //////////////////////////////////////////////////////////////////////

    getQueryStringFromQueryParameters(Query_Parameters = {}) {
        let querry = "";

        for (let param in Query_Parameters) {
            if (Array.isArray(Query_Parameters[param])) {
                for (let value of Query_Parameters[param]) {
                    querry += "&" + param + "=" + value;
                }

            } else {
                querry += "&" + param + "=" + Query_Parameters[param];
            }
        }
        if (querry == "") {
            return "";
        } else {
            return "?" + querry.substring(1);
        }
    }
    async AccessTwitchNewAPI(ENDPOINT_URL, TOKEN_TYPE = "AnyAccessToken", METHOD = "GET", BODY, RETURN_RAW = false, RETRYS = 3) {
        let used_token = null;
        let theactualtoken = null;

        if (TOKEN_TYPE == "UserAccessToken") {
            //USER ACCESS
            if (!this.UserAccessToken) {
                return Promise.reject(new Error("User Access Token NOT Available!"));
            }
            used_token = "UserAccessToken";
            theactualtoken = this.UserAccessToken;
        } else if (TOKEN_TYPE == "AppAccessToken") {
            //APP ACCESS
            if (!this.AppAccessToken) {
                return Promise.reject(new Error("App Access Token NOT Available!"));
            }
            used_token = "AppAccessToken";
            theactualtoken = this.AppAccessToken;
        } else if (TOKEN_TYPE == "AnyAccessToken") {
            //ANY ACCESS
            if (this.AppAccessToken) {
                //APP ACCESS
                used_token = "AppAccessToken";
                theactualtoken = this.AppAccessToken;
            } else if (this.UserAccessToken) {
                //USER ACCESS
                used_token = "UserAccessToken";
                theactualtoken = this.UserAccessToken;
            } else {
                return Promise.reject(new Error("NO Access Token Available!"));
            }
        } else {
            return Promise.reject(new Error("Access Token Type NOT found!"));
        }

        if (used_token == null || theactualtoken == null) {
            return Promise.reject(new Error("Access Token NOT Available!"));
        }
        
        const OPTIONS = {
            method: METHOD,
            headers: {
                'Authorization': 'Bearer ' + theactualtoken.access_token,
                'Client-ID': this.Settings.Client_ID,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(BODY)
        };
        
        return FETCH(CONSTANTS.TTV_API_ROOT_URL + ENDPOINT_URL, OPTIONS)
            .then(data => {
                if (RETURN_RAW) {
                    return data.text();
                } else {
                    return data.json();
                }
            })
            .then(async data => {
                //Retry / Auto Update
                if (data instanceof Object && data.error == "Unauthorized" && data.message == "Invalid OAuth token") {
                    if (RETRYS > 0) {
                        this.Logger.info("Retry Accessing Twitch API: " + ENDPOINT_URL);
                        return this.AccessTwitchNewAPI(ENDPOINT_URL, TOKEN_TYPE, METHOD, BODY, RETURN_RAW, RETRYS - 1);
                    } else if (RETRYS == 0) {
                        //Auto Update Token
                        try {
                            if (used_token == "UserAccessToken") {
                                await this.updateUserAccessToken();
                            } else if (used_token == "AppAccessToken") {
                                await this.updateAppAccessToken();
                            }
                            
                            return this.AccessTwitchNewAPI(ENDPOINT_URL, TOKEN_TYPE, METHOD, BODY, RETURN_RAW, RETRYS - 1);
                        } catch (err) {
                            console.log(err);
                            return Promise.reject(new Error("Unauthorized - OAuth Token invalid, outdated or missing!"));
                        }
                    } else {
                        return Promise.reject(new Error("Unauthorized - OAuth Token invalid, outdated or missing!"));
                    }
                }

                return Promise.resolve(data);
            })
            .catch(err => Promise.reject(err));
    }

    //Ads
    async StartCommercial(Query_Parameters) {
        return this.AccessTwitchNewAPI("/channels/commercial" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken", "POST", { broadcaster_id: broadcaster_id, lenght: length });
    }

    //Analytics
    async GetExtensionAnalytics(Query_Parameters) {
        return this.AccessTwitchNewAPI("/analytics/extensions" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetGameAnalytics(Query_Parameters) {
        return this.AccessTwitchNewAPI("/analytics/extensions/games" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }

    //Bits
    async GetCheermotes(Query_Parameters) {
        return this.AccessTwitchNewAPI("/bits/cheermotes" + this.getQueryStringFromQueryParameters(Query_Parameters), "AppAccessToken");
    }
    async GetBitsLeaderboard(Query_Parameters) {
        return this.AccessTwitchNewAPI("/bits/leaderboard" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetExtensionTransactions(Query_Parameters) {
        Query_Parameters.extension_id = extension_id;
        return this.AccessTwitchNewAPI("/extensions/transactions" + this.getQueryStringFromQueryParameters(Query_Parameters), "AppAccessToken");
    }

    //Clips
    async CreateClip(Query_Parameters, body) {
        Query_Parameters.broadcaster_id = broadcaster_id;
        return this.AccessTwitchNewAPI("/clips" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken", "POST", body);
    }
    async GetClips(Query_Parameters) {
        return this.AccessTwitchNewAPI("/clips" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }

    //Entitlements
    async CreateEntitlementGrantsUploadURL(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/entitlements/upload" + this.getQueryStringFromQueryParameters(Query_Parameters), "AppAccessToken", "POST", body);
    }
    async GetCodeStatus(Query_Parameters) {
        return this.AccessTwitchNewAPI("/entitlements/codes" + this.getQueryStringFromQueryParameters(Query_Parameters), "AppAccessToken");
    }
    async RedeemCode(Query_Parameters) {
        return this.AccessTwitchNewAPI("/entitlements/code" + this.getQueryStringFromQueryParameters(Query_Parameters), "AppAccessToken");
    }

    //Games
    async GetTopGames(Query_Parameters) {
        return this.AccessTwitchNewAPI("/games/top" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async GetGames(Query_Parameters) {
        return this.AccessTwitchNewAPI("/games" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }

    //Moderation
    async CheckAutoModStatus(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/moderation/enforcements/status" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "POST", body);
    }
    async GetBannedUsers(Query_Parameters) {
        return this.AccessTwitchNewAPI("/moderation/banned" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetBannedEvents(Query_Parameters) {
        return this.AccessTwitchNewAPI("/moderation/banned/events" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetModerators(Query_Parameters) {
        return this.AccessTwitchNewAPI("/moderation/moderators" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetModeratorEvents(Query_Parameters) {
        return this.AccessTwitchNewAPI("/moderation/moderators/events" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }

    //Search
    async SearchCategories(Query_Parameters) {
        return this.AccessTwitchNewAPI("/search/categories" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async SearchChannels(Query_Parameters) {
        return this.AccessTwitchNewAPI("/search/channels" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }

    //Streams
    async GetStreamKey(Query_Parameters) {
        return this.AccessTwitchNewAPI("/streams/key" + this.getQueryStringFromQueryParameters(Query_Parameters) + broadcaster_id, "UserAccessToken");
    }
    async GetStreams(Query_Parameters) {
        return this.AccessTwitchNewAPI("/streams" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async GetStreamsMetadata(Query_Parameters) {
        return this.AccessTwitchNewAPI("/streams/metadata" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async CreateStreamMarker(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/streams/markers" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "POST", body);
    }
    async GetStreamMarkers(Query_Parameters) {
        return this.AccessTwitchNewAPI("/streams/markers" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetChannelInformation(Query_Parameters) {
        return this.AccessTwitchNewAPI("/channels" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async ModifyChannelInformation(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/channels" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "POST", body);
    }

    //Subscriptions
    async GetBroadcasterSubscriptions(Query_Parameters) {
        return this.AccessTwitchNewAPI("/subscriptions" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }

    //Tags
    async GetAllStreamTags(Query_Parameters) {
        return this.AccessTwitchNewAPI("/tags/streams" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async GetStreamTags(Query_Parameters) {
        return this.AccessTwitchNewAPI("/streams/tags" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async ReplaceStreamTags(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/streams/tags" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "PUT", body);
    }

    //Users
    async CreateUserFollows(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/users/follows" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "POST", body);
    }
    async DeleteUserFollows(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/users/follows" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "DELETE", body);
    }
    async GetUsers(Query_Parameters) {
        return this.AccessTwitchNewAPI("/users" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async GetUsersFollows(Query_Parameters) {
        return this.AccessTwitchNewAPI("/users/follows" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    async UpdateUser(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/users" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "PUT", body);
    }
    async GetUserExtensions(Query_Parameters) {
        return this.AccessTwitchNewAPI("/users/extensions/list" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async GetUserActiveExtensions(Query_Parameters) {
        return this.AccessTwitchNewAPI("/users/extensions" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken");
    }
    async UpdateUserExtensions(Query_Parameters, body) {
        return this.AccessTwitchNewAPI("/users/extensions" + this.getQueryStringFromQueryParameters(Query_Parameters), "UserAccessToken", "PUT", body);
    }

    //Videos
    async GetVideos(Query_Parameters) {
        return this.AccessTwitchNewAPI("/videos" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }

    //Webhooks
    async GetWebhookSubscriptions(Query_Parameters) {
        return this.AccessTwitchNewAPI("/webhooks/subscriptions" + this.getQueryStringFromQueryParameters(Query_Parameters), "AppAccessToken");
    }

    //HypeTrain
    async GetHypeTrainEvents(Query_Parameters) {
        return this.AccessTwitchNewAPI("/hypetrain/events" + this.getQueryStringFromQueryParameters(Query_Parameters), "AnyAccessToken");
    }
    
    //not Helix
    async getBadges() {
        return new Promise(async (resolve, reject) => {
            let output = null;
            try {
                await this.request("https://badges.twitch.tv/v1/badges/global/display?language=en", {}, json => {
                    output = json.badge_sets;
                });
                resolve(output);
            } catch (err) {
                reject(err);
            }
        });
    }

    /////////////////////////////////////////////////
    //                  UTIL
    /////////////////////////////////////////////////
    
    getClientID(){
        return this.Settings.Client_ID;
    }
    async request(URL, options, callback, raw) {
        return await FETCH(URL, options)
            .then(async (data) => {
                for (let symbol of Object.getOwnPropertySymbols(data)) {
                    if (symbol.toString() == "Symbol(Response internals)") {

                        //HERE HEADERS - TWITCH RATELIMIT CHECK
                        //console.log(data[symbol]);
                        this.RateLimits = data[symbol];
                    }
                }

                if (raw) {
                    return await data.text()
                        .then(callback);
                }

                return await data.json()
                    .then(callback);
            })
            .catch(err => console.log(err));
    }
    setLogger(loggerObject) {
        if (loggerObject && loggerObject.info && loggerObject.warn && loggerObject.error) {
            this.Logger = loggerObject;
        } else {
            this.Logger = {
                info: console.log,
                warn: console.log,
                error: console.log
            };
        }
    }
}

function writeFile(path, data) {
    let fd;

    try {
        fd = fs.openSync(path, 'w');
        fs.writeSync(fd, data);
    } catch (err) {
        /* Handle the error */
        console.log(err);
        return err;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        } else {
            return "fd was undefinded";
        }
    }

    return null;
}
function readFile(path) {
    try {
        //File/Path present/valid ?
        fs.accessSync(path, fs.constants.F_OK);

        //read File
        return fs.readFileSync(path);

    } catch (err) {
        console.log("ERROR: " + err);
        return null;
    }
}

module.exports.TwitchAPI = TwitchAPI;
module.exports.CONFIG_TEMPLATE = {
    "Bot_User": "",
    "Bot_User_ID": "",
    "Client_ID": "",
    "Client_OAuth": "",
    "Client_Redirect_Uri": "",
    "Client_Secret": "",
    "Scopes": [ ],
    "Claims": [ ],
    "Tokens_Dir": "Tokens/"
};