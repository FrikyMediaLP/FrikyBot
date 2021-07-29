const CONFIGHANDLER = require('./ConfigHandler.js');

class ModuleBase {
    constructor(details = {}, configJSON, logger) {
        //PRE-INIT
        this.Module_Details = {
            name: details.name || "UNKNOWN",
            description: details.description || "",
            picture: details.picture || null
        };

        if (!this.GetName() || this.GetName() === "UNKNOWN") throw new Error("Module needs a name!");
        
        //Config
        this.Config = new CONFIGHANDLER.Config(this.GetName(), [], { preloaded: configJSON });
        this.Config.AddSettingTemplates([
            { name: 'enabled', type: 'boolean', requiered: true, default: true }
        ]);
        this.Config.Load();
        this.Config.FillConfig();

        //LOGGER
        if (logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                [this.GetName()]: {
                    display: () => (" " + this.GetName() + " ").inverse.cyan
                }
            });
            this.setLogger(logger[this.GetName()]);
        } else {
            this.setLogger(logger);
        }

        //Ready
        this.READY_REQUIREMENTS = [];
        this.addReadyRequirement(() => {
            return this.Config.ErrorCheck() === true;
        });

        //Infos
        this.DISPLAYABELS = [];
        this.LOGS = [];
    }

    async Init(WebInter) {
        return Promise.resolve();
    }

    GetName() {
        return this.Module_Details.name;
    }
    GetDescription() {
        return this.Module_Details.description;
    }
    GetDetails() {
        return {
            name: this.GetName(),
            description: this.GetDescription(),
            picture: this.Module_Details.picture,
            displayables: this.GetDisplayables(),
            enabled: this.isEnabled(),
            ready: this.isReady()
        };
    }

    isEnabled() {
        return this.Config.GetConfig()['enabled'] !== false;
    }
    enable() {
        this.setEnabled(true);
    }
    disable() {
        this.setEnabled(false);
    }
    setEnabled(state) {
        return this.Config.UpdateSetting('enabled', state === true);
    }
    
    GetConfig(json = true) {
        if (json) return this.Config.GetConfig();
        return this.Config;
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
    
    //Custmizable Info
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

        return [];
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
    async GetLogs(pagination = "T") {
        let out = {};
        for (let log of this.LOGS) {
            try {
                out[log.name] = await this.AccessNeDB(log.database, log.query || {}, pagination);
            } catch (err) {

            }
        }
        return Promise.resolve(out);
    }
    async GetLog(name, pagination = "T") {
        let log = this.LOGS.find(elt => elt.name === name);
        if (!log) return Promise.reject(new Error('Log not found.'));
        return this.AccessNeDB(log.database, log.query || {}, pagination);
    }
    
    //Logger Interface
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

    //Util
    replaceAll(string, replace, wITH) {
        if (typeof string != "string")
            return string;

        while (string.indexOf(replace) >= 0) {

            string = string.substring(0, string.indexOf(replace)) + wITH + string.substring(string.indexOf(replace) + replace.length);
        }

        return string;
    }
    async AccessNeDB(datastore, query = {}, pagination) {
        if (!datastore) return Promise.resolve([]);
        
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
                        
                        resolve({
                            data: docs.slice(first * cursor, first * (cursor + 1)),
                            pagination: this.GetPaginationString(first, cursor + 1, opts)
                        });
                    } else {
                        resolve(docs);
                    }
                }
            });
        });
    }
    GetPaginationValues(pagination = "") {
        if (!pagination) return null;
        let out = [10, 0, {}];

        try {
            if (pagination.indexOf('A') >= 0 && pagination.indexOf('B') >= 0 && pagination.indexOf('C') >= 0) {
                out[0] = parseInt(pagination.substring(1, pagination.indexOf('B')));
                out[1] = parseInt(pagination.substring(pagination.indexOf('B'), pagination.indexOf('C')));
            }

            if (pagination.indexOf('T') >= 0) out[2].timesorted = true;
            if (pagination.indexOf('PS') >= 0 && pagination.indexOf('PE') >= 0) out[2].pagecount = parseInt(pagination.substring(pagination.indexOf('PS'), pagination.indexOf('PE')));
        } catch (err) {
            return null;
        }

        return out;
    }
    GetPaginationString(first = 10, cursor = 0, options = {}) {
        let s = "A" + first + "B" + cursor + "C";
        if (options.timesorted) s += "T";
        if (options.pagecount !== undefined) s += "PS" + options.pagecount + "PE";
        return s;
    }
}

module.exports = ModuleBase;