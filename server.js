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
        if (INSTALLED_MODULES['WebApp'] === undefined) {
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
    for (let module in configs) {
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
                await obj.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor());

                //Authenticator
                let auth = new (node_module).Authenticator(Logger, obj.GetConfig(false), obj);
                await auth.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor());
                INSTALLED_MODULES['WebApp'].Object.addAuthenticator(auth);
            } else {
                //Init
                await obj.Init(INSTALLED_MODULES['WebApp'].Object.GetInteractor());
            }
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

    Logger.server.info("BOT ONLINE AND READY!");
    
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
        WebAppInteractor.addAuthAPIRoute('/modules/control', { user_level: 'staff' }, ModuleControlAPIRouter);

        //Bot API - Packages
        APIRouter.get('/packages', API_PACKAGES_INFO);
        WebAppInteractor.addAuthAPIEndpoint('/packages/settings', { user_level: 'staff' }, 'POST', API_PACKAGE_SETTINGS);

        let PackageControlAPIRouter = express.Router();
        PackageControlAPIRouter.get('/start', API_PACKAGE_CONTROL_START);
        PackageControlAPIRouter.get('/stop', API_PACKAGE_CONTROL_STOP);
        PackageControlAPIRouter.get('/reload', API_PACKAGE_CONTROL_RELOAD);
        PackageControlAPIRouter.get('/remove', API_PACKAGE_CONTROL_REMOVE);
        PackageControlAPIRouter.post('/add', API_PACKAGE_CONTROL_ADD);
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
        
        WebAppInteractor.addAPIRoute('', APIRouter);
        
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

//Modules
function autodetectModules() {
    try {
        return fs.readdirSync(path.resolve(CONSTANTS.FILESTRUCTURE.MODULES_INSTALL_ROOT)).map(x => x.split('.js')[0])
    } catch (err) {
        return [];
    }
}
function loadModule(module, preloaded_config, ConfigHandler) {
    try {
        INSTALLED_MODULES[module] = {
            node_module: require('./' + CONSTANTS.FILESTRUCTURE.MODULES_INSTALL_ROOT + module + '.js'),
            Object: null
        };

        let obj = new INSTALLED_MODULES[module].node_module[module](preloaded_config, Logger);
        INSTALLED_MODULES[module].Object = obj;

        ConfigHandler.AddConfig(obj.Config);
    } catch (err) {
        if (module === 'WebApp') {
            Logger.server.error("The FrikyBot REQUIERES the WebApp Module! Please check your install!");
            Logger.server.warn("Please check your install!");
            return Promise.reject(err);
        }

        Logger.setup.error(module + ' failed to load!');
    }
}

//Packages
function autodetectPackages() {
    try {
        return fs.readdirSync(path.resolve(CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT));
    } catch (err) {
        return [];
    }
}
function loadPackage(pack, preloaded_config) {
    try {
        INSTALLED_PACKAGES[pack] = {
            Object: null,
            Class: require('./' + CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + pack + '/' + pack + '.js')[pack],
            Config: preloaded_config
        };
    } catch (err) {
        Logger.server.error(pack + " -> " + err.message);
        Logger.server.warn(pack + " -> " + "Please check your install or contact the Devs!");
    }
}
async function iniPackage(pack) {
    try {
        let packClass = INSTALLED_PACKAGES[pack].Class;

        INSTALLED_PACKAGES[pack].Object = new packClass(INSTALLED_MODULES['WebApp'].Object.GetInteractor(), (INSTALLED_MODULES['TwitchIRC'] || {}).Object, (INSTALLED_MODULES['TwitchAPI'] || {}).Object, (INSTALLED_MODULES['DataCollection'] || {}).Object, Logger);
        
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
    
    //TTV Login
    if (INSTALLED_MODULES['TwitchAPI'] && req.originalUrl.toLowerCase().startsWith("/settings/setup") && req.query['code']) {
        try {
            await INSTALLED_MODULES['TwitchAPI'].Object.createUserAccessToken(req.query['code'], req.query['scopes']);
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
    out.enable = INSTALLED_MODULES[module_name].Object.isEnabled() ? 'success' : 'failed';
    out.status = INSTALLED_MODULES[module_name].Object.isEnabled();
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
    out.enable = INSTALLED_MODULES[module_name].Object.isEnabled() ? 'failed' : 'success';
    out.status = INSTALLED_MODULES[module_name].Object.isEnabled();
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

        await INSTALLED_PACKAGES[package_name].Object.reload();

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
        res.status(400).json({ err: 'Bad Request. Package not found.' });
        return Promise.resolve();
    }

    if (!INSTALLED_PACKAGES[package_name].Object) {
        res.status(500).json({ err: 'Package not initiated.' });
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
        res.status(500).json({ err: 'Package allready installed.' });
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
            status: pkg ? 'ready' : 'not ready',
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
        await INSTALLED_MODULES['WebApp'].Object.GetInteractor().AuthorizeUser(res.locals.user, { user_level: 'staff' });
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
    let auth = INSTALLED_MODULES['WebApp'].Object.Authenticator || {};

    res.json({ authenticator: auth.GetName() || 'UNAVAILABLE' });
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

    //TTV API
    let ttv_api;

    if (TwitchAPI && TwitchAPI.isEnabled()) {
        ttv_api = {};
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
    }

    res.json({
        data: {
            cfg: ConfigHandler.GetConfigJSON(),
            tmpl: ConfigHandler.GetTemplates(),
            auths: INSTALLED_MODULES['WebApp'].Object.GetAuthenticatorDetails(),
            ttv_api, ttv_irc
        }
    });
}
async function PAGE_Settings_Modules(req, res, next) {
    let data = {
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
        Packages: [],
        auto_detected: autodetectPackages()
    };

    for (let pack in INSTALLED_PACKAGES) {
        try {
            let pkg = INSTALLED_PACKAGES[pack].Object;
            let pkg_data = {
                status: pkg ? 'ready' : 'not ready', 
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

    //Modules
    for (let name in INSTALLED_MODULES) {
        let module = INSTALLED_MODULES[name].Object;
        if (!module) continue;
        try {
            data['Modules'].push({
                name: name,
                logs: await module.GetLogs()
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
                logs: await packg.GetLogs()
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
        let DataCollection = (INSTALLED_MODULES['DataCollection'] || {}).Object;

        //Twitch IRC
        if (TwitchIRC && TwitchIRC.isEnabled() && TwitchIRC.isReady()) {
            data.Channel = TwitchIRC.getChannel();
            if (data.Channel && data.Channel.indexOf('#') >= 0) data.Channel = data.Channel.substring(1);
        } else {
            Server_Status.errors.fatal.TwitchIRC = "Not available.";
        }

        //Twitch API
        if (!TwitchAPI || !TwitchAPI.isEnabled() || !TwitchAPI.isReady()) {
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
                    Server_Status.errors.outage.TwitchAPI = "Access unavailabe.";
                }
            }
        }

        //DataCollection
        if (DataCollection) {
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