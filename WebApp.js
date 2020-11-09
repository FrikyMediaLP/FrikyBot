const CONSTANTS = require('./Util/CONSTANTS.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

class WebApp {
    constructor(config = {}, logger) {
        this.Settings = {

        };

        //Apply Config Settings
        if (typeof config == "object" && config.length == undefined) {
            for (let setting in config) {
                //one time nesting
                if (typeof config[setting] == "object" && config[setting].length == undefined) {
                    for (let innerSetting in config[setting]) {
                        this.Settings[setting][innerSetting] = config[setting][innerSetting];
                    }
                } else {
                    this.Settings[setting] = config[setting];
                }
            }
        }

        //LOGGER
        if (logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                express: {
                    display: () => " EXPRESS ".inverse.cyan
                }
            });
            this.setLogger(logger.express);
        } else {
            this.setLogger(logger);
        }

        //Express App
        this.app = express();
        this.Authenticator;
    }

    async Init() {
        //Express App Setup
        this.server = this.app.listen(8080, () => {
            let address = this.server.address();
            this.Logger.info("Listening on " + address.address + ":" + address.port + " ...");
        });
        this.app.use(express.json({ limit: "1mb" }));
        
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

        //NO ENDPOINT FOUND
        this.app.all('/api/*', (req, res, next) => res.json({ err: "404 - API Endpoint not found" }));
        //NO FILE FOUND
        this.app.use((req, res, next) =>  res.redirect("/NotFound") );

        return Promise.resolve();
    }
    setAuthenticator(authenticator) {
        this.Authenticator = authenticator;
        this.WebAppInteractor.Authenticator = authenticator;
    }
    GetInteractor() {
        return this.WebAppInteractor;
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
    addAuthAPIRoute(route, auth_method = {}, ...middlewares) {
        if (auth_method === null)
            auth_method = {};

        if (!(auth_method instanceof Object))
            return false;
        
        this.API_ROUTER.use(route, (req, res, next) => this.AuthenticateRequest(req, auth_method, res, next), ...middlewares);
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
    addAuthAPIEndpoint(route, auth_method = {}, method = 'GET', ...middlewares) {
        if (auth_method === null)
            auth_method = {};

        if (typeof (method) !== 'string' || !(auth_method instanceof Object))
            return false;

        method = method.toLowerCase();
        
        if (this.API_ROUTER[method]) {
            try {
                this.API_ROUTER[method](route, (req, res, next) => this.AuthenticateRequest(req, auth_method, res, next), ...middlewares);
                return true;
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        return false;
    }

    //Authentication
    async AuthenticateRequest(req, method = {}, res, next) {
        if (!this.Authenticator) {
            if (res) res.status("500").send("Authenticator not ready!");
            return Promise.resolve();
        }
        
        try {
            let user = await this.Authenticator.AuthenticateUser(req.headers, method);
            if (res) res.locals.user = user;
            if(next) next();
            return Promise.resolve(true);
        } catch (err) {
            //authorization failed
        }

        if (res) res.status("401").send("Unauthorized");
        return Promise.resolve(false);
    }
}

module.exports.WebApp = WebApp;
module.exports.WebAppInteractor = WebAppInteractor;