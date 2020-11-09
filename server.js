'use strict';

/*
 *  ----------------------------------------------------------
 *                      NPM MODULES
 *  ----------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const colors = require('colors');
const express = require('express');

console.log("\n");
console.log("///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");
console.log("                                   FRIKYBOT - CHAT BOT - NODE JS SERVER");
console.log("///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");

/*
 *  ----------------------------------------------------------
 *                      PRE-INIT
 *  ----------------------------------------------------------
 */

//LOGGER
let LOGGER;
let Logger;

//CONSTANTS
let CONSTANTS;

//WebApp
let WEBAPP = require('./WebApp.js');
let WebApp;

//TWITCH CHAT -> IRC
let TWITCHIRC;
let TwitchIRC;

//TWITCH API
let TWITCHAPI;
let TwitchAPI;

//DataCollection
let DATACOLLECTION;
let DataCollection;

//TEMP
let app;

//SERVER STATUS DATA
let Server_Status = {
    status: "Operational",
    errors: {
        fatal: {

        },
        outage: {

        }
    }
};

//BOT DATA COLLECTION - PACKAGES
let INSTALLED_PACKAGES = {

};

//Bot Config
let CONFIG = {};
const CONFIG_SETUP_TEMPLATE = {
    "TwitchIRC": {
        name: "Twitch IRC Interface",
        descriptiion: "Twitch Chat Integration allowing to send and receive Chat Messages.",
        type: "Object",
        default: {
            Bot_Username: "",
            OAuth: "",
            Broadcaster_Channel: ""
        }
    },
    "TwitchAPI": {
        name: "Twitch API Interface",
        descriptiion: "Twitch API Integration allowing to access the Twitch API receiving and updating User/Stream/and more Data.",
        type: "Object",
        default: {
            "Bot_User": "",
            "Bot_User_ID": "",
            "Client_ID": "",
            "Client_OAuth": "",
            "Client_Redirect_Uri": "",
            "Client_Secret": ""
        }
    },
    "DataCollection": {
        name: "DataCollection",
        descriptiion: "DataCollection Integration allowing to collect/analyse various Data from Users/Streams/... in one single place.",
        type: "Object",
        default: {}
    },
    "Packages": {
        name: "Packages",
        descriptiion: "Packages Integration adding more(most) Features to the Bot. Some might REQUIERE other Core Modules to run correctly!",
        type: "Object",
        default: {}
    }
};

/*
 *  ----------------------------------------------------------
 *                      INIT
 *  ----------------------------------------------------------
 */

//SPECIAL - BOT ESSENTIAL
//LOGGER
try {
    LOGGER = require('./Util/Logger.js');
    Logger = new LOGGER({ enableFileOutput: true });
    Logger.addSources({
        server: {
            display: () => " SERVER ".inverse.cyan
        },
        setup: {
            display: () => " SETUP ".inverse
        },
        express: {
            display: () => " EXPRESS ".inverse.cyan
        }
    });
} catch (err) {
    console.log("[ERROR] The FrikyBot REQUIERES the Custom Logger Module! Please check your install!".red);
    console.log("[ERROR] Please check your install!".red);
    return Promise.reject(err);
}

//CONSTANTS
try {
    CONSTANTS = require('./Util/CONSTANTS.js');
} catch (err) {
    Logger.server.error("The FrikyBot REQUIERES the Custom CONSTANTS Module! Please check your install!");
    Logger.server.warn("Please check your install!");
    return Promise.reject(err);
}

//SETUP WIZARD kinda
SETUP()
    .then(async data => {
        /*----------------------------------------------------------
         *                   INIT VARIABLES
         *----------------------------------------------------------*/
        
        //TwitchIRC 
        if (CONFIG.TwitchIRC) {
            try {
                TWITCHIRC = require('./TwitchIRC.js');
            } catch (err) {
                Logger.server.error("TwitchIRC Module failed to load!!");
                Logger.server.error(err.message);
                Logger.server.warn("Twitch Chat will be unavailable, please check your install!");
            }
        }

        

        //TwitchAPI
        if (CONFIG.TwitchAPI) {
            try {
                TWITCHAPI = require('./TwitchAPI.js');
            } catch (err) {
                Logger.server.error("TwitchAPI Module failed to load!!");
                Logger.server.error(err.message);
                Logger.server.warn("Twitch API will be unavailable, please check your install!");
            }
        }

        //DataCollection
        if (CONFIG.DataCollection) {
            try {
                DATACOLLECTION = require('./DataCollection.js');
            } catch (err) {
                Logger.server.error("DataCollection Module failed to load!!");
                Logger.server.error(err.message);
                Logger.server.warn("DataCollection will be unavailable, please check your install!");
            }
        }

        /*----------------------------------------------------------
         *                   INIT BOT
         *----------------------------------------------------------*/

        try {
            await INIT();
        } catch (err) {
            return Promise.reject(err);
        }
        
        try {
            await POST_INIT();
        } catch (err) {
            return Promise.reject(err);
        }

        if (WebApp === undefined) {
            Logger.server.error("Internal Error, WebServer wasnt started!");
            console.log("Press any key to exit.");
            process.stdin.on("data", data => {
                shutdown(0);
            });
        }
    })
    .catch(err => {
        Logger.server.error(err.message);
        console.log("Press any key to exit.");
        process.stdin.on("data", data => {
            shutdown(0);
        });
    });

/*
 *  ----------------------------------------------------------
 *                       functions
 *  ----------------------------------------------------------
 */

//SETUP
async function SETUP() {
    //REQUIERES CONSTANTS
    try {
        await checkBotFileStructure();
    } catch (err) {
        return Promise.reject(err);
    }

    //Config Setup
    if (fs.existsSync(path.resolve(CONSTANTS.FILESTRUCTURE.CONFIG_FILE_PATH))) {
        //Load Config
        Logger.setup.info("Config found!");
        if (!loadConfig()) {
            return Promise.reject(new Error("Config File Corrupted!"));
        }
    } else {
        //Create Config
        Logger.setup.error("Config not found!");

        try {
            await Config_Setup_Wizard();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    Logger.setup.info("Config ready!");

    return Promise.resolve();
}
async function checkBotFileStructure(go2create) {

    let FILESTRUCTURE = {};

    //Constats
    for (let dir in CONSTANTS.FILESTRUCTURE) {
        FILESTRUCTURE[dir] = CONSTANTS.FILESTRUCTURE[dir];
    }

    //Logger
    for (let dir in Logger.Settings.FileStructure) {
        FILESTRUCTURE["LOGS " + dir] = (dir !== "ROOT" ? Logger.Settings.FileStructure.ROOT : "") + Logger.Settings.FileStructure[dir];
    }
    
    //Create Basic Dir Structure
    try {
        for (let dir in FILESTRUCTURE) {
            if (dir === "CONFIG_FILE_PATH")
                continue;

            if (!fs.existsSync(path.resolve(FILESTRUCTURE[dir]))) {
                if (go2create === undefined) {
                    Logger.setup.warn("Seems like some Directories are missing!");
                    await Logger.setup.input("Do you want to create them now? (y/n) > ", async (line) => {
                        line = line.toLowerCase();

                        if (line === "yes" || line === "y") {
                            go2create = true;
                            return Promise.resolve();
                        } else if (line === "no" || line === "n") {
                            go2create = false;
                            return Promise.resolve();
                        } else {
                            Logger.setup.space("(yes or no) > ");
                            return Promise.reject();
                        }
                    });
                }
                
                if (go2create) {
                    Logger.setup.info("Created Directory: " + FILESTRUCTURE[dir])
                    fs.mkdirSync(path.resolve(FILESTRUCTURE[dir]));
                }
            }
        }

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

//CONFIG
async function Config_Setup_Wizard(cfg = {}) {
    Logger.setup.warn("Seems like the Config is missing!");
    let result = false;

    await Logger.setup.input("Do you want to create the config now? (y/n) > ", async (line) => {
        line = line.toLowerCase();

        if (line === "yes" || line === "y") {
            result = true;
            return Promise.resolve();
        } else if (line === "no" || line === "n") {
            result = false;
            return Promise.resolve();
        } else {
            Logger.setup.space("(yes or no) > ");
            return Promise.reject();
        }
    });


    if (!result) {
        return Promise.reject(new Error("User declinded Config creation!"));
    }

    //Create Config
    for (let key in CONFIG_SETUP_TEMPLATE) {
        Logger.setup.info(CONFIG_SETUP_TEMPLATE[key].descriptiion);
        let result = false;

        await Logger.setup.input("Do you want " + CONFIG_SETUP_TEMPLATE[key].name + "? (y/n) > ", async (line) => {
            line = line.toLowerCase();

            if (line === "yes" || line === "y") {
                result = true;
                return Promise.resolve();
            } else if (line === "no" || line === "n") {
                result = false;
                return Promise.resolve();
            } else {
                Logger.setup.space("(yes or no) > ");
                return Promise.reject();
            }
        });
        
        if (result) {
            cfg[key] = CONFIG_SETUP_TEMPLATE[key].default ? CONFIG_SETUP_TEMPLATE[key].default : getEmptyOfType(CONFIG_SETUP_TEMPLATE[key].type);

            //Add Packages
            if (key === "Packages") {
                let more;
                do {
                    await Logger.setup.input("Do you want to add a" + (more !== undefined ? "nother" : "") + " Package? (y/n) > ", async (line) => {
                        line = line.toLowerCase();

                        if (line === "yes" || line === "y") {
                            more = true;
                            return Promise.resolve();
                        } else if (line === "no" || line === "n") {
                            more = false;
                            return Promise.resolve();
                        } else {
                            Logger.setup.space("(yes or no) > ");
                            return Promise.reject();
                        }
                    });
                    
                    if (more === true) {
                        let packge = await Logger.setup.input("Enter the Name of the Package: ");
                        let startParam = await Logger.setup.input("Start Paramerters for the '" + packge + "' Package: ");

                        cfg.Packages[packge] = startParam;
                    }

                } while (more);
            }
        }
    }

    fs.writeFileSync(path.resolve(CONSTANTS.FILESTRUCTURE.CONFIG_FILE_PATH), JSON.stringify(cfg, null, 4));
    CONFIG = cfg;
}

function loadConfig() {
    //////////////////
    //// LOADDING ////
    //////////////////
    let resolvedPath = path.resolve(CONSTANTS.FILESTRUCTURE.CONFIG_FILE_PATH);
    
    //SETUP CONFIG
    let config_content = {};
    let virtual_config = {};
    let extern_files = {};

    if (fs.existsSync(resolvedPath)) {
        //Load Config when exists
        //Is File?
        if (!fs.lstatSync(resolvedPath).isFile()) {
            Logger.server.error("CONFIG PATH IS NOT A FILE! Needs to be a .json File!");
            return false;
        } else {
            //Load Data
            try {
                virtual_config = JSON.parse(fs.readFileSync(resolvedPath));
                config_content = JSON.parse(JSON.stringify(virtual_config));
            } catch (err) {
                Logger.server.error("FILE ERROR: " + err.message);
                console.log(err);
                return false;
            }
        }
    } else {
        //"Create new File"
        Logger.server.error("CONFIG File NOT found!");
        return false;
    }
    
    /////////////////////
    //// EXTERN DATA ////
    /////////////////////

    //Uses Extern Config Settings
    for (let core in config_content) {
        if (config_content[core].extern != undefined) {
            let externResolvedPath = path.resolve(config_content[core].extern);

            if (fs.existsSync(externResolvedPath)) {
                //Is File?
                if (!fs.lstatSync(externResolvedPath).isFile()) {
                    Logger.server.error("EXTERN CONFIG PATH IS NOT A FILE! Needs to be a .json File!");
                    return false;
                } else {
                    let temp = extern_files[externResolvedPath];

                    if (temp == undefined) {
                        //Load Data
                        try {
                            temp = JSON.parse(fs.readFileSync(externResolvedPath));
                            extern_files[externResolvedPath] = temp;
                        } catch (err) {
                            Logger.server.error("FILE ERROR: " + err.message);
                            console.log(err);
                            return false;
                        }
                    }

                    let check = "INTERNAL ERROR!";
                    if (temp[core] != undefined) {
                        //Use parts
                        check = combineConfigs(config_content[core], temp[core]);
                    } else {
                        //use all 
                        check = combineConfigs(config_content[core], temp);
                    }

                    if (typeof check == "string") {
                        Logger.server.error("CONFIG ERROR: " + check);
                    }
                }
            } else {
                Logger.server.error("EXTERN CONFIG File NOT found at " + externResolvedPath);
                return false;
            }
        }
    }
    
    ////////////////////
    //// DATA CHECK ////
    ////////////////////

    //Check Contents if they make sense / are correct
    if (checkConfigContent(config_content, virtual_config) == false) {
        return false;
    }

    CONFIG = config_content;
    return true;
}
function checkConfigContent(config_content, virtual_config) {

    for (let key in CONFIG_SETUP_TEMPLATE) {
        if (config_content[key]) {

            if (CONFIG_SETUP_TEMPLATE[key].type.toLowerCase() !== typeof (config_content[key])) {
                Logger.setup.error("Config " + key + " is of wrong type!!");
                return false;
            }

            if (CONFIG_SETUP_TEMPLATE[key].type === "Object" && CONFIG_SETUP_TEMPLATE[key].default != undefined) {
                for (let req in CONFIG_SETUP_TEMPLATE[key].default) {
                    if (config_content[key][req] == undefined) {
                        Logger.setup.error("Config " + key + "." + req + " is missing!!");
                        return false;
                    }
                }
            }
        }
    }

    Logger.server.info("Config READY! Starting Bot ... ");
    return true;
}
function combineConfigs(config_content, extern_config) {
    if (!(config_content instanceof Object && extern_config instanceof Object)) {
        return config_content instanceof Object ? "curernt config NOT AN OBJECT!" : "extern config NOT AN OBJECT!";
    }

    for (let ext in extern_config) {
        if (config_content[ext] == undefined) {
            config_content[ext] = extern_config[ext];
            continue;
        }

        if (typeof extern_config[ext] != typeof config_content[ext]) {
            return ext + " is wrong type! Must be: " + typeof extern_config[ext];
        }

        //is itself an Object
        if (extern_config[ext] instanceof Object) {
            let inner = combineConfigs(config_content[ext], extern_config[ext]);

            if (typeof inner == "string") {
                return inner;
            }
        }
    }

    return true;
}

//INIT
async function INIT() {
    Logger.server.info("INITATING BOT CORE ... ");
    
    //Init
    try {
        await INIT_WEBAPP();
    } catch (err) {
        Logger.express.error(err.message);
    }
    
    //TwitchIRC
    try {
        await INIT_TTV_IRC();
    } catch (err) {
        Logger.TwitchIRC.error(err.message);
        Server_Status.errors.outage.TwitchIRCDisconnect = err.message;
    }
    
    //Twitch API
    try {
        await INIT_TTV_API();
    } catch (err) {
        Logger.TwitchAPI.error(err.message);
        Server_Status.errors.outage.TwitchAPI = err.message;
    }

    //DataCollection
    INIT_DATACOLLECTION();

    //LOAD CONFIG PACKAGES
    loadPackages();

    //INIT PACKAGES
    return INIT_Packages();
}
async function INIT_Packages() {
    Logger.server.info("INITATING BOT Packages ... ");
    
    //Setup ALL Packages
    for (let pack in INSTALLED_PACKAGES) {
        try {
            let packClass = INSTALLED_PACKAGES[pack].Class;
            INSTALLED_PACKAGES[pack].Object = new packClass(WebApp.GetInteractor(), TwitchIRC, TwitchAPI, DataCollection, CONFIG.Packages[pack], Logger);

            //Init ENABLED Packages
            if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                try {
                    await INSTALLED_PACKAGES[pack].Object.Init();
                } catch (err) {
                    console.log(err);
                    Logger.error(err.message);
                }
            }

        } catch (err) {
            Logger.server.error(err.message);
        }
    }

    return Promise.resolve();
}
async function POST_INIT() {
    Logger.server.info("POST INIT BOT Packages ... ");

    //WebApp Authenticator
    if (CONFIG.TwitchAPI && TWITCHAPI && TwitchAPI) {
        let auth = new TWITCHAPI.Authenticator({ show_auth_message: false }, TwitchAPI, Logger);
        WebApp.setAuthenticator(auth);
        let AuthenticatorAPIRoute = express.Router();

        AuthenticatorAPIRoute.get('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }
            
            let user_ids;

            if (typeof (req.query.user_id) === 'string') {
                user_ids = [ req.query.user_id ];
            } else {
                user_ids = req.query.user_id;
            }

            try {
                let users = await auth.GetUsers(user_ids);
                res.json({ data: users });
            } catch (err) {
                res.json({ err: 'getting users failed.' });
            }
            return Promise.resolve();
        });
        AuthenticatorAPIRoute.post('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            //Add User
            try {
                let new_user = await auth.addUser(req.body.user_id, req.body.user_name, req.body.user_level, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ new_user: new_user });
            } catch (err) {
                res.json({ err: err.message });
            }
            return Promise.resolve();
        });
        AuthenticatorAPIRoute.delete('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            //Remove User
            try {
                let cnt = await auth.removeUser(req.body.user_id, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ deleted: cnt });
            } catch (err) {
                res.json({ err: err.message });
            }
            return Promise.resolve();
        });
        AuthenticatorAPIRoute.put('/user', async (req, res, next) => {
            if (!res.locals.user || isNaN(res.locals.user.sub)) {
                res.status(500).json({ err: 'Internal Error.' });
                return Promise.resolve();
            }

            try {
                let cnt = await auth.updateUser(req.body.user_id, req.body.user_name, req.body.user_level, res.locals.user.sub, res.locals.user.preferred_username);
                res.json({ upt_user: cnt });
            } catch (err) {
                console.log(err);
                res.json({ err: 'user edit failed.' });
            }
            return Promise.resolve();
        });

        WebApp.GetInteractor().addAuthAPIRoute('/Authenticator', null, AuthenticatorAPIRoute);
    }

    //PACKAGE INTERCONNECT
    for (let pack in INSTALLED_PACKAGES) {
        try {
            //Post Init ENABLED Packages
            if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                try {
                    let Package_Interconnect_requests = INSTALLED_PACKAGES[pack].Object.GetPackageInterconnectRequests();

                    for (let request in Package_Interconnect_requests) {
                        if (INSTALLED_PACKAGES[request] && INSTALLED_PACKAGES[request].Object && INSTALLED_PACKAGES[request].Object.isEnabled()) {
                            let intercon_status = INSTALLED_PACKAGES[request].Object.requestPackageInterconnect(pack, Package_Interconnect_requests[request]);
                            
                            if (!intercon_status){
                                Logger.server.warn("Package '" + request + "' DECLINED Interconnect Request from '" + pack + "'");
                            }
                        }
                    }

                } catch (err) {
                    console.log(err);
                    Logger.error(err.message);
                }
            }

        } catch (err) {
            Logger.server.error(err.message);
        }
    }

    //PACKAGE POST INIT
    for (let pack in INSTALLED_PACKAGES) {
        try {
            //Post Init ENABLED Packages
            if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                try {
                    await INSTALLED_PACKAGES[pack].Object.PostInit();
                } catch (err) {
                    console.log(err);
                    Logger.error(err.message);
                }
            }
        } catch (err) {
            Logger.server.error(err.message);
        }
    }

    //CONSOLE INPUT
    process.stdin.on("data", DEV_CONSOLE_INPUT_MASTER);

    Logger.server.info("BOT ONLINE AND READY!");
    return Promise.resolve();
}

async function INIT_WEBAPP() {
    WebApp = new WEBAPP.WebApp({}, Logger);

    try {
        await WebApp.Init();
        let WebAppInteractor = WebApp.GetInteractor();

        ////WebApp - API
        let APIRouter = express.Router();
        let AuthAPIRouter = express.Router();

        //NON AUTHENTICATED
        APIRouter.get('/BotStatus', API_BotStatus);
        APIRouter.get('/Navi', API_Navi);
        APIRouter.get('/Packages', API_Packages);
        APIRouter.get('/Cookies', API_Cookies);

        //AUTHENTICATED - SETTINGS
        let SettingsAPIRouter = express.Router();
        SettingsAPIRouter.get('/setup', PAGE_Settings_Setup);
        SettingsAPIRouter.get('/navigation', PAGE_Settings_Nav);
        AuthAPIRouter.use("/settings", SettingsAPIRouter);

        WebAppInteractor.addMainRoute(MAIN_ROUTER);
        WebAppInteractor.addAPIRoute('', APIRouter);
        WebAppInteractor.addAuthAPIRoute('/auth', null, AuthAPIRouter);

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}
async function INIT_TTV_IRC() {
    if (CONFIG.TwitchIRC && TWITCHIRC) {
        TwitchIRC = new TWITCHIRC.TwitchIRC(CONFIG.TwitchIRC.Bot_Username, CONFIG.TwitchIRC.OAuth, CONFIG.TwitchIRC.Broadcaster_Channel, Logger);

        TwitchIRC.on('connected', (addr, port) => {
            Logger.TwitchIRC.info(`*Connected to ${addr}:${port}`);
            delete Server_Status.errors.outage.TwitchIRCDisconnect;
        });
        TwitchIRC.on('disconnected', (reason) => {
            Logger.TwitchIRC.error("Bot got disconnected! Reason: " + (reason ? reason : " UNKNOWN"));
            Server_Status.errors.outage.TwitchIRCDisconnect = "Reason: " + (reason ? reason : " UNKNOWN");
        });
        TwitchIRC.on('chat', (channel, userstate, message, self) => {
            let msg = new TWITCHIRC.Message(channel, userstate, message);
            Logger.TwitchIRC.info(msg.toString());
        });
        TwitchIRC.on('join', (channel, username, self) => { Logger.TwitchIRC.info(username + " joined!"); });
        
        //Connect to Twitch IRC Servers
        try {
            await TwitchIRC.Connect();
        } catch (err) {
            return Promise.reject(new Error("Couldnt connect to TwitchIRC"));
        }
    }
    return Promise.resolve();
}
async function INIT_TTV_API() {
    if (CONFIG.TwitchAPI && TWITCHAPI) {
        TwitchAPI = new TWITCHAPI.TwitchAPI(CONFIG.TwitchAPI, WebApp.GetInteractor(), TwitchIRC, Logger);
        try {
            await TwitchAPI.Init();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    return Promise.resolve();
}
function INIT_DATACOLLECTION() {
    if (CONFIG.DataCollection && DATACOLLECTION) {
        if (CONFIG.DataCollection.enabled != false)
            DataCollection = new DATACOLLECTION.DataCollection(CONFIG.DataCollection, TwitchIRC, TwitchAPI);
    }
}

//Packages
function loadPackages() {
    for (let pack in CONFIG.Packages) {
        try {
            INSTALLED_PACKAGES[pack] = {
                Object: null,
                Class: require('./' + CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + pack + '/' + pack + '.js')[pack],
                Config: CONFIG.Packages[pack]
            }
        } catch (err) {
            Logger.server.error(err.message);
            Logger.server.warn("Please check your install!");
        }
    }
}

//UTIL
function getEmptyOfType(type) {
    if (type === "Object") {
        return {};
    } else if (type === "Array") {
        return [];
    } else if (type === "Number") {
        return 0;
    } else if (type === "String") {
        return "";
    } else {
        return null;
    }
}
function shutdown(timeS) {

    if (timeS > 0) {
        Logger.server.warn("BOT SHUTTING DOWN IN " + timeS + "... ");
    } else if (timeS == 0) {
        Logger.server.warn("BOT SHUTTING DOWN NOW!");
    } else {
        process.exit(0);
    }

    setTimeout(() => shutdown(timeS - 1), 1000);
}

/*
 *  ----------------------------------------------------------
 *                       EXPRESS MIDDLEWARE
 *  ----------------------------------------------------------
 */

async function MAIN_ROUTER(req, res, next) {
    //Rediect .../test/ to .../test
    if (req.originalUrl !== "/" && req.originalUrl.charAt(req.originalUrl.length - 1) == "/") {
        res.redirect(req.originalUrl.substring(0, req.originalUrl.length - 1));
        return Promise.resolve();
    }
   
    //Facivon 
    if (req.originalUrl == "/favicon.ico") {
        return res.redirect("/favicon.png");
    }

    //TTV Login 
    if (CONFIG.TwitchAPI && TwitchAPI && req.originalUrl.toLowerCase().startsWith("/settings/setup") && req.query['code']) {
        try {
            await TwitchAPI.createUserAccessToken(req.query['code'], req.query['scopes']);
            return res.redirect("/Settings");
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
            return res.redirect("/Settings?error=" + err.message);
        }
    }
    
    //Check other Routers
    try {
        next();
    } catch (err) {
        Logger.server.error(err.message);
    }
}

async function API_BotStatus(req, res, next) {
    try {
        //Get Data
        let data = {
            Status: Server_Status,
            Username: "",
            Channel: "",
            Description: "",
            Type: "",
            Image: ""
        };

        //Twitch IRC
        if (CONFIG.TwitchIRC) {
            if (TwitchIRC) {
                data.Channel = TwitchIRC.getChannel();
            } else {
                Server_Status.errors.fatal.TwitchIRC = "Not initialized.";
            }
        }

        //Twitch API
        if (CONFIG.TwitchAPI) {
            if (!TwitchAPI) {
                Server_Status.errors.fatal.TwitchAPI = "Not initialized.";
            } else {
                delete Server_Status.errors.fatal.TwitchAPI;

                if (!TwitchAPI.UserAccessToken) {
                    Server_Status.errors.outage.TwitchAPI = "No UserAccess.";
                } else if (!TwitchAPI.AppAccessToken) {
                    Server_Status.errors.outage.TwitchAPI = "No AppAccess.";
                } else {
                    delete Server_Status.errors.outage.TwitchAPI;
                }

                if (TwitchIRC) {
                    try {
                        let UserJson = await TwitchAPI.GetUsers({ login: TwitchIRC.getUsername() });

                        if (UserJson && UserJson.data && UserJson.data[0]) {
                            data.Username = UserJson.data[0].display_name ? UserJson.data[0].display_name : UserJson.data[0].login;
                            data.Description = UserJson.data[0].description;
                            data.Type = UserJson.data[0].type;
                            data.Image = UserJson.data[0].profile_image_url;
                        }
                    } catch (err) {
                        Logger.TwitchAPI.error(err.message);
                        Server_Status.errors.fatal.TwitchAPI = err.message;
                    }
                }
            }
        }

        //DataCollection
        if (CONFIG.DataCollection) {
            if (!DataCollection) {
                Server_Status.errors.fatal.DataCollection = "Not initialized.";
            }
        }

        //Check Status Level
        if (Object.getOwnPropertyNames(Server_Status.errors.fatal).length > 0) {
            Server_Status.status = "Fatal";
        } else if (Object.getOwnPropertyNames(Server_Status.errors.outage).length > 0) {
            Server_Status.status = "Outages";
        } else {
            Server_Status.status = "Operational";
        }

        //Send Data
        if (data) {
            res.json(data);
        } else {
            res.json({ err: "No Data was fetched" });
        }
    } catch (err) {
        res.json({ err: err.message });
    }
}
async function API_Navi(req, res, next) {
    //Authentication
    let is_authed = false;
    try {
        is_authed = await WebApp.GetInteractor().AuthenticateRequest(req);
    } catch (err) {

    }


    //  Main - Section
    let MainNavigationPackages = ["CommandHandler", "ChatStats", "CustomChat"];
    let MainSection = [{ type: "icon", name: "Homepage", href: "/", icon: "images/icons/home.svg" }];

    for (let pack of MainNavigationPackages) {
        if (INSTALLED_PACKAGES[pack] && INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isNaviEnabled()) {
            let temp_Pck_Nav = INSTALLED_PACKAGES[pack].Object.isNaviEnabled();
            temp_Pck_Nav.type = "icon";
            MainSection.push(temp_Pck_Nav);
        }
    }

    //  Packages - Section
    let PackageSection = [];

    for (let pack in INSTALLED_PACKAGES) {
        //Skip Packages already used in Main Nav
        let skip = false;
        for (let dont of MainNavigationPackages) {
            if (dont == pack) {
                skip = true; break;
            }
        }

        //Add Data
        if (!skip && INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isNaviEnabled()) {
            let temp_Pck_Nav = INSTALLED_PACKAGES[pack].Object.isNaviEnabled();
            temp_Pck_Nav.type = "icon";
            PackageSection.push(temp_Pck_Nav);
        }
    }
    //Add "More Packages"
    PackageSection.push({ type: "icon", name: "More Packages", href: "/Packages", icon: "images/icons/packages.svg" });

    //  Settings - Section
    let SettingsSection = [];

    SettingsSection.push({ type: "icon", name: "Bot Details", href: "/Bot", icon: "images/icons/FrikyBot.png" });
    if (is_authed === true) SettingsSection.push({ type: "icon", name: "Settings", href: "/Settings", icon: "images/icons/gear.svg" });
    SettingsSection.push({ type: "icon", name: "Login", href: "/Login", icon: "images/icons/twitch.svg" });

    //Return Data
    return res.json({
        data: [
            {
                "type": "section",
                "name": "Main Navigation",
                "contents": [{ type: "icon", name: "Homepage", href: "/", icon: "images/icons/home.svg" }]
            },
            {
                "type": "section",
                "name": "Packages",
                "contents": PackageSection
            },
            {
                "type": "section",
                "name": "Settings",
                "contents": SettingsSection
            }
        ]
    });
}
async function API_Packages(req, res, next) {
    //Authentication
    let is_authed = false;
    try {
        is_authed = await WebApp.GetInteractor().AuthenticateRequest(req);
    } catch (err) {

    }

    let out = {
        Packages: {

        }
    };

    for (let pack in INSTALLED_PACKAGES) {
        try {
            if (is_authed || INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                out.Packages[pack] = INSTALLED_PACKAGES[pack].Object.getPackageDetails();
            }
        } catch (err) {
            Logger.server.error(err.message);
        }
    }

    return res.json({ data: out });
}
function API_Cookies(req, res, next) {
    const out = {
        LocalStorage: {

        },
        SessionStorage: {
            "BOT_STATUS_DETAILS": {
                "Set By?": "Bot_Status_Details.js",
                "When Set?": "When new Bot Details were fetched",
                "Used for?": "Reduce loadtimes by storing a temporary dataset of the Bot Status."
            },
            "NAVIVATION": {
                "Set By?": "standard.js -> ANY",
                "When Set?": "When new Navigation Data was fetched",
                "Used for?": "Reduce loadtimes by storing a temporary dataset of the Navigation Data."
            }
        }
    };

    return res.json({ data: out });
}

async function PAGE_Settings_Control(req, res, next) {
    let data = {};

    res.json({
        data: data
    });
}
async function PAGE_Settings_Setup(req, res, next) {
    let data = {};

    //TTV API
    if (CONFIG.TwitchAPI && TwitchAPI) {
        data.TwitchAPI = {};

        try {
            await TwitchAPI.updateAppAccessToken();
            data.TwitchAPI.app = await TwitchAPI.getAppTokenStatus();
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
        }

        try {
            await TwitchAPI.updateUserAccessToken();
            data.TwitchAPI.user = await TwitchAPI.getUserTokenStatus();
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
        }
    }

    //TTV IRC
    if (CONFIG.TwitchIRC && TwitchIRC) {
        data.TwitchIRC = {
            channel: TwitchIRC.getChannel()
        };

        if (TwitchIRC.getChannel()) {
            try {
                let streams = await TwitchAPI.GetStreams({ user_login: TwitchIRC.getChannel().substring(1) });
                if (streams && streams.data && streams.data.length > 0)
                    data.TwitchIRC.channel_state = true;
                else
                    data.TwitchIRC.channel_state = false;
            } catch (err) {
                Logger.TwitchIRC.error(err.message);
            }
        }
    }
    
    //Authentication
    if (WebApp && WebApp.GetInteractor() && WebApp.GetInteractor().Authenticator) {
        let auth = WebApp.GetInteractor().Authenticator;

        data.Authenticator = {

        };
        
        if (TWITCHAPI && auth instanceof TWITCHAPI.Authenticator) {
            data.Authenticator.origin = 'TWITCH API AUTHENTICATOR';
            try {
                data.Authenticator.users = await auth.GetUsers();
            } catch (err) {
                Logger.Authenticator.error(err.message);
            }
        }
    }

    res.json({
        data: data
    });
}
async function PAGE_Settings_Packages(req, res, next) {
    let data = {};

    res.json({
        data: data
    });
}
async function PAGE_Settings_Logs(req, res, next) {
    let data = {};

    res.json({
        data: data
    });
}
async function PAGE_Settings_Nav(req, res, next) {
    let data = [];

    //Bot Control
    data.push({
        type: "icon",
        name: "Bot Control",
        href: "settings",
        icon: "images/icons/home.svg"
    });

    //Bot Setup
    data.push({
        type: "icon",
        name: "Bot Setup",
        href: "settings/setup",
        icon: "images/icons/home.svg"
    });

    //Packages
    data.push({
        type: "icon",
        name: "Packages",
        href: "settings/packages",
        icon: "images/icons/home.svg"
    });

    //Logs
    data.push({
        type: "icon",
        name: "Logs",
        href: "settings/logs",
        icon: "images/icons/home.svg"
    });

    res.json({
        data: data
    });
}

/*
 *  ----------------------------------------------------------
 *                 DEV - CONSOLE INPUT COMMANDS
 *  ----------------------------------------------------------
 */

function DEV_CONSOLE_INPUT_MASTER(data) {
    let trans = "";

    for (let i = 0; i < data.toString().length - 2; i++) {
        trans += data.toString().charAt(i);
    }

    let params = trans.split(" ");

    if (params[0] == "exit") {
        process.exit(0);
    } else if (params[0] == "enable") {
        try {
            INSTALLED_PACKAGES[params[1]].Object.enable();
            Logger.server.info("ENABLED " + params[1]);
        } catch (err) {
            Logger.server.error("ENABLE FAILED! " + err.message);
        }
    } else if (params[0] == "disable") {
        try {
            if (INSTALLED_PACKAGES[params[1]]) {
                INSTALLED_PACKAGES[params[1]].Object.disable();
                Logger.server.info("DISABLED " + params[1]);
            }
        } catch (err) {
            Logger.server.error("DISABLE FAILED! " + err.message);
        }
    } else if (params[0] == "reload") {
        try {
            if (INSTALLED_PACKAGES[params[1]]) {
                INSTALLED_PACKAGES[params[1]].Object.reload();
            } else {
                return;
            }
            Logger.server.info("RELOADED " + params[1]);
        } catch (err) {
            Logger.server.error("RELAODING FAILED! " + err.message);
        }
    }
}