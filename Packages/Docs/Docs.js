const CONSTANTS = require('./../../Util/CONSTANTS.js');
const express = require('express');
const path = require('path');

const PACKAGE_DETAILS = {
    name: "Docs",
    description: "FrikyBot Documentation.",
    picture: "/images/icons/server-solid.svg"
};
const COOKIES = {
    SessionStorage: [
        { name: 'DOCS_DATA', by: 'Docs Page', set: 'When new Docs were fetched', reason: 'Reduce loadtimes by storing a temporary dataset of the Docs Data.' }
    ]
};

class Docs extends require('./../../Util/PackageBase.js').PackageBase {
    constructor(webappinteractor, twitchirc, twitchapi, logger) {
        super(PACKAGE_DETAILS, webappinteractor, twitchirc, twitchapi, logger);
        
        this.Config.AddSettingTemplates([
            { name: 'Data_Dir', type: 'string', default: this.getMainPackageRoot() + 'Docs/Data/' },
            { name: 'allow_data_caching', type: 'boolean', default: false }
        ]);
        this.Config.Load();
        this.Config.FillConfig();

        //Cookies
        this.setWebCookies(COOKIES);
    }

    async Init(startparameters) {
        if (!this.isEnabled()) return Promise.resolve();

        this.DOCS_NAV = {};
        this.DOCS_DATA = {};

        //API ENDPOINTS
        let APIRouter = express.Router();
        APIRouter.get('/Data/:module', (req, res, next) => {
            let moduleData = this.getData(req.params.module);

            if (moduleData.err) {
                res.status(404).json({ err: moduleData.err, code: moduleData.code });
            } else {
                res.json({ data: moduleData });
            }
        });
        APIRouter.get('/Data/:module/:class', (req, res, next) => {
            let moduleData = this.getData(req.params.module);

            if (moduleData.err) {
                res.status(404).json({ err: moduleData.err, code: moduleData.code });
            } else if (moduleData[req.params.module] && moduleData[req.params.module].classes && moduleData[req.params.module].classes[req.params.class] != undefined) {
                res.json({ data: {
                        [req.params.class]: moduleData[req.params.module].classes[req.params.class]
                    } });
            } else {
                res.status(404).json({ err: 'Class Not Found', code: 404 });
            }
        });
        APIRouter.get('/Navigation', (req, res, next) => {
            let cfg = this.Config.GetConfig();

            if (cfg.realtime_update == true) this.updateNavigation();

            res.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                data: this.DOCS_NAV
            });
        });
        super.setAPIRouter(APIRouter);
        
        //STATIC FILE ROUTE
        let StaticRouter = express.Router();
        StaticRouter.use("/", (req, res, next) => {
            let page = this.HTMLFileExists(req.url);

            //Check if File/Dir is Present
            if (page != "") {
                res.sendFile(page);
            } else {
                res.sendFile(path.resolve("Packages/Docs/html/index.html"));
            }
        });
        super.setFileRouter(StaticRouter);
        return this.reload();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));

        let cfg = this.Config.GetConfig();

        if (cfg.allow_data_caching === true) this.loadAllModules();
        this.updateNavigation();

        this.Logger.info("Docs (Re)Loaded!");
        return Promise.resolve();
    }
    
    loadAllModules() {
        let cfg = this.Config.GetConfig();
        let files = super.getFilesFromDir(cfg.Data_Dir);

        if (!files) files = [];

        for (let file of files) {
            if (file.indexOf('.js.json') >= 0) this.loadModule(file.substring(0, file.indexOf('.js.json')));
        }
    }
    loadModule(module) {
        let cfg = this.Config.GetConfig();

        try {
            let ModuleFilePath = cfg.Data_Dir + module + ".js.json";
            let ModuleJSON = JSON.parse(super.readFile(ModuleFilePath));

            if (!ModuleJSON) return { err: 'Data not found', code: 404 };

            if (cfg.allow_data_caching == true) this.DOCS_DATA[module] = ModuleJSON;

            return ModuleJSON;
        } catch (err) {
            if (err.message !== "404: File doesnt Exist!" && !err.message.startsWith("Cannot read property")) {
                this.Logger.error(err.message);
            }
            return { err: 'Data not found', code: 404 };
        }
    }
    getData(module) {
        if (!module) return { err: 'No Module found', code: 400 };

        let cfg = this.Config.GetConfig();

        if (this.DOCS_DATA[module] !== undefined) return this.DOCS_DATA[module];

        let data = this.loadModule(module);
        if (data.code === 404 && data.err === 'Data not found') return data;

        if (cfg.allow_data_caching == true) {
            this.DOCS_DATA[module] = data;
        }

        return data;
    }

    updateNavigation() {
        let cfg = this.Config.GetConfig();

        try {
            this.DOCS_NAV = JSON.parse(super.readFile(cfg.Data_Dir + "Navigation.json"));
        } catch (err) {
            this.Logger.error(err.message);
        }
        
        return this.DOCS_NAV;
    }
}

module.exports.Docs = Docs;