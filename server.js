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

//Config
let CONFIGHANDLER_MODULE = require('./ConfigHandler.js');;
let ConfigHandler;

//LOGGER
const LOGGER = require('./Util/Logger.js');
let Logger;

//CONSTANTS
const CONSTANTS = require('./Util/CONSTANTS.js');

//WebApp
let WEBAPP;
let WebApp;

//PACKAGES
let INSTALLED_AUTHENTICATORS = { };


//TWITCH CHAT -> IRC
let TWITCHIRC;
let TwitchIRC;

//TWITCH API
let TWITCHAPI;
let TwitchAPI;

//DataCollection
let DATACOLLECTION;
let DataCollection;

//PACKAGES
let INSTALLED_PACKAGES = { };

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

/*
 *  ----------------------------------------------------------
 *                      INIT
 *  ----------------------------------------------------------
 */

//SETUP WIZARD kinda
SETUP()
    .then(async data => {
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

        //DONE
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
        console.log(err);
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
    //Start Logger
    Logger = new LOGGER({ enableFileOutput: true });
    Logger.addSources({
        server: { display: () => " SERVER ".inverse.cyan },
        setup: { display: () => " SETUP ".inverse }
    });
    Logger.setup.info("FrikyBot Statup ... ");

    //REQUIERES CONSTANTS
    try {
        await checkBotFileStructure();
    } catch (err) {
        return Promise.reject(err);
    }

    //Config Setup
    ConfigHandler = new CONFIGHANDLER_MODULE.Handler(Logger);
    
    //Load Config
    let errors = ConfigHandler.Load();

    //Add Module Configs
    let fbCfg = errors['FrikyBot'] ? errors['FrikyBot'][1] : undefined;
    ConfigHandler.AddConfig(new CONFIGHANDLER_MODULE.Config('FrikyBot', [{ name: 'logger', type: 'string' }, { name: 'constants', type: 'string' }], { preloaded: fbCfg }));

    try {
        let waCfg = errors['WebApp'] ? errors['WebApp'][1] : undefined;
        WEBAPP = require('./WebApp.js');
        WebApp = new WEBAPP.WebApp(waCfg, Logger);
        ConfigHandler.AddConfig(WebApp.Config);
    } catch (err) {
        Logger.server.error("The FrikyBot REQUIERES the WebApp Module! Please check your install!");
        Logger.server.warn("Please check your install!");
        return Promise.reject(err);
    }
    
    //Get from Config
    for (let cfg in errors) {
        try {
            if (cfg === 'TwitchIRC') {
                TWITCHIRC = require('./TwitchIRC.js');
                TwitchIRC = new TWITCHIRC.TwitchIRC(errors[cfg][1], Logger);
                ConfigHandler.AddConfig(TwitchIRC.Config);
            } else if (cfg === 'TwitchAPI') {
                TWITCHAPI = require('./TwitchAPI.js');
                TwitchAPI = new TWITCHAPI.TwitchAPI(errors[cfg][1], Logger);
                ConfigHandler.AddConfig(TwitchAPI.Config);
            } else if (cfg === 'DataCollection') {
                DATACOLLECTION = require('./DataCollection.js');
                DataCollection = new DATACOLLECTION.DataCollection(errors[cfg][1], TwitchIRC, TwitchAPI);
                //ConfigHandler.AddConfig(DataCollection.Config);
                ConfigHandler.AddConfig(new CONFIGHANDLER_MODULE.Config('DataCollection', [], { wip: true, groups: [{ name: 'Message Data' }, { name: 'Stream Data' }], preloaded: errors[cfg][1] }));
            }
        } catch (err) {
            Logger.setup.error(cfg + " Module failed to load!!");
            Logger.setup.error(err.message);
            Logger.setup.warn(cfg + " will be unavailable, please check your install!");
            continue;
        }
    }

    let packCfg = errors['Packages'] ? errors['Packages'][1] : undefined;
    ConfigHandler.AddConfig(new CONFIGHANDLER_MODULE.Config('Packages', [], { groups: [{ name: 'Edit Packages' }], preloaded: packCfg }));

    //Check for errors
    let errs = ConfigHandler.Check();
    let detected_err = false;

    for (let err in errs) {
        if (errs[err].length === 0) continue;
        
        for (let errMsg of errs[err])
            Logger.setup.warn(err + " Module Config Error: " + errMsg);

        detected_err = true;
    }

    ConfigHandler.Fill();

    //Save filled/missing Settings
    if (detected_err) {
        Logger.setup.info("Auto Filling Config ... pls add Values in Setup!");
        ConfigHandler.Save();
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
            if (dir === "CONFIG_FILE_PATH") continue;

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
                    Logger.setup.info("Created Directory: " + FILESTRUCTURE[dir]);
                    fs.mkdirSync(path.resolve(FILESTRUCTURE[dir]));
                }
            }
        }

        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

//INIT
async function INIT() {
    Logger.server.info("INITATING BOT CORE ... ");
    
    //WebApp
    try {
        await INIT_WEBAPP();
    } catch (err) {
        Logger.website.error(err.message);
    }
    
    //TwitchIRC
    try {
        if (TwitchIRC && TwitchIRC.isEnabled()) {
            //Add Events to List
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

            //Init
            await TwitchIRC.Init(WebApp.GetInteractor());
        }
    } catch (err) {
        Logger.TwitchIRC.error(err.message);
        Server_Status.errors.outage.TwitchIRCDisconnect = err.message;
    }
    
    //Twitch API
    try {
        if (TwitchAPI && TwitchAPI.isEnabled()) await TwitchAPI.Init(WebApp.GetInteractor());
    } catch (err) {
        Logger.TwitchAPI.error(err.message);
        Server_Status.errors.outage.TwitchAPI = err.message;
    }
    //Authenticator
    INSTALLED_AUTHENTICATORS['TTV Auth.'] = new TWITCHAPI.Authenticator(TwitchAPI, TwitchAPI.GetConfig(false), Logger);
    INSTALLED_AUTHENTICATORS['TTV Auth.'].setAPI(WebApp.GetInteractor());

    //DataCollection
    try {
        if (DataCollection && DataCollection.isEnabled()) await DataCollection.Init();
    } catch (err) {
        Logger.TwitchAPI.error(err.message);
        Server_Status.errors.outage.TwitchAPI = err.message;
    }

    //LOAD CONFIG PACKAGES
    loadPackages();

    //INIT PACKAGES
    Logger.server.info("INITATING BOT Packages ... ");

    //Setup ALL Packages
    for (let pack in INSTALLED_PACKAGES) {
        try {
            let packClass = INSTALLED_PACKAGES[pack].Class;
            INSTALLED_PACKAGES[pack].Object = new packClass(WebApp.GetInteractor(), TwitchIRC, TwitchAPI, DataCollection, Logger);

            //Init ENABLED Packages
            if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                try {
                    await INSTALLED_PACKAGES[pack].Object.Init(INSTALLED_PACKAGES[pack].Config);
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
            if (INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isEnabled()) {
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
            if (INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isEnabled()) {
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
    
    Logger.server.info("BOT ONLINE AND READY!");

    //WebApp Authenticator
    switchAuthenticator();

    return Promise.resolve();
}

async function INIT_WEBAPP() {
    try {
        await WebApp.Init();
        WebApp.StartServer();
        let WebAppInteractor = WebApp.GetInteractor();

        //Authenticator
        INSTALLED_AUTHENTICATORS['FrikyBot Auth.'] = new WEBAPP.Authenticator(Logger, WebApp.GetConfig(false));
        INSTALLED_AUTHENTICATORS['FrikyBot Auth.'].setAPI(WebAppInteractor);
        
        //ROUTING SETUP
        //Main Router
        WebAppInteractor.addMainRoute(MAIN_ROUTER);
        
        //Bot API - General
        let APIRouter = express.Router();
        APIRouter.get('/Cookies', API_Cookies);

        //Bot API - Packages
        APIRouter.get('/packages', API_Packages);
        WebAppInteractor.addAuthAPIEndpoint('/packages/control', { user_level: 'staff' }, 'GET', API_PACKAGE_CONTROL);
        
        //Bot API - Pages
        let PageAPIRouter = express.Router();
        let PageAuthAPIRouter = express.Router();

        PageAPIRouter.get('/navigation', PAGE_Navi);
        PageAPIRouter.get('/login', PAGE_LOGIN);

        let StgPageAPIRouter = express.Router();
        StgPageAPIRouter.get('/setup', PAGE_Settings_Setup);
        StgPageAPIRouter.get('/dashboard', PAGE_Settings_Dashboard);
        StgPageAPIRouter.get('/packages', PAGE_Settings_Packages);
        StgPageAPIRouter.get('/logs', PAGE_Settings_Logs);
        StgPageAPIRouter.get('/navigation', PAGE_Settings_Nav);
        
        PageAuthAPIRouter.use('/settings', StgPageAPIRouter);

        WebAppInteractor.addAPIRoute('/pages', PageAPIRouter);
        WebAppInteractor.addAuthAPIRoute('/pages', { user_level: 'staff' }, PageAuthAPIRouter);
        
        //SETTINGS - API
        let SettingsAPIRouter = express.Router();
        SettingsAPIRouter.post('/webapp/port', API_Settings_PortRestart);
        WebAppInteractor.addAuthAPIRoute('/settings', { user_level: 'staff' }, SettingsAPIRouter);
        
        //MISC - API
        APIRouter.get('/BotStatus', API_BotStatus);
        
        WebAppInteractor.addAPIRoute('', APIRouter);
        
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}
function switchAuthenticator(authName) {
    console.log("AUTH IN USE: " + INSTALLED_AUTHENTICATORS[authName].identify());
    WebApp.setAuthenticator(INSTALLED_AUTHENTICATORS[authName]);
    INSTALLED_AUTHENTICATORS[authName].setEnable(true);
}

//Packages
function loadPackages() {
    let packages = ConfigHandler.GetConfigJSON().Packages;

    for (let pack in packages) {
        try {
            INSTALLED_PACKAGES[pack] = {
                Object: null,
                Class: require('./' + CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + pack + '/' + pack + '.js')[pack],
                Config: packages[pack]
            }
        } catch (err) {
            Logger.server.error(err.message);
            Logger.server.warn("Please check your install!");
        }
    }
}

//UTIL
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
    //Facivon 
    if (req.originalUrl == "/favicon.ico") {
        return res.redirect("/favicon.png");
    }
    
    //TTV Login 
    if (TwitchAPI && req.originalUrl.toLowerCase().startsWith("/settings/setup") && req.query['code']) {
        try {
            await TwitchAPI.createUserAccessToken(req.query['code'], req.query['scopes']);
            return res.redirect("/Settings");
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
            return res.redirect("/Settings?error=" + err.message);
        }
    }
    
    //Check other Routers
    next();
}

//General API
function API_Cookies(req, res, next) {
    let LocalStorage = [];
    let SessionStorage = [];
    let Cookies = [];
    
    //From Core
    LocalStorage.push({ name: 'CookieAccept', by: 'Every Site with a "Accept Cookie" Notification', set: 'When you accept the Cookie Notification', removed: 'When you decline Cookies.', reason: 'Remembering that you allredy accepted Cookies.' });
    SessionStorage.push({ name: 'BOT_STATUS_DETAILS', by: 'Bot Status', set: 'When new Bot Details were fetched', reason: 'Reduce loadtimes by storing a temporary dataset of the Bot Status.' });
    SessionStorage.push({ name: 'NAVIVATION', by: 'Sites using NavigationV2 (pretty much every)', set: 'When new Navigation Data was fetched', reason: 'Reduce loadtimes by storing a temporary dataset of the Navigation Data.' });
    LocalStorage.push({ name: 'LOGGED_IN_USER', by: '(Twitch) Login', set: 'When you log in using Twitch or an Authorization Code', removed: 'When you log out / Your Access expires.', reason: 'Stay logged in on every Site.' });
    
    //From Packages
    for (let pack in INSTALLED_PACKAGES) {
        try {
            if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                let package_cookies = INSTALLED_PACKAGES[pack].Object.getWebCookies();

                if (!package_cookies) continue;

                if (package_cookies.LocalStorage) for (let local of package_cookies.LocalStorage) LocalStorage.push(local);
                if (package_cookies.SessionStorage) for (let session of package_cookies.SessionStorage) SessionStorage.push(session);
                if (package_cookies.Cookies) for (let cookie of package_cookies.Cookies) Cookies.push(cookie);
            }
        } catch (err) {
            Logger.server.error(err.message);
        }
    }

    return res.json({
        data: {
            LocalStorage: LocalStorage,
            SessionStorage: SessionStorage,
            Cookies: Cookies
        }
    });
}

//Package API
async function API_PACKAGE_CONTROL(req, res, next) {
    const package_name = req.query['package_name'];
    const type = req.query['type'];
    
    if (!type || !package_name) {
        res.status(400).json({ err: 'Bad Request. ' + (!type ? 'type missing!' : 'package missing!') });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name]) {
        res.status(400).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name].Object) {
        res.status(500).json({ err: 'Package not initiated.' });
        return Promise.resolve();
    }

    let out = {};

    if (type === 'start') {
        //set Enable + call Reload
        try {
            await INSTALLED_PACKAGES[package_name].Object.enable();
            out.enable = 'success';
        } catch (err) {
            out.err = 'enable failed';
        }
    } else if (type === 'stop') {
        //set Disable
        try {
            await INSTALLED_PACKAGES[package_name].Object.disable();
            out.disable = 'success';
        } catch (err) {
            out.err = 'disable failed';
        }
    } else if (type === 'reload') {
        //call Reload
        try {
            await INSTALLED_PACKAGES[package_name].Object.reload();
            out.reload = 'success';
        } catch (err) {
            out.err = 'reload failed';
        }
    } else {
        res.status(400).json({ err: 'Bad Request. Type not found.' });
        return Promise.resolve();
    }

    out.package_name = package_name;
    out.status = INSTALLED_PACKAGES[package_name].Object.isEnabled();
    res.json(out);
    return Promise.resolve();
}

//Page Infos API
async function PAGE_Navi(req, res, next) {
    //Main - Section
    let MainNavigationPackages = ["CommandHandler", "ChatStats", "CustomChat"];
    let MainSection = [{ type: "icon", name: "Homepage", href: "/", icon: "images/icons/home.svg" }];

    for (let pack of MainNavigationPackages) {
        if (INSTALLED_PACKAGES[pack] && INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.getWebNavigation()) {
            let temp_Pck_Nav = INSTALLED_PACKAGES[pack].Object.getWebNavigation();
            temp_Pck_Nav.type = "icon";
            MainSection.push(temp_Pck_Nav);
        }
    }

    //Packages - Section
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
        if (!skip && INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.getWebNavigation()) {
            let temp_Pck_Nav = INSTALLED_PACKAGES[pack].Object.getWebNavigation();
            temp_Pck_Nav.type = "icon";
            PackageSection.push(temp_Pck_Nav);
        }
    }

    //Add "More Packages"
    PackageSection.push({ type: "icon", name: "More Packages", href: "/Packages", icon: "images/icons/packages.svg" });

    //Settings - Section
    let SettingsSection = [];

    SettingsSection.push({ type: "icon", name: "Bot Details", href: "/bot", icon: "images/icons/FrikyBot.png" });

    try {
        //Settings Link
        await WebApp.GetInteractor().AuthorizeUser(res.locals.user, { user_level: 'staff' });
        SettingsSection.push({ type: "icon", name: "Settings", href: "/settings", icon: "images/icons/gear.svg" });
    } catch (err) {

    }

    SettingsSection.push({ type: "icon", name: "Login", href: "/login", icon: "images/icons/twitch.svg" });

    //Return Data
    return res.json({
        data: [
            {
                "type": "section",
                "name": "Main Navigation",
                "contents": MainSection
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

function PAGE_LOGIN(req, res, next) {
    let auth = WebApp.Authenticator || {};

    res.json({ authenticator: auth.identify() || 'UNAVAILABLE' });
}

async function PAGE_Settings_Dashboard(req, res, next) {
    let data = {
        TwitchAPI: { installed: false },
        TwitchIRC: { installed: false },
        WebApp: { installed: false },
        Authenticator: { installed: false },
        Packages: { installed: false }
    };

    //TTV API
    if (TwitchAPI) {
        data.TwitchAPI.installed = true;

        let tokens = {
            user: null,
            app: null
        };

        try {
            await TwitchAPI.updateAppAccessToken();
            tokens.app = await TwitchAPI.getAppTokenStatus();
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
        }

        try {
            await TwitchAPI.updateUserAccessToken();
            tokens.user = await TwitchAPI.getUserTokenStatus();
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
        }
    }

    //TTV IRC
    if (TwitchIRC) {
        data.TwitchIRC.installed = true;
    }

    //WEBAPP
    if (WebApp) {
        data.WebApp.installed = true;
    }

    //AUTHENTICATOR
    if (WebApp && WebApp.GetInteractor() && WebApp.GetInteractor().Authenticator) {
        let auth = WebApp.GetInteractor().Authenticator;

        data.Authenticator.installed = true;
    }

    //DATACOLLECTION
    if (DataCollection) {
        data.DataCollection.installed = true;
    }

    //PACKAGES
    if (Object.getOwnPropertyNames(INSTALLED_PACKAGES).length > 0) {
        data.Packages.installed = true;
    }

    res.json({ data: data });
}
async function PAGE_Settings_Setup(req, res, next) {
    res.json({
        data: {
            cfg: ConfigHandler.GetConfigJSONREDACTED(),
            tmpl: ConfigHandler.GetTemplates()
        }
    });
}
async function PAGE_Settings_Packages(req, res, next) {
    let data = {
        Packages: []
    };

    for (let pack in INSTALLED_PACKAGES) {
        try {
            let pkg = INSTALLED_PACKAGES[pack].Object;
            let pkg_data = {
                status: INSTALLED_PACKAGES[pack].Object ? 'ready' : 'not ready', 
                details: pkg.getPackageDetails(),
                interconnects: pkg.GetPackageInterconnectRequests()
            };
            
            data.Packages.push(pkg_data);
        } catch (err) {
            Logger.server.error(err.message);
        }
    }

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
    let dashboard = [];
    let settings = [];
    let misc = [];

    //Dashboard
    dashboard.push({
        type: "icon",
        name: "Overview",
        href: "settings",
        icon: "images/icons/home.svg"
    });
    dashboard.push({
        type: "icon",
        name: "Core Modules",
        href: "settings/modules",
        icon: "images/icons/server-solid.svg"
    });
    dashboard.push({
        type: "icon",
        name: "Packages",
        href: "settings/packages",
        icon: "images/icons/packages.svg"
    });

    //Settings
    settings.push({
        type: "icon",
        name: "Bot Setup",
        href: "settings/setup",
        icon: "images/icons/gear.svg"
    });

    //Misc
    misc.push({
        type: "icon",
        name: "Logs",
        href: "settings/logs",
        icon: "images/icons/copy-regular.svg"
    });
    misc.push({
        type: "icon",
        name: "Analytics",
        href: "settings/analtyics",
        icon: "images/icons/chart-bar.svg"
    });
    misc.push({
        type: "icon",
        name: "Tools",
        href: "settings/tools",
        icon: "images/icons/pencil-ruler-solid.svg"
    });

    res.json({
        data: [
            {
                "type": "section",
                "name": "FrikyBot Dashboard",
                "contents": dashboard
            },
            {
                "type": "section",
                "name": "FrikyBot Settings",
                "contents": settings
            },
            {
                "type": "section",
                "name": "Miscellaneous",
                "contents": misc
            }
        ]
    });
}

//Settings API
async function API_Settings_PortRestart(req, res, next) {
    try {
        if (req.body.port) {
            if (isNaN(req.body.port) || req.body.port < 0 || req.body.port > 9999) {
                res.json({ err: 'Port is not a valid number' });
                return Promise.resolve();
            }

            let errors = WebApp.Config.UpdateSetting('Port', req.body.port);

            if (errors !== true) {
                res.json({ err: 'Changing Port failed: ' + errors[0] });
                return Promise.resolve();
            }
        }

        res.json({ msg: '200', port: req.body.port });
        await WebApp.Restart();
    } catch (err) {
        res.json({ err: 'restart failed' });
    }
    return Promise.resolve();
}

//Misc API
async function API_BotStatus(req, res, next) {
    try {
        //Get Data
        let data = {
            Status: Server_Status,
            Username: "",
            Channel: "",
            Live: null,
            Type: "",
            Image: ""
        };

        //Twitch IRC
        if (TwitchIRC) {
            data.Channel = TwitchIRC.getChannel();
            if (data.Channel.indexOf('#') >= 0) data.Channel = data.Channel.substring(1);
        } else {
            Server_Status.errors.fatal.TwitchIRC = "Not available.";
        }

        //Twitch API
        if (!TwitchAPI) {
            Server_Status.errors.fatal.TwitchAPI = "Not available.";
        } else {
            delete Server_Status.errors.fatal.TwitchAPI;

            if (!TwitchAPI.UserAccessToken) {
                Server_Status.errors.outage.TwitchAPI = "Only Basic API Access";
            } else if (!TwitchAPI.AppAccessToken) {
                Server_Status.errors.outage.TwitchAPI = "No API Access";
            } else {
                delete Server_Status.errors.outage.TwitchAPI;
            }

            if (TwitchIRC) {
                //Fetch Stream/User Info
                try {
                    let UserJson = await TwitchAPI.GetUsers({ login: TwitchIRC.getUsername() });

                    if (UserJson && UserJson.data && UserJson.data[0]) {
                        data.Username = UserJson.data[0].display_name ? UserJson.data[0].display_name : UserJson.data[0].login;
                        data.Description = UserJson.data[0].description;
                        data.Type = UserJson.data[0].type;
                        data.Image = UserJson.data[0].profile_image_url;
                    }

                    let StreamJson = await TwitchAPI.GetStreams({ user_login: data.Channel });

                    if (StreamJson && StreamJson.data) {
                        data.Live = StreamJson.data.length > 0 === true;
                    }
                } catch (err) {
                    Logger.TwitchAPI.error(err.message);
                    Server_Status.errors.outage.TwitchAPI = "Access unavailabe.";
                }
            }
        }

        //DataCollection
        if (!DataCollection) {
            Server_Status.errors.outage.DataCollection = "Not availabe. (WiP)";
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