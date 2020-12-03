﻿const fs = require('fs');
const path = require('path');
const CONSTANTS = require('./../Util/CONSTANTS.js');

const PACKAGE_SETTINGS_REQUIERED = {
    enabled: true
};

const PACKAGE_SETTINGS = {
    enabled: true,
    HTML_ROOT_NAME: "",
    API_ROOT_NAME: ""
};

class PackageBase {
    constructor(package_details = {}, webappinteractor, twitchirc, twitchapi, datacollection, logger) {
        //PRE-INIT
        this.Package_Details = {
            name: package_details.name ? package_details.name : "UNKNOWN",
            description: package_details.description ? package_details.description : ""
        };

        //LOGGER
        if (logger && logger.identify != undefined && logger.identify() == "FrikyBotLogger") {
            logger.addSources({
                [this.getName()]: {
                    display: () => (" " + this.getName() + " ").inverse.yellow
                }
            });
            this.setLogger(logger[this.getName()]);
        } else {
            this.setLogger(logger);
        }

        //INIT
        this.Package_Interconnects = [];
        this.Requested_Package_Interconnects = [];
        this.Allowed_Package_Interconnects = [];

        this.WebAppInteractor = webappinteractor;
        this.TwitchIRC = twitchirc;
        this.TwitchAPI = twitchapi;
        this.Datacollection = datacollection;

        this.Settings = {
            enabled: false
        };
        
        this.USE_HTML_HOSTING = false;
        this.USE_API_HOSTING = false;

        //Setup
        this.Logger.info("Package Setup ... ");
        this.loadSettings();
    }
    
    /*
     * /////////////////////////////////////////////////
     *                 BASE FUNCTIONS
     * /////////////////////////////////////////////////
     */
    
    async Init(startparameters) {
        this.setStartparameters(startparameters);
        return Promise.resolve();
    }
    async PostInit() {
        for (let interconnect in this.Package_Interconnects) {
            this.Package_Interconnects[interconnect](this);
        }

        return Promise.resolve();
    }

    async enable() {
        this.setEnable(true);
        return Promise.resolve();
    }
    async disable() {
        this.setEnable(false);
        return Promise.resolve();
    }

    async reload() {
        try {
            await this.Init();
            await this.PostInit();
            return Promise.resolve();
        } catch (err) {
            return  Promise.reject(err);
        }
    }
    
    /*
     * /////////////////////////////////////////////////
     *              CONGIG / SETTINGS
     * /////////////////////////////////////////////////
     */

    loadSettings() {
        let resolvedPath = path.resolve(CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + this.getName() + "/config.json");

        //SETUP CONFIG
        let settings_file = {};

        if (fs.existsSync(resolvedPath)) {
            //Is File?
            if (!fs.lstatSync(resolvedPath).isFile()) {
                this.Logger.error("CONFIG PATH IS NOT A FILE! Needs to be a .json File!");
                return false;
            } else {
                //Load Data
                try {
                    settings_file = JSON.parse(fs.readFileSync(resolvedPath));
                } catch (err) {
                    this.Logger.warn("FILE ERROR: " + err.message);
                    console.log(err);
                    return false;
                }
            }
        } else {
            this.Logger.warn("CONFIG File NOT found! Creating new from DEFAULT...");
        }

        //STD Settings CHECK
        let check = this.AddObjectElementsToOtherObject(settings_file, PACKAGE_SETTINGS_REQUIERED, msg => this.Logger.info("CONFIG UPDATE: " + msg));
        let update = check == true;

        //Custom Check
        check = this.CheckSettings(settings_file);
        update = update || check == true;

        if (update == true) {
            try {
                this.Logger.info("Updating Config File!");
                fs.writeFileSync(resolvedPath, JSON.stringify(settings_file, null, 4));
            } catch (err) {
                this.Logger.warn("FILE ERROR: " + err.message);
                console.log(err);
            }
        }

        this.changeSettings(settings_file);
    }
    CheckSettings(settings) {
        return true;
    }
    
    changeSettings(settings = {}) {
        //Update this.Settings
        this.AddObjectElementsToOtherObject(this.Settings, settings, undefined, true);

        //HTML ROOT Name
        if (this.Settings.HTML_ROOT_NAME) {
            this.getHTMLROOT = () => this.Settings.HTML_ROOT_NAME;
        } else {
            this.getHTMLROOT = () => this.getName();
        }

        //HTML ROOT Name
        if (this.Settings.API_ROOT_NAME) {
            this.getAPIROOT = () => this.Settings.API_ROOT_NAME;
        } else {
            this.getAPIROOT = () => this.getName();
        }

        //enabled
        if (this.Settings.enabled == true) {
            this.enable();
        } else {
            this.disable();
            this.Logger.warn("Package is DISABLED!");
        }
    }

    setStartparameters(parameters = {}) {

    }

    setEnable(enable) {
        this.isEnabled = () => enable;
    }
    setLogger(loggerObject) {
        if (loggerObject && loggerObject.info && loggerObject.warn && loggerObject.error) {
            this.Logger = loggerObject;
        }
    }
    
    /*
     * /////////////////////////////////////////////////
     *               PACKAGE INTERCONNECT
     * /////////////////////////////////////////////////
     */

    //SETUP
    allowPackageInterconnects(allowed_packages = []) {
        try {
            for (let allowed_package of allowed_packages) {
                this.Allowed_Package_Interconnects.push(allowed_package);
            }
        } catch (err) {
            this.Logger.error(err.message);
        }
    }

    //My Own Requests to other Packages
    GetPackageInterconnectRequests() {
        return this.Requested_Package_Interconnects;
    }
    addPackageInterconnectRequest(package_name, callback, description) {
        this.Requested_Package_Interconnects.push({
            package: package_name,
            callback: callback,
            description: description
        });
    }

    //Requests From Other Packages to me
    requestPackageInterconnect(package_name, callback, description) {
        let is_allowed = this.Allowed_Package_Interconnects.find(elt => elt.package_name === package_name);
        
        if (is_allowed || Object.getOwnPropertyNames(this.Allowed_Package_Interconnects).length == 0) {
            this.Package_Interconnects.push(package_name, callback, description);
            return true;
        }
        
        return false;
    }

    /*
     * /////////////////////////////////////////////////
     *                 HTML / API
     * /////////////////////////////////////////////////
     */

    //Express Routing
    useDefaultFileRouter() {
        this.USE_HTML_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");
        
        this.WebAppInteractor.addFileRoute("/" + this.getHTMLROOT(), (req, res, next) => { if (this.isEnabled()) next(); else res.sendFile(path.resolve("DATA/PAGES/PackageDisabled.html")); }, (req, res, next) => {
            let page = this.HTMLFileExists(req.url);
            //Check if File/Dir is Present
            if (page != "") {
                res.sendFile(page);
            } else {
                next();
            }
        });
    }
    setFileRouter(router) {
        this.USE_HTML_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");
        
        this.WebAppInteractor.addFileRoute("/" + this.getHTMLROOT(), (req, res, next) => { if (this.isEnabled()) next(); else res.sendFile(path.resolve("DATA/PAGES/PackageDisabled.html")); }, router);
    }
    setAPIRouter(router) {
        this.USE_API_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");

        this.WebAppInteractor.addAPIRoute("/" + this.getAPIROOT(),
            (req, res, next) => { if (this.isEnabled()) next(); else res.status(401).json({ err: 'Package Disabled!' }); },
            router);
    }
    setAuthenticatedAPIRouter(router, method) {
        this.USE_API_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");

        let response = this.WebAppInteractor.addAuthAPIRoute("/" + this.getAPIROOT(), method,
            (req, res, next) => { if (this.isEnabled()) next(); else res.status(401).json({ err: 'Package Disabled!' }); },
            router);
    }

    setAPIEndpoint(router, method) {
        this.USE_API_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");

        this.WebAppInteractor.addAPIEndpoint("/" + this.getAPIROOT(), method,
            (req, res, next) => { if (this.isEnabled()) next(); else res.status(401).json({ err: 'Package Disabled!' }); },
            router);
    }
    setAuthenticatedAPIEndpoint(endpoint, auth_method, callback, method = 'GET') {
        this.USE_API_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");
        
        return this.WebAppInteractor.addAuthAPIEndpoint("/" + this.getAPIROOT() + endpoint, auth_method, method,
            (req, res, next) => { if (this.isEnabled()) next(); else res.status(401).json({ err: 'Package Disabled!' }); }, callback);
    }
    
    //WebApp Util
    setWebNavigation(data) {
        if (typeof (data) != "object" || data.length != "undefinded") {
            this.getWebNavigation = () => data;
        }
    }
    setWebCookies(data) {
        if (typeof (data) != "object" || data.length != "undefinded") {
            this.getWebCookies = () => data;
        }
    }
    
    /*
     * /////////////////////////////////////////////////
     *                 GENERAL GETTERS
     * /////////////////////////////////////////////////
     */

    isEnabled() {
        return false;
    }
    getNavigation() {
        return null;
    }
    getHTMLROOT() {
        return this.getName();
    }
    getAPIROOT() {
        return this.getName();
    }
    getName() {
        return this.Package_Details.name;
    }
    getDescription() {
        return this.Package_Details.description;
    }
    getPackageDetails() {
        return {
            name: this.getName(),
            description: this.getDescription(),
            enabled: this.isEnabled(),
            html: (this.USE_HTML_HOSTING ? this.getHTMLROOT() : undefined),
            html_navi: (this.isNaviEnabled ? this.isNaviEnabled() : undefined),
            api: (this.USE_API_HOSTING ? this.getAPIROOT() : undefined)
        }
    }
    
    getWebNavigation() {
        return null;
    }
    getWebCookies() {
        return null;
    }

    getMainPackageRoot() {
        return CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT;
    }
    
    /*
     * /////////////////////////////////////////////////
     *                      UTIL
     * /////////////////////////////////////////////////
     */
    
    //File System
    writeFile(path, data) {
        return fs.writeFileSync(path, data);
    }
    readFile(path) {
        if (!fs.existsSync(path))
            throw new Error("404: File doesnt Exist!");
        
        return fs.readFileSync(path);
    }
    copyFile(file, dir2) {
        //gets file name and adds it to dir2
        let f = path.basename(file);
        let source = fs.createReadStream(file);
        let dest = fs.createWriteStream(path.resolve(dir2, f));

        source.pipe(dest);
        source.on('error', function (err) { console.log(err); });
    }
    getFilesFromDir(path, options = {}) {
        return fs.readdirSync(path, options);
    }
    HTMLFileExists(URL_PATH) {
        //Cut extra / at the end
        if (URL_PATH.charAt(URL_PATH.length - 1) == "/") URL_PATH = URL_PATH.substring(0, URL_PATH.length - 1);
        let pathRes = path.resolve(CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + this.getName() + "/html" + URL_PATH);
        
        //ALREADY EXISTS
        if (URL_PATH != "" && fs.existsSync(pathRes) && fs.statSync(pathRes).isFile())
            return pathRes;

        //Check File Endnings .html .js or .css
        let FILE_ENDINGS = ["/index.html", "/index.htm",".html", ".htm"];

        for (let ending of FILE_ENDINGS) {
            pathRes = path.resolve(CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + this.getName() + "/html" + URL_PATH + ending);
            if (fs.existsSync(pathRes) && fs.statSync(pathRes).isFile())
                return pathRes;
        }

        return "";
    }

    //Object/Array/... UTIL
    AddObjectElementsToOtherObject(into, from, logger = x => x, replaceMode = false) {
        if (!(into instanceof Object || from instanceof Object)) {
            return false;
        }

        let change = false;

        for (let key in from) {
            if (into[key] == undefined || (replaceMode && !(into[key] instanceof Object))) {
                logger(key + " added!");
                into[key] = from[key];
                change = true;
                continue;
            }
            if (into[key] instanceof Object)
                this.AddObjectElementsToOtherObject(into[key], from[key]) == true ? change = true : change = change;
        }

        return change;
    }
    HasObjectContents(object, contents) {
        if (!(object instanceof Object || contents instanceof Object)) {
            return object instanceof Object ? "object is not an Object!" : "contents is not an Object";
        }

        for (let key in contents) {
            if (object[key] == undefined) {
                return key + " is missing!";
            }
            
            if (typeof object[key] != typeof contents[key]) {
                return key + " is not a(n) " + typeof object[key] +"!";
            }
            
            if (object[key] instanceof Object) {
                let ans = this.HasObjectContents(object[key], contents[key]);
                if (ans instanceof String) {
                    return ans;
                } 
            }
        }

        return true;
    }

    checkForCompletion(source, template, required) {
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
    ReplaceObjectContents(object, path, value) {
        if (path == "") {
            return value;
        } else {
            let temp = object[path.split(".")[0]];

            if (!temp) {
                object[path.split(".")[0]] = value;
                temp = object[path.split(".")[0]];
            }

            if (path.split(".").length == 1) {
                object[path.split(".")[0]] = this.ReplaceObjectContents(temp, "", value);
            } else {
                object[path.split(".")[0]] = this.ReplaceObjectContents(temp, path.substring(path.indexOf(".") + 1), value);
            }

            return object;
        }
    }
    StringContains(string, array) {
        for (let element of array) {
            if (string.indexOf(element) != -1) {
                return true;
            }
        }
        return false;
    }
    arrayShiftUp(arr, n = 1) {
        let temp = [];

        for (let i = n; i < arr.length; i++) {
            temp.push(arr[i]);
        }

        return temp;
    }
    replaceAll(string, replace, wITH) {
        if (typeof string != "string")
            return string;

        while (string.indexOf(replace) >= 0) {

            string = string.substring(0, string.indexOf(replace)) + wITH + string.substring(string.indexOf(replace) + replace.length);
        }

        return string;
    }
}

module.exports.PackageBase = PackageBase;