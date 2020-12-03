const CONSTANTS = require('./../../Util/CONSTANTS.js');
const express = require('express');
const path = require('path');

const PACKAGE_DETAILS = {
    name: "Docs",
    description: "FrikyBot Documentation."
};

const SETTINGS_REQUIERED = {
    "Data_Dir": "Packages/Docs/Data/",
    "allow_data_caching": false,
    "realtime_update": false
};

class Docs extends require('./../PackageBase.js').PackageBase {
    constructor(expressapp, twitchirc, twitchapi, datacollection, logger) {
        super(PACKAGE_DETAILS, expressapp, twitchirc, twitchapi, datacollection, logger);
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
                res.status(404).json({
                    status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                    err: moduleData.err,
                    code: moduleData.code
                });
            } else {
                res.json({
                    status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                    data: moduleData
                });
            }
        });
        APIRouter.get('/Data/:module/:class', (req, res, next) => {
            let moduleData = this.getData(req.params.module);

            if (moduleData.err) {
                res.status(404).json({
                    status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                    err: moduleData.err,
                    code: moduleData.code
                });
            } else if (moduleData[req.params.module] && moduleData[req.params.module].classes && moduleData[req.params.module].classes[req.params.class] != undefined) {
                res.json({
                    status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                    data: {
                        [req.params.class]: moduleData[req.params.module].classes[req.params.class]
                    }
                });
            } else {
                res.status(404).json({
                    status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                    err: 'Class Not Found',
                    code: 404
                });
            }
        });
        APIRouter.get('/Navigation', (req, res, next) => {
            res.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                data: this.getNavigation()
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

        if (this.Settings.allow_data_caching == true)
            this.loadAllModules();

        this.Logger.info("Docs (Re)Loaded!");
        return Promise.resolve();
    }

    CheckSettings(settings) {
        return this.AddObjectElementsToOtherObject(settings, SETTINGS_REQUIERED, msg => this.Logger.info("CONFIG UPDATE: " + msg));
    }

    loadAllModules() {
        let files = super.getFilesFromDir(this.Settings.Data_Dir);

        if (!files)
            files = [];

        for (let file of files) {
            if (file.indexOf('.js.json') >= 0)
                this.getData(file.substring(0, file.indexOf('.js.json')));
        }
    }

    getData(module) {
        if (!module)
            return { err: 'No Module found', code: 400 };

        if (this.Settings.realtime_update == true || this.DOCS_DATA[module] == undefined) {
            this.Logger.info("Fetching Module: " + module)
            //Update Data
            try {
                let ModuleFilePath = this.Settings.Data_Dir + module + ".js.json";
                let ModuleJSON = JSON.parse(super.readFile(ModuleFilePath));
                
                if (ModuleJSON && this.Settings.allow_data_caching == true) {
                    this.DOCS_DATA[module] = ModuleJSON;
                }

                return ModuleJSON ? ModuleJSON : { err: 'Data not found', code: 404 };
            } catch (err) {
                if (err.message !== "404: File doesnt Exist!" && !err.message.startsWith("Cannot read property")) {
                    this.Logger.error(err.message);
                    console.log(err);
                }
                return { err: 'Data not found', code: 404 };
            }
        } else if (this.DOCS_DATA[module]) {
            return this.DOCS_DATA[module];
        }

        return { err: 'Data not found', code: 404 };
    }
    getNavigation() {
        if (this.Settings.realtime_update == true || Object.getOwnPropertyNames(this.DOCS_NAV).length == 0) {
            //Update Data

            try {
               this.DOCS_NAV = JSON.parse(super.readFile(this.Settings.Data_Dir + "Navigation.json"));
            } catch (err) {
                this.Logger.error(err.message);
                console.log(err);
            }
        }
        
        return this.DOCS_NAV;
    }
}

module.exports.Docs = Docs;