const CONSTANTS = require('./CONSTANTS.js');
const FETCH = require('node-fetch');
const fs = require('fs');
const path = require('path');

const NewAPIEndpoints = {
    GetBitsLeaderboard: {
        URL: "https://api.twitch.tv/helix/bits/leaderboard",
        Authorization: "Bearer",
        Token: CONSTANTS.UserAccess
    },
    GetBroadcasterSubscriptions: {
        URL: "https://api.twitch.tv/helix/subscriptions?broadcaster_id=<ID>",
        Authorization: "Bearer",
        replace_param: ["<ID>"],
        Token: CONSTANTS.AppAccess
    },
    CreateClip: {
        URL: "https://api.twitch.tv/helix/clips?broadcaster_id=<ID>&has_delay=<DELAY>",
        method: "POST",
        Authorization: "Bearer",
        replace_param: ["<ID>", "<DELAY>"],
        Token: CONSTANTS.AppAccess                                                               //PENDING
    },
    GetClipsByBroadcastID: {
        URL: "https://api.twitch.tv/helix/clips?broadcaster_id=<ID>",
        Authorization: "Client-ID",
        replace_param: ["<ID>"]
    },
    GetClipsByClipID: {
        URL: "https://api.twitch.tv/helix/clips?id=<ID>",
        Authorization: "Client-ID",
        replace_param: ["<ID>"]
    },
    GetGameByGameID: {
        URL: "https://api.twitch.tv/helix/games?id=<ID>",
        Authorization: "Client-ID",
        replace_param: ["<ID>"]
    },
    GetGamesByGameName: {
        URL: "https://api.twitch.tv/helix/games?name=<NAME>",
        Authorization: "Client-ID",
        replace_param: ["<NAME>"]
    },
    GetBannedEvents: {
        URL: "https://api.twitch.tv/helix/moderation/banned/events?broadcaster_id=<ID>",                                            //NOT WORKING?!?!?!
        Authorization: "Bearer",
        replace_param: ["<ID>"],
        Token: CONSTANTS.UserAccess
    },
    GetBannedEventsForUser: {                                                                                                       //NOT WORKING?!?!?!
        URL: "https://api.twitch.tv/helix/moderation/banned/events?broadcaster_id=<BROADID>?user_id=<USERID>",
        Authorization: "Bearer",
        replace_param: ["<BROADID>", "<USERID>"],
        Token: CONSTANTS.UserAccess
    },
    GetModerators: {

    },
    GetModeratorEvents: {

    },
    GetStreamsMetadata: {

    },
    CreateStreamMarker: {

    },
    GetStreamMarkers: {

    },
    GetAllStreamTags: {

    },
    GetStreamTags: {

    },
    ReplaceStreamTags: {

    },
    GetUsers: {

    },
    GetUsersFollows: {

    },
    GetVideos: {

    }
};

class TwitchNewAPI {
    constructor(config, twitchChat) {

        this.config = config;
        this.twitchChat = twitchChat;

        this.LoggedInUser = null;

        this.TOKENS_FOLDER = "TOKENS/";

        //This Scope Object is only for Access Token requests - use AppAccessToken.scopes instead (currently active scopes)
        this.scopes = ["bits:read", "channel:read:subscriptions", "clips:edit", "user:edit", "user:edit:broadcast", "moderation:read", "channel:moderate"];
        this.AppAccessToken = null;
        this.UserAccessToken = null;

        this.RateLimits = null;

        console.log("New Twitch API Connection init...");

        this.checkAppAccess(true);
        this.checkUserAccess(true);

        //this.test(NewAPIEndpoints.test, ["38921745"]);
    }

    //API STUFF
    //Parameter array must match contents of endpoint.replace_param
    test(endpoint, parameters) {

        if (!endpoint) {
            return;
        }

        let URL = endpoint.URL;

        if (endpoint.replace_param) {
            for (let i = 0; i < endpoint.replace_param.length; i++) {

                let start = URL.indexOf(endpoint.replace_param[i]);
                if (start < 0)
                    return;
                let end = URL.indexOf("?", start);

                if (end < 0) {
                    URL = URL.substring(0, start) + parameters[i];
                } else {
                    URL = URL.substring(0, start) + parameters[i] + URL.substring(end);
                }
            }
        }

        let options = {
            headers: {

            }
        };

        if (endpoint.Authorization) {   
            if (endpoint.Authorization == "Client-ID") {            //use Client ID
                options.headers["Client-ID"] = this.config.Client_ID;
            } else if (endpoint.Authorization == "Bearer") {        //use Access Tokens
                if (endpoint.Token == CONSTANTS.AppAccess) {
                    if (this.AppAccessToken)
                        options.headers.Authorization = "Bearer " + this.AppAccessToken.access_token;
                    else
                        return;
                } else if (endpoint.Token == CONSTANTS.UserAccess) {
                    if (this.UserAccessToken)
                        options.headers.Authorization = "Bearer " + this.UserAccessToken.access_token;
                    else
                        return;
                } else if (endpoint.Token == CONSTANTS.IDAccess) {
                    //unused
                    return;
                }else{
                    return;
                }
            } else {
                return;
            }
        }

        if (endpoint.method) {
            options.method = endpoint.method;
        }

        console.log(URL);

        this.request(URL, options, json => console.log(json));
    }

    //OLD AF KRAKEN PLS SWITCH IT TO KNEW WTF IS WRONG WITH YOU TWITCH?!?!
    //OAUTH NOT SAVED ON SERVER - JUST USED TO GET THE OBJ
    async getUserDetailsByOAuth(OAUTH) {
        return await this.request("http://api.twitch.tv/kraken/user", {
            method: "GET",
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                "Content-Type": "application/json",
                'Authorization': 'OAuth ' + OAUTH,
                'Client-ID': this.config.Client_ID
            }
        }, json => { return json; });
    }
    
    //TWTICH NEW API ENDPOINTS
    async getUserDetails(login) {

        if (!this.UserAccessToken) {
            return;
        }

        let params = "";

        if (Array.isArray(login)) {
            for (let log of login) {
                params += "&login=" + log;
            }

            params = params.substring(1);

        } else {
            params = "login=" + login;
        }

        console.log(login);

        return await this.request("https://api.twitch.tv/helix/users?" + params, {
            headers: {
                'Authorization': 'Bearer ' + this.UserAccessToken.access_token
            }
        }, json => { return json; });
    }

    async getBotUserDetails() {

        let x = await this.getUserDetails(this.twitchChat.Username);

        if (x) {
            return x.data[0];
        } else {
            return {
                err: "Could not connect to Twitch API"
            };
        }
    }

    getLogInHTMLPageCode(scopes) {

        if (!scopes) return "";

        let scopesOut = "";

        for (let scope of scopes) {
            scopesOut += scope + "+";
        }

        scopesOut = scopesOut.substring(0, scopesOut.length - 1);

        let query = "https://id.twitch.tv/oauth2/authorize"
        query += "?client_id=" + this.config.Client_ID;
        query += "&redirect_uri=" + this.config.Client_Redirect_Uri;
        query += "&response_type=code";
        if (scopesOut != "") query += "&scope=" + scopesOut;

        return query;
    }

    getLogInHTMLPageToken(scopes) {

        if (!scopes) return "";

        let scopesOut = "";

        for (let scope of scopes) {
            scopesOut += scope + "+";
        }

        scopesOut = scopesOut.substring(0, scopesOut.length - 1);

        let query = "https://id.twitch.tv/oauth2/authorize"
        query += "?client_id=" + this.config.Client_ID;
        query += "&redirect_uri=" + this.config.Client_Redirect_Uri;
        query += "&response_type=token";
        query += "&force_verify=true";
        if (scopesOut != "") query += "&scope=" + scopesOut;

        return query;
    }

    //TOKENS STUFF / TWICH AUTHENTICATION
    //AppAccess
    updateAppAccessToken() {

        if (!this.checkAppAccess()) {
            let SUP = this;
            this.AppAccessToken = null;

            fs.readdirSync(path.resolve(this.TOKENS_FOLDER + "AppAccess/")).forEach(function (file, index) {
                let curPath = path.resolve(SUP.TOKENS_FOLDER + "AppAccess/" + file);
                
                try {
                    let s = readFile(curPath);
                    let json = JSON.parse(s);

                    if (new Date(json.expires_at) < Date.now()) {
                        fs.unlinkSync(curPath);
                    } else {
                        console.log("New Twitch API: Using older/other AppAccessToken!");
                        SUP.AppAccessToken = json;
                        return;
                    }

                } catch (err) {
                    console.log(err);
                }

            });

            if (!this.AppAccessToken) {
                console.log("New Twitch API: New App Access Token requested!");
                this.AppAccessToken = this.getNewAppAccessToken();
            }
        } else {
            console.log("New Twitch API: App Access Token still valid until " + this.AppAccessToken.expires_at);
        }
    }
    getNewAppAccessToken() {

        let URL = "https://id.twitch.tv/oauth2/token?";
        URL += "client_id=" + this.config.Client_ID;
        URL += "&client_secret=" + this.config.Client_Secret;
        URL += "&grant_type=client_credentials";
        URL += "&scope=";

        for (let scope of this.scopes) {
            URL += scope + "+";
        }

        URL = URL.substring(0, URL.length - 1);

        this.request(URL, { method: "POST" }, json => {
            console.log(json);

            let date = new Date(Date.now());
            json.created_at = date.toISOString().replace(/T/, ' ').replace(/\..+/, ''); 

            date.setSeconds(date.getSeconds() + json.expires_in);
            json.expires_at = date.toISOString().replace(/T/, ' ').replace(/\..+/, ''); 

            let file = path.resolve(this.TOKENS_FOLDER + "AppAccess/" + json.access_token + ".json");

            if (!fs.existsSync(file)) {
                console.log('New App Access Token saved!');
            } else {
                console.log('Existing App Access Token updated!');
            }

            writeFile(file, JSON.stringify(json, null, 4));
            
            return json;
        });

        return null;
    }
    checkAppAccess(change) {

        if (!this.AppAccessToken || new Date(this.AppAccessToken.expires_at) < Date.now()) {

            if (change) {
                return this.updateAppAccessToken();
            }

            return false;
        } else {
            return true;
        }
    }

    //UserAccess
    updateUserAccessToken() {
        if (!this.checkUserAccess()) {
            let SUP = this;
            this.UserAccessToken = null;

            fs.readdirSync(path.resolve(this.TOKENS_FOLDER + "UserAccess/")).forEach(function (file, index) {
                let curPath = path.resolve(SUP.TOKENS_FOLDER + "UserAccess/" + file);
                
                try {
                    let s = readFile(curPath);
                    let json = JSON.parse(s);

                    if (new Date(json.expires_at) < Date.now()) {
                        fs.unlinkSync(curPath);
                    } else {
                        console.log("New Twitch API: Using older/other UserAccessToken!");
                        SUP.UserAccessToken = json;
                        return;
                    }

                } catch (err) {
                    console.log(err);
                }

            });

            if (!this.UserAccessToken) {
                console.log("New Twitch API: User has to log in again!!");


            }
        } else {
            console.log("New Twitch API: User Access Token still valid until " + this.UserAccessToken.expires_at);
        }
    }
    getUserAccessTokenWithCode(code) {

        let querry = "https://id.twitch.tv/oauth2/token";
        querry += "?client_id=" + this.config.Client_ID;
        querry += "&client_secret=" + this.config.Client_Secret;
        querry += "&code=" + code;
        querry += "&grant_type=authorization_code";
        querry += "&redirect_uri=" + this.config.Client_Redirect_Uri;


        this.request(querry, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, json => {

            let date = new Date(Date.now());
            json.created_at = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');

            date.setSeconds(date.getSeconds() + json.expires_in);
            json.expires_at = date.toISOString().replace(/T/, ' ').replace(/\..+/, ''); 

            this.UserAccessToken = json;

            writeFile(path.resolve(this.TOKENS_FOLDER + "UserAccess/" + json.access_token + ".json"), JSON.stringify(json, null, 4));
        });
    }
    checkUserAccess(change) {
        if (!this.UserAccessToken || new Date(this.UserAccessToken.expires_at) < Date.now()) {

            if (change) {
                return this.updateUserAccessToken();
            }

            return false;
        } else {
            return true;
        }
    }

    async revoke(token) {
        return await this.request("https://id.twitch.tv/oauth2/revoke?client_id=" + this.config.Client_ID + "&token=" + token, {
            method: "POST"
        }, json => { return json; });
    }

    //API REQUEST
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
        return "ERROR: " + err;
    }
}


module.exports.TwitchNewAPI = TwitchNewAPI;