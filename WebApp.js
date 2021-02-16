const CONSTANTS = require('./Util/CONSTANTS.js');
const CONFIGHANDLER = require('./ConfigHandler.js');

const fs = require('fs');
const path = require('path');

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class WebApp {
    constructor(configJSON, logger, WebAppInteractor) {
        this.Config = new CONFIGHANDLER.Config('WebApp', [
            { name: 'Port', type: 'number', range: '0:99999', default: 8080, group: 0 },
            { name: 'Authenticator', type: 'config', requiered: true }
        ], { groups: [{ name: 'WebApp' }, { name: 'Authenticator' }], preloaded: configJSON });

        //LOGGER
        if (logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                website: {
                    display: () => " WEBSITE ".inverse.cyan
                }
            });
            this.setLogger(logger.website);
        } else {
            this.setLogger(logger);
        }

        //Express App
        this.app = express();
        this.Installed_Authenticators = [];
        this.Authenticator;

        if (WebAppInteractor) this.WebAppInteractor = WebAppInteractor;
    }

    async Init() {
        //Express App Setup
        this.app.use(express.json({ limit: "1mb" }));

        //WebAppInteractor
        if (!this.WebAppInteractor) this.setupWAI();

        return Promise.resolve();
    }
    setupWAI() {
        //Routers
        this.MAIN_ROUTER = express.Router();
        this.FILE_ROUTER = express.Router();
        this.API_ROUTER = express.Router();

        //WebInteractor
        this.WebAppInteractor = new WebAppInteractor(this.MAIN_ROUTER, this.FILE_ROUTER, this.API_ROUTER, this.Authenticator, this.Logger);

        //Apply Routing
        this.app.use(this.WebAppInteractor.MAIN_ROUTER);
        this.app.use((req, res, next) => this.BetterFileFinder('public', ['.html', '.htm', 'index.html'], req, res, next));
        this.app.use(this.WebAppInteractor.FILE_ROUTER);
        this.app.use("/api", this.WebAppInteractor.API_ROUTER);

        //Add Basic API
        this.WebAppInteractor.addMainRoute(async (req, res, next) => {
            //Rediect .../test/ to .../test
            if (req.originalUrl !== "/" && req.originalUrl.charAt(req.originalUrl.length - 1) == "/") {
                res.redirect(req.originalUrl.substring(0, req.originalUrl.length - 1));
                return Promise.resolve();
            }

            //Add User Information
            try {
                let user = await this.WebAppInteractor.AuthenticateUser(req.headers);
                res.locals.user = user;
            } catch (err) {

            }

            //Check other Routers
            try {
                next();
            } catch (err) {
                Logger.server.error(err.message);
            }
        });
        this.WebAppInteractor.addAPIEndpoint('/login/user', 'GET', (req, res) => {
            return res.json({ user: res.locals.user });
        });

        //NO ENDPOINT FOUND
        this.app.all('/api/*', (req, res, next) => res.json({ err: "404 - API Endpoint not found" }));
        //NO FILE FOUND
        this.app.use((req, res, next) => res.status(404).sendFile(path.resolve('public/NotFound.html')));
    }

    async StartServer() {
        let cfg = this.Config.GetConfig();
        this.Logger.warn('Server starting ...');

        return new Promise((resolve, reject) => {
            this.server = this.app.listen(cfg.Port, () => {
                let address = this.server.address();
                this.Logger.info("FrikyBot Website online at " + (address.address === '::' ? 'localhost' : address.address) + ":" + address.port + " ...");
                resolve();
            });
        });
    }
    async StopServer() {
        if (!this.server) return Promise.resolve();

        this.Logger.warn('Server shutting down...');

        return new Promise((resolve, reject) => {
            this.server.close(() => {
                this.Logger.warn('Server was shutdown!');
                return resolve();
            });
        });
    }
    async Restart() {
        //Keep Alive
        let KEEP_ALIVE_INTERVAL = setInterval((x) => x, 1000 * 60);

        //Stop
        try {
            await this.StopServer();
        } catch (err) {
            return Promise.reject(err);
        }

        //Start
        try {
            await this.StartServer();
        } catch (err) {
            return Promise.reject(err);
        } finally {
            clearInterval(KEEP_ALIVE_INTERVAL);
        }

        return Promise.resolve();
    }

    addAuthenticator(authenticator) {
        this.Installed_Authenticators.push(authenticator);
    }
    setAuthenticator(authenticator) {
        if (this.Authenticator) {
            this.Authenticator.setEnable(false);
        }

        this.Authenticator = authenticator;
        this.WebAppInteractor.Authenticator = authenticator;

        this.Logger.warn("New Authenticator in use: " + authenticator.identify());
    }
    GetInteractor() {
        return this.WebAppInteractor;
    }

    //Routing Structure
    API_ANALYSE_DISPLAY(arch, parent = "ExpressApp", depth = 0, offset = 4) {
        let out = "";

        for (let i = 0; i < depth * offset; i++) {
            out += " ";
        }
        out += depth + ". " + parent + "\n";

        for (let layer of arch) {
            if (layer.stack !== "END") {
                out += API_ANALYSE_DISPLAY(layer.stack, layer.regex ? layer.regex : layer.name, depth + 1, offset = 4);
            } else {
                for (let i = 0; i < (depth + 1) * offset; i++) {
                    out += " ";
                }

                out += (depth + 1) + ". " + layer.name + "\n";
            }
        }

        return out;
    }
    API_ANALYSE(layer, type = "handle", iter = 100, allow_cleanup = false) {
        let obj = [];

        if (layer[type].stack) {
            for (let sub_layer of layer[type].stack) {
                if (iter < 0) break;

                let splitted = sub_layer.regexp.toString().split('\\/');
                let cutted_regex;

                if (splitted.length > 2 && splitted[1].charAt(0) !== "?") {
                    cutted_regex = "/" + splitted[1];
                }

                let method = "";

                if (type === 'route') {
                    for (let meth in layer.route.methods) {
                        method = meth;
                    }
                }

                let name = (sub_layer.name !== "<anonymous>" && sub_layer.name !== "bound dispatch" ? sub_layer.name + "" : (sub_layer.name == "bound dispatch" ? sub_layer.route.path : (cutted_regex ? cutted_regex + "" : '')));

                if (name === 'router' && sub_layer.path) {
                    name = sub_layer.path;
                }

                let new_layer = {};

                if (method) {
                    new_layer = {
                        name: method,
                        stack: 'METHOD'
                    };
                } else {
                    new_layer = {
                        name: name,
                        stack: API_ANALYSE(sub_layer, sub_layer.route ? 'route' : 'handle', iter - 1)
                    };
                }

                if (name === 'router' && new_layer.stack.length > 0) {
                    for (let new_sub_layer of new_layer.stack) {
                        obj.push(new_sub_layer);
                    }
                } else {
                    obj.push(new_layer);
                }
            }

            //Cleanup
            let found = 0;
            while (allow_cleanup && found >= 0) {
                found = -1;

                for (let i = 0; i < obj.length; i++) {
                    if (obj[i].name === "" || obj[i].stack.length == 0) {
                        obj.splice(i, 1);
                        found = i;
                        break;
                    }

                    if (obj[i].stack === "END" || obj[i].stack === "METHOD") {
                        break;
                    }

                    for (let j = 0; j < obj[i].stack.length; j++) {
                        if (obj[i].stack.find((elt, idx) => {
                            if (elt.name === obj[i].stack[j].name && elt.stack === obj[i].stack[j].stack && idx !== j) {

                                found = idx;
                                return true;
                            }

                            return false;
                        })) break;

                    }

                    if (found < 0 && obj[i].stack.find((elt, idx) => {
                        if (elt.name === "") {

                            found = idx;
                            return true;
                        }

                        return false;
                    }));

                    if (found >= 0)
                        obj[i].stack.splice(found, 1);
                }
            }
        } else {
            obj = 'END';
        }

        return obj;
    }

    //UTIL
    BetterFileFinder(folder, extensions, req, res, next, steps) {
        if (!folder || !extensions) return next();

        //console.log();

        if (!steps) {
            steps = req['_parsedUrl'].pathname.split('/');
            steps.shift();
        }

        //console.log(steps);
        //console.log("F: " + folder);

        //URL Step
        let step = steps.shift();
        if (step === undefined) step = '';
        //console.log("S: " + step);

        //Path Files/Dirs
        let dirs = fs.readdirSync(path.resolve(folder));

        //Find File/Dir
        let match = dirs.find(dir => dir.toLowerCase() === step.toLowerCase());

        if (match) {
            //Its a File or Dir here
            //console.log("M: " + match);

            if (fs.statSync(path.resolve(folder + '/' + match)).isFile()) {
                //console.log("MF: CHECK!");
                return res.sendFile(path.resolve(folder + '/' + match));
            } else {
                return this.BetterFileFinder(folder + '/' + match, extensions, req, res, next, steps);
            }
        } else {
            //It MIGHT be a file - check auto Extension
            for (let ext of extensions) {
                //console.log("E: " + ext);
                let Ematch = dirs.find(dir => dir.toLowerCase() === step.toLowerCase() + ext);

                if (Ematch) {
                    //Its a File
                    //console.log("ME: " + ext);
                    return res.sendFile(path.resolve(folder + '/' + step + ext));
                }
            }
        }
        return next();
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

class WebAppInteractor {
    constructor(MAIN_ROUTER, FILE_ROUTER, API_ROUTER, Authenticator, Logger) {
        this.MAIN_ROUTER = MAIN_ROUTER;
        this.FILE_ROUTER = FILE_ROUTER;
        this.API_ROUTER = API_ROUTER;

        this.Authenticator = Authenticator;

        this.Logger = Logger;
    }

    //Routes
    addMainRoute(...middlewares) {
        this.MAIN_ROUTER.use(...middlewares);
    }
    addFileRoute(route, ...middlewares) {
        this.FILE_ROUTER.use(route, ...middlewares);
    }
    addAPIRoute(route, ...middlewares) {
        this.API_ROUTER.use(route, ...middlewares);
    }
    addAuthAPIRoute(route, auth_method, ...middlewares) {
        if (auth_method === null)
            auth_method = {};

        if (!(auth_method instanceof Object))
            return false;

        return this.API_ROUTER.use(route, (req, res, next) => this.AuthorizeRequest(auth_method, req, res, next), ...middlewares);
    }

    //Endpoints
    addAPIEndpoint(route, method = 'GET', ...middlewares) {
        if (typeof (method) !== 'string')
            return false;

        method = method.toLowerCase();

        if (this.API_ROUTER[method]) {
            try {
                this.API_ROUTER[method](route, ...middlewares);
                return true;
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        return false;
    }
    addAuthAPIEndpoint(route, auth_method, method = 'GET', ...middlewares) {
        if (auth_method === null)
            auth_method = {};

        if (typeof (method) !== 'string' || !(auth_method instanceof Object))
            return false;

        method = method.toLowerCase();

        if (this.API_ROUTER[method]) {
            try {
                this.API_ROUTER[method](route, (req, res, next) => this.AuthorizeRequest(auth_method, req, res, next), ...middlewares);
                return true;
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        return false;
    }

    //Authentication
    async AuthorizeRequest(method = {}, req, res, next) {
        //Used as middleware
        //User Locals Info to Authorize User
        try {
            await this.AuthorizeUser(res.locals.user, method);
            next();
            return Promise.resolve();
        } catch (err) {

        }

        //Auth Failed / Unauthorized
        res.status("401").send("Unauthorized");
        return Promise.resolve();
    }
    async AuthenticateUser(headers = {}) {
        //Authenticates a User by an JWT
        if (!this.Authenticator) {
            return Promise.reject(new Error("Authenticator not available."));
        }

        return this.Authenticator.AuthenticateUser(headers);
    }
    async AuthorizeUser(user, method = {}) {
        //Used for next()-Middlewares to get User Info from req.locals
        if (!this.Authenticator) {
            return Promise.reject(new Error("Authenticator not available."));
        }

        try {
            await this.Authenticator.AuthorizeUser(user, method);
            return Promise.resolve(user);
        } catch (err) {
            //authorization failed
            return Promise.reject(err);
        }
    }
}

class Authenticator {
    constructor(logger, parentConfigObj) {
        this.Config = new CONFIGHANDLER.Config('Authenticator', [
            { name: 'enabled', type: 'boolean', default: true, requiered: true },
            { name: 'secret', type: 'string', requiered: true, default_func: () => this.regenerateSecret(false) },
            { name: 'Userlevels', type: 'array', type_array: 'string', default: ['viewer', 'moderator', 'staff', 'admin'] },
            { name: 'show_auth_message', type: 'boolean', default: false },
            { name: 'show_prev_token', type: 'boolean', default: true },
            { name: 'prev_token', type: 'string', private: true, default_func: () => this.generateToken('ConsoleUser') }
        ], { preloaded: parentConfigObj.GetConfig()['Authenticator'] });

        parentConfigObj.AddChildConfig(this.Config);
        this.Config.FillConfig();

        //LOGGER
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                Authenticator: {
                    display: () => " Authenticator ".inverse.cyan
                }
            });
            this.setLogger(logger.Authenticator);
        } else {
            this.setLogger(logger);
        }

        //Init Message
        if (this.Config.GetConfig()['show_prev_token'] !== false)
            this.Logger.warn("Use the following Authorization Code to Login and Setup your Bot: " + this.Config.GetConfig()['prev_token']);
    }

    //Auth
    async AuthorizeRequest(headers = {}, method = {}, user) {

        //Fetch User Data
        if (!user) {
            const header = headers['authorization'];
            const token = header && header.split(" ")[1];

            //Check JWT
            try {
                user = await this.checkToken(token);
            } catch (err) {
                //JWT Validation failed
                return Promise.reject(err);
            }
        }

        //Check User and Method
        return this.AuthenticateUser(user, method);
    }
    async AuthenticateUser(headers = {}) {
        const header = headers['authorization'];
        const token = header && header.split(" ")[1];

        //Check JWT
        return this.checkToken(token);
    }
    async AuthorizeUser(user = {}, method = {}) {
        let cfg = this.Config.GetConfig();

        //Check Method
        for (let meth in method) {
            try {
                if (meth === 'user_level') {
                    if (!this.CompareUserlevels(user.user_level, method[meth], method.user_level_cutoff === true)) {
                        return Promise.reject(new Error("Userlevel doesnt match"));
                    }
                } else {
                    return Promise.reject(new Error('Unknown Authorization Method!'));
                }
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (cfg.show_auth_message === true)
            this.Logger.warn("Authenticated FrikyBot User: " + user.user_level);

        return Promise.resolve(user);
    }

    setAPI(webInt) {
        if (!webInt) return;

        //Regenerate Token
        webInt.addAuthAPIRoute('/settings/webapp/fbauth/regen', { user_level: 'staff' }, 'GET', async (req, res) => {
            let new_scrt = this.regenerateSecret();
            let new_token = this.generateToken(res.locals.user.preferred_username, res.locals.user.user_level);
            return res.json({ new_scrt, new_token });
        });

        //Enable/Disable
        webInt.addAuthAPIRoute('/settings/webapp/fbauth/state', { user_level: 'staff' }, 'POST', async (req, res) => {
            this.setEnable(req.body.state === true);
            
            return res.json({ state: this.isEnabled() });
        });
    }

    async checkToken(token) {
        if (!token) return Promise.reject(new Error('Token not found'));
        let cfg = this.Config.GetConfig();

        return new Promise((resolve, reject) => {
            jwt.verify(token, cfg['secret'], (err, user) => {
                if (err) return reject(new Error(err));
                return resolve(user);
            });
        });
    }
    generateToken(username, user_level = 'admin') {
        let cfg = this.Config.GetConfig();
        const payload = {
            preferred_username: username,
            user_level: user_level,
            iss: 'FrikyBot'
        };

        return jwt.sign(payload, cfg['secret']);
    }
    regenerateSecret(updateConfig = true) {
        let scrt = crypto.randomBytes(64).toString('hex');
        if (updateConfig) this.Config.UpdateSetting('secret', scrt);
        return scrt;
    }

    //Util
    GetUserlevels() {
        let cfg = this.Config.GetConfig();
        return cfg.Userlevels || [];
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
        if (cutoff === true && rel_index === 0 && current_index !== this.GetUserlevels().length - 1) return false;

        return true;
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

    setEnable(state) {
        this.Config.UpdateSetting('enabled', state === true);
    }
    isEnabled() {
        let cfg = this.Config.GetConfig();
        return cfg.enabled === true;
    }

    identify() {
        return "FrikyBot Auth.";
    }
}


module.exports.WebApp = WebApp;
module.exports.WebAppInteractor = WebAppInteractor;
module.exports.Authenticator = Authenticator;