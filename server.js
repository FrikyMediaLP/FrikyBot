'use strict';

const VERSION = '0.4.1.0';

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
console.log("                                   FRIKYBOT - v" + VERSION + " - NODE JS SERVER");
console.log("///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");

/*
 *  ----------------------------------------------------------
 *                      PRE-INIT
 *  ----------------------------------------------------------
 */

//Config
let CONFIGHANDLER_MODULE = require('./Util/ConfigHandler.js');
let ConfigHandler;

//LOGGER
const LOGGER = require('./Util/Logger.js');
let Logger;

//CONSTANTS
const CONSTANTS = require('./Util/CONSTANTS.js');

//Modules
let INSTALLED_MODULES = {};

//PACKAGES
let INSTALLED_PACKAGES = {};

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
        
        if (INSTALLED_MODULES['WebApp'] === undefined) {
            return Promise.reject(new Error("WebServer not found! Missing Files?"));
        }

        try {
            await POST_INIT();
        } catch (err) {
            return Promise.reject(err);
        }
    })
    .catch(err => {
        console.log(err);
        Logger.server.error(err.message);
        //console.log(err);
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

    Logger.setup.info("FrikyBot Startup ... ");
    
    //REQUIERES CONSTANTS
    try {
        await checkBotFileStructure();
    } catch (err) {
        return Promise.reject(err);
    }

    //Config Setup
    ConfigHandler = new CONFIGHANDLER_MODULE.Handler(Logger);
    
    //Load Config
    let configs = {};
    let files = [];

    try {
        for (let file of fs.readdirSync(path.resolve('Modules'))) files.push(file.substring(0, file.lastIndexOf('.js')));
    } catch (err) {

    }

    //Assemble Modules in order
    //From Config / Local Files Auto Load
    let errors = ConfigHandler.Load();
    for (let module of CONSTANTS.MODULE_BOOT_ORDER) {
        if (errors[module] !== undefined) configs[module] = errors[module][1];
        else if (files.find(elt => elt === module)) configs[module] = null;
    }
    //Fill Unordered
    for (let module in errors) if (module !== 'FrikyBot' && module !== 'Packages' && configs[module] === undefined) configs[module] = errors[module][1];

    //Load FrikyBot Essentials Configs
    ConfigHandler.AddConfig(new CONFIGHANDLER_MODULE.Config('FrikyBot', [{ name: 'logger', type: 'string' }, { name: 'constants', type: 'string' }], { preloaded: (errors['FrikyBot'] || [])[1] }));

    //Load Modules
    for (let module of CONSTANTS.MODULE_BOOT_ORDER) {
        loadModule(module, configs[module], ConfigHandler);
    }

    //Load FrikyBot Essentials Configs
    ConfigHandler.AddConfig(new CONFIGHANDLER_MODULE.Config('Packages', [], { groups: [{ name: 'Edit Packages' }], preloaded: (errors['Packages'] || [])[1] }));

    //Check Config for errors
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
                //Ask to create
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

                //Create
                if (go2create) {
                    Logger.setup.info("Created Directory: " + FILESTRUCTURE[dir]);

                    let splitPath = '';

                    for (let split of FILESTRUCTURE[dir].split('/')) {
                        if (split === "") continue;

                        splitPath += split + '/' ;
                        if (!fs.existsSync(path.resolve(splitPath))) fs.mkdirSync(path.resolve(splitPath));
                    }
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
    
    //Modules
    for (let module in INSTALLED_MODULES) {
        let obj = INSTALLED_MODULES[module].Object;
        let node_module = INSTALLED_MODULES[module].node_module;

        if (!obj) continue;
        
        try {
            if (module === 'WebApp') {
                //Init
                await INIT_WEBAPP();
                //Authenticator
                let auth = new (node_module).FrikyBot_Auth(Logger, obj.GetConfig(false));
                await auth.Init(obj.GetInteractor());
                obj.addAuthenticator(auth);
            } else if (module === 'TwitchIRC') {
                //Add Events to List
                obj.on('connected', (addr, port) => {
                    delete Server_Status.errors.outage.TwitchIRCDisconnect;
                });
                obj.on('disconnected', (reason) => {
                    Server_Status.errors.outage.TwitchIRCDisconnect = "Reason: " + (reason ? reason : " UNKNOWN");
                });

                //Init
                await obj.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor());
            } else if (module === 'TwitchAPI') {
                //Init
                await obj.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor())
                    .catch(err => {
                        Logger[module].error(err.message);
                        Server_Status.errors.outage[module] = err.message;
                    });

                //Authenticator
                let auth = new (node_module).Authenticator(Logger, obj.GetConfig(false), INSTALLED_MODULES['TwitchAPI'].Object);
                await auth.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor());
                INSTALLED_MODULES['WebApp'].Object.addAuthenticator(auth);
            } else {
                //Init
                await obj.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor());
            }

            obj.Logger.info("Module Loaded" + (obj.isReady() ? ' and Ready' : '') + '!');
        } catch (err) {
            Logger[module].error(err.message);
            Server_Status.errors.outage[module] = err.message;
        }
    }
    
    //LOAD CONFIG PACKAGES
    let packages = ConfigHandler.GetConfigJSON().Packages;
    for (let pack in packages) {
        loadPackage(pack, packages[pack]);
    }

    //INIT PACKAGES
    Logger.server.info("INITATING BOT Packages ... ");

    //Setup ALL Packages
    for (let pack in INSTALLED_PACKAGES) {
        try {
            await iniPackage(pack);
        } catch (err) {
            Logger.error(err.message);
            console.log(err);
        }
    }

    return Promise.resolve();
}
async function POST_INIT() {
    Logger.server.info("POST INIT BOT Packages ... ");
    
    //PACKAGE INTERCONNECT
    for (let pack in INSTALLED_PACKAGES) {
        postIniPackage(pack);
    }

    //PACKAGE POST INIT
    for (let pack in INSTALLED_PACKAGES) {
        try {
            await PackageInterconnectPackage(pack);
        } catch (err) {
            console.log(err);
            Logger.error(err.message);
        }
    }

    //WebApp Authenticator
    INSTALLED_MODULES['WebApp'].Object.autoSetAuthenticator();
    let address = INSTALLED_MODULES['WebApp'].Object.server.address();
    Logger.server.info("BOT ONLINE AND READY! Visit http://" + (address.address === '::' ? 'localhost' : address.address) + ":" + address.port + ' to access Bot Settings!');
    
    return Promise.resolve();
}
async function INIT_WEBAPP() {
    try {
        await INSTALLED_MODULES['WebApp'].Object.Init();
        INSTALLED_MODULES['WebApp'].Object.StartServer();
        let WebAppInteractor = INSTALLED_MODULES['WebApp'].Object.GetInteractor();
        
        //ROUTING SETUP
        //Main Router
        WebAppInteractor.addMainRoute(SERVER_MAIN_ROUTER);
        
        //Bot API - General
        let APIRouter = express.Router();
        APIRouter.get('/Cookies', API_Cookies);

        //Bot API - Modules
        let ModuleControlAPIRouter = express.Router();
        ModuleControlAPIRouter.get('/start', API_MODULE_CONTROL_START);
        ModuleControlAPIRouter.get('/stop', API_MODULE_CONTROL_STOP);
        ModuleControlAPIRouter.get('/remove', API_MODULE_CONTROL_REMOVE);
        ModuleControlAPIRouter.post('/add', API_MODULE_CONTROL_ADD);
        ModuleControlAPIRouter.put('/ables', API_MODULE_CONTROL_ABLES);
        WebAppInteractor.addAuthAPIRoute('/modules/control', { user_level: 'staff' }, ModuleControlAPIRouter);
        WebAppInteractor.addAuthAPIEndpoint('/modules/logs/:module', {}, 'GET', API_MODULE_LOGS);
        WebAppInteractor.addAuthAPIEndpoint('/modules/logs/:module/:log', {}, 'GET', API_MODULE_LOGS);

        //Bot API - Packages
        APIRouter.get('/packages', API_PACKAGES_INFO);
        WebAppInteractor.addAuthAPIEndpoint('/packages/settings', { user_level: 'staff' }, 'POST', API_PACKAGE_SETTINGS);
        WebAppInteractor.addAuthAPIEndpoint('/packages/logs/:package', {}, 'GET', API_PACKAGE_LOGS);
        WebAppInteractor.addAuthAPIEndpoint('/packages/logs/:package/:log', {}, 'GET', API_PACKAGE_LOGS);

        let PackageControlAPIRouter = express.Router();
        PackageControlAPIRouter.get('/start', API_PACKAGE_CONTROL_START);
        PackageControlAPIRouter.get('/stop', API_PACKAGE_CONTROL_STOP);
        PackageControlAPIRouter.get('/reload', API_PACKAGE_CONTROL_RELOAD);
        PackageControlAPIRouter.get('/remove', API_PACKAGE_CONTROL_REMOVE);
        PackageControlAPIRouter.post('/add', API_PACKAGE_CONTROL_ADD);
        PackageControlAPIRouter.put('/ables', API_PACKAGE_CONTROL_ABLES);
        WebAppInteractor.addAuthAPIRoute('/packages/control', { user_level: 'staff' }, PackageControlAPIRouter);
        
        //Bot API - Pages
        let PageAPIRouter = express.Router();
        let PageAuthAPIRouter = express.Router();

        PageAPIRouter.get('/navigation', PAGE_Navi);
        PageAPIRouter.get('/login', PAGE_LOGIN);

        let StgPageAPIRouter = express.Router();
        StgPageAPIRouter.get('/setup', PAGE_Settings_Setup);
        StgPageAPIRouter.get('/dashboard', PAGE_Settings_Dashboard);
        StgPageAPIRouter.get('/modules', PAGE_Settings_Modules);
        StgPageAPIRouter.get('/packages', PAGE_Settings_Packages);
        StgPageAPIRouter.get('/logs', PAGE_Settings_Logs);
        StgPageAPIRouter.get('/navigation', PAGE_Settings_Nav);
        StgPageAPIRouter.get('/tools', PAGE_Settings_Tools);
        
        PageAuthAPIRouter.use('/settings', StgPageAPIRouter);

        WebAppInteractor.addAPIRoute('/pages', PageAPIRouter);
        WebAppInteractor.addAuthAPIRoute('/pages', { user_level: 'staff' }, PageAuthAPIRouter);
        
        //MISC - API
        APIRouter.get('/BotStatus', API_BotStatus);

        //LOGGER API
        let LoggerAPIRouter = express.Router();
        LoggerAPIRouter.get('/raw', LOGGER_RAW_API);
        WebAppInteractor.addAuthAPIRoute('/logger', { user_level: 'staff' }, LoggerAPIRouter);
        
        WebAppInteractor.addAPIRoute('', APIRouter);
        
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

//Modules
function autodetectModules() {
    let out = [];
    let files = [];

    try {
        files = fs.readdirSync(path.resolve(CONSTANTS.FILESTRUCTURE.MODULES_INSTALL_ROOT)).map(x => x.split('.js')[0]);
    } catch (err) {

    }

    for (let name of files) {
        if (INSTALLED_MODULES[name] && INSTALLED_MODULES[name].node_module) {
            out.push(INSTALLED_MODULES[name].node_module.DETAILS || { name });
            continue;
        }
        
        try {
            let obj = require('./' + CONSTANTS.FILESTRUCTURE.MODULES_INSTALL_ROOT + name + '.js');
            out.push(obj.DETAILS || { name });
        } catch (err) {

        }
    }

    return out;
}
function loadModule(module, preloaded_config, ConfigHandler) {
    try {
        INSTALLED_MODULES[module] = {
            node_module: require('./' + CONSTANTS.FILESTRUCTURE.MODULES_INSTALL_ROOT + module + '.js'),
            Object: null
        };

        let obj = null;

        if (module === 'TwitchIRC') obj = new INSTALLED_MODULES[module].node_module[module](preloaded_config, Logger, INSTALLED_MODULES['TwitchAPI'] ? INSTALLED_MODULES['TwitchAPI'].Object : null);
        if (module === 'TwitchAPI') {
            obj = new INSTALLED_MODULES[module].node_module[module](preloaded_config, Logger, INSTALLED_MODULES['TwitchIRC'].Object);
            if (INSTALLED_MODULES['TwitchAPI'] && INSTALLED_MODULES['TwitchAPI'].Object) INSTALLED_MODULES['TwitchIRC'].Object.setTwitchAPI(INSTALLED_MODULES['TwitchAPI'].Object);
        }
        else obj = new INSTALLED_MODULES[module].node_module[module](preloaded_config, Logger);

        INSTALLED_MODULES[module].Object = obj;

        ConfigHandler.AddConfig(obj.Config);
    } catch (err) {
        if (module === 'WebApp') {
            Logger.server.error("The FrikyBot REQUIERES the WebApp Module! Please check your install!");
            Logger.server.warn("Please check your install!");
        }
        console.log(err);
        Logger.setup.error(module + ' failed to load!');
    }
}

//Packages
function autodetectPackages() {
    let out = [];
    let files = [];

    try {
        files = fs.readdirSync(path.resolve(CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT));
    } catch (err) {

    }

    for (let name of files) {
        if (INSTALLED_PACKAGES[name] && INSTALLED_PACKAGES[name].node_module) {
            out.push(INSTALLED_PACKAGES[name].node_module.DETAILS || { name });
            continue;
        }

        try {
            let obj = require('./' + CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + name + '/' + name + '.js');
            out.push(obj.DETAILS || { name });
        } catch (err) {

        }
    }

    return out;
}
function loadPackage(pack, preloaded_config) {
    try {
        INSTALLED_PACKAGES[pack] = {
            Object: null,
            node_module: require('./' + CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + pack + '/' + pack + '.js'),
            Class: null,
            Config: preloaded_config
        };
        INSTALLED_PACKAGES[pack].Class = INSTALLED_PACKAGES[pack].node_module[pack];
    } catch (err) {
        Logger.server.error(pack + " -> " + err.message);
        Logger.server.warn(pack + " -> " + "Please check your install or contact the Devs!");
    }
}
async function iniPackage(pack, auto_enable = false) {
    try {
        let packClass = INSTALLED_PACKAGES[pack].Class;

        INSTALLED_PACKAGES[pack].Object = new packClass(INSTALLED_MODULES['WebApp'].Object.GetInteractor(), (INSTALLED_MODULES['TwitchIRC'] || {}).Object, (INSTALLED_MODULES['TwitchAPI'] || {}).Object, Logger);

        //Auto Enable
        if (auto_enable === true) {
            await INSTALLED_PACKAGES[pack].Object.enable();
        }

        //Init ENABLED Packages
        if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
            return INSTALLED_PACKAGES[pack].Object.Init(INSTALLED_PACKAGES[pack].Config);
        }
        else return Promise.resolve();
    } catch (err) {
        Logger.server.error(err.message);
        return Promise.reject(err);
    }
}
function postIniPackage(pack) {
    try {
        //Post Init ENABLED Packages
        if (INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isEnabled()) {
            try {
                let Package_Interconnect_requests = INSTALLED_PACKAGES[pack].Object.GetPackageInterconnectRequests();
                
                for (let request of Package_Interconnect_requests) {
                    if (INSTALLED_PACKAGES[request.package] && INSTALLED_PACKAGES[request.package].Object && INSTALLED_PACKAGES[request.package].Object.isEnabled()) {
                        let intercon_status = INSTALLED_PACKAGES[request.package].Object.requestPackageInterconnect(pack, request.callback, request.description);

                        if (!intercon_status) {
                            Logger.server.warn("Package '" + request.package + "' DECLINED Interconnect Request from '" + pack + "'");
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
async function PackageInterconnectPackage(pack) {
    if (INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isEnabled())
        return INSTALLED_PACKAGES[pack].Object.PostInit();
    else
        return Promise.resolve();
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
function GetPaginationValues(pagination = "") {
    if (!pagination) return null;
    let out = [10, 0, {}];

    try {
        if (pagination.indexOf('A') >= 0 && pagination.indexOf('B') >= 0 && pagination.indexOf('C') >= 0) {
            out[0] = parseInt(pagination.substring(1, pagination.indexOf('B')));
            out[1] = parseInt(pagination.substring(pagination.indexOf('B') + 1, pagination.indexOf('C')));
        }

        if (pagination.indexOf('T') >= 0) out[2].timesorted = true;
        if (pagination.indexOf('CSS') >= 0 && pagination.indexOf('CSE') >= 0) {
            out[2].customsort = pagination.substring(pagination.indexOf('CSS') + 2, pagination.indexOf('CSE'));
        }
        if (pagination.indexOf('PS') >= 0 && pagination.indexOf('PE') >= 0) out[2].pagecount = parseInt(pagination.substring(pagination.indexOf('PS') + 2, pagination.indexOf('PE')));
    } catch (err) {
        return null;
    }

    return out;
}
function GetPaginationString(first = 10, cursor = 0, options = {}) {
    let s = "A" + first + "B" + cursor + "C";
    if (options.timesorted) s += "T";
    if (options.customsort) s += "CSS" + customsort + "CSE";
    if (options.pagecount !== undefined) s += "PS" + options.pagecount + "PE";
    return s;
}
function ExtractFromVersionString(string = '') {
    let split = string.split('.');

    return {
        patch: parseInt(split.pop()),
        minor: parseInt(split.pop()),
        major: parseInt(split.pop()),
        release: parseInt(split.pop())
    };
}

/*
 *  ----------------------------------------------------------
 *                   EXPRESS MIDDLEWARE
 *  ----------------------------------------------------------
 */

async function SERVER_MAIN_ROUTER(req, res, next) {
    //Facivon 
    if (req.originalUrl == "/favicon.ico") {
        return res.redirect("/favicon.png");
    }
    
    //TTV Login - Update Bot User
    if (INSTALLED_MODULES['TwitchAPI'] && req.originalUrl.toLowerCase().startsWith("/settings/setup") && req.query['code']) {
        try {
            await INSTALLED_MODULES['TwitchAPI'].Object.createUserAccessToken(req.query['code'], req.query['scopes'], req.query['state']);
            return res.redirect("/Settings/setup");
        } catch (err) {
            Logger.TwitchAPI.error(err.message);
            return res.redirect("/Settings/setup?error=" + err.message);
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
    LocalStorage.push({ name: 'CookieAccept', by: 'Cookie Settings', set: 'When you accept the Cookie Notification', removed: 'When you decline Cookies.', reason: 'Remembering that you allredy accepted Cookies.', origin: 'frikybot' });
    LocalStorage.push({ name: 'ACCEPTED_COOKIES', by: 'Cookie Settings', set: 'When you allow a Cookie in the Cookie Settings', removed: 'When remove all Cookie Settings.', reason: 'Only allow the Cookies you want to use!', origin: 'frikybot' });
    LocalStorage.push({ name: 'darkmode', by: 'Any Page', set: 'When you change your Darkmode Preference', removed: 'When you decline Cookies.', reason: 'Remembering that Pages should be loaded in darkmode', origin: 'frikybot' });
    LocalStorage.push({ name: 'LOGGED_IN_USER', by: '(Twitch) Login', set: 'When you log in using Twitch or an Authorization Code', removed: 'When you log out / Your Access expires.', reason: 'Stay logged in on every Site.', origin: 'frikybot' });
    LocalStorage.push({ name: 'LOGIN_NONCE', by: '(Twitch) Login', set: 'When you log in using Twitch or an Authorization Code', removed: 'Directly after Login', reason: 'Verifying that the Response you received originated from your browser.', origin: 'frikybot' });
    LocalStorage.push({ name: 'NEWSFEED_ALLOW_SCHEDULED', by: 'Homepage / News', set: 'When you toggle the NewsFeed to show/hide Scheduled News.', removed: 'When remove all Cookies.', reason: 'Dont Leak unpublished News.', origin: 'frikybot' });

    SessionStorage.push({ name: 'LOGIN_ORG_PAGE', by: 'Twitch Login', set: 'When sent over to Twitch.', reason: 'Be able to return to the Page you left off.', origin: 'frikybot' });
    SessionStorage.push({ name: 'BOT_STATUS_DETAILS', by: 'Bot Status', set: 'When new Bot Details were fetched', reason: 'Reduce loadtimes by storing a temporary dataset of the Bot Status.', origin: 'frikybot' });

    //From Packages
    for (let pack in INSTALLED_PACKAGES) {
        try {
            if (INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                let package_cookies = INSTALLED_PACKAGES[pack].Object.getWebCookies();
                for (let local of package_cookies.LocalStorage) LocalStorage.push(local);
                for (let session of package_cookies.SessionStorage) SessionStorage.push(session);
                for (let cookie of package_cookies.Cookies) Cookies.push(cookie);
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

//Module API
function API_MODULE_CONTROL_START(req, res, next) {
    const module_name = req.query['module_name'];

    if (!INSTALLED_MODULES[module_name]) return res.status(400).json({ err: 'Bad Request. Module not found.' });
    if (!INSTALLED_MODULES[module_name].Object) return res.status(500).json({ err: 'Module not initiated.' });

    let out = {};
    out.module_name = module_name;

    //set Enable
    INSTALLED_MODULES[module_name].Object.enable();
    out.enable = INSTALLED_MODULES[module_name].Object.isEnabled();
    out.status = INSTALLED_MODULES[module_name].Object.isReady();
    return res.json(out);
}
function API_MODULE_CONTROL_STOP(req, res, next) {
    const module_name = req.query['module_name'];

    if (!INSTALLED_MODULES[module_name]) return res.status(400).json({ err: 'Bad Request. Module not found.' });
    if (!INSTALLED_MODULES[module_name].Object) return res.status(500).json({ err: 'Module not initiated.' });

    let out = {};
    out.module_name = module_name;

    //set Enable
    INSTALLED_MODULES[module_name].Object.disable();
    out.enable = INSTALLED_MODULES[module_name].Object.isEnabled();
    out.status = INSTALLED_MODULES[module_name].Object.isReady();
    return res.json(out);
}
function API_MODULE_CONTROL_REMOVE(req, res, next) {
    const module_name = req.query['module_name'];
    const is_unknown = req.query['is_unknown'] === 'true';

    if (!module_name) return res.status(400).json({ err: 'Bad Request. Module not found.' });
    if (!ConfigHandler.Preloaded[module_name]) return res.status(400).json({ err: 'Bad Request. Module not found.' });

    let out = {};
    out.module_name = module_name;

    //Filter for Installed and Unknowns
    if (!is_unknown) {
        if (!INSTALLED_MODULES[module_name]) return res.status(400).json({ err: 'Bad Request. Module not installed.' });
        if (!INSTALLED_MODULES[module_name].Object) return res.status(500).json({ err: 'Module not initiated.' });
        //remove Config Template
        ConfigHandler.RemoveConfig(module_name);
    }
    
    //remove from Config Preloaded
    ConfigHandler.Preloaded[module_name] = undefined;
    out.removed = 'success';

    //Save remaining Config
    ConfigHandler.Save();
    
    //Send API Response
    res.json(out);
    
    //Restart when removed
    shutdown(5);
}
function API_MODULE_CONTROL_ADD(req, res, next) {
    const module_name = req.body['module_name'];

    if (!module_name) return res.status(400).json({ err: 'Bad Request. Module not found.' });
    if (INSTALLED_MODULES[module_name]) return res.status(400).json({ err: 'Bad Request. Module allready installed.' });

    let out = {};
    out.module_name = module_name;

    //add to Config
    ConfigHandler.Preloaded[module_name] = {};
    ConfigHandler.Save();

    out.added = 'success';
    res.json(out);

    //Restart when added
    shutdown(5);
}

async function API_MODULE_CONTROL_ABLES(req, res, next) {
    const module_name = req.body['module_name'];
    const controllable_name = req.body['controllable_name'];

    if (!module_name) return res.status(400).json({ err: 'Bad Request. Module not found.' });
    if (!INSTALLED_MODULES[module_name]) return res.status(400).json({ err: 'Bad Request. Module not installed.' });

    let out = {
        type: 'info',
        message: ''
    };

    if (module_name === 'WebApp' && controllable_name === '_temp_clearErrorLog') {
        Server_Status = {
            status: "Operational",
            errors: {
                fatal: {

                },
                outage: {

                }
            }
        };

        out.message = 'cleared';
        res.json(out);
        return;
    }

    try {
        let info = await INSTALLED_MODULES[module_name].Object.executeControllable(controllable_name, res.locals.user);
        if (typeof info === 'string') out.message = info;
        else out = info;
    } catch (err) {
        out.message = err.message;
        out.type = 'error';
    }

    res.json(out);
}

async function API_MODULE_LOGS(req, res, next) {
    const module_name = req.params['module'];
    const log_name = req.params['log'];
    const pagination = req.query['pagination'];
    let module_obj = INSTALLED_MODULES[module_name];

    if (!module_obj || !module_obj.Object) return res.sendStatus(404);

    try {
        let logs = null;

        if (log_name) logs = await module_obj.Object.GetLog(log_name, pagination);
        else logs = await module_obj.Object.GetLogs(pagination);
        return res.json(logs);
    } catch (err) {
        return res.sendStatus(408);
    }

    return res.sendStatus(500);
}

//Package API
async function API_PACKAGES_INFO(req, res, next) {
    let out = {
        Packages: {

        }
    };

    let authenticated = false;

    try {
        await this.WebAppInteractor.AuthorizeUser(res.locals.user, { user_level: 'staff' });
        authenticated = true;
    } catch (err) {

    }

    for (let pack in INSTALLED_PACKAGES) {
        try {
            if (authenticated || INSTALLED_PACKAGES[pack].Object.isEnabled()) {
                out.Packages[pack] = INSTALLED_PACKAGES[pack].Object.getPackageDetails();
            }
        } catch (err) {
            Logger.server.error(err.message);
        }
    }

    return res.json({ data: out });
}
async function API_PACKAGE_CONTROL_START(req, res, next) {
    const package_name = req.query['package_name'];

    if (!INSTALLED_PACKAGES[package_name]) {
        res.status(400).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name].Object) {
        res.status(500).json({ err: 'Package not initiated.' });
        return Promise.resolve();
    }

    let out = {};
    out.package_name = package_name;

    //set Enable + call Reload
    try {
        await INSTALLED_PACKAGES[package_name].Object.enable();
        out.enable = 'success';

        if (INSTALLED_PACKAGES[package_name].Object.SETUP_COMPLETE !== true) {
            let packCfg = ConfigHandler.GetConfigs().find(elt => elt.GetName() === 'Packages');
            await INSTALLED_PACKAGES[package_name].Object.Init(packCfg[package_name]);
        } else {
            await INSTALLED_PACKAGES[package_name].Object.reload();
        }

        out.reload = 'success';
    } catch (err) {
        out.err = 'failed';
    }

    out.status = INSTALLED_PACKAGES[package_name].Object.isEnabled();
    res.json(out);
    return Promise.resolve();
}
async function API_PACKAGE_CONTROL_STOP(req, res, next) {
    const package_name = req.query['package_name'];

    if (!INSTALLED_PACKAGES[package_name]) {
        res.status(400).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name].Object) {
        res.status(500).json({ err: 'Package not initiated.' });
        return Promise.resolve();
    }

    let out = {};
    out.package_name = package_name;

    //set Enable
    try {
        await INSTALLED_PACKAGES[package_name].Object.disable();
        out.disable = 'success';
    } catch (err) {
        out.err = 'failed';
    }

    out.status = INSTALLED_PACKAGES[package_name].Object.isEnabled();
    res.json(out);
    return Promise.resolve();
}
async function API_PACKAGE_CONTROL_RELOAD(req, res, next) {
    const package_name = req.query['package_name'];

    if (!INSTALLED_PACKAGES[package_name]) {
        res.status(400).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name].Object) {
        res.status(500).json({ err: 'Package not initiated.' });
        return Promise.resolve();
    }

    let out = {};
    out.package_name = package_name;

    //set Enable
    try {
        await INSTALLED_PACKAGES[package_name].Object.reload();
        out.reload = 'success';
    } catch (err) {
        out.err = 'failed';
    }

    res.json(out);
    return Promise.resolve();
}
async function API_PACKAGE_CONTROL_REMOVE(req, res, next) {
    const package_name = req.query['package_name'];

    if (!INSTALLED_PACKAGES[package_name]) {
        res.status(404).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name].Object) {
        res.status(406).json({ err: 'Package not initiated.' });
        return Promise.resolve();
    }

    let out = {};
    out.package_name = package_name;

    //set Enable + remove from installed + remove from config
    try {
        await INSTALLED_PACKAGES[package_name].Object.disable();
        delete INSTALLED_PACKAGES[package_name];

        let packCfg = ConfigHandler.GetConfigs().find(elt => elt.GetName() === 'Packages');
        packCfg.UpdateSetting(package_name, undefined);

        out.removed = 'success';
    } catch (err) {
        out.err = 'failed';
    }

    res.json(out);
    return Promise.resolve();
}
async function API_PACKAGE_CONTROL_ADD(req, res, next) {
    const package_name = req.body['package_name'];

    if (!package_name) {
        res.status(400).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (INSTALLED_PACKAGES[package_name]) {
        res.status(406).json({ err: 'Package allready installed.' });
        return Promise.resolve();
    }

    let out = {};
    out.package_name = package_name;

    //add to Config, try to load when Files present
    try {
        let packCfg = ConfigHandler.GetConfigs().find(elt => elt.GetName() === 'Packages');
        packCfg.UpdateSetting(package_name, req.body['startparameters'] || '');

        loadPackage(package_name, req.body['startparameters'] || '');
        await iniPackage(package_name);
        postIniPackage(package_name);
        await PackageInterconnectPackage(package_name);

        if (INSTALLED_PACKAGES[package_name]) out.added = 'success';
        else out.added = 'partial';

        let pkg = INSTALLED_PACKAGES[package_name].Object;
        out.package = {
            details: pkg.getPackageDetails(),
            interconnects: pkg.GetPackageInterconnectRequests(),
            cfg: pkg.GetConfig(false).GetConfigREDACTED(),
            template: pkg.GetConfig(false).Template
        };
    } catch (err) {
        out.err = 'failed';
    }

    res.json(out);
    return Promise.resolve();
}

async function API_PACKAGE_CONTROL_ABLES(req, res, next) {
    const package_name = req.body['package_name'];
    const controllable_name = req.body['controllable_name'];

    if (!package_name) return res.status(400).json({ err: 'Bad Request. Package not found.' });
    if (!INSTALLED_PACKAGES[package_name]) return res.status(400).json({ err: 'Bad Request. Package not installed.' });

    let out = {
        type: 'info',
        message: ''
    };

    try {
        let info = await INSTALLED_PACKAGES[package_name].Object.executeControllable(controllable_name, res.locals.user);
        if (typeof info === 'string') out.message = info;
        else out = info;
    } catch (err) {
        out.message = err.message;
        out.type = 'error';
    }

    res.json(out);
}

async function API_PACKAGE_LOGS(req, res, next) {
    const package_name = req.params['package'];
    const log_name = req.params['log'];
    const pagination = req.query['pagination'];
    let package_obj = INSTALLED_PACKAGES[package_name];

    if (!package_obj || !package_obj.Object) return res.sendStatus(404);

    try {
        let logs = null;

        if (log_name) logs = await package_obj.Object.GetLog(log_name, pagination);
        else logs = await package_obj.Object.GetLogs(pagination);
        return res.json(logs);
    } catch (err) {
        return res.sendStatus(408);
    }

    return res.sendStatus(500);
}

function API_PACKAGE_SETTINGS(req, res, next) {
    const package_name = req.query['package_name'];

    if (!package_name || !req.body.cfg) return res.status(400).json({ err: 'Bad Request. package or config missing!' });
    if (!INSTALLED_PACKAGES[package_name]) return res.status(400).json({ err: 'Bad Request. Package not found.' });
    if (!INSTALLED_PACKAGES[package_name].Object) return res.status(500).json({ err: 'Package not initiated.' });

    let pkg = INSTALLED_PACKAGES[package_name].Object;

    for (let change in req.body.cfg) {
        let error = pkg.GetConfig(false).UpdateSetting(change, req.body.cfg[change]);
        if (error !== true) return res.json({ err: error });
    }
    
    res.json({ status: 'success' });
}

//Page Infos API
async function PAGE_Navi(req, res, next) {
    let maximum_userlevel = 'regular';
    
    let package_nagiation_elements = [];
    const ALL_ELEMENTS = [
        { data: { type: "icon", name: "Homepage", href: "/", icon: "images/icons/home.svg" }, categorie: 'Main' },
        { data: { type: "icon", name: "Bot Details", href: "/bot", icon: "images/icons/FrikyBot.png" }, categorie: 'Settings', userlevel: 'staff' },
        { data: { type: "icon", name: "Settings", href: "/settings", icon: "images/icons/gear.svg" }, categorie: 'Settings', userlevel: 'staff' }
    ];

    //Collect Package Navigation ELements
    for (let pack in INSTALLED_PACKAGES) {
        if (INSTALLED_PACKAGES[pack].Object && INSTALLED_PACKAGES[pack].Object.isEnabled() && INSTALLED_PACKAGES[pack].Object.getWebNavigation()) {
            ALL_ELEMENTS.push(INSTALLED_PACKAGES[pack].Object.getWebNavigation());
        }
    }

    //Check Userlevel and Push
    for (let element of ALL_ELEMENTS) {
        if (element.userlevel) {
            let userlevel_value = null;
            if (element.userlevel instanceof Function) userlevel_value = element.userlevel();
            else userlevel_value = element.userlevel;
            
            if (CONSTANTS.UserLevel[userlevel_value] === undefined) continue;

            if (CONSTANTS.UserLevel[maximum_userlevel] < CONSTANTS.UserLevel[userlevel_value]) {
                //Check Userlevel
                try {
                    await INSTALLED_MODULES['WebApp'].Object.GetInteractor().AuthorizeUser(res.locals.user, { user_level: userlevel_value });
                    maximum_userlevel = userlevel_value;
                } catch (err) {
                    continue;
                }
            }
        }

        package_nagiation_elements.push(element);
    }
    
    //Main - Section
    let MainSection = [];
    
    for (let pack of package_nagiation_elements.filter(elt => elt.categorie === 'Main')) {
        let temp_Pck_Nav = pack.data;
        temp_Pck_Nav.type = "icon";
        MainSection.push(temp_Pck_Nav);
    }

    //Packages - Section
    let PackageSection = [];

    for (let pack of package_nagiation_elements.filter(elt => elt.categorie === 'Packages')) {
        let temp_Pck_Nav = pack.data;
        temp_Pck_Nav.type = "icon";
        PackageSection.push(temp_Pck_Nav);
    }

    //Add "More Packages"
    PackageSection.push({ type: "icon", name: "More Packages", href: "/Packages", icon: "images/icons/packages.svg" });

    //Settings - Section
    let SettingsSection = [];

    for (let pack of package_nagiation_elements.filter(elt => elt.categorie === 'Settings')) {
        let temp_Pck_Nav = pack.data;
        temp_Pck_Nav.type = "icon";
        SettingsSection.push(temp_Pck_Nav);
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
    let auth = INSTALLED_MODULES['WebApp'].Object.Authenticator || {};

    res.json({ authenticator: auth.GetName ? auth.GetName() : 'UNAVAILABLE' });
}

async function PAGE_Settings_Dashboard(req, res, next) {
    let data = {
        Modules: [],
        Packages: []
    };

    //Modules
    for (let name in INSTALLED_MODULES) {
        let module = INSTALLED_MODULES[name].Object;
        if (!module) continue;

        data['Modules'].push(module.GetDetails());
    }

    //Packages
    for (let name in INSTALLED_PACKAGES) {
        let pack = INSTALLED_PACKAGES[name].Object;
        if (!pack) continue;

        data['Packages'].push(pack.getPackageDetails());
    }

    res.json({ data });
}
async function PAGE_Settings_Setup(req, res, next) {
    //TTV IRC
    let ttv_irc;
    let TwitchIRC = (INSTALLED_MODULES['TwitchIRC'] || {}).Object;
    let TwitchAPI = (INSTALLED_MODULES['TwitchAPI'] || {}).Object;

    if (TwitchIRC && TwitchIRC.isEnabled()) {
        ttv_irc = {};

        ttv_irc['ready'] = TwitchIRC.isReady();

        if (TwitchIRC.Config.GetConfig()['login']) {
            try {
                let user = (await TwitchAPI.GetUsers({ login: TwitchIRC.Config.GetConfig()['login'] })).data[0];

                ttv_irc['user'] = {
                    preferred_username: user.display_name,
                    sub: user.id,
                    description: user.description,
                    picture: user.profile_image_url
                };
            } catch {

            }
        }
    }

    //TTV API
    let ttv_api;

    if (TwitchAPI && TwitchAPI.isEnabled()) {
        ttv_api = {};

        ttv_api['ready'] = TwitchAPI.isReady();

        try {
            ttv_api['user'] = await TwitchAPI.getUserTokenStatus();
            if (ttv_api['user'].sub) {
                let user = (await TwitchAPI.GetUsers({ id: ttv_api['user'].sub })).data[0];
                ttv_api['user'].picture = user.profile_image_url;
            }
        } catch {

        }

        try {
            let ttv_auth = (INSTALLED_MODULES['WebApp'] || {}).Object.Installed_Authenticators.find(elt => elt.GetName() === 'TTV Auth.');
            if (ttv_auth) {
                ttv_api['authenticator_userlevels'] = ttv_auth.Config.GetConfig()['Userlevels'];
                ttv_api['authenticator_users'] = await ttv_auth.GetUsers();
            }
        } catch {

        }

        ttv_api.endpoints = TwitchAPI.GetEndpointSettings();
        ttv_api.eventsubs = TwitchAPI.GetEventSubSettings();
    }

    //Package API Req
    let packages = {};
    for (let pgk in INSTALLED_PACKAGES) {
        try {
            packages[pgk] = INSTALLED_PACKAGES[pgk].Object.getPackageDetails();
        } catch (err) {

        }
    }

    //Authenticators Details
    let auths = [];

    try {
        auths = await INSTALLED_MODULES['WebApp'].Object.GetAuthenticatorDetails();
    } catch (err) {

    }

    res.json({
        data: {
            cfg: ConfigHandler.GetConfigJSON(),
            tmpl: ConfigHandler.GetTemplates(),
            auths, ttv_api, ttv_irc, packages
        }
    });
}
async function PAGE_Settings_Modules(req, res, next) {
    let data = {
        server: VERSION,
        Modules: [],
        Unknown_Modules: [],
        auto_detected: autodetectModules()
    };

    //Modules
    for (let name in INSTALLED_MODULES) {
        let module = INSTALLED_MODULES[name].Object;
        if (!module) continue;

        data['Modules'].push(module.GetDetails());
    }

    //Unknown Modules
    for (let mdl in ConfigHandler.GetConfigJSON()) {
        if (ConfigHandler.Configs.find(elt => elt.GetName() === mdl)) continue;
        data['Unknown_Modules'].push(mdl);
    }

    res.json({
        data: data
    });
}
async function PAGE_Settings_Packages(req, res, next) {
    let data = {
        server: VERSION,
        modules: [],
        Packages: [],
        auto_detected: autodetectPackages(),
        inactive_endpoints: [],
        inactive_eventsubs: []
    };

    //Check Module Versions
    for (let modl in INSTALLED_MODULES) {
        try {
            if (INSTALLED_MODULES[modl].node_module) {
                modules.push(INSTALLED_MODULES[modl].node_module.DETAILS);
            }
        } catch (err) {

        }
    }

    //Find API / EventSubs
    let TTVAPI = INSTALLED_MODULES['TwitchAPI'];
    if (INSTALLED_MODULES['TwitchAPI'] && INSTALLED_MODULES['TwitchAPI'].node_module && INSTALLED_MODULES['TwitchAPI'].Object) {
        //Inactive Stuff
        let inactive_endpoints = [];
        let inactive_eventsubs = [];
        let scopes = TTVAPI.Object.GetScopes();

        for (let name in TTVAPI.node_module.TTV_API_INFO || {}) {
            if (!TTVAPI.node_module.TTV_API_INFO[name].req_scope) continue;
            if (scopes.find(elt => elt === TTVAPI.node_module.TTV_API_INFO[name].req_scope)) continue;
            inactive_endpoints.push(name);
        }

        for (let topic in TTVAPI.node_module.TTV_EVENTSUB_TOPICS || {}) {
            if (!TTVAPI.node_module.TTV_EVENTSUB_TOPICS[topic].scope) continue;

            let t_scopes = TTVAPI.node_module.TTV_EVENTSUB_TOPICS[topic].scope;
            if (typeof t_scopes === 'string') t_scopes = [t_scopes];
            
            for (let scope of t_scopes) {
                if (scopes.find(elt => elt === scope)) continue;
                inactive_eventsubs.push(topic);
            }
        }

        data.inactive_endpoints = inactive_endpoints;
        data.inactive_eventsubs = inactive_eventsubs;
    }

    //Collect Package Data
    for (let pack in INSTALLED_PACKAGES) {
        try {
            let pkg = INSTALLED_PACKAGES[pack].Object;
            let pkg_data = {
                details: pkg.getPackageDetails(),
                interconnects: pkg.GetPackageInterconnectRequests(),
                cfg: pkg.GetConfig(false).GetConfigREDACTED(),
                template: pkg.GetConfig(false).GetTemplate(true, true)
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
    let data = {
        Modules: [],
        Packages: []
    };

    const pagination = GetPaginationString(10, 0, { timesorted: true });

    //Modules
    for (let name in INSTALLED_MODULES) {
        let module = INSTALLED_MODULES[name].Object;
        if (!module) continue;
        try {
            data['Modules'].push({
                name: name,
                logs: await module.GetLogs(pagination)
            });
        } catch (err) {

        }
    } 

    //Packages
    for (let name in INSTALLED_PACKAGES) {
        let packg = INSTALLED_PACKAGES[name].Object;
        if (!packg) continue;
        try {
            data['Packages'].push({
                name: name,
                logs: await packg.GetLogs(pagination)
            });
        } catch (err) {

        }
    }

    res.json({ data });
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

async function PAGE_Settings_Tools(req, res, next) {
    let data = {};

    let WebApp = (INSTALLED_MODULES['WebApp'] || {}).Object;
    let WAI = WebApp.GetInteractor();

    //API STRUCTURE
    let main = WebApp.API_TREE_R(WAI.MAIN_ROUTER);
    let file = WebApp.API_TREE_R(WAI.FILE_ROUTER);
    let api = WebApp.API_TREE_R(WAI.API_ROUTER);
    api.mount = '/api';

    data['api_tree'] = {
        'Main Router': WebApp.API_TREE_SIMPLYFIY(main),
        'File Router': WebApp.API_TREE_SIMPLYFIY(file),
        'API Router': WebApp.API_TREE_SIMPLYFIY(api)
    };

    //Logs
    data['RAW_LOGS'] = Logger.GetAllRawLogNames();

    //EventSubs
    try {
        let TwitchAPI = (INSTALLED_MODULES['TwitchAPI'] || {}).Object;
        data['EVENTSUBS'] = TwitchAPI.GetActiveEventSubs();
    } catch (err) {
        console.log(err);
    }


    res.json({ data });
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

        let TwitchIRC = (INSTALLED_MODULES['TwitchIRC'] || {}).Object;
        let TwitchAPI = (INSTALLED_MODULES['TwitchAPI'] || {}).Object;

        //Twitch IRC
        if (TwitchIRC && TwitchIRC.isEnabled() && TwitchIRC.isReady()) {
            data.Channel = TwitchIRC.getChannel();
            data.Username = TwitchIRC.getLoginName() || '';
        } else {
            Server_Status.errors.fatal.TwitchIRC = "Not available.";
        }

        //Twitch API
        if (!TwitchAPI || !TwitchAPI.isEnabled() || !TwitchAPI.isReady()) {
            Server_Status.errors.fatal.TwitchAPI = "Not available.";
        } else {
            delete Server_Status.errors.fatal.TwitchAPI;
            delete Server_Status.errors.outage.TwitchAPI;
            
            //EventSubs
            let missing_ES = TwitchAPI.GetMissingEventSubs();
            if (missing_ES.length > 1) {
                Server_Status.errors.outage.TwitchAPI = "EventSubs not available!";
            }

            //Tokens
            if (!TwitchAPI.UserAccessToken) {
                Server_Status.errors.outage.TwitchAPI = "Only Basic API Access";
            } else if (!TwitchAPI.AppAccessToken) {
                Server_Status.errors.outage.TwitchAPI = "No API Access";
            }

            //Fetch User Info
            if (TwitchIRC && TwitchIRC.getLoginName()) {
                try {
                    let UserJson = await TwitchAPI.GetUsers({ login: TwitchIRC.getLoginName() });

                    if (UserJson && UserJson.data && UserJson.data[0]) {
                        data.Username = UserJson.data[0].display_name ? UserJson.data[0].display_name : UserJson.data[0].login;
                        data.Description = UserJson.data[0].description;
                        data.Type = UserJson.data[0].type;
                        data.Image = UserJson.data[0].profile_image_url;
                    }
                } catch (err) {
                    Server_Status.errors.outage.TwitchAPI = "Access unavailabe.";
                }
            }

            //Fetch Stream Info
            if (TwitchIRC) {
                try {
                    let StreamJson = await TwitchAPI.GetStreams({ user_login: data.Channel });

                    if (StreamJson && StreamJson.data) {
                        data.Live = StreamJson.data.length > 0 === true;
                    }
                } catch (err) {
                    Server_Status.errors.outage.TwitchAPI = "Access unavailabe.";
                }
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

//Logger API
async function LOGGER_RAW_API(req, res, next) {
    const raw_log_name = req.query['log_name'];
    
    try {
        let response = await Logger.GetRawLog(raw_log_name);
        res.json(response);
    } catch (err) {
        res.json({ err: err.message });
    }
}