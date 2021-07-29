const fs = require('fs');
const path = require('path');

const SettingTypes = [
    {
        name: 'number', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'number' && !isNaN(x) ? true : 'type missmatch' },
            { name: 'min', check: (x, optionSet) => x >= parseInt(optionSet.min) || 'number too small' },
            { name: 'max', check: (x, optionSet) => x <= parseInt(optionSet.min) || 'number too big' },
            { name: 'range', check: (x, optionSet) => (x >= parseInt(optionSet.range.substring(0, optionSet.range.indexOf(':'))) && x <= parseInt(optionSet.range.substring(optionSet.range.indexOf(':') + 1))) || 'number out of bounds' },
            { name: 'selection', check: (x, optionSet) => optionSet.selection.find(elt => elt === x) !== undefined || 'number not in the selection' }
        ], default: 0
    }, {
        name: 'boolean', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'boolean' || 'type missmatch' }
        ], default: false
    }, {
        name: 'string', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'string' || 'type missmatch' },
            { name: 'minlength', check: (x, optionSet) => x.length >= optionSet.minlength || 'too short' }
        ], default: ''
    }, {
        name: 'object', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'object' || 'type missmatch' }
        ], default: {}
    }, {
        name: 'array', options: [
            { name: 'type', check: (x, optionSet) => x instanceof Array || 'type missmatch' },
            {
                name: 'selection', check: (x, optionSet) => {
                    if (x.length == 0 && optionSet.allow_empty) return true;
                    if (x.length == 0 && optionSet.selection.length > 0) return 'array is no subset of the selection';
                    for (let elt of x) if (optionSet.selection.find(el => el === elt) === undefined) return 'array is no subset of the selection';
                    return true;
                }
            },
            {
                name: 'typeArray', check: (x, optionSet) => {
                    for (let elt of x) {
                        if (optionSet.typeArray === 'array' && !(elt instanceof Array)) return 'array elements type missmatch';
                        else if (optionSet.typeArray !== 'array' && typeof elt !== optionSet.typeArray) return 'array elements type missmatch';
                    }

                    return true;
                }
            }
        ], default: [], compare: (a, b) => {
            if (!(a instanceof Array && b instanceof Array)) return false;
            if (a.length !== b.length) return false;
            for (let elt of a) if (b.find(el => el === elt) === undefined) return false;
            return true;
        }
    }, {
        name: 'config', options: [
            { name: 'type', check: (x, optionSet) => x instanceof Object || 'type missmatch' }
        ], default: {}
    }
];

class ConfigHandler{
    constructor(logger, settings = {}) {
        this.Settings = {
            export_dir: '',
            export_name: 'config'
        };

        //Copy Settings
        for (let set in settings) this.Settings[set] = settings[set];

        //LOGGER
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                Config: {
                    display: () => " Config ".inverse
                }
            });
            this.setLogger(logger.Config);
        } else {
            this.setLogger(logger);
        }
        
        this.Configs = [];
        this.Preloaded = {};
    }

    //Interface
    AddConfig(config) {
        if (!config instanceof Config) return ['Config type missmatch'];

        this.Configs.push(config);
        config.parent = this;
        config.Save = () => this.Save();
        config.Load = () => this.Load();
    }
    RemoveConfig(name) {
        let index;
        this.Configs.find((elt, idx) => { if (elt.GetName() === name) { index = idx; return true; } });
        if (index === undefined) return false;

        //Remove
        this.Configs[index].Save = this.Configs[index].DefaultSave;
        this.Configs[index].Load = this.Configs[index].DefaultLoad;
        this.Configs.splice(index, 1);
        return true;
    }
    
    //Configs
    GetConfigs() {
        return this.Configs;
    }
    GetTemplates() {
        let json = [];

        for (let cfg of this.Configs) {
            json.push({ name: cfg.GetName(), settings: cfg.GetTemplate(), options: cfg.GetOptions() });
        }

        return json;
    }
    GetConfigJSON() {
        let json = JSON.parse(JSON.stringify(this.Preloaded));

        for (let cfg of this.Configs) {
            json[cfg.GetName()] = cfg.GetConfig();
        }

        return json;
    }
    GetConfigJSONWithoutDefaults() {
        let copy = JSON.parse(JSON.stringify(this.Preloaded));

        for (let cfg of this.Configs) {
            copy[cfg.GetName()] = cfg.GetConfigWithoutDefaults();
        }

        return copy;
    }
    GetConfigJSONREDACTED() {
        let copy = JSON.parse(JSON.stringify(this.Preloaded));

        for (let cfg of this.Configs) {
            copy[cfg.GetName()] = cfg.GetConfigREDACTED();
        }

        return copy;
    }

    UpdateConfig(cfgJSON) {
        let errors = {};

        for (let key in cfgJSON) {
            let foundCFG = this.Configs.find(elt => elt.name === key);

            if (foundCFG) {
                errors[key] = foundCFG.UpdateConfig(cfgJSON[key], false, false);
            } else {
                errors[key] = ['Unknown Config', cfgJSON[key]];
            }
        }

        //Check for Errors
        if (this.CheckErrors(errors)) this.Save();

        return errors;
    }

    //Checking
    Check() {
        let errors = {};

        for (let cfg of this.Configs) {
            errors[cfg.GetName()] = cfg.check();
        }

        return errors;
    }
    Fill() {
        let errors = {};
        for (let cfg of this.Configs) {
            errors[cfg.GetName()] = cfg.FillConfig();
        }

        return errors;
    }
    CheckErrors(errors = {}) {
        for (let mdl in errors) {
            if (errors[mdl] !== true) return false;
        }
        return true;
    }

    //IO
    Save() {
        try {
            let s = this.GetConfigJSONWithoutDefaults();
            fs.writeFileSync(path.resolve(this.Settings.export_dir + this.Settings.export_name + '.json'), JSON.stringify(s, null, 4));
        } catch (err) {
            return [err.message];
        }
    }
    Load() {
        try {
            let s = fs.readFileSync(path.resolve(this.Settings.export_dir + this.Settings.export_name + '.json'));
            this.Preloaded = JSON.parse(s);
            return this.UpdateConfig(this.Preloaded);
        } catch (err) {
            return [err.message];
        }
    }

    //Util
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

class Config {
    constructor(name, template = [], options = {}, settings = {}, parentConfig) {
        this.name = name;
        this.Template = template;
        this.options = options;
        this.parentConfig = parentConfig;
        if (!options) options = {};

        this.Settings = {
            export_dir: null,
            export_name: 'config'
        };
        
        //Copy Settings
        for (let set in settings) this.Settings[set] = settings[set];

        //Init
        this.Config = options.preloaded || this.CreateBlankConfig();
        delete options.preloaded;

        //Cascaded Configs
        this.parent = null;
        this.children = [];
    }

    //Interface
    AddSettingTemplates(settings = []) {
        if (!(settings instanceof Array)) settings = [settings];    //convert to array
        for(let stg of settings) this.Template.push(stg);           //Add Array Elements to Templates
    }
    EditSettingTemplate(settingName, changes = {}) {
        if (!settingName) return false;

        let setting = this.Template.find(elt => elt.name === settingName);
        if (setting === undefined) return 'Setting not found';

        for (let change in changes) {
            setting[change] = changes[change];
        }
    }
    RemoveSettingTemplate(settingName) {
        if (!settingName) return false;
        
        let index;
        this.Template.find((elt, idx) => { if (elt.name === settingName) { index = idx; return true; } });
        if (index === undefined) return 'Setting not found';

        this.Template.splice(index, 1);
        return true;
    }

    AddChildConfig(cfgObj) {
        if (!(cfgObj instanceof Config)) return "This Config Type is no supported.";
        if (this.children.find(elt => elt.GetName() === cfgObj.GetName()) !== undefined) return "This Config already exists.";

        //Update Config Interface
        cfgObj.Save = () => this.UpdateSetting(cfgObj.GetName(), cfgObj.GetConfig(), true, true);
        
        //Add Config
        this.children.push(cfgObj);
        cfgObj.Load();
        cfgObj.FillConfig();
        return true;
    }
    RemoveChildConfig(name) {
        let idx = -1;

        //Find Child
        this.children.find((elt, eltIdx) => {
            if (elt.GetName() === name) {
                idx = eltIdx;
                return true;
            }
        });
        //Didnt Find
        if (idx < 0) return "This Config doesnt exists.";

        //Remove
        this.children[idx].Save = this.children[idx].DefaultSave;
        this.children[idx].Load = this.children[idx].DefaultLoad;
        this.children.splice(idx, 1);
        return true;
    }
    
    UpdateConfig(cfg = {}, skipOptions = false, autoSave = true) {
        let test_result = this.check(cfg, skipOptions);

        //Check Result
        if (test_result.length > 0) return test_result;

        //Update
        this.Config = cfg;
        if (autoSave) this.Save();

        return true;
    }
    UpdateSetting(stgName, updatedSetting, autoSave = true, skipOptions = false) {
        //Find Template
        let stgT = this.Template.find(elt => elt.name === stgName);
        if (stgT) {
            let result = this.checkType(stgT.type, updatedSetting, stgT, skipOptions);
            if (result !== true) return '"' + stgT.name + '" ' + result;
        }

        let copyCat = this.GetConfig();
        if (updatedSetting === undefined) delete copyCat[stgName];
        else copyCat[stgName] = updatedSetting;

        //Update
        this.Config = copyCat;
        if (autoSave) this.Save();

        return true;
    }
    
    ResetConfig(include_opt = false) {
        this.Config = this.CreateBlankConfig(include_opt);
    }
    FillConfig() {
        for (let templ of this.Template) {
            if (this.Config[templ.name] !== undefined) continue;
            this.UpdateSetting(templ.name, this.GetSettingDefault(templ.name));
        }
    }

    CreateBlankConfig(include_opt = false) {
        let newCfg = {};

        for (let stg of this.Template) {
            if (!include_opt && (stg.requiered !== true || stg.wip === true)) continue;
            newCfg[stg.name] = this.GetSettingDefault(stg.name);
        }

        return newCfg;
    }

    GetSettingDefault(name) {
        let template = this.Template.find(elt => elt.name === name);
        if (!template) template = {};

        if (template.default !== undefined) {
            return template.default;
        } else if (template.default_func !== undefined) {
            return template.default_func();
        } else if (template.type !== undefined) {
            let type = SettingTypes.find(elt => elt.name === template.type);
            if (type) return type.default; 
        }
        
        return null; 
    }

    //Checking
    check(config, skipOptions = false) {
        if (config === undefined) config = this.Config;

        let errors = [];

        for (let stgT of this.Template) {
            if (stgT.requiered !== true) continue;

            if (config[stgT.name] === undefined) {
                errors.push('"' + stgT.name + '" missing');
                continue;
            }

            //Check Type
            let result = this.checkType(stgT.type, config[stgT.name], stgT, skipOptions);
            if (result !== true) errors.push('"' + stgT.name + '" ' + (result instanceof Array ? result.join(", ") : result));
        }

        return errors;
    }
    checkType(name, value, options, skipOptions = false) {
        let TYPE = SettingTypes.find(elt => elt.name === name);

        //Skip unknown Types
        if (!TYPE) return true;
        
        //Check Type and return result on error
        let TYPEtype = TYPE.options.find(elt => elt.name === 'type');
        if (!TYPEtype) return true; //Skip unknown

        let result = TYPEtype.check(value, options);
        if (result !== true) return result;

        //Skip Options
        if (skipOptions) return true;

        if (name === 'config') {
            //Config Check
            let config = this.children.find(elt => elt.GetName() === options['config_name']);
            if (!config) return true;   //Skip unknown

            let results = config.check(value, skipOptions);
            return results.length === 0 ? true : results.join(', ');
        } else {
            //General Type
            //Copy and delete unneeded info
            options = JSON.parse(JSON.stringify(options));
            delete options['name'];
            delete options['type'];
            delete options['opt'];
            delete options['default'];
            
            //Check Variable Types
            for (let type in options) {
                //Find Type - skip unknowns
                TYPEtype = TYPE.options.find(elt => elt.name === type);
                if (!TYPEtype) continue;

                //Check and return result on error
                result = TYPEtype.check(value, options);
                if (result !== true) return result;
            }
        }

        return true;
    }
    ErrorCheck() {
        return this.CheckErrors(this.check());
    }
    CheckErrors(errors = {}) {
        for (let mdl in errors) {
            if (errors[mdl] !== true) return false;
        }
        return true;
    }
    
    //Config
    GetConfig() {
        return JSON.parse(JSON.stringify(this.Config));
    }
    GetConfigWithoutDefaults() {
        let copy = {};

        for (let stgName in this.Config) {
            let child = this.children.find(elt => elt.GetName() === stgName);
            if (child) {
                let settings = child.GetConfigWithoutDefaults();
                copy[stgName] = settings;
                continue;
            }


            //Template
            let template = this.Template.find(elt => elt.name === stgName);
            if (!template) template = {};

            //Setting Type
            let type = SettingTypes.find(elt => elt.name === template.type);
            if (!type) type = {};

            //Compare
            let same = false;
            if (type.compare !== undefined) {
                same = type.compare(this.GetSettingDefault(stgName), this.Config[stgName]);
            } else {
                same = this.GetSettingDefault(stgName) === this.Config[stgName];
            }
            
            //Add
            if (template.requiered === true || !same) {
                //Recursive Children
                if (template.type === 'config') {
                    let child = this.children.find(elt => elt.GetName() === stgName);
                    if (child) {
                        copy[stgName] = child.GetConfigWithoutDefaults();
                        continue;
                    }
                }

                copy[stgName] = this.Config[stgName];
            }
        }

        return copy;
    }
    GetConfigREDACTED() {
        let copy = {};

        for (let stgName in this.Config) {
            let tmplReq = this.Template.find(elt => elt.name === stgName);
            if (!tmplReq) tmplReq = {};

            if (tmplReq.private === true) {
                copy[stgName] = '************';
            } else {
                copy[stgName] = this.Config[stgName];
            }
        }

        return copy;
    }

    GetTemplate(copy = true, deep = false) {
        if (!copy) return this.Template;
        if (deep) {
            let temps = [];
            for (let cfgTmp of this.Template) {
                if (cfgTmp.type !== 'config') temps.push(cfgTmp);
                else {
                    let childData = JSON.parse(JSON.stringify(cfgTmp));
                    let child = this.children.find(elt => elt.GetName() === cfgTmp.name);
                    if (child) childData['childTemplates'] = child.GetTemplate(true, true);
                    temps.push(childData);
                }
            }
            return temps;
        }
        return this.Template.slice();
    }
    GetOptions(copy = true) {
        if (copy) return JSON.parse(JSON.stringify(this.options));
        else return this.options;
    }

    //IO
    DefaultSave() {
        if (this.Settings.export_dir == null || this.Settings.export_name == null) return [ 'No Ouput File set.' ];

        try {
            let s = this.GetConfigWithoutDefaults();
            fs.writeFileSync(path.resolve(this.Settings.export_dir + this.Settings.export_name + '.json'), JSON.stringify(s, null, 4));
        } catch (err) {
            return [err.message];
        }
    }
    Save() {
        return this.DefaultSave();
    }
    DefaultLoad() {
        if (this.Settings.export_dir == null || this.Settings.export_name == null) return ['No Ouput File set.'];
        
        try {
            let s = fs.readFileSync(path.resolve(this.Settings.export_dir + this.Settings.export_name + '.json'));
            this.Preloaded = JSON.parse(s);
            return this.UpdateConfig(this.Preloaded);
        } catch (err) {
            return [err.message];
        }
    }
    Load() {
        return this.DefaultLoad();
    }

    //Util
    GetName() {
        return this.name;
    }
}

module.exports.Handler = ConfigHandler;
module.exports.Config = Config;