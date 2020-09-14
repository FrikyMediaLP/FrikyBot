'use strict';

/*
 *  ----------------------------------------------------------
 *                      NPM MODULES
 *  ----------------------------------------------------------
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

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
//TWITCH CHAT -> IRC
let TWITCHIRC;
let TwitchIRC;
//TWITCH API
let TWITCHAPI;
let TwitchAPI;
//DataCollection
let DATACOLLECTION;
let DataCollection;
//Express
const app = express();
let server;

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
    Logger = new LOGGER();
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

        if (server === undefined) {
            Logger.server.info("Press Enter to exit.");
            await ConsolePrompt();
            shutdown(-1);
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
    if (fs.existsSync(path.resolve(CONSTANTS.DEFAULT_CONFIG_FILE_PATH))) {
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

    Logger.setup.info("Config ready!".green);

    return Promise.resolve();
}
async function checkBotFileStructure(go2create) {
    //Create Basic Dir Structure
    try {
        const dirs = [
            CONSTANTS.PACKAGES_INSTALL_ROOT,
            CONSTANTS.UTIL_INSTALL_ROOT,
            CONSTANTS.DATA_STORAGE_ROOT,
            CONSTANTS.ThirdrdPary_INSTALL_ROOT,
            CONSTANTS.Static_Hosting_ROOT
        ];

        for (let dir of dirs) {
            if (!fs.existsSync(path.resolve(dir))) {
                if (go2create === undefined) {
                    Logger.setup.warn("Seems like some Directories are missing!");
                    process.stdout.write("Do you want to create them now? (y/n) > ");

                    //Console Input
                    do {
                        let answer = await ConsolePrompt();
                        //Make into String and remove '\' and 'n' Chars from the linebreak
                        answer = answer.toString().substring(0, answer.length - 2).toLowerCase();

                        if (answer === "yes" || answer === "y") {
                            go2create = true;
                        } else if (answer === "no" || answer === "n") {
                            go2create = false;
                        } else {
                            process.stdout.write("Yes or No? > ");
                        }
                    } while (go2create === undefined);
                }
                
                if (go2create) {
                    Logger.setup.info("Created Directory: " + dir)
                    fs.mkdirSync(path.resolve(dir));
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
    Logger.setup.info("Do you want to create them now? (y/n)");
    let result = await ConsoleYN();

    if (!result) {
        return Promise.reject(new Error("User declinded Config creation!"));
    }

    //Create Config
    for (let key in CONFIG_SETUP_TEMPLATE) {
        Logger.setup.info(CONFIG_SETUP_TEMPLATE[key].descriptiion);
        Logger.setup.info("Do you want " + CONFIG_SETUP_TEMPLATE[key].name + "? (y/n)");
        let result = await ConsoleYN();
        
        if (result) {
            cfg[key] = CONFIG_SETUP_TEMPLATE[key].default ? CONFIG_SETUP_TEMPLATE[key].default : getEmptyOfType(CONFIG_SETUP_TEMPLATE[key].type);

            //Add Packages
            if (key === "Packages") {
                let more;
                do {
                    Logger.setup.info("Do you want to add a" + (more !== undefined ? "nother": "") + " Package? (y/n)");
                    more = await ConsoleYN();

                    if (more === true) {
                        process.stdout.write("Enter the Name of the Package: ");
                        let packge = await ConsolePrompt();
                        packge = packge.toString().substring(0, packge.length - 2);

                        process.stdout.write("Start Paramerters for the '" + packge + "' Package: ");
                        let startParam = await ConsolePrompt();
                        startParam = startParam.toString().substring(0, startParam.length - 2);

                        cfg.Packages[packge] = startParam;
                    }

                } while (more);
            }
        }
    }

    fs.writeFileSync(path.resolve(CONSTANTS.DEFAULT_CONFIG_FILE_PATH), JSON.stringify(cfg, null, 4));
    CONFIG = cfg;
}

function loadConfig() {
    //////////////////
    //// LOADDING ////
    //////////////////
    let resolvedPath = path.resolve(CONSTANTS.DEFAULT_CONFIG_FILE_PATH);

    if (!fs.existsSync(resolvedPath.substring(0, resolvedPath.lastIndexOf("\\")))) {
        Logger.server.error("CONFIG PATH TRACEABLE!");
        return false;
    }

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

    //WebApp Init
    server = app.listen(8080, () => Logger.express.info("Listening on " + server.address().address + ":" + server.address().port + " ..."));
    app.use(express.static("public", {
        extensions: ['html', 'htm']
    }));
    app.use(express.json({ limit: "1mb" }));

    //WebApp - File Routing
    app.use(async function (req, res, next) {
        //Rediect .../test/ to .../test
        if (req.originalUrl.charAt(req.originalUrl.length - 1) == "/") {
            res.redirect(req.originalUrl.substring(0, req.originalUrl.length - 1));
            return Promise.resolve();
        }

        //Facivon 
        if (req.originalUrl == "/favicon.ico") {
            res.redirect("/favicon.png");
            return Promise.resolve();
        }

        //Routing
        let URL = req.originalUrl;

        if (URL.indexOf("/Twitch-redirect?") >= 0) {
            //AUTHENTICATION
            if (true) {
                res.sendFile(path.resolve("DATA/PAGES/Settings/settings.html"));
            } else {
                res.sendFile(path.resolve("DATA/PAGES/NoAccess.html"));
            }

            let code = "";
            let scopes = "";

            if (req.url.indexOf("&scope=") < 0) {
                code = req.url.substring(req.url.indexOf("?code=") + 6);
            } else {
                code = req.url.substring(req.url.indexOf("?code=") + 6, req.url.indexOf("&scope="));
                scopes = req.url.substring(req.url.indexOf("&scope=") + 7);
            }
            try {
                await TwitchAPI.createUserAccessToken(code, scopes);
                res.redirect("Bot");
            } catch (err) {
                Logger.server.error(err.message);
                res.redirect("Bot").sendFile(path.resolve("DATA/PAGES/NoAccess.html"));
            }
        } else if (URL.indexOf("/Twitch-redirect") >= 0) {
            res.redirect("login");
        } else if (URL.indexOf("/Settings/") >= 0 || URL == "/Settings") {
            //AUTHENTICATION
            if (true) {
                res.sendFile(path.resolve("DATA/PAGES/Settings/settings.html"));
            } else {
                res.sendFile(path.resolve("DATA/PAGES/NoAccess.html"));
            }
        } else {
            //Check other Routers
            try {
                next();
            } catch (err) {
                Logger.server.error(err.message);
            }
        }
    });

    //WebApp - API
    let APIRouter = express.Router();

    APIRouter.get('/BotStatus', async (request, response) => {
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

            if (TwitchIRC) {
                data.Channel = TwitchIRC.getChannel();
            } else {
                Server_Status.errors.fatal.TwitchIRC = "Not initialized.";
            }

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
                        console.log(err);
                        Server_Status.errors.fatal.TwitchAPI = err.message;
                    }
                }
            }

            if (!DataCollection) {
                Server_Status.errors.fatal.DataCollection = "Not initialized.";
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
                response.json(data);
            } else {
                response.json({ err: "No Data was fetched" });
            }
        } catch (err) {
            response.json({ err: err.message });
        }
    });
    APIRouter.get('/Navi', (request, response) => {
        //  Main - Section
        let MainNavigationPackages = ["CommandHandler", "ChatStats", "CustomChat"];
        let MainSection = {
            "type": "section",
            "name": "Main Navigation",
            "contents": [
                {
                    type: "icon", name: "Homepage", href: "/", icon: "images/icons/home.svg"
                }
            ]
        };

        for (let pack of MainNavigationPackages) {
            if (INSTALLED_PACKAGES[pack] && INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isNaviEnabled()) {
                let temp_Pck_Nav = INSTALLED_PACKAGES[pack].Object.isNaviEnabled();
                temp_Pck_Nav.type = "icon";
                MainSection.contents.push(temp_Pck_Nav);
            }
        }
        
        //  Packages - Section
        let PackageSection = {
            "type": "section",
            "name": "Packages",
            "contents": [

            ]
        };
        for (let pack in INSTALLED_PACKAGES) {
            //Skip Packages already used in Main Nav
            let skip = false
            for (let dont of MainNavigationPackages) {
                if (dont == pack) {
                    skip = true;
                    break;
                }
            }

            //Add Data
            if (!skip && INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isNaviEnabled()) {
                let temp_Pck_Nav = INSTALLED_PACKAGES[pack].Object.isNaviEnabled();
                temp_Pck_Nav.type = "icon";
                PackageSection.contents.push(temp_Pck_Nav);
            }
        }
        //Add "More Packages"
        PackageSection.contents.push({ type: "icon", name: "More Packages", href: "/Packages", icon: "images/icons/packages.svg" });

        //  Settings - Section
        let SettingsSection = {
            "type": "section",
            "name": "Settings",
            "contents": [
                {
                    type: "icon", name: "Bot Details", href: "/Bot", icon: "images/icons/FrikyBot.png"
                }
            ]
        };

        //Return Data
        response.json({
            status: CONSTANTS.STATUS_SUCCESS,
            req: request.body,
            data: [MainSection, PackageSection, SettingsSection]
        });
    });
    APIRouter.get('/Packages', (request, response) => {

        let i = 1;
        let authent = false;

        if (request.headers.authentication) {
            Logger.server.warn("Authenticating: " + request.headers.authentication + " -> SUCCESS");
            authent = true;
        }

        let out = {
            Packages: {

            }
        };

        for (let pack in INSTALLED_PACKAGES) {
            try {
                if (authent || INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                    out.Packages[pack] = INSTALLED_PACKAGES[pack].Object.getPackageDetails();
                }
            } catch (err) {
                Logger.server.error(err.message);
            }
        }

        response.json({
            status: CONSTANTS.STATUS_SUCCESS,
            req: request.body,
            data: out
        });
    });
    APIRouter.get('/Cookies', (request, response) => {
        let out = {
            LocalStorage: {
                "TTV_PROFILE": {
                    "Set By?": "standard.js -> /Login",
                    "When Set?": "When logging in using Twitch",
                    "When Removed?": "When logging out",
                    "Used for?": "Authenticate the User over all Sides (mostly for Stats Settings and the Custom Chat). Detailed Usage of this Dataset is given by every supported Package."
                }
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

        response.json({
            status: CONSTANTS.STATUS_SUCCESS,
            req: request.body,
            data: out
        });
    });

    app.use("/api", APIRouter, (req, res, next) => {
            res.status(404).json({
                status: CONSTANTS.STATUS_FAILED,
                req: req.body,
                err: "404 - API Endpoint not found"
            });
        });

    //TwitchIRC
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
            Logger.TwitchIRC.error(err.message);
            Server_Status.errors.outage.TwitchIRCDisconnect = "Couldnt connect to TwitchIRC";
        }
    }
    
    //Twitch API
    if (CONFIG.TwitchAPI && TWITCHAPI) {
        TwitchAPI = new TWITCHAPI.TwitchAPI(CONFIG.TwitchAPI, app, TwitchIRC, Logger);
        try {
            await TwitchAPI.Init();
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
            Server_Status.errors.outage.TwitchAPI = err.message;
        }
    }
    

    //DataCollection
    if (CONFIG.DataCollection && DATACOLLECTION) {
        if (CONFIG.DataCollection.enabled != false)
            DataCollection = new DATACOLLECTION.DataCollection(CONFIG.DataCollection, TwitchIRC, TwitchAPI);
    }

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
            INSTALLED_PACKAGES[pack].Object = new packClass(app, TwitchIRC, TwitchAPI, DataCollection, CONFIG.Packages[pack], Logger);

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

    //NO ENDPOINT FOUND
    app.all('/api/*', (request, response) => {
        response.json({
            status: CONSTANTS.STATUS_FAILED,
            req: request.body,
            err: "404 - API Endpoint not found"
        });
    });
    //NO FILE FOUND
    app.use((req, res, next) => {
        res.redirect("/NotFound");
    });

    //CONSOLE INPUT
    process.stdin.on("data", data => {
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
    });

    Logger.server.info("BOT ONLINE AND READY!");
    return Promise.resolve();
}

//Packages
function loadPackages() {
    for (let pack in CONFIG.Packages) {
        try {
            INSTALLED_PACKAGES[pack] = {
                Object: null,
                Class: require('./Packages/' + pack + '/' + pack + '.js')[pack],
                Config: CONFIG.Packages[pack]
            }
        } catch (err) {
            Logger.server.error(err.message);
            Logger.server.warn("Please check your install!");
        }
    }
}

//Console Stuff
async function ConsoleYN() {
    let yn = undefined;
    //Console Input
    do {
        let answer = await ConsolePrompt();
        //Make into String and remove '\' and 'n' Chars from the linebreak
        answer = answer.toString().substring(0, answer.length - 2).toLowerCase();

        if (answer === "yes" || answer === "y") {
            yn = true;
        } else if (answer === "no" || answer === "n") {
            yn = false;
        } else {
            process.stdout.write("Yes or No? > ");
        }
    } while (yn === undefined);

    return Promise.resolve(yn);
}
async function ConsolePrompt() {
    return new Promise((resolve, reject) => {
        let callback = function (data) {
            process.stdin.removeListener("data", callback);
            resolve(data);
        }
        process.stdin.on("data", callback);
    });
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