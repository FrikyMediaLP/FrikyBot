const fs = require('fs');
const path = require('path');
const CONSTANTS = require('./../Util/CONSTANTS.js');
const CONFIGHANDLER = require('./../Util/ConfigHandler.js');

class PackageBase {
    constructor(package_details = {}, webappinteractor, twitchirc, twitchapi, logger) {
        //PRE-INIT
        this.Package_Details = {
            name: package_details.name || "UNKNOWN",
            description: package_details.description || "",
            picture: package_details.picture || null,
            api_requierements: package_details.api_requierements ||  {}
        };

        if (!this.getName() || this.getName() === "UNKNOWN") throw new Error("Package needs a name!");

        //LOGGER
        if (logger && logger && logger.identify != undefined && logger.identify() == "FrikyBotLogger") {
            logger.addSources({
                [this.getName()]: {
                    display: () => (" " + this.getName() + " ").inverse.yellow
                }
            });
            this.setLogger(logger[this.getName()]);
        } else {
            this.setLogger(logger);
        }

        //Config
        this.Config = new CONFIGHANDLER.Config('config', [], null, { export_dir: 'Packages/' + this.Package_Details['name'] + '/' });
        this.Config.AddSettingTemplates([
            { name: 'HTML_ROOT_NAME', type: 'string', default: this.Package_Details['name'] },
            { name: 'API_ROOT_NAME', type: 'string', default: this.Package_Details['name'] },
            { name: 'enabled', type: 'boolean', requiered: true, default: true }
        ]);
        this.Config.Load();
        this.Config.FillConfig();

        //INIT
        this.SETUP_COMPLETE = false;

        this.Package_Interconnects = [];
        this.Requested_Package_Interconnects = [];
        this.Allowed_Package_Interconnects = [];

        this.WebAppInteractor = webappinteractor;
        this.TwitchIRC = twitchirc;
        this.TwitchAPI = twitchapi;

        //WEBAPP
        this.USE_HTML_HOSTING = false;
        this.USE_API_HOSTING = false;
        this.RESTRICTED_HTML_HOSTING = null;
        this.HTML_NAVIGATION_ELEMENT = null;
        this.WEB_COOKIES = {
            LocalStorage: [],
            SessionStorage: [],
            Cookies: []
        };

        //TCP
        this.TCP_Clients = [];

        //STATUS
        this.DISPLAYABELS = [];
        this.CONTROLLABLES = [];
        this.LOGS = [];

        //Ready
        this.READY_REQUIREMENTS = [];
        this.addReadyRequirement(() => {
            return this.Config.ErrorCheck() === true;
        });

        //Setup
        this.Logger.info("Package Setup ... ");
    }
    
    /*
     * /////////////////////////////////////////////////
     *                 BASE FUNCTIONS
     * /////////////////////////////////////////////////
     */
    
    async Init(startparameters) {
        this.setStartparameters(startparameters);
        this.SETUP_COMPLETE = true;
        return Promise.resolve();
    }
    async PostInit() {
        for (let interconnect of this.Package_Interconnects) {
            interconnect.callback(this);
        }

        return Promise.resolve();
    }

    async enable() {
        if (this.isEnabled()) return Promise.resolve();

        this.setEnable(true);
        if (this.isEnabled() !== true) return Promise.reject(new Error('enable failed'));

        this.Logger.warn("Package enabled!");
        return Promise.resolve();
    }
    async disable() {
        if (!this.isEnabled()) return Promise.resolve();

        this.setEnable(false);
        if (this.isEnabled() !== false) return Promise.reject(new Error('disable failed'));

        this.Logger.warn("Package disabled!");
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
     *              CONFIG / SETTINGS
     * /////////////////////////////////////////////////
     */

    setStartparameters(parameters = {}) {

    }

    setEnable(state) {
        this.Config.UpdateSetting('enabled', state === true);
    }
    setLogger(loggerObject) {
        if (loggerObject && loggerObject.info && loggerObject.warn && loggerObject.error) {
            this.Logger = loggerObject;
        }
    }

    //Ready/Status
    addReadyRequirement(func) {
        if (func instanceof Function) this.READY_REQUIREMENTS.push(func);
    }
    removeReadyRequirement(index) {
        this.READY_REQUIREMENTS.splice(index, 1);
    }
    isReady() {
        for (let func of this.READY_REQUIREMENTS) {
            if (func instanceof Function && func() === false) return false;
        }

        return true;
    }
    
    /*
     * /////////////////////////////////////////////////
     *               PACKAGE INTERCONNECT
     * /////////////////////////////////////////////////
     */

    //SETUP
    allowPackageInterconnects(allowed_packages = []) {
        if (!(allowed_packages instanceof Array)) allowed_packages = [allowed_packages];

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
        let is_allowed = this.Allowed_Package_Interconnects.find(elt => elt === package_name || elt === 'all');
        
        if (is_allowed) {
            this.Package_Interconnects.push({ package_name, callback, description });
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
        
        this.WebAppInteractor.addFileRoute("/" + this.getHTMLROOT(), (req, res, next) => { if (this.isEnabled()) next(); else res.sendFile(path.resolve("public/NotFound.html")); }, (req, res, next) => {
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
        
        this.WebAppInteractor.addFileRoute("/" + this.getHTMLROOT(), (req, res, next) => { if (this.isEnabled()) next(); else res.sendFile(path.resolve("public/NotFound.html")); }, router);
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

    setAPIEndpoint(endpoint, callback, method) {
        this.USE_API_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");

        this.WebAppInteractor.addAPIEndpoint("/" + this.getAPIROOT() + endpoint, method,
            (req, res, next) => { if (this.isEnabled()) next(); else res.status(401).json({ err: 'Package Disabled!' }); },
            callback);
    }
    setAuthenticatedAPIEndpoint(endpoint, auth_method, callback, method = 'GET') {
        this.USE_API_HOSTING = true;
        if (!this.WebAppInteractor) throw new Error("WebApp-Reference is not set!");

        return this.WebAppInteractor.addAuthAPIEndpoint("/" + this.getAPIROOT() + endpoint, auth_method, method,
            (req, res, next) => { if (this.isEnabled()) next(); else res.status(401).json({ err: 'Package Disabled!' }); }, callback);
    }
    
    //WebApp Util
    setWebNavigation(data, categorie = "Packages", userlevel) {
        if (!userlevel) userlevel = this.RESTRICTED_HTML_HOSTING;
        this.HTML_NAVIGATION_ELEMENT = { data, categorie, userlevel };
    }
    getWebNavigation() {
        return this.HTML_NAVIGATION_ELEMENT;
    }
    setWebCookies(cookie_data = {}) {
        for (let cookie of cookie_data.LocalStorage || []) {
            this.addWebCookie('localstorage', cookie);
        }

        for (let cookie of cookie_data.SessionStorage || []) {
            this.addWebCookie('sessionstorage', cookie);
        }

        for (let cookie of cookie_data.Cookies || []) {
            this.addWebCookie('cookie', cookie);
        }
    }
    addWebCookie(type, cookie_data = {}) {
        cookie_data.origin = this.getName().toLowerCase();
        
        if (type === 'localstorage') {
            this.WEB_COOKIES.LocalStorage.push(cookie_data);
        } else if (type === 'sessionstorage') {
            this.WEB_COOKIES.SessionStorage.push(cookie_data);
        } else if (type === 'cookie') {
            this.WEB_COOKIES.Cookies.push(cookie_data);
        } else {
            return false;
        }
    }
    getWebCookies() {
        return this.WEB_COOKIES;
    }
    getWebSockets() {
        return this.WebAppInteractor.GetWebSockets("/" + this.getHTMLROOT());
    }

    /*
     * /////////////////////////////////////////////////
     *               TCP CONNECTIONS
     * /////////////////////////////////////////////////
     */

    useTCP(topic = this.getName(), callback = (ws, type, data) => true) {
        this.WebAppInteractor.AddTCPCallback(topic, (ws, type, data) => this.TCPMasterCallback(ws, type, data, callback));
    }
    TCPMasterCallback(ws, type, data, callback) {
        //Add to TCP List
        if (type === 'register') {
            this.TCP_Clients.push({ origin: data.origin, topic: data.topic, misc: data.misc, ws });
        } else if (type === 'terminated') {
            let idx = -1;
            this.TCP_Clients.find((elt, index) => {
                if (elt.ws === ws) {
                    idx = index;
                    return true;
                }
                return false;
            });

            if (idx >= 0) {
                this.TCP_Clients.splice(idx, 1);
            }
        }

        try {
            if (callback instanceof Function) callback(ws, type, data);
        } catch (err) {

        }
    }
    TCPMassSend(origin, topic, data, check_misc = (client) => this.TCPMiscEval(client, topic)) {
        if (typeof origin === 'string') origin = [origin];
        
        //Send Message to All Connected Clients at the given origin
        for (let client of this.TCP_Clients.filter(elt => origin.find(elt2 => elt2 === 'all' || elt.origin === elt2))) {

            //Skip Custom Topic and Misc Eval
            if (check_misc instanceof Function && !check_misc(client)) continue;
            
            //Send Data
            client.ws.send(topic + ":" + JSON.stringify(data));
        }
    }
    TCPMiscEval(client, topic) {
        return true;
    }

    TerminateTCPClients(reason = 'unknown') {
        for (let client of this.TCP_Clients) {
            client.ws.send("terminated:" + reason);
            client.ws.terminate();
        }

        this.TCP_Clients = [];
    }

    /*
     * /////////////////////////////////////////////////
     *                 CUSTOM DATA LOGS
     * /////////////////////////////////////////////////
     */

    addDisplayable(name, value) {
        this.DISPLAYABELS.push({ name, value });
    }
    addDisplayables(displayables = []) {
        for (let elt of displayables) {
            this.DISPLAYABELS.push({ name: elt.name, value: elt.value });
        }
    }
    removeDisplayable(name) {
        let index = -1;
        this.DISPLAYABELS.find((elt, idx) => {
            if (elt === name) {
                index = idx;
                return true;
            }
            return false;
        });
        if (index >= 0) {
            this.DISPLAYABELS.splice(index, 1);
        }
    }
    GetDisplayables() {
        let out = [];

        for (let dis of this.DISPLAYABELS) {
            if (dis.value instanceof Function) out.push({ name: dis.name, value: dis.value() });
            else out.push({ name: dis.name, value: dis.value });
        }

        return out;
    }
    
    addControllable(name, title, callback = (user) => 'unused') {
        if (this.CONTROLLABLES.find(elt => elt.name === name)) return 'already exists';
        this.CONTROLLABLES.push({ name, title, callback });
        return true;
    }
    addControllables(constrollables = []) {
        let ress = {};

        for (let controll of constrollables) {
            let res = this.addControllable(controll.name, controll.title, controll.callback);
            if (res !== true) return res[controll.name] = res;
        }

        return Object.getOwnPropertyNames(ress).length === 0 ? ress : true;
    }
    removeControllable(name) {
        let i = -1;
        this.CONTROLLABLES.find((elt, idx) => {
            if (elt.name === name) {
                i = idx;
                return true;
            }
            return false;
        });

        if (i < 0) return 'not found';
        this.CONTROLLABLES.splice(i, 1);
        return true;
    }
    async executeControllable(name, user) {
        let contr = this.CONTROLLABLES.find(elt => elt.name === name);
        if (!contr) return Promise.reject(new Error('not found'));
        return contr.callback(user);
    }
    GetControllables() {
        return this.CONTROLLABLES;
    }


    addLog(name, database, query) {
        this.LOGS.push({ name, database, query });
    }
    removeLog(name) {
        let index = -1;
        this.LOGS.find((elt, idx) => {
            if (elt === name) {
                index = idx;
                return true;
            }
            return false;
        });
        if (index >= 0) {
            this.LOGS.splice(index, 1);
        }
    }
    async GetLogs(pagination) {
        if (!pagination) pagination = this.GetPaginationString(10, 0, { timesorted: true });

        let out = {};
        for (let log of this.LOGS) {
            try {
                out[log.name] = await this.AccessFrikyDB(log.database, log.query || {}, pagination);
            } catch (err) {

            }
        }
        return Promise.resolve(out);
    }
    async GetLog(name, pagination) {
        let log = this.LOGS.find(elt => elt.name === name);
        if (!log) return Promise.reject(new Error('Log not found.'));

        if (!pagination) pagination = this.GetPaginationString(10, 0, { timesorted: true });
        return this.AccessFrikyDB(log.database, log.query || {}, pagination);
    }

    /*
     * /////////////////////////////////////////////////
     *                 GENERAL GETTERS
     * /////////////////////////////////////////////////
     */
    
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
            picture: this.Package_Details['picture'],
            api_requierements: this.Package_Details['api_requierements'],
            html: (this.USE_HTML_HOSTING ? this.getHTMLROOT() : undefined),
            html_navi: (this.isNaviEnabled ? this.isNaviEnabled() : undefined),
            api: (this.USE_API_HOSTING ? this.getAPIROOT() : undefined),
            restricted: this.RESTRICTED_HTML_HOSTING,
            displayables: this.GetDisplayables(),
            controllables: this.GetControllables(),
            ready: this.isReady()
        }
    }

    isEnabled() {
        return this.Config.GetConfig()['enabled'] === true;
    }
    GetConfig(copy = true) {
        if (copy) return this.Config.GetConfig();
        else return this.Config;
    }

    getNavigation() {
        return null;
    }
    getHTMLROOT() {
        return this.Config.GetConfig()['HTML_ROOT_NAME'];
    }
    getAPIROOT() {
        return this.Config.GetConfig()['API_ROOT_NAME'];
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
    HTMLFileExists(URL_PATH, origin = this.getMainPackageRoot() + this.getName() + "/html") {
        //Cut extra / at the end
        if (URL_PATH.charAt(URL_PATH.length - 1) == "/") URL_PATH = URL_PATH.substring(0, URL_PATH.length - 1);
        let pathRes = path.resolve(origin + URL_PATH);
        
        //ALREADY EXISTS
        if (URL_PATH != "" && fs.existsSync(pathRes) && fs.statSync(pathRes).isFile()) return pathRes;

        //Check CaseSensitive
        let steps = URL_PATH.split('/').filter(elt => elt !== "");
        let last = steps.pop() || '';
        let cur_path = origin;

        //Check Folder Path up to file
        for (let folder of steps) {
            let dirs = fs.readdirSync(path.resolve(cur_path));
            let match = dirs.find(dir => dir.toLowerCase() === folder.toLowerCase());
            if (!match) return "";
            cur_path += "/" + match;
        }

        //Final File found?
        let dirs = fs.readdirSync(cur_path);
        let match = dirs.find(dir => dir.toLowerCase() === last.toLowerCase());
        if (match && fs.statSync(path.resolve(cur_path + "/" + match)).isFile()) return path.resolve(cur_path + "/" + match);

        //Check File Endnings .html .js or .css
        let FILE_ENDINGS = ["index.html", "index.htm",".html", ".htm"];

        for (let ext of FILE_ENDINGS) {
            let Ematch = dirs.find(dir => dir.toLowerCase() === last.toLowerCase() + ext);
            if (Ematch) return path.resolve(cur_path + '/' + Ematch);
        }

        return "";
    }

    async AccessNeDB(datastore, query = {}, pagination) {
        if (!datastore) return Promise.resolve([]);

        if (pagination instanceof Object) pagination = this.GetPaginationString(pagination.first, pagination.cursor, pagination);

        return new Promise((resolve, reject) => {
            datastore.find(query, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    if (pagination) {
                        let pages = this.GetPaginationValues(pagination);
                        let first = 10;
                        let cursor = 0;
                        let opts = {};
                        
                        if (pages) {
                            first = pages[0] || 10;
                            cursor = pages[1] || 0;
                            opts = pages[2] || {};
                        }
                        
                        if (first > 0) opts.pagecount = Math.ceil(docs.length / first);

                        if (opts.timesorted) docs.sort((a, b) => {
                            if (a.time) return (-1) * (a.time - b.time);
                            else if (a.iat) return (-1) * (a.iat - b.iat);
                            else return 0;
                        });
                        
                        if (opts.customsort) docs.sort((a, b) => {
                            return (-1) * (a[opts.customsort] - b[opts.customsort]);
                        });

                        resolve({
                            data: docs.slice(first * cursor, first * (cursor + 1)),
                            pagination: this.GetPaginationString(first, Math.min(first * (cursor + 1), opts.pagecount), opts)
                        });
                    } else {
                        resolve(docs);
                    }
                }
            });
        });
    }
    async AccessFrikyDB(collection, query = {}, pagination) {
        if (!collection) return Promise.resolve([]);
        if (pagination instanceof Object) pagination = this.GetPaginationString(pagination.first, pagination.cursor, pagination);

        let collection_slice = [];

        try {
            collection_slice = await collection.find(query);
        } catch (err) {
            return Promise.reject(err);
        }

        if (pagination) {
            let pages = this.GetPaginationValues(pagination);
            let first = 10;
            let cursor = 0;
            let opts = {};

            if (pages) {
                first = pages[0] || 10;
                cursor = pages[1] || 0;
                opts = pages[2] || {};
            }

            if (first > 0) opts.pagecount = Math.ceil(collection_slice.length / first);

            if (opts.timesorted) collection_slice = collection_slice.sort((a, b) => {
                if (a.time) return (-1) * (a.time - b.time);
                else if (a.iat) return (-1) * (a.iat - b.iat);
                else return 0;
            });

            if (opts.customsort) collection_slice = collection_slice.sort((a, b) => {
                return (-1) * (a[opts.customsort] - b[opts.customsort]);
            });

            return Promise.resolve({
                data: collection_slice.slice(first * cursor, first * (cursor + 1)),
                pagination: this.GetPaginationString(first, cursor + 1, opts)
            });
        } else {
            return Promise.resolve(collection_slice);
        }
    }
    GetPaginationValues(pagination = "") {
        if (!pagination) return null;
        let out = [10, 0, {}];

        try {
            if (pagination.indexOf('A') >= 0 && pagination.indexOf('B') >= 0 && pagination.indexOf('C') >= 0) {
                out[0] = parseInt(pagination.substring(1, pagination.indexOf('B')));
                out[1] = parseInt(pagination.substring(pagination.indexOf('B') + 1, pagination.indexOf('C')));
            }

            if (pagination.indexOf('T') >= 0) out[2].timesorted = true;
            if (pagination.indexOf('CSS') >= 0 && pagination.indexOf('CSE') >= 0) {
                out[2].customsort = pagination.substring(pagination.indexOf('CSS') + 3, pagination.indexOf('CSE'));
            }
            if (pagination.indexOf('PS') >= 0 && pagination.indexOf('PE') >= 0) out[2].pagecount = parseInt(pagination.substring(pagination.indexOf('PS') + 2, pagination.indexOf('PE')));
        } catch (err) {
            return null;
        }

        return out;
    }
    GetPaginationString(first = 10, cursor = 0, options = {}) {
        let s = "A" + first + "B" + Math.max(0, Math.min(cursor, (options.pagecount === undefined ? (cursor + 1) : options.pagecount) - 1)) + "C";
        if (options.timesorted) s += "T";
        if (options.customsort) s += "CSS" + options.customsort + "CSE";
        if (options.pagecount !== undefined) s += "PS" + options.pagecount + "PE";
        return s;
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
    FillFormattedString(string = "", vars = {}) {
        let outstring = "";

        let i = 0;
        while (string.indexOf('{', i) >= 0 && string.indexOf('}', string.indexOf('{', i)) >= 0) {
            let varname = string.substring(string.indexOf('{', i) + 1, string.indexOf('}', string.indexOf('{', i)));

            outstring += string.substring(i, string.indexOf('{', i));
            outstring += vars[varname];

            i = string.indexOf('}', string.indexOf('{', i)) + 1;
        }
        outstring += string.substring(i);

        return outstring;
    }

    cloneJSON(json) {
        let new_json = {};

        for (let key in json) {
            if (json[key] instanceof Array) new_json[key] = this.cloneJSONArray(json[key]);
            else if (json[key] instanceof Function) new_json[key] = json[key];
            else if (json[key] instanceof Object) new_json[key] = this.cloneJSON(json[key]);
            else new_json[key] = json[key];
        }

        return new_json;
    }
    cloneJSONArray(arr) {
        let new_arr = [];

        for (let elt of arr) {
            if (elt instanceof Array) new_arr.push(this.cloneJSONArray(elt));
            else if (elt instanceof Function) new_arr.push(elt);
            else if (elt instanceof Object) new_arr.push(this.cloneJSON(elt));
            else new_arr.push(elt);
        }

        return new_arr;
    }
}

module.exports.PackageBase = PackageBase;