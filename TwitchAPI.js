const CONSTANTS = require('./Util/CONSTANTS.js');
const CONFIGHANDLER = require('./ConfigHandler.js');
const WEBAPP = require('./WebApp');

const express = require('express');
const FETCH = require('node-fetch');

const fs = require('fs');
const path = require('path');

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const Datastore = require('nedb');

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
const TTV_JWK_URL = "https://id.twitch.tv/oauth2/keys";

const TTV_API_INFO = {
    "Start Commercial": {
        token_type: 'User',
        method: 'POST',
        url: '/channels/commercial',
        req_scope: null
    },
    "Get Extension Analytics": {
        token_type: 'User',
        method: 'GET',
        url: '/analytics/extensions',
        req_scope: 'analytics:read:extensions'
    },
    "Get Game Analytics": {
        token_type: 'User',
        method: 'GET',
        url: '/analytics/games',
        req_scope: 'analytics:read:games'
    },
    "Get Bits Leaderboard": {
        token_type: 'User',
        method: 'GET',
        url: '/bits/leaderboard',
        req_scope: 'bits:read'
    },
    "Get Cheermotes": {
        token_type: 'Any',
        method: 'GET',
        url: '/bits/cheermotes',
        req_scope: null
    },
    "Get Extension Transactions": {
        token_type: 'Any',
        method: 'GET',
        url: '/extensions/transactions',
        req_scope: null
    },
    "Get Channel Information": {
        token_type: 'Any',
        method: 'GET',
        url: '/channels',
        req_scope: null
    },
    "Modify Channel Information": {
        token_type: 'User',
        method: 'PATCH',
        url: '/channels',
        req_scope: 'user:edit:broadcast'
    },
    "Get Channel Editors": {
        token_type: 'User',
        method: 'GET',
        url: '/channels/editors',
        req_scope: 'channel:read:editors'
    },
    "Create Custom Rewards": {
        token_type: 'User',
        method: 'POST',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:manage:redemptions'
    },
    "Delete Custom Rewards": {
        token_type: 'User',
        method: 'DELETE',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:manage:redemptions'
    },
    "Update Custom Rewards": {
        token_type: 'User',
        method: 'PATCH',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:manage:redemptions'
    },
    "Get Custom Rewards": {
        token_type: 'User',
        method: 'GET',
        url: '/channel_points/custom_rewards',
        req_scope: 'channel:read:redemptions'
    },
    "Get Custom Reward Redemption": {
        token_type: 'User',
        method: 'GET',
        url: '/channel_points/custom_rewards/redemptions',
        req_scope: 'channel:read:redemptions'
    },
    "Update Redemption Status": {
        token_type: 'User',
        method: 'PATCH',
        url: '/channel_points/custom_rewards/redemptions',
        req_scope: 'channel:manage:redemptions'
    },
    "Create Clip": {
        token_type: 'User',
        method: 'POST',
        url: '/clips',
        req_scope: 'clips:edit',
        rate_limited: true
    },
    "Get Clip": {
        token_type: 'Any',
        method: 'GET',
        url: '/clips',
        req_scope: null
    },
    "Create Entitlement Grants Upload URL": {
        token_type: 'App',
        method: 'POST',
        url: '/entitlements/upload',
        req_scope: null
    },
    "Get Code Status": {
        token_type: 'App',
        method: 'GET',
        url: '/entitlements/codes',
        req_scope: null
    },
    "Get Drops Entitlements": {
        token_type: 'App',
        method: 'GET',
        url: '/entitlements/drops',
        req_scope: null
    },
    "Redeem Code": {
        token_type: 'App',
        method: 'GET',
        url: '/entitlements/code',
        req_scope: null
    },
    "Get Top Games": {
        token_type: 'Any',
        method: 'GET',
        url: '/games/top',
        req_scope: null
    },
    "Get Games": {
        token_type: 'Any',
        method: 'GET',
        url: '/games',
        req_scope: null
    },
    "Get Hype Train Events": {
        token_type: 'Any',
        method: 'GET',
        url: '/hypetrain/events',
        req_scope: 'channel:read:hype_train'
    },
    "Check AutoMod Status": {
        token_type: 'User',
        method: 'POST',
        url: '/moderation/enforcements/status',
        req_scope: 'moderation:read'
    },
    "Get Banned Events": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/banned/events',
        req_scope: 'moderation:read'
    },
    "Get Banned Users": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/banned',
        req_scope: 'moderation:read'
    },
    "Get Moderators": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/moderators',
        req_scope: 'moderation:read'
    },
    "Get Moderators Events": {
        token_type: 'User',
        method: 'GET',
        url: '/moderation/moderators/events',
        req_scope: 'moderation:read'
    },
    "Search Categories": {
        token_type: 'Any',
        method: 'GET',
        url: '/search/categories',
        req_scope: null
    },
    "Search Channels": {
        token_type: 'Any',
        method: 'GET',
        url: '/search/channels',
        req_scope: null
    },
    "Get Stream Key": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/key',
        req_scope: 'channel:read:stream_key'
    },
    "Get Streams": {
        token_type: 'Any',
        method: 'GET',
        url: '/streams',
        req_scope: null
    },
    "Create Stream Marker": {
        token_type: 'User',
        method: 'POST',
        url: '/streams/markers',
        req_scope: 'user:edit:broadcast'
    },
    "Get Stream Markers": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/markers',
        req_scope: 'user:read:broadcast'
    },
    "Get Broadcaster Subscriptions": {
        token_type: 'User',
        method: 'GET',
        url: '/subscriptions',
        req_scope: 'channel:read:subscriptions'
    },
    "Get All Stream Tags": {
        token_type: 'App',
        method: 'GET',
        url: '/tags/streams',
        req_scope: null
    },
    "Get Stream Tags": {
        token_type: 'User',
        method: 'GET',
        url: '/streams/tags',
        req_scope: null
    },
    "Replace Stream Tags": {
        token_type: 'User',
        method: 'PUT',
        url: '/streams/tags',
        req_scope: 'user:edit:broadcast'
    },
    "Get Users": {
        token_type: 'Any',
        method: 'GET',
        url: '/users',
        req_scope: null
    },
    "Update Users": {
        token_type: 'User',
        method: 'PUT',
        url: '/users',
        req_scope: 'user:edit'
    },
    "Get Users Follows": {
        token_type: 'User',
        method: 'GET',
        url: '/users/follows',
        req_scope: null
    },
    "Create Users Follows": {
        token_type: 'User',
        method: 'POST',
        url: '/users/follows',
        req_scope: 'user:edit:follows'
    },
    "Delete Users Follows": {
        token_type: 'User',
        method: 'DELETE',
        url: '/users/follows',
        req_scope: 'user:edit:follows'
    },
    "Get User Block List": {
        token_type: 'User',
        method: 'GET',
        url: '/users/blocks',
        req_scope: 'user:read:blocked_users'
    },
    "Block User": {
        token_type: 'User',
        method: 'PUT',
        url: '/users/blocks',
        req_scope: 'user:manage:blocked_users'
    },
    "Unblock User": {
        token_type: 'User',
        method: 'DELETE',
        url: '/users/blocks',
        req_scope: 'user:manage:blocked_users'
    },
    "Get User Extensions": {
        token_type: 'User',
        method: 'GET',
        url: '/users/extensions/list',
        req_scope: 'user:read:broadcast'
    },
    "Get User Active Extensions": {
        token_type: 'User',
        method: 'GET',
        url: '/users/extensions',
        req_scope: null
    },
    "Update User Extensions": {
        token_type: 'User',
        method: 'PUT',
        url: '/users/extensions',
        req_scope: 'user:edit:broadcast'
    },
    "Get Videos": {
        token_type: 'Any',
        method: 'GET',
        url: '/videos',
        req_scope: null
    },
    "Delete Videos": {
        token_type: 'User',
        method: 'DELETE',
        url: '/videos',
        req_scope: 'channel:manage:videos'
    },
    "Get Webhook Subscriptions": {
        token_type: 'App',
        method: 'GET',
        url: '/webhooks/subscriptions',
        req_scope: null
    }
};

class TwitchAPI {
    constructor(configJSON, logger) {
        this.Config = new CONFIGHANDLER.Config('TwitchAPI', [
            { name: 'ClientID', type: 'string', minlength: 1, requiered: true, group: 0 },
            { name: 'Secret', type: 'string', minlength: 1, requiered: true, group: 0 },
            { name: 'Scopes', type: 'array', group: 1 },
            { name: 'Claims', type: 'array', group: 3 },
            { name: 'Tokens_Dir', type: 'string', group: 3, default: 'Tokens/' },
            { name: 'Authenticator', type: 'config', requiered: true }
        ], { groups: [{ name: 'You Application' }, { name: 'User Login' }, { name: 'Authenticatior' }, { name: 'Advanced' }], preloaded: configJSON });
        this.Config.FillConfig();

        //LOGGER
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                TwitchAPI: {
                    display: () => " TwitchAPI ".inverse.magenta
                }
            });
            this.setLogger(logger.TwitchAPI);
        } else {
            this.setLogger(logger);
        }

        //API Stuff
        this.RateLimits = null;

        this.AppAccessToken = null;
        this.UserAccessToken = null;

        //Util
        this.Enabled = true;
    }

    //////////////////////////////////////////////////////////////////////
    //                          SETUP
    //////////////////////////////////////////////////////////////////////

    async Init(WebInter) {
        //Check Config
        if (this.Config.check().length > 0) {
            this.Enabled = false;
            this.Logger.error('Twitch API disabled: Config Errors!');
        }

        if (this.Enabled !== true) return Promise.reject(new Error('TwitchAPI is disabled.'));

        let cfg = this.Config.GetConfig();

        //File Structure Check
        if (!fs.existsSync(cfg.Tokens_Dir)) {
            try {
                fs.mkdirSync(path.resolve(cfg.Tokens_Dir));
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (!fs.existsSync(path.resolve(cfg.Tokens_Dir + "AppAccess/"))) {
            try {
                fs.mkdirSync(path.resolve(cfg.Tokens_Dir + "AppAccess/"));
            } catch (err) {
                console.log(err);
            }
        }

        if (!fs.existsSync(path.resolve(cfg.Tokens_Dir + "UserAccess/"))) {
            try {
                fs.mkdirSync(path.resolve(cfg.Tokens_Dir + "UserAccess/"));
            } catch (err) {
                console.log(err);
            }
        }
        
        //Add API
        this.setAPI(WebInter);

        //Create Class Functions
        this.CreateTTVApiFunctions();

        //Checking Tokens
        this.Logger.warn("Checking Access Tokens...");
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
    setAPI(WebInter) {
        let api_router = express.Router();
        //Tokens
        api_router.route('/token')
            .get(async (req, res) => {
                if (this.Enabled !== true) return res.status(503).json({ err: 'Twitch API is disabled' });
                if (!req.query['type']) return res.status(400).json({ err: 'Bad Request' });
                if (typeof req.query['type'] === 'string') req.query['type'] = [req.query['type']];

                let data = [];

                for (let type of req.query['type']) {
                    let tkn_data = {
                        type: type,
                        state: 'unavailable',
                        data: null
                    };

                    if (type === 'app') {
                        try {
                            if (this.AppAccessToken) {
                                tkn_data.state = 'available';
                                tkn_data.data = this.getAppTokenStatus();
                            }
                        } catch (err) {

                        }
                    }
                    else if (type === 'user') {
                        try {
                            if (this.UserAccessToken) {
                                tkn_data.state = 'available';
                                tkn_data.data = await this.getUserTokenStatus();
                            }
                        } catch (err) {

                        }
                    }
                    else {
                        return res.json({ err: 'invalid Type ' + type });
                    }

                    data.push(tkn_data);
                }

                return res.json({ data: data });
            })
            .delete(async (req, res) => {
                if (this.Enabled !== true) return res.status(503).json({ err: 'Twitch API is disabled' });
                if (!req.query['type']) return res.status(400).json({ err: 'Bad Request' });
                if (typeof req.query['type'] === 'string') req.query['type'] = [req.query['type']];

                let data = [];

                for (let type of req.query['type']) {
                    let tkn_data = {
                        type: type,
                        state: 'failed'
                    };

                    if (type === 'app') {
                        //App
                        try {
                            await this.removeAppAccessToken();
                            data.app.state = this.AppAccessToken ? 'failed' : 'deleted';
                        } catch (err) {

                        }
                    }
                    else if (type === 'user') {
                        //User
                        try {
                            await this.removeUserAccessToken();
                            data.user.state = this.UserAccessToken ? 'failed' : 'deleted';
                        } catch (err) {

                        }
                    }
                    else {
                        return res.json({ err: 'invalid Type ' + type });
                    }

                    data.push(tkn_data);
                }

                return res.json({ data: data });
            });
        
        WebInter.addAPIRoute('/TwitchAPI', api_router);
        WebInter.addAuthAPIEndpoint('/TwitchAPI/Scopes', { user_level: 'staff' }, 'GET', (request, response) => {
            if (this.Enabled !== true) return response.status(503).json({ err: 'Twitch API is disabled' });

            let cfg = this.Config.GetConfig();
            response.json({
                data: {
                    scopes: cfg.Scopes,
                    claims: cfg.Claims
                }
            });
        });
    }
    CreateTTVApiFunctions() {
        for (let api_endpoint in TTV_API_INFO) {
            let endpoint_data = TTV_API_INFO[api_endpoint];
            
            this[this.trimString(api_endpoint)] = async (querry_params, body) => {
                if (this.Enabled !== true) return Promise.reject(new Error('TwitchAPI is disabled.'));
                return this.AccessTwitchNewAPI(endpoint_data.url + this.getQueryStringFromQueryParameters(querry_params), endpoint_data.token_type, endpoint_data.method, body);
            };
        }
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWTICH AUTHORIZATION
    //////////////////////////////////////////////////////////////////////
    
    /// APP ACCESS
    async getAppAccessToken() {
        let cfg = this.Config.GetConfig();

        let URL = "https://id.twitch.tv/oauth2/token?";
        URL += "client_id=" + cfg.ClientID;
        URL += "&client_secret=" + cfg.Secret;
        URL += "&grant_type=client_credentials";
        URL += "&scope=";

        for (let scope of cfg.Scopes) {
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
        let cfg = this.Config.GetConfig();

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
            } catch (err) {
                //Invalid -> DELETE
                try {
                    //REVOKE
                    let resp = await this.revoke(token.access_token);

                    if (resp != "200 OK") {
                        this.Logger.warn("Revoking App Access Token failed: " + resp.message);
                        continue;
                    }

                    this.Logger.warn("Revoked App Access Token:" + resp);

                    //Delete OLD
                    this.Logger.warn("Deleting Old App Access Token!");
                    fs.unlinkSync(cfg.Tokens_Dir + "AppAccess/" + token.access_token + ".json");
                } catch (err) {
                    this.Logger.error("Revoking/Deleting Old App Access Token FAILED! - " + err.message);
                    continue;
                }
            }
        }
        
        try {
            //GET NEW
            let newToken = await this.getAppAccessToken();
            this.Logger.warn("Requested a new App Access Token!");

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
    async removeAppAccessToken() {
        let cfg = this.Config.GetConfig();
    
        try {
            //REVOKE
            let tkn = this.AppAccessToken.access_token;
            let resp = await this.revoke(tkn);
            this.Logger.warn("Revoked App Access Token:" + resp);

            if (resp != "200 OK") 
                return Promise.reject(new Error('Revoking failed!'));

            this.AppAccessToken = null;

            //Delete OLD
            this.Logger.warn("Deleting Old App Access Token!");
            fs.unlinkSync(cfg.Tokens_Dir + "AppAccess/" + tkn + ".json");
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /// USER ACCESS
    generateUserAccessLinkCode(scopes = [], claims) {
        let cfg = this.Config.GetConfig();

        let querry = "https://id.twitch.tv/oauth2/authorize";
        querry += "?client_id=" + cfg.ClientID;
        querry += "&redirect_uri=" + cfg.Client_Redirect_Uri;
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
        let cfg = this.Config.GetConfig();

        let query = "https://id.twitch.tv/oauth2/authorize"
        query += "?client_id=" + cfg.ClientID;
        query += "&redirect_uri=" + cfg.Client_Redirect_Uri;
        query += "&response_type=id_token";
        query += "&scope=openid";

        if (claims) {
            query += "&claims=" + JSON.stringify(claims);
        }

        query += "&force_verify=true";

        return query;
    }

    async getUserAccessToken(code) {
        let cfg = this.Config.GetConfig();

        let URL = "https://id.twitch.tv/oauth2/token";
        URL += "?client_id=" + cfg.ClientID;
        URL += "&client_secret=" + cfg.Client_Secret;
        URL += "&code=" + code;
        URL += "&grant_type=authorization_code";
        URL += "&redirect_uri=" + cfg.Client_Redirect_Uri;

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

                if (!newToken || !newToken.access_token || !newToken.id_token) {
                    reject(new Error("Token was not created properly!"));
                    return;
                }

                //SAVE NEW
                this.Logger.warn(idUser.preferred_username + " just logged in as Bot API User!");

                this.setExtraTokenDetails(newToken);
                this.saveToken(newToken, "UserAccess");
                this.UserAccessToken = newToken;

                resolve(newToken);
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    }
    async updateUserAccessToken() {
        let cfg = this.Config.GetConfig();

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
                        fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + token.access_token + ".json");
                        continue;
                    }
                    this.Logger.info("Refreshed User Access Token!");

                    //set new Token
                    this.setExtraTokenDetails(resp);
                    this.saveToken(resp, "UserAccess");
                    this.UserAccessToken = resp;

                    //Delete Old Token
                    this.Logger.warn("Deleting Old User Access Token!");
                    fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + token.access_token + ".json");
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
    async removeUserAccessToken() {
        let cfg = this.Config.GetConfig();

        try {
            //Delete Old Token
            this.Logger.warn("Deleting Old User Access Token!");
            fs.unlinkSync(cfg.Tokens_Dir + "UserAccess/" + this.UserAccessToken.access_token + ".json");
            this.UserAccessToken = null;
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    
    async revoke(token) {
        let cfg = this.Config.GetConfig();

        //ONLY APP ACCESS AND OAuth
        return FETCH("https://id.twitch.tv/oauth2/revoke?client_id=" + cfg.ClientID + "&token=" + token, { method: "POST" })
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
        let cfg = this.Config.GetConfig();

        //Only UserAccess Token
        if (!token || !token.refresh_token) {
            return Promise.reject(new Error("No Token found."));
        }

        let querry = "?grant_type=refresh_token";
        querry += "&refresh_token=" + encodeURI(token.refresh_token);
        querry += "&client_id=" + cfg.ClientID;
        querry += "&client_secret=" + cfg.Client_Secret;

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
        let cfg = this.Config.GetConfig();

        //No Scopes/No Params -> using Stream Endpoint
        try {
            let resp = await this.request("https://api.twitch.tv/helix/streams?first=1", {
                headers: {
                    'Client-ID': cfg.ClientID,
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

    //General Tokens
    setExtraTokenDetails(token) {
        //Add created_at
        let date = new Date();
        token.created_at = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

        //Add expires_at
        date = new Date(Date.now() + (token.expires_in * 1000));
        token.expires_at = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    }
    saveToken(token, type) {
        let cfg = this.Config.GetConfig();
        writeFile(cfg.Tokens_Dir + type + "/" + token.access_token + ".json", JSON.stringify(token, null, 4));
    }
    readTokensFromFile(type) {
        let cfg = this.Config.GetConfig();

        let files = [];
        let tokens = [];

        try {
            files = fs.readdirSync(cfg.Tokens_Dir + type + "/");
        } catch (err) {
            console.log(err);
        }

        for (let file of files) {
            try {
                tokens.push(JSON.parse(readFile(cfg.Tokens_Dir + type + "/" + file)));
            } catch(err) {
                console.log(err);
            }
        }

        return tokens;
    }

    getClaims() {
        let cfg = this.Config.GetConfig();
        let output = {

        };

        for (let key in cfg.Claims) {
            output[key] = null;
        }

        return { userinfo: output };
    }
    getScopes() {
        let cfg = this.Config.GetConfig();
        let output = [];

        if (this.UserAccessToken) {
            output = this.UserAccessToken.scope.filter(scope => scope !== "openid");
        } else {
            for (let scope of cfg.Scopes) {
                output.push(scope);
            }
        }

        return output;
    }
    async getUserTokenStatus() {
        if (!this.UserAccessToken)
            return Promise.resolve({});

        let user;

        try {
            user = await this.OIDCUserInfoEndpoint(this.UserAccessToken.access_token);
        } catch (err) {
            return Promise.reject(err);
        }
        
        if (!user)
            return Promise.resolve({});

        return {
            sub: user.sub,
            preferred_username: user.preferred_username,
            picture: user.picture,
            iat: Math.floor(new Date(this.UserAccessToken.created_at).getTime() / 1000),
            exp: Math.floor(new Date(this.UserAccessToken.expires_at).getTime() / 1000),
            scopes: this.getScopes()
        };
    }
    getAppTokenStatus() {
        if (!this.AppAccessToken)
            return Promise.resolve({});

        return {
            iat: Math.floor(new Date(this.AppAccessToken.created_at).getTime() / 1000),
            exp: Math.floor(new Date(this.AppAccessToken.expires_at).getTime() / 1000),
        };
    }

    //////////////////////////////////////////////////////////////////////
    //                  TWITCH API - HELIX
    //////////////////////////////////////////////////////////////////////
    // - Query Parameters in form: { name: value }
    //      Value can be an array -> contents will be connected like this: 
    //       -> ?name=value0&name=value1&...
    // - Body Parameters in JSON form
    //////////////////////////////////////////////////////////////////////

    getQueryStringFromQueryParameters(Query_Parameters = {}) {
        let querry = "";

        for (let param in Query_Parameters) {
            if (Array.isArray(Query_Parameters[param])) {
                for (let value of Query_Parameters[param]) {
                    if (value !== undefined && value !== null)
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
    async AccessTwitchNewAPI(ENDPOINT_URL, TOKEN_TYPE = "Any", METHOD = "GET", BODY, RETURN_RAW = false, RETRYS = 3) {
        let cfg = this.Config.GetConfig();

        let used_token = null;
        let theactualtoken = null;

        if (TOKEN_TYPE == "User") {
            //USER ACCESS
            if (!this.UserAccessToken) {
                return Promise.reject(new Error("User Access Token NOT Available!"));
            }
            used_token = "User";
            theactualtoken = this.UserAccessToken;
        } else if (TOKEN_TYPE == "App") {
            //APP ACCESS
            if (!this.AppAccessToken) {
                return Promise.reject(new Error("App Access Token NOT Available!"));
            }
            used_token = "App";
            theactualtoken = this.AppAccessToken;
        } else if (TOKEN_TYPE == "Any") {
            //ANY ACCESS
            if (this.AppAccessToken) {
                //APP ACCESS
                used_token = "App";
                theactualtoken = this.AppAccessToken;
            } else if (this.UserAccessToken) {
                //USER ACCESS
                used_token = "User";
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
                'Client-ID': cfg.ClientID,
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
                            if (used_token == "User") {
                                await this.updateUserAccessToken();
                            } else if (used_token == "App") {
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

    //////////////////////////////////////////////////////////////////////
    //                  TWITCH API - NON HELIX
    //////////////////////////////////////////////////////////////////////
    async getBadges() {
        if (this.Enabled !== true) return Promise.reject(new Error('TwitchAPI is disabled.'));

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

    isEnabled() {
        return this.Enabled === true;
    }
    getClientID() {
        let cfg = this.Config.GetConfig();
        return cfg.ClientID;
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
    trimString(str) {
        return str.split(" ").join("");
    }
    GetConfig(json = true) {
        if (json) return this.Config.GetConfig();
        return this.Config;
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

class Authenticator extends WEBAPP.Authenticator {
    constructor(logger, parentConfigObj, webInt, TwitchAPI) {
        super("FrikyBot Auth.", logger);

        this.Config = new CONFIGHANDLER.Config('Authenticator', [
            { name: 'show_auth_message', type: 'boolean', default: false },
            { name: 'UserDB_File', type: 'string', default: CONSTANTS.FILESTRUCTURE.DATA_STORAGE_ROOT + "Auth/User.db" },
            { name: 'Userlevels', type: 'array', typeArray: 'string', default: ['viewer', 'subscriber', 'moderator', 'staff', 'admin'] },
            { name: 'enabled', type: 'boolean', default: true, requiered: true }
        ], { preloaded: parentConfigObj.GetConfig()['Authenticator'] });

        parentConfigObj.AddChildConfig(this.Config);
        this.Config.FillConfig();
        
        //LOGGER
        if (logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                Authenticator: {
                    display: () => " Authenticator ".inverse.cyan
                }
            });
            this.setLogger(logger.Authenticator);
        } else {
            this.setLogger(logger);
        }
        
        //Init
        let noErrs = this.Config.ErrorCheck();

        if (noErrs) {
            this.TwitchAPI = TwitchAPI;
            this.UserDatabase = new Datastore({ filename: path.resolve(this.Config.GetConfig()['UserDB_File'] + ".db"), autoload: true });
            this.setAPI(webInt);
            this.isReady = () => true;
        }
    }
    //API
    setAPI(webInt) {
        if (!webInt) return;

        //Authentication Database API
        let router = express.Router();
        router.get('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            let user_ids;

            if (typeof (req.query.user_id) === 'string') {
                user_ids = [req.query.user_id];
            } else {
                user_ids = req.query.user_id;
            }

            try {
                let users = await this.GetUsers({ user_id: user_ids });
                res.json({ data: users });
            } catch (err) {
                res.json({ err: 'getting users failed.' });
            }
            return Promise.resolve();
        });
        router.post('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            //Check Userlevel
            try {
                await this.Auth_UserLevel(res.locals.user.sub, req.body.user_level, true);
            } catch (err) {
                if (err.message === 'User not found!') {
                    res.status(401).send('You have no Entry in the Authenticator! So you cant edit anything!');
                } else if (err.message === 'Userlevel doesnt match') {
                    res.status(401).send('You cant add a User with the same or more power than yourself.');
                } else {
                    this.Logger.error(err.message);
                    res.status(500).json({ err: 'Internal Error.' });
                }

                return Promise.resolve();
            }

            //Add User
            try {
                let new_user = await this.addUser(req.body.user_id, req.body.user_name, req.body.user_level, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ new_user: new_user });
            } catch (err) {
                res.json({ err: err.message });
            }
            return Promise.resolve();
        });
        router.delete('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            if (req.body.user_id !== res.locals.user.sub) {
                //Check Userlevel
                try {
                    let users = await this.GetUsers({ user_id: req.body.user_id });

                    if (!users || users.length == 0) {
                        res.status(404).send('User not found!');
                        return Promise.resolve();
                    }

                    await this.Auth_UserLevel(res.locals.user.sub, users[0].user_level, true);
                } catch (err) {
                    if (err.message === 'User not found!') {
                        res.status(401).send('You have no Entry in the Authenticator! So you cant edit anything!');
                    } else if (err.message === 'Userlevel doesnt match') {
                        res.status(401).send('You cant remove a User with the same or more power than yourself.');
                    } else {
                        this.Logger.error(err.message);
                        res.status(500).json({ err: 'Internal Error.' });
                    }

                    return Promise.resolve();
                }
            }


            //Remove User
            try {
                let cnt = await this.removeUser(req.body.user_id, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ deleted: cnt });
            } catch (err) {
                res.json({ err: err.message });
            }
            return Promise.resolve();
        });
        router.put('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            let target_user = null;
            let current_user = null;

            //Get User
            try {
                let users = await this.GetUsers({ user_id: [res.locals.user.sub, req.body.user_id] });

                if (!users || users.length == 0) {
                    res.status(404).send('User not found!');
                    return Promise.resolve();
                }

                for (let user of users) {
                    if (user.user_id === res.locals.user.sub) {
                        current_user = user;
                    } else if (user.user_id === req.body.user_id) {
                        target_user = user;
                    }
                }
            } catch (err) {
                this.Logger.error(err.message);
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            //Check Userlevel
            if (!current_user || !target_user) {
                res.status(404).send('User not found!');
                return Promise.resolve();
            } else if (!this.CompareUserlevels(current_user.user_level, target_user.user_level, true)) {
                res.status(401).send('You cant edit a User with the same or more power than yourself.');
                return Promise.resolve();
            } else if (!this.CompareUserlevels(current_user.user_level, req.body.user_level, true)) {
                res.status(401).send('You cant give a User the same or more power than yourself.');
                return Promise.resolve();
            }

            //Edit User
            try {
                let cnt = await this.updateUser(req.body.user_id, req.body.user_name, req.body.user_level, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ upt_user: cnt });
            } catch (err) {
                console.log(err);
                res.json({ err: 'user edit failed.' });
            }
            return Promise.resolve();
        });
        webInt.addAuthAPIRoute('/TwitchAPI/Authenticator', { user_level: 'staff' }, (req, res, next) => { if (this.isEnabled()) return next(); else return res.sendStatus("503"); }, router);

        //Login using Twitch
        webInt.addAPIEndpoint('/TwitchAPI/login/user', 'GET', (req, res) => {
            if (!this.isEnabled()) return res.sendStatus("503");
            if (!this.TwitchAPI) return res.json({ err: 'Twitch API is not available.' });

            response.json({
                data: this.TwitchAPI.generateUserAccessLinkToken({ id_token: { preferred_username: null, picture: null } })
            });
        });
        webInt.addAuthAPIEndpoint('/TwitchAPI/login/bot', { user_level: 'admin' }, 'POST', (req, res) => {
            if (!this.isEnabled()) return res.sendStatus("503");
            if (!this.TwitchAPI) return res.json({ err: 'Twitch API is not available.' });

            let claims = req.body['claims'] ? req.body['claims'] : this.TwitchAPI.getClaims();
            let scopes = req.body['scopes'] ? req.body['scopes'] : this.TwitchAPI.getScopes();

            res.send({
                data: this.TwitchAPI.generateUserAccessLinkCode(scopes, claims)
            });
        });
    }

    //Authentication - Base
    async AuthorizeRequest(headers = {}, method = {}, user) {
        //Fetch User Data
        if (!user) {
            try {
                user = await this.AuthenticateUser(headers);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        //Check User and Method
        return this.AuthenticateUser(user, method);
    }
    async AuthenticateUser(headers = {}) {
        if (!this.TwitchAPI) return Promise.reject(new Error('Twitch API is not available.'));

        const header = headers['authorization'];
        const token = header && header.split(" ")[1];

        //Check JWT
        try {
            user = await this.TwitchAPI.VerifyTTVJWT(token);
        } catch (err) {
            //JWT Validation failed
            return Promise.reject(err);
        }

        //Check Database
        try {
            let db_users = await this.GetUsers({ user_id: [user.sub] });
            if (db_users.length > 0) user.user_level = db_users[0].user_level;
            return Promise.resolve(user);
        } catch (err) {
            //Database Error
            return Promise.reject(err);
        }
    }
    async AuthorizeUser(user = {}, method = {}) {
        let cfg = this.Config.GetConfig();

        //Check Method
        for (let meth in method) {
            try {
                if (meth === 'user_id') {
                    await this.Auth_UserID(user.sub, method[meth]);
                } else if (meth === 'user_level') {
                    await this.Auth_UserLevel(user.user_level, method[meth], method.user_level_cutoff === true);
                } else {
                    return Promise.reject(new Error('Unknown Authorization Method!'));
                }
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (cfg.show_auth_message === true)
            this.Logger.warn("Authenticated User: (" + user.sub + ") " + user.preferred_username);

        return Promise.resolve(user);
    }

    async Auth_UserID(user_id, target_id) {
        //Check UserID
        if (user_id === target_id) {
            return Promise.resolve();
        } else {
            return Promise.reject(new Error('User ID doesnt match!'));
        }
    }
    async Auth_UserLevel(user_level, target_level, cutoff) {
        //Check Userlevel
        if (!this.CompareUserlevels(user_level, target_level, cutoff)) {
            return Promise.reject(new Error("Userlevel doesnt match"));
        }

        return Promise.resolve();
    }

    //User Auth Database
    async GetUsers(params = {}) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));
 
        let query = { $and: [] };

        //Query Parse
        for (let param in params) {
            let sub_query = {};
            if (param === 'user_id' || param === 'user_name' || param === 'user_level' || param === 'added_by') {
                if (params[param] instanceof Array) {
                    let temp = [];

                    for (let value of params[param]) {
                        temp.push({ [param]: value });
                    }

                    sub_query = { $or: temp };
                } else {
                    sub_query = { [param]: params[param] };
                }
            } else {
                return Promise.reject(new Error('Parameter invalid.'));
            }

            query.$and.push(sub_query);
        }
        
        //Access Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.find(query, (err, docs) => {
                if (err || !docs) return reject(new Error("User Database Error."));

                let users = [];

                for (let doc of docs) {
                    users.push({
                        user_id: doc.user_id,
                        user_name: doc.user_name,
                        user_level: doc.user_level,
                        added_by: doc.added_by,
                        added_at: doc.added_at
                    });
                }

                return resolve(users);
            });
        });
    }
    async addUser(user_id, user_name, user_level, added_by_id, added_by) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));

        //Input Check
        if (typeof user_level !== 'string') return Promise.reject(new Error('User Level not found'));

        try {
            let users = await this.fetchUserInfo([user_id, added_by_id], [user_name, added_by]);

            for(let user of users) {
                if (user.id == user_id || user.login == user_name || user.display_name == user_name) {
                    user_id = user.id;
                    user_name = user.login;
                }

                if (user.id == added_by_id || user.login == added_by || user.display_name == added_by) {
                    added_by_id = user.id;
                    added_by = user.login;
                }
            }
        } catch (err) {
            return Promise.reject(err);
        }

        if (!user_id || !user_name || !user_level || !added_by_id || !added_by) 
            return Promise.reject(new Error("User Info not found"));

        //Add User to Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.insert({ user_id: user_id, user_name: user_name, user_level: user_level, added_by: added_by, added_by_id: added_by_id, added_at: Math.floor(Date.now() / 1000) }, (err, newDocs) => {
                if (err) return reject(new Error("User Database Error"));
                if (newDocs == 0) return reject(new Error("User couldnt be inserted"));

                this.Logger.warn('Added ' + user_id + '(' + user_name + ') User Authorization as ' + user_level + ' by ' + added_by_id + '(' + added_by + ')');
                
                return resolve({
                    added_at: newDocs.added_at,
                    added_by: newDocs.added_by,
                    user_id: newDocs.user_id,
                    user_level: newDocs.user_level,
                    user_name: newDocs.user_name
                });
            });
        });
    }
    async removeUser(user_id, added_by_id, added_by) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));

        if (!user_id || !added_by_id || !added_by)
            return Promise.reject(new Error("User Info not found"));

        //Add User to Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.remove({ user_id: user_id }, (err, numRemoved) => {
                if (err) return reject(new Error("User Database Error"));
                if (numRemoved == 0) return reject(new Error("User couldnt be removed"));

                this.Logger.warn('Removed ' + user_id + ' User Authorization by ' + added_by_id + '(' + added_by + ')');

                return resolve(numRemoved);
            });
        });
    }
    async updateUser(user_id, user_name, user_level, added_by_id, added_by) {
        if (!this.UserDatabase) return Promise.reject(new Error('User Database not available.'));

        //Input Check
        if (typeof user_level !== 'string') return Promise.reject(new Error('User Level not found'));

        try {
            let users = await this.fetchUserInfo([user_id, added_by_id], [user_name, added_by]);

            for (let user of users) {
                if (user.id == user_id || user.login == user_name || user.display_name == user_name) {
                    user_id = user.id;
                    user_name = user.login;
                }

                if (user.id == added_by_id || user.login == added_by || user.display_name == added_by) {
                    added_by_id = user.id;
                    added_by = user.login;
                }
            }
        } catch (err) {
            return Promise.reject(err);
        }

        if (!user_id || !user_name || !user_level || !added_by_id || !added_by)
            return Promise.reject(new Error("User Info not found"));
        
        //Update User to Database
        return new Promise((resolve, reject) => {
            this.UserDatabase.update({ user_id: user_id }, { user_id: user_id, user_name: user_name, user_level: user_level, added_by: added_by, added_by_id: added_by_id, added_at: Math.floor(Date.now() / 1000) }, (err, numReplaced) => {
                if (err) return reject(new Error("User Database Error"));
                if (numReplaced == 0) return reject(new Error("User couldnt be updated"));

                this.Logger.warn('Updated ' + user_id + '(' + user_name + ') User Authorization to ' + user_level + ' by ' + added_by_id + '(' + added_by + ')');

                return resolve(numReplaced);
            });
        });
    }
    
    //UTIL
    GetUserlevels() {
        let cfg = this.Config.GetConfig();
        return cfg.Userlevels ? cfg.Userlevels : [];
    }
    GetUserLevelIndex(user_level) {
        let userlevel_index = -1;

        this.GetUserlevels().find((element, index) => {
            if (element === user_level) {
                userlevel_index = index;
                return true;
            }

            return false;
        });

        return userlevel_index;
    }
    CompareUserlevels(current, target, cutoff = false) {
        let target_index = this.GetUserLevelIndex(target);
        let current_index = this.GetUserLevelIndex(current);
        let rel_index = 0;

        if (target_index === -1) return false;

        rel_index = current_index - target_index;
        
        if (rel_index < 0) return false;
        if (cutoff === true && rel_index === 0 && current_index !== this.GetUserlevels().length-1) return false;
        
        return true;
    }

    async fetchUserInfo(ids = [], names = []) {
        if (!this.TwitchAPI) return Promise.reject(new Error('Twitch API is not available.'));

        let query = {
            id: ids,
            login: names
        };

        if (query.id.length == 0) delete query.id;
        if (query.login.length == 0) delete query.login;
        if (!query.id && !query.login) return Promise.reject(new Error('User not supplied'));
        
        //Fetch Data
        try {
            let resp = await this.TwitchAPI.GetUsers(query);

            if (resp && resp.data && resp.data.length > 0) {
                return Promise.resolve(resp.data);
            } else {
                return Promise.reject(new Error('User not found'));
            }
        } catch (err) {
            return Promise.reject(err);
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
module.exports.Authenticator = Authenticator;