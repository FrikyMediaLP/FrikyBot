'use strict';

console.log("\n");
console.log("///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");
console.log("                                   NEW TWITCH CHAT BOT - NODE JS SERVER")
console.log("///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");

/*
 *  ----------------------------------------------------------
 *                      NPM MODULES
 *  ----------------------------------------------------------
 */

//NPM
const express = require('express');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

/*
 *  ----------------------------------------------------------
 *              VARIABLES / CONSTANTS / OBJECTS
 *  ----------------------------------------------------------
 */

//Config CONSTANTS
let CONFIG;
let CONFIG_PATH = "C:/Users/friky/Desktop/config.json";
let CONFIG_CONTENT_REQUIRED = ["TwitchIRC", "TwitchNewAPI"];
let DefaultConfig = {
    "TwitchIRC": {
        "Username": "",
        "OAuth": "oauth:",
        "Channel": ""
    },
    "TwitchNewAPI": {
        "Client_ID": "",
        "Client_Redirect_Uri": "",
        "Client_Secret": "",
        "ACCESS_TOKEN": {
            "access_token": "",
            "refresh_token": "",
            "expires": ""
        }
    },
    "Packages": {
        "PackageName": "PackageConfig"
    }
};

//TWITCH CHAT -> IRC
const TWITCHIRC = require('./TwitchIRC.js');
let TwitchChat;

//TWITCH NEW API
const TWITCHNEWAPI = require('./TwitchNewAPI.js');
let TwitchNewAPI;
let BOT_SCOPES = ["channel:read:subscriptions"];

//BOT DATA COLLECTION - PACKAGES
let INSTALLED_PACKAGES = {

};

//CONSTANTS (for sync of other Packages)
const CONSTANTS = require('./CONSTANTS.js');

let API_PW_PROTECTED_ENDPOINTS = [      //Password protected API Endpoints (format: {path: "API_ENPOINT_PATH", type: "GET/POST/..."})
   
];

/*
 *  ----------------------------------------------------------
 *                      WEBSITE - INIT
 *  ----------------------------------------------------------
 */

const app = express();

app.listen(1337, () => console.log("Listening on localhost:1337..."));
app.use(express.static("public", {
    extensions: ['html', 'htm']
}));
app.use(express.json({ limit: "1mb" }));

////ROUTERS
app.use(function (req, res, next) {

    if (!req.originalUrl) {
        res.status(500).send("Something broke!");
        return;
    }

    let path = req.originalUrl;

    //Is part of an API
    if (path.substring(0, 5) == "/api/") {

        if (isPWProtected({ path: path, type: req.method })) {
            if (req.body && req.body.Authentication) {
                if (req.body.Authentication != CONSTANTS.API_PASSWORD) {
                    res.json({
                        status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                        req: req.body,                      //Mirror-Request (for debug reasons / sending error detection)
                        err: "Password incorrect!"
                    });
                    return;
                }
            } else {
                res.json({
                    status: CONSTANTS.STATUS_FAILED,        //Sending Failure confimation
                    req: req.body,                          //Mirror-Request (for debug reasons / sending error detection)
                    err: "Body structure incorrect!"
                });
                return;
            }
        }

        //go to endpoints
        next();

        //Redirect to .html without .html in URL / to 404 page not found page
    } else if (path.indexOf("/Twitch-redirect?") >= 0) {
        if (req.url.indexOf("&scope=") < 0) {
            TwitchNewAPI.getUserAccessTokenWithCode(req.url.substring(req.url.indexOf("?code=") + 6));
        } else {
            TwitchNewAPI.getUserAccessTokenWithCode(req.url.substring(req.url.indexOf("?code=") + 6, req.url.indexOf("&scope=")));
        }

        res.redirect("Bot");
    } else {
        
        //trim extra / ,but leave if folder requested
        if (path.charAt(path.length-1) == "/") {
            path = path.substring(0, path.length - 1);
        }

        //allready redirected? else redirect to path.html
        if (path.indexOf(".html.html") >= 0)
            res.status(404).redirect("http://localhost:1337/not-found.html");
        else
            res.redirect("http://localhost:1337" + path + ".html");
    }
});

/*
 *  ----------------------------------------------------------
 *                      BOT API
 *     each installed Package handles their own API!
 *     Package api root url: 
 *          - "/api/[PACKAGENAME]/"
 *  ----------------------------------------------------------
 */

//STATUS 
app.all('/api/Status', (request, response) => {
    response.json({
        status: CONSTANTS.STATUS_SUCCESS,
        req: request.body,
        data: {
            Status: "RUNNING!",
            LogIn: {
                Name: TwitchChat.Username,
                Status: TwitchNewAPI.UserAccessToken ? true : false
            }
        }
    });
});

//UserInfo 
app.all('/api/TwitchNewAPI/GetBot', async (request, response) => {
    response.json(await TwitchNewAPI.getBotUserDetails());
});

//UserInfo 
app.post('/api/TwitchNewAPI/GetLogInPage', async (request, response) => {
    let s = await TwitchNewAPI.getLogInHTMLPage(request.body.scopes);

    response.send(s);
});

//INIT PACKAGES/TWITCHCHAT/NEWAPI/ AND PACKAGE API AFTER BOT API AND BEFORE NOT FOUND ENDPOINT
INIT();


//NO ENDPOINT FOUND
app.all('/api/*', (request, response) => {
    response.json({
        status: CONSTANTS.STATUS_FAILED,
        req: request.body,
        err: "404 - API Endpoint not found"
    });
});

/*
 *  ----------------------------------------------------------
 *                      BOT FUNCTIONS
 *  ----------------------------------------------------------
 */

function INIT() {
    //CONFIG READ / CREATE
    loadConfig();
    loadPackages();

    //removeOldPackageStuff
    removeOldPackageFiles("public");

    //TWITCH IRC 
    Twitch_IRC_Init();

    //Twitch New API
    Twitch_NEW_API_Init();


    //DataCollection
    //init all Loaded/Installed Packages by there Class and save Object nack in the INSTALLED_PACKAGES Object
    for (let pack of Object.getOwnPropertyNames(INSTALLED_PACKAGES)) {
        let packClass = INSTALLED_PACKAGES[pack].Class;
        INSTALLED_PACKAGES[pack].Object = new packClass(CONFIG.Packages[pack], app, TwitchChat, TwitchNewAPI);
    }
}

function loadConfig() {
    try {
        //is Config File present?
        fs.accessSync(CONFIG_PATH, fs.constants.F_OK);

        //-> yes
        console.log("Config File found!".green);

        try {
            let temp = JSON.parse(fs.readFileSync(CONFIG_PATH));

            let completion = checkForCompletion(temp, DefaultConfig, CONFIG_CONTENT_REQUIRED);

            if (completion == "COMPLETE") {
                CONFIG = temp;
            } else {
                console.log("ERROR: Config File not complete: " + completion.red);
                while (1);
            }

        } catch (err) {
            console.log(err);
            while (1);
        }

        //-> no
    } catch (err) {
        initConfig();
    }
}
function initConfig() {
    CONFIG = DefaultConfig;

    let fd;

    try {
        fd = fs.openSync(CONFIG_PATH, 'wx');
        fs.writeSync(fd, JSON.stringify(DefaultConfig, null, 4));
    } catch (err) {
        /* Handle the error */
        console.log(err);
        while (1);
    } finally {
        if (fd !== undefined)
            fs.closeSync(fd);
    }
    console.log("PLS EDIT CONFIG NOW AND THEN RESTART!".green);
}
function loadPackages() {
    if (CONFIG.Packages) {
        for (let pack of Object.getOwnPropertyNames(CONFIG.Packages)) {
            INSTALLED_PACKAGES[pack] = {
                Object: null,
                Class: require('./Packages/' + pack + '/' + pack + '.js')[pack],
                Config: CONFIG.Packages[pack]
            }
        }
    }
}

/*
 *  ----------------------------------------------------------
 *                 TWITCH IRC | EVENTHANDLERS
 *  ----------------------------------------------------------
 */

function Twitch_IRC_Init() {
    TwitchChat = new TWITCHIRC.TwitchIRC(CONFIG.TwitchIRC.Username, CONFIG.TwitchIRC.OAuth, CONFIG.TwitchIRC.Channel);

    // Register our event handlers (defined below) (comment out what you dont need or add what you do need (info in tmi-docs))
    TwitchChat.on('connected', onConnectedHandler);                        //Bot connected to Chat
    TwitchChat.on('disconnected', onDisconnectedHandler);                  //Bot got disconnected from Chat

    TwitchChat.on('message', onMessageHandler);                            //User chat message
    TwitchChat.on('messagedeleted', onMessagedeletedHandler);              //user message deleted

    TwitchChat.on('hosted', onHostedHandler);                              //Channel got hosted
    TwitchChat.on('raided', onRaidedHandler);                              //Channel got raided

    TwitchChat.on('join', onJoinHandler);                                  //User joined channel
    TwitchChat.on('part', onPartHandler);                                  //User left channel
    TwitchChat.on('ban', onBanHandler);                                    //User got banned
    TwitchChat.on('mod', onModHandler);                                    //User got modded
    TwitchChat.on('unmod', onUnmodHandler);                                //User got unmodded
    TwitchChat.on('timeout', onTimeoutHandler);                            //User got timeouted

    TwitchChat.on('subscription', onSubscriptionHandler);                  //User subscribed
    TwitchChat.on('resub', onResubHandler);                                //User resubscribed
    TwitchChat.on('subgift', onSubgiftHandler);                            //User gifted subs (chosen)
    TwitchChat.on('submysterygift', onSubmysterygiftHandler);              //User gifted subs (random)
    TwitchChat.on('giftpaidupgrade', onGiftpaidupgradeHandler);            //User Upgraded from gift to real subscription
    TwitchChat.on('anongiftpaidupgrade', onAnongiftpaidupgradeHandler);    //User Upgraded from anonymousgift to real subscription
    TwitchChat.on('cheer', onCheerHandler);                                //User cheered

    //Connect to Twitch IRC Servers
    TwitchChat.Connect();
}

/*
 *  ----------------------------------------------------------
 *                     EVENT HANDLERS
 *  ----------------------------------------------------------
 */



/*
 *  ----------------------------------------------------------
 *                     BOT CONNECTION
 *  ----------------------------------------------------------
 */

function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);

    //TwitchChat.send("FrikyBot online!");
}
function onDisconnectedHandler(reason) {
    console.log("Bot got disconnected from TwitchIRC: " + reason);
}

/*
 *  ----------------------------------------------------------
 *                         CHAT
 *  ----------------------------------------------------------
 */

function onMessageHandler(channel, userstate, message, self) {
    if (self) { return; } // Ignore messages from the bot

    let msg = new TWITCHIRC.Message(channel, userstate, message);

    for (let pack of Object.getOwnPropertyNames(INSTALLED_PACKAGES)) {
        let packObject = INSTALLED_PACKAGES[pack].Object;

        if (packObject) {
            packObject.MessageHandler(msg);
        }
    }
}
function onMessagedeletedHandler(channel, username, deletedMessage, userstate) {

}


/*
 *  ----------------------------------------------------------
 *                       CHANNEL
 *  ----------------------------------------------------------
 */

function onHostedHandler(channel, username, viewers, autohost) {

}
function onRaidedHandler(channel, username, viewers) {

}

/*
 *  ----------------------------------------------------------
 *                         USER
 *  ----------------------------------------------------------
 */

function onJoinHandler(channel, username, self) {
    console.log(username + " joined!");
}
function onPartHandler(channel, username, self) {

}
function onBanHandler(channel, username, reason, userstate) {

}
function onModHandler(channel, username) {

}
function onUnmodHandler(channel, username) {

}
function onTimeoutHandler(channel, username, reason, duration, userstate) {

}

/*
 *  ----------------------------------------------------------
 *                 SUBSCRIPTIONS / CHEERS
 *  ----------------------------------------------------------
 */

function onSubscriptionHandler(channel, username, methods) {

}
function onResubHandler(channel, username, months, message, userstate, methods) {

}
function onSubgiftHandler(channel, username, streakMonths, recipient, methods, userstate) {

}
function onSubmysterygiftHandler(channel, username, numbOfSubs, methods, userstate) {

}
function onGiftpaidupgradeHandler(channel, username, sender, userstate) {

}
function onAnongiftpaidupgradeHandler(channel, username, userstate) {

}
function onCheerHandler(channel, userstate, message) {

}

/*
 *  ----------------------------------------------------------
 *                 TWITCH NEW API
 *  ----------------------------------------------------------
 */

function Twitch_NEW_API_Init() {
    TwitchNewAPI = new TWITCHNEWAPI.TwitchNewAPI(CONFIG.TwitchNewAPI, TwitchChat);
}

/*
 *  ----------------------------------------------------------
 *                       UTIL
 *  ----------------------------------------------------------
 */

//checking Stuff - not clean, but works for now
function checkForCompletion(source, template, required) {
    
    //go threw template
    for (let templ of Object.getOwnPropertyNames(template)) {

        let da = false;

        //check given for template minimum
        for (let response of Object.getOwnPropertyNames(source)) {
            //has given what template needs
            if (templ == response) {
                da = true;

                //is MUST HAVE value
                for (let req of required) {
                    if (templ == req) {
                        if (source[response] == "") {
                            return "Pls fill in/declare " + req;
                        } else {
                            for (let underObj of Object.getOwnPropertyNames(source[response])) {
                                if (source[response][underObj] == "") {
                                    return "Pls fill in/declare " + req + "." + underObj
                                }
                            }
                            break;
                        }
                    }
                }
                break;
            }
        }

        if (!da) {
            return templ + " missing";
        }
    }
    return "COMPLETE";
}
function isPWProtected(endpoint) {

    for (let pwProtected of API_PW_PROTECTED_ENDPOINTS) {
        if (pwProtected.path == endpoint.path && pwProtected.type == endpoint.type) {
            return true;
        }
    }

    let pack = getPackageByName(endpoint.path.substring(5, endpoint.path.indexOf('/', 5)));

    if (pack) {
        pack = pack.Object;
        if (pack) {

            let cuttedPath = endpoint.path.substring(endpoint.path.indexOf('/', 5));

            if (pack.isPWProtected({path: cuttedPath, type: endpoint.type})) {
                return true;
            }
        }
    }

    return false;
}

function getPackageByName(name) {
    if (INSTALLED_PACKAGES[name]) {
        return INSTALLED_PACKAGES[name];
    } else {
        return null;
    }
}
function removeOldPackageFiles(blankPath) {

    let exeptions = ["public/images", "public/scripts", "public/styles"];

    for (let exept of exeptions) {
        if (exept == blankPath) {
            return;
        }
    }

    let publicDir = path.resolve(blankPath);

    if (fs.existsSync(publicDir)) {
        fs.readdirSync(publicDir).forEach(function (file, index) {
            var curPath = blankPath + "/" + file;
            var curPathRes = path.resolve(blankPath + "/" + file);
            if (fs.lstatSync(curPathRes).isDirectory()) { // recurse
                removeOldPackageFiles(curPath);
            } else {
                if (blankPath != "public") {
                    fs.unlinkSync(curPathRes);
                }
            }
        });
        if(blankPath != "public") fs.rmdirSync(publicDir);
    }
}

//File Stuff
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
function removeDir(blankPath) {
    let publicDir = path.resolve(blankPath);

    if (fs.existsSync(publicDir)) {
        let pack = this;
        fs.readdirSync(publicDir).forEach(function (file, index) {
            var curPath = path.resolve(blankPath + "/" + file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                pack.removeHTML(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(publicDir);
    }
}