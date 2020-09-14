const fs = require('fs');
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
    constructor(packagename = "", description = "", expressapp, twitchirc, twitchapi, datacollection, startparameters = {}, logger) {
        //PACKAGE UTILITY
        this.Package_Status = {
            Status: "Operational",
            errors: {
                fatal: {

                },
                outage: {

                }
            }
        };

        //LOGGER
        if (logger && logger.identify != undefined && logger.identify() == "FrikyBotLogger") {
            logger.addSources({
                [packagename]: {
                    display: () => (" " + packagename + " ").inverse.yellow
                }
            });
            this.setLogger(logger[packagename]);
        } else {
            this.setLogger(logger);
        }

        //INIT
        this.PackageName = packagename;
        this.Description = description;

        this.Package_Interconnects = {};
        this.Requested_Package_Interconnects = {};
        this.Allowed_Package_Interconnects = {};

        this.ExpressApp = expressapp;
        this.TwitchIRC = twitchirc;
        this.TwitchAPI = twitchapi;
        this.Datacollection = datacollection;

        this.Settings = {
            enabled: false
        };

        //MiniSet
        this.USE_HTML_HOSTING = false;
        this.USE_API_HOSTING = false;

        this.Logger.info("Package Setup ... ");
        this.loadSettings();
    }
    
    /*
     * /////////////////////////////////////////////////
     *                 BASE FUNCTIONS
     * /////////////////////////////////////////////////
     */
    
    async Init() {
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
        let resolvedPath = path.resolve(CONSTANTS.PACKAGES_INSTALL_ROOT + this.PackageName + "/config.json");

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
            this.getHTMLROOT = () => this.PackageName;
        }

        //HTML ROOT Name
        if (this.Settings.API_ROOT_NAME) {
            this.getAPIROOT = () => this.Settings.API_ROOT_NAME;
        } else {
            this.getAPIROOT = () => this.PackageName;
        }

        //enabled
        if (this.Settings.enabled == true) {
            this.enable();
        } else {
            this.disable();
            this.Logger.warn("Package is DISABLED!");
        }
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
     *             ERROR AND PACKAGE STATUS - BETA
     * /////////////////////////////////////////////////
     */

    getPackageStatus() {
        return this.Package_Status;
    }
    setPackageStatus(status) {
        if (CONSTANTS.Package_Status.find(elt => elt == status) != undefined) {
            this.Package_Status.Status = status;
        }
    }

    addFatalError(name, details) {
        //Package gets Disabled / needs User to restart/change stuff
        this.Package_Status.fatal[name] = details;
        this.disable();
    }
    resolveFatalError(name) {
        delete this.Package_Status.fatal[name];
    }

    addOutage(name, details) {
        //Package remains enabled / Feature is disabled
        this.Package_Status.outage[name] = details;
    }
    hasOutage(name) {
        return this.Package_Status.outage[name] != undefined;
    }
    resolveOutage(name) {
        delete this.Package_Status.outage[name];
    }

    /*
     * /////////////////////////////////////////////////
     *               PACKAGE INTERCONNECT
     * /////////////////////////////////////////////////
     */

    //SETUP
    allowPackageInterconnects(allowed = {}) {
        if (allowed instanceof Object) {
            this.Allowed_Package_Interconnects = allowed;
        } else {
            this.Allowed_Package_Interconnects = {};
        }
    }

    //My Own Requests to other Packages
    GetPackageInterconnectRequests() {
        return this.Requested_Package_Interconnects;
    }
    addPackageInterconnectRequest(package_name, callback) {
        this.Requested_Package_Interconnects[package_name] = callback;
    }

    //Requests From Other Packages to me
    requestPackageInterconnect(package_name, callback) {
        if (this.Allowed_Package_Interconnects[package_name] != undefined || Object.getOwnPropertyNames(this.Allowed_Package_Interconnects).length == 0) {
            return this.setPackageInterconnect(package_name, callback);
        }
        
        return false;
    }
    setPackageInterconnect(package_name, callback) {
        this.Package_Interconnects[package_name] = callback;
        return true;
    }
    removePackageInterconnect(package_name) {
        delete this.PackageInterconnects[package_name];
    }

    /*
     * /////////////////////////////////////////////////
     *                 HTML / API
     * /////////////////////////////////////////////////
     */

    //Express Routing
    useDefaultFileRouter() {
        this.USE_HTML_HOSTING = true;
        if (!this.ExpressApp) throw new Error("ExpressApp-Reference is not set!");

        this.ExpressApp.use("/" + this.getHTMLROOT(),
            (req, res, next) => { if (this.isEnabled()) next(); else res.sendFile(path.resolve("DATA/PAGES/PackageDisabled.html")); },
            (req, res, next) => {
                let page = this.HTMLFileExists(req.url);
                //Check if File/Dir is Present
                if (page != "") {
                    res.sendFile(page);
                } else {
                    next();
                }
            }
        );
    }
    setFileRouter(router) {
        this.USE_HTML_HOSTING = true;
        if (!this.ExpressApp) throw new Error("ExpressApp-Reference is not set!");
        
        this.ExpressApp.use("/" + this.getHTMLROOT(),
            (req, res, next) => { if (this.isEnabled()) next(); else res.sendFile(path.resolve("DATA/PAGES/PackageDisabled.html")); },
            router);
    }
    setAPIRouter(router) {
        this.USE_API_HOSTING = true;
        if (!this.ExpressApp) throw new Error("ExpressApp-Reference is not set!");

        this.ExpressApp.use("/" + this.getAPIROOT() + "/api",
            (req, res, next) => {
                if (this.isEnabled())
                    next(); 
                else 
                    res.sendFile(path.resolve("DATA/PAGES/PackageDisabled.html")); },
            router, (req, res, next) => {
                res.status(404).json({
                    status: CONSTANTS.STATUS_FAILED,
                    req: req.body,
                    err: "404 - API Endpoint not found"
                });
            });
    }

    //WebApp Util
    setHTMLNavigation(data) {
        if (typeof(data) != "object" || data.length != "undefinded") {
            this.isNaviEnabled = () => data;
        }
    }
    
    /*
     * /////////////////////////////////////////////////
     *                 GENERAL GETTERS
     * /////////////////////////////////////////////////
     */

    getNavigation() {
        return null;
    }
    getHTMLROOT() {
        return this.PackageName;
    }
    getAPIROOT() {
        return this.PackageName;
    }
    getName() {
        return this.PackageName;
    }
    getDescription() {
        return this.Description;
    }
    getPackageDetails() {
        return {
            description: this.getDescription(),
            html: (this.USE_HTML_HOSTING ? this.getHTMLROOT() : undefined)
        }
    }

    isEnabled() {
        return false;
    }
    isNaviEnabled() {
        return false;
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
        let pathRes = path.resolve(CONSTANTS.PACKAGES_INSTALL_ROOT + this.PackageName + "/html" + URL_PATH);
        
        //ALREADY EXISTS
        if (URL_PATH != "" && fs.existsSync(pathRes) && fs.statSync(pathRes).isFile())
            return pathRes;

        //Check File Endnings .html .js or .css
        let FILE_ENDINGS = ["/index.html", "/index.htm",".html", ".htm"];

        for (let ending of FILE_ENDINGS) {
            pathRes = path.resolve(CONSTANTS.PACKAGES_INSTALL_ROOT + this.PackageName + "/html" + URL_PATH + ending);
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