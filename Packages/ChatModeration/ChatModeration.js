const CONSTANTS = require('./../../Util/CONSTANTS.js');
const CONFIGHANDLER = require('./../../Util/ConfigHandler.js');
const TWITCHIRC = require('./../../Modules/TwitchIRC.js');

const BTTV = require('./../../3rdParty/BTTV.js');
const FFZ = require('./../../3rdParty/FFZ.js');

const express = require('express');
const fs = require('fs');
const PATH = require('path');
const Datastore = require('nedb');

let COMMANDHANDLER;

const PACKAGE_DETAILS = {
    name: "ChatModeration",
    description: "Chat Moderation Filters checking Chat Messages for Spam, Caps, Bad Words etc.",
    picture: "/images/icons/user-secret-solid.svg"
};

const PUNISHMENT = {
    WARNING: "WARNING",
    DELETE: "DELETE",
    TIMEOUT: "TIMEOUT",
    BAN: "BAN"
}

class ChatModeration extends require('./../../Util/PackageBase.js').PackageBase {
    constructor(webappinteractor, twitchirc, twitchapi, logger) {
        super(PACKAGE_DETAILS, webappinteractor, twitchirc, twitchapi, logger);
        
        this.Config.AddSettingTemplates([
            { name: 'debug', type: 'boolean', default: false },
            { name: 'Log_Dir', type: 'string', default: 'Logs/' + PACKAGE_DETAILS.name + '/' },
            { name: 'disable_Chat_Commands', type: 'boolean', default: false }
        ]);
        this.Config.Load();
        this.Config.FillConfig();

        this.RESTRICTED_HTML_HOSTING = 'moderator';
    }

    async Init(startparameters) {
        if (!this.isEnabled()) return Promise.resolve();
        let cfg = this.Config.GetConfig();

        //Static Information
        this.LATEST_STREAM_DATA = null;
        this.next_stream_check = 0;

        //Permitted
        this.Permitted = {};

        //Setup Filter
        this.Filters = [
            new WordFilter(this, this.TwitchIRC, this.TwitchAPI, this.Logger),
            new SpamFilter(this, this.TwitchIRC, this.TwitchAPI, this.Logger),
            new LinkFilter(this, this.TwitchIRC, this.TwitchAPI, this.Logger)
        ];

        //Logs
        this.PUNISHMENT_LOG = new Datastore({ filename: PATH.resolve(cfg.Log_Dir + 'API_Logs.db'), autoload: true });
        this.addLog('Punishment Issues', this.PUNISHMENT_LOG);
        
        //Twitch Chat Listener
        if (this.TwitchIRC) this.TwitchIRC.on('chat', (channel, userstate, message, self) => this.MessageEventHandler(channel, userstate, message, self));

        //API ENDPOINTS
        let Filter_Settings_Router = express.Router();
        Filter_Settings_Router.route('/filters/settings')
            .get(async (req, res) => {
                let data = {};
                
                for (let filter of this.Filters) {
                    try {
                        data[filter.GetName()] = await filter.GetSettings();
                    } catch (err) {

                    }
                }
                res.json(data);
                return Promise.resolve();
            })
            .put(async (req, res) => {
                const name = req.body['name'];

                let filter = this.Filters.find(elt => name === elt.GetName());

                try {
                    await filter.ChangeSetting(req, res);
                    res.json({ updated_settings: await filter.GetSettings() });
                } catch (err) {
                    res.json({ err: err.message });
                }
                
                return Promise.resolve();
            });
        this.setAuthenticatedAPIRouter(Filter_Settings_Router, { user_level: 'moderator' });

        //STATIC FILE ROUTE
        this.useDefaultFileRouter();
        
        //PACKAGE INTERCONNECT - Adding Commands
        if (cfg.disable_Chat_Commands != true) {
            
            try {
                COMMANDHANDLER = require('./../CommandHandler/CommandHandler.js');
                this.addPackageInterconnectRequest("CommandHandler", (CommandHandlerObj) => {
                    CommandHandlerObj.addHardcodedCommands("!ChatModeration", new COMMANDHANDLER.HCCommand("!ChatModeration", (userMessageObj, parameters) => this.Chat_Command_ChatModeration(userMessageObj, parameters),
                        { description: '<p>Set/Change/Enable/Disable/... Chat Moderation Filters using the Twitch Chat.</p>' }));
                    CommandHandlerObj.addHardcodedCommands("!permit", new COMMANDHANDLER.HCCommand("!permit", (userMessageObj, parameters) => this.Chat_Command_permit(userMessageObj, parameters),
                        { description: '<p>Permits a User to post any Message otherwise restricted by the FrikyBot ChatModeration Filters! <b>(this doesn´t stop AutoMod or other Twitch Intern Settings)</b></p>' }));
                }, "Add Chat Commands to setup Chat Moderation Features.");
            } catch (err) {
                if (err.message.startsWith('Cannot find module')) this.Logger.warn("Command Handler not Found! ChatModeration Commands not available!");
                else this.Logger.error(err.message);
            }
        }

        return this.reload();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));
        
        try {
            for (let filter of this.Filters) {
                this.Logger.info("Reloading " + filter.GetName() + " ...");
                await filter.Init();
            }
        } catch (err) {
            this.Logger.error(err.message);
        }

        try {
            this.CheckLiveStatus();
        } catch (err) {

        }

        if (this.LATEST_STREAM_DATA) this.Logger.warn("Stream is Live! Chat Moderation Active!");

        this.Logger.info("ChatModeration (Re)Loaded!");
        return Promise.resolve();
    }
    async CheckLiveStatus(channel) {
        try {
            let response = await this.TwitchAPI.GetStreams({ user_login: channel || this.TwitchIRC.getChannel(true) });
            if (response.data.length > 0) this.LATEST_STREAM_DATA = response.data[0];
            else this.LATEST_STREAM_DATA = null;
        } catch (err) {
            this.LATEST_STREAM_DATA = null;
            return Promise.reject(err);
        }

        this.next_stream_check = Date.now() + 5*60*1000;        //Check every 5 min at max
        return Promise.resolve();
    }
    
    //Chat Moderation - Filters
    async MessageEventHandler(channel, userstate, message, self) {
        if (!this.isEnabled()) return Promise.resolve();

        //Dont Check Bot Messages
        if (self) return Promise.resolve();
        
        //SKIP PERMITTED
        this.updatePermitList();
        if (this.checkPermit[userstate.username]) return Promise.resolve();

        let cfg = this.Config.GetConfig();
        let msgObj = new TWITCHIRC.Message(channel, userstate, message);

        //Skip Moderators and up
        if (msgObj.matchUserlevel(CONSTANTS.UserLevel.moderator)) return Promise.resolve();
        
        //SKIP WHEN IN DEBUG
        if (cfg.debug !== true && this.next_stream_check < Date.now()) {
            //Skip when Streamer is Offline
            try {
                await this.CheckLiveStatus(channel);
                if (!this.LATEST_STREAM_DATA) return Promise.resolve();
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        //Check Filter
        for (let filter of this.Filters) {
            try {
                let issue = await filter.CheckMessage(msgObj, this.LATEST_STREAM_DATA);
                if (typeof issue == "object") {
                    await this.executePunishment(msgObj, issue);
                    this.Logger.warn("Chat Alert -> " + issue.reason + " -> Punishment: " + issue.punishment + (issue.punishment_length ? (" LENGTH: " + issue.punishment_length) : ""));
                    return Promise.resolve();
                }
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        return Promise.resolve();
    }
    async executePunishment(msgObj, issue) {
        //Logs
        if (this.PUNISHMENT_LOG) {
            this.PUNISHMENT_LOG.insert({
                issue: issue,
                message_object: channel,
                time: Date.now()
            });
        }

        //Execute
        try {
            if (issue.punishment == PUNISHMENT.DELETE) {
                await this.TwitchIRC.deleteMessage(msgObj.getID());
            } else if (issue.punishment == PUNISHMENT.TIMEOUT) {
                await this.TwitchIRC.timeout(msgObj.getUsername(), issue.punishment_length || 10, issue.reason);
            } else if (issue.punishment == PUNISHMENT.BAN) {
                await this.TwitchIRC.ban(msgObj.getUsername(), issue.reason);
            }

            await this.sendResponse(issue.message, msgObj);
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async sendResponse(codedString, msgObj) {
        while (codedString.indexOf("{user}") >= 0) {
            codedString = codedString.substring(0, codedString.indexOf("{user}")) + msgObj.getDisplayName() + codedString.substring(codedString.indexOf("{user}") + 6);
        }
        return this.TwitchIRC.say(codedString);
    }

    updatePermitList() {
        for (let user in this.Permitted) {
            if (this.Permitted[user] < Date.now()) delete this.Permitted[user];
        }
    }
    checkPermit(username) {
        return this.Permitted[username] > Date.now();
    }
    permitUser(username) {
        this.Permitted[username] = Date.now() + (1000 * 60);
    }

    //Commands
    async Chat_Command_ChatModeration(userMessageObj, parameters) {
        //Get ChatModeration Status
        if (parameters.length == 1) {
            try {
                let output = "";

                if (this.isEnabled()) {
                    output = "Current Chat Moderation Filters: ";

                    for (let filter of this.Filters) {
                        if (filter.isEnabled())
                            output += filter.GetName() + ", "
                    }

                    if (output == "Current Chat Moderation Filters: ")
                        output += "NONE";
                    else
                        output = output.substring(0, output.lastIndexOf(","));
                } else {
                    output = "Chat Moderation is currently disabled!";
                }
                
                await this.TwitchIRC.say(output);
                return Promise.resolve();
            } catch (err) {
                console.log(err);
            }
        }

        //Chat Moderation Settings - Mod Status needed
        if (parameters.length == 2 && userMessageObj.matchUserlevel(CONSTANTS.UserLevel.moderator)) {
            //Settings
            if (parameters[1].toLowerCase() == "disable") {
                try {
                    await this.disable();
                    await this.TwitchIRC.say("Chat Moderation is now DISABLED!");
                    return Promise.resolve();
                } catch (err) {
                    console.log(err);
                }
            }
        }

        //Chat Moderation Filter
        if (parameters.length >= 3 && parameters[1].toLowerCase() == "filter" && this.Filters[parameters[2]] != undefined) {
            //Print Status
            if (parameters.length == 3) {
                this.TwitchIRC.saySync("Chat Moderation Filter '" + this.Filters[parameters[2]].GetName() + "' is currently " + (this.Filters[parameters[2]].isEnabled() ? "ENABLED" : "DISABLED") + "!");
                return Promise.resolve();
            }

            //Settings need Mod Status
            if (!userMessageObj.matchUserlevel(CONSTANTS.UserLevel.moderator)) {
                return Promise.resolve();
            }

            //Settings
            if (parameters[3].toLowerCase() == "enable") {
                try {
                    await this.Filters[parameters[2]].enable();
                    await this.TwitchIRC.say("Filter '" + this.Filters[parameters[2]].GetName() + "' is now ENABLED!");
                    return Promise.resolve();
                } catch (err) {
                    console.log(err);
                }
            } else if (parameters[3].toLowerCase() == "disable") {
                try {
                    await this.Filters[parameters[2]].disable();
                    await this.TwitchIRC.say("Filter '" + this.Filters[parameters[2]].GetName() + "' is now DISABLED!");
                    return Promise.resolve();
                } catch (err) {
                    console.log(err);
                }
            }
        }
        
        return Promise.resolve();
    }
    async Chat_Command_permit(userMessageObj, parameters) {
        if (parameters.length > 1 && userMessageObj.matchUserlevel(CONSTANTS.UserLevel.moderator)) {
            try {
                this.permitUser(parameters[1].toLowerCase());
                await this.TwitchIRC.say("Permitted: " + parameters[1] + "! No Filters will be applied for the next 60seconds!");
            } catch (err) {
                console.log(err);
            }
        }
        return Promise.resolve();
    }
}

class Filter {
    constructor(name, ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        this.name = name;
        this.ChatModeration = ChatModeration;

        //Config
        this.Config = new CONFIGHANDLER.Config(this.GetName(), [], { preloaded: ChatModeration.Config.GetConfig()[name] });
        this.Config.AddSettingTemplates([
            { name: 'enabled', type: 'boolean', requiered: true, default: true },
            { name: 'File_Dir', type: 'string', default: CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + "ChatModeration/" + this.GetName() + "/" },
        ]);
        ChatModeration.Config.AddChildConfig(this.Config);
        this.Config.Load();
        this.Config.FillConfig();
        
        this.TwitchIRC = TwitchIRC;
        this.TwitchAPI = TwitchAPI;
        this.Logger = Logger;
        
        //Ready
        this.READY_REQUIREMENTS = [];
        this.addReadyRequirement(() => {
            return this.Config.ErrorCheck() === true;
        });
    }

    async CheckMessage(msgObj, streamData) {
        return Promise.resolve();
    }
    async Init() {
        return this.reload();
    }
    async reload() {
        return Promise.resolve();
    }
    
    GetName() {
        return this.name;
    }
    async GetSettings() {
        return Promise.resolve({});
    }
    async ChangeSetting(req, res) {
        return true;
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
    isEnabled() {
        return this.Config.GetConfig()['enabled'] !== false;
    }
    
    async CheckOneDBSearch(db, querry) {
        return new Promise((resolve, reject) => {
            db.find(querry, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    for (let doc of docs) delete doc['_id'];
                    resolve(docs);
                }
            });
        });
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

}

//Word Filter
class WordFilter extends Filter {
    constructor(ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        super("Word Filter", ChatModeration, TwitchIRC, TwitchAPI, Logger);

        //Config
        this.Config.AddSettingTemplates([
            { name: 'Blacklist_File', type: 'string', default: "Blacklist.db" },
            { name: 'message', type: 'string', default: "{user} - a word u used is on the Blacklist!" }
        ]);
        this.Config.Load();
        this.Config.FillConfig();
        
        //Ready
        this.addReadyRequirement(() => {
            let cfg = this.Config.GetConfig();
            
            if (!fs.existsSync(PATH.resolve(cfg['File_Dir']))) {
                try {
                    fs.mkdirSync(PATH.resolve(cfg['File_Dir']));
                } catch (err) {
                    this.Logger.error("Corrupted Installation: Word Filter Folder couldnt be created!");
                    return false;
                }
            }

            if (!this.Blacklist) return false;
            
            return true;
        });
    }

    //SETUP
    async Init() {
        let cfg = this.Config.GetConfig();

        if (!fs.existsSync(PATH.resolve(cfg['File_Dir']))) {
            try {
                fs.mkdirSync(PATH.resolve(cfg['File_Dir']));
            } catch (err) {
                this.Logger.warn("Corrupted Installation: Word Filter Folder couldnt be created!");
                this.disable();
            }
        }

        return this.reload();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Filter is disabled!"));
        let cfg = this.Config.GetConfig();
        
        if(!this.Blacklist)
            this.Blacklist = new Datastore({ filename: PATH.resolve(cfg['File_Dir'] + cfg['Blacklist_File']), autoload: true });
        
        return Promise.resolve();
    }
    
    async GetSettings() {
        let cfg = this.Config.GetConfig();

        let data = {
            message: cfg['message'],
            enabled: this.isEnabled(),
            ready: this.isReady()
        };

        try {
            data['Blacklist'] = await this.CheckOneDBSearch(this.Blacklist, {});
        } catch (err) {

        }

        return Promise.resolve(data);
    }
    async ChangeSetting(req, res) {
        const action = req.body['action'];

        try {
            if (action === 'add_word') {
                await this.addWord(req.body['word'], req.body['casesensitive'], req.body['in_word_use'], req.body['block_patterns'], req.body['ignore_emotes'], req.body['emote_only'], req.body['include_BTTV'], req.body['include_FFZ'], (res.locals.user || {}).preferred_username);
            } else if (action === 'remove_word') {
                await this.removeWord(req.body['word']);
            } else if (action === 'clear') {
                await this.clearBlacklist();
            } else if (action === 'enable') {
                if (req.body['value'] === true) this.enable();
                else if (req.body['value'] === false) this.disable();
            } else if (action === 'message') {
                this.Config.UpdateSetting('message', req.body['value']);
            } else {
                return Promise.reject(new Error('Action not found.'));
            }
        } catch (err) {
            return Promise.reject(err);
        }
        return Promise.resolve();
    }

    //Filter
    async CheckMessage(msgObj, streamData){
        if (!this.isEnabled() || !this.isReady()) return Promise.resolve();

        let blacklist = [];
        let cfg = this.Config.GetConfig();

        try {
            blacklist = await this.CheckOneDBSearch(this.Blacklist, {});
        } catch (err) {

        }

        //EXCLUDE EMOTES IF NOT ALLOWED / EMOTES ONLY / ONLY BTTV / FFZ EMOTES
        let words = msgObj.getMessage().split(" ");
        let TTV_emotes = {};
        let BTTV_emotes = {};
        let FFZ_emotes = {};

        try {
            words = (await msgObj.getMessageWithoutEmotes(false, false)).split(" ");
            TTV_emotes = await msgObj.getEmotes();
            BTTV_emotes = await msgObj.getEmotes(true);
            FFZ_emotes = await msgObj.getEmotes(false, true);
        } catch (err) {

        }
        
        //Is Blacklisted?
        try {
            for (let bl_word of blacklist) {
                for (let word of words) {
                    if (!word) continue;

                    //Check Emotes
                    if (!bl_word.ignore_emotes) {
                        //TTV
                        for (let emote in TTV_emotes) {
                            let emote_start = TTV_emotes[emote][0].split('-')[0];
                            let emote_end = TTV_emotes[emote][0].split('-')[1]
                            let emote_name = msgObj.getMessage().substring(emote_start, emote_end + 1);

                            if (emote_name === bl_word.word || (!bl_word.in_word_use && emote_name.indexOf(bl_word.word) >= 0) || (bl_word.block_patterns && emote_name.indexOf(bl_word.word) !== emote_name.lastIndexOf(bl_word.word))) {
                                return Promise.resolve({ msgObj, message: cfg.message, punishment: PUNISHMENT.DELETE, reason: "Used a word on the Blacklist", exact_reason: bl_word.word });
                            }
                        }

                        //BTTV
                        if (bl_word.include_BTTV) {
                            for (let emote_name in BTTV_emotes) {
                                if (!isNaN(emote_name)) continue;
                                if (emote_name === bl_word.word || (!bl_word.in_word_use && emote_name.indexOf(bl_word.word) >= 0) || (bl_word.block_patterns && emote_name.indexOf(bl_word.word) !== emote_name.lastIndexOf(bl_word.word))) {
                                    return Promise.resolve({ msgObj, message: cfg.message, punishment: PUNISHMENT.DELETE, reason: "Used a word on the Blacklist", exact_reason: bl_word.word });
                                }
                            }
                        }

                        //FFZ
                        if (bl_word.include_FFZ) {
                            for (let emote_name in FFZ_emotes) {
                                if (!isNaN(emote_name)) continue;
                                if (emote_name === bl_word.word || (!bl_word.in_word_use && emote_name.indexOf(bl_word.word) >= 0) || (bl_word.block_patterns && emote_name.indexOf(bl_word.word) !== emote_name.lastIndexOf(bl_word.word))) {
                                    return Promise.resolve({ msgObj, message: cfg.message, punishment: PUNISHMENT.DELETE, reason: "Used a word on the Blacklist", exact_reason: bl_word.word });
                                }
                            }
                        }
                    }

                    if (bl_word.emote_only) continue;

                    //Check Words
                    if (bl_word.casesensitive === false) {
                        bl_word.word = bl_word.word.toLowerCase();
                        word = word.toLowerCase();
                    }

                    if (word === bl_word.word || (!bl_word.in_word_use && word.indexOf(bl_word.word) >= 0) || (bl_word.block_patterns && word.indexOf(bl_word.word) !== word.lastIndexOf(bl_word.word))) {
                        return Promise.resolve({ msgObj, message: cfg.message, punishment: PUNISHMENT.DELETE, reason: "Used a word on the Blacklist", exact_reason: bl_word.word });
                    }
                }
            }
        } catch (err) {
            this.Logger.error(err.message);
        }

        return Promise.resolve();
    }

    //Blacklist
    async addWord(word, casesensitive = true, in_word_use = true, block_patterns = true, ignore_emotes = true, emote_only = false, include_BTTV = false, include_FFZ = false, username) {
        try {
            let words = await this.CheckOneDBSearch(this.Blacklist, { word });
            if (words.length > 0) return Promise.reject(new Error('Word allready on the Blacklist!'));
        } catch (err) {
            return Promise.reject(err);
        }
        
        return new Promise((resolve, reject) => {
            this.Blacklist.insert({ word: word, blocked_by: username || 'UNKNOWN', blocked_at: Date.now(), casesensitive, in_word_use, block_patterns, ignore_emotes, emote_only, include_BTTV, include_FFZ }, function (err, newDocs) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
    async removeWord(word) {
        return new Promise((resolve, reject) => {
            this.Blacklist.remove({ word: word }, {}, function (err, numRemoved) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
    async clearBlacklist() {
        return new Promise((resolve, reject) => {
            this.Blacklist.remove({}, { multi: true }, function (err, numRemoved) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
}

//Spam Filter
class SpamFilter extends Filter {
    constructor(ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        super("Spam Filter", ChatModeration, TwitchIRC, TwitchAPI, Logger);
        
        //Caps Config
        this.Caps_Config = new CONFIGHANDLER.Config('Caps', [], { preloaded: this.Config.GetConfig()['Caps'] });
        this.Caps_Config.AddSettingTemplates([
            { name: 'enabled', type: 'boolean', requiered: true, default: true },
            { name: 'Caps_Limit', type: 'number', default: 20 },
            { name: 'Caps_Limit_%', type: 'number', default: 80 },
            { name: 'include_TTV_Emotes', type: 'boolean', default: true },
            { name: 'include_BTTV_Emotes', type: 'boolean', default: true },
            { name: 'include_FFZ_Emotes', type: 'boolean', default: true },
            { name: 'message', type: 'string', default: "{user} - Hey hey, stop shouting D:" }
        ]);
        this.Config.AddChildConfig(this.Caps_Config);

        //Emotes Config
        this.Emotes_Config = new CONFIGHANDLER.Config('Emotes', [], { preloaded: this.Config.GetConfig()['Emotes'] });
        this.Emotes_Config.AddSettingTemplates([
            { name: 'enabled', type: 'boolean', requiered: true, default: false },
            { name: 'include_TTV_Emotes', type: 'boolean', default: true },
            { name: 'TTV_Emote_Limit', type: 'number', default: 6 },
            { name: 'include_BTTV_Emotes', type: 'boolean', default: false },
            { name: 'BTTV_Emote_Limit', type: 'number', default: 6 },
            { name: 'include_FFZ_Emotes', type: 'boolean', default: false },
            { name: 'FFZ_Emote_Limit', type: 'number', default: 6 },
            { name: 'global_Emote_Limit', type: 'number', default: 15 },
            { name: 'message', type: 'string', default: "{user} - Hey hey, slow with these Emotes or you might hurt yourself!" }
        ]);
        this.Config.AddChildConfig(this.Emotes_Config);

        //Patterns Config
        this.Patterns_Config = new CONFIGHANDLER.Config('Patterns', [], { preloaded: this.Config.GetConfig()['Patterns'] });
        this.Patterns_Config.AddSettingTemplates([
            { name: 'enabled', type: 'boolean', requiered: true, default: false }
        ]);
        this.Config.AddChildConfig(this.Patterns_Config);
        
        //Messages Config
        this.Messages_Config = new CONFIGHANDLER.Config('Messages', [], { preloaded: this.Config.GetConfig()['Messages'] });
        this.Messages_Config.AddSettingTemplates([
            { name: 'enabled', type: 'boolean', requiered: true, default: true },
            { name: 'max_message_length', type: 'number', default: 100 },
            { name: 'include_TTV_Emotes', type: 'boolean', default: false },
            { name: 'include_BTTV_Emotes', type: 'boolean', default: true },
            { name: 'include_FFZ_Emotes', type: 'boolean', default: true },
            { name: 'message', type: 'string', default: "{user} - Hey, keep it short please :)" }
        ]);
        this.Config.AddChildConfig(this.Messages_Config);
    }

    //SETUP
    async reload() {
        return Promise.resolve();
        
        this.BTTV_Emotes = [];
        this.FFZ_Emotes = [];

        if (!this.TwitchIRC) return Promise.reject(new Error("Twitch IRC not available. BTTV and FFZ Emotes not available."));

        //Current Chat Channel
        let channelLogin = this.TwitchIRC.getChannel();
        if (!channelLogin) return Promise.resolve();

        if (channelLogin.charAt(0) == "#") {
            channelLogin = channelLogin.substring(1);
        }

        //FFZ
        try {
            let response = await FFZ.GetRoomByName(channelLogin, true);
            if (!response.error) {
                for (let set in response.sets) {
                    for (let emote of response.sets[set].emoticons) {
                        this.FFZ_Emotes.push(emote.name);
                    }
                }
            }
        } catch (err) {
            if (this.Logger != null)
                this.Logger.error("Spam Filter: " + err.message);
            else console.error(err);
        }

        if (!this.TwitchAPI) return Promise.reject(new Error("Twitch API not available. BTTV Emotes not available."));
        //BTTV Emotes - Get Chat Channel ID -> Get BTTV Emotes
        try {
            let response = await this.TwitchAPI.GetUsers({ login: channelLogin });
            if (response.data && response.data.length > 0) {
                let BTTV_DATA = await BTTV.GetChannelEmotes(response.data[0].id, true);

                for (let emote of BTTV_DATA) {
                    this.BTTV_Emotes.push(emote.code);
                }
            }
        } catch (err) {
            if (this.Logger != null)
                this.Logger.error("Spam Filter: " + err.message);
            else console.error(err);
        }
    }

    async GetSettings() {
        let cfg = this.Config.GetConfig();

        cfg.ready = this.isReady();

        return Promise.resolve(cfg);
    }
    async ChangeSetting(req, res) {
        const action = req.body['action'];
        const origin = req.body['origin'];

        if (origin === 'Caps') {
            this.Caps_Config.UpdateSetting(action, req.body['value']);
        } else if (origin === 'Emotes') {
            this.Emotes_Config.UpdateSetting(action, req.body['value']);
        } else if (origin === 'Messages') {
            this.Messages_Config.UpdateSetting(action, req.body['value']);
        } else if (action === 'enable') {
            if (req.body['value'] === true) this.enable();
            else if (req.body['value'] === false) this.disable();
        } else {
            return Promise.reject(new Error('origin not found.'));
        }

        return Promise.resolve();
    }

    //Filter
    async CheckMessage(msgObj, streamData) {
        if (!this.isEnabled()) return Promise.resolve();

        const CHECKS = [async (msgObj) => this.Check_Symbols_Caps(msgObj), async (msgObj) => this.Check_Symbols_Patterns(msgObj), async (msgObj) => this.Check_Symbols_Emotes(msgObj), async (msgObj) => this.Check_Message_Length(msgObj)];

        for (let check of CHECKS) {
            try {
                let issue = await check(msgObj);
                if (!issue) continue;
                return Promise.resolve(issue);
            } catch (err) {
                this.Logger.error(err.message);
            }
        }
        
        return Promise.resolve();
    }

    async Check_Symbols_Caps(msgObj) {
        let cfg = this.Config.GetConfig();
        if (cfg.Caps.enabled) return Promise.resolve();

        let messageString = msgObj.getMessage();

        if (cfg.Caps.include_TTV_Emotes == false || cfg.Caps.include_BTTV_Emotes == false || cfg.Caps.include_FFZ_Emotes == false) {
            try {
                messageString = await msgObj.getMessageWithoutEmotes(cfg.Caps.include_BTTV_Emotes, cfg.Caps.include_FFZ_Emotes, cfg.Caps.include_TTV_Emotes);
            } catch (err) {
                this.Logger.error(err.message ? err.message : err);
            }
        }

        let count = (messageString.match(/[A-Z]/g) || []).length;

        if (count > cfg.Caps.Caps_Limit || count > cfg['Caps.Caps_Limit_%'] * messageString.length) {
            return Promise.resolve({ msgObj, message: cfg.Caps.message, punishment: PUNISHMENT.DELETE, reason: "Used too much CAPS", exact_reason: count });
        }

        return Promise.resolve();
    }
    async Check_Symbols_Patterns(msgObj) {
        let cfg = this.Config.GetConfig();
        if (cfg.Patterns.enabled) return Promise.resolve();

        return Promise.resolve();
    }
    async Check_Symbols_Emotes(msgObj) {
        let cfg = this.Config.GetConfig();
        if (cfg.Emotes.enabled) return Promise.resolve();

        let emoteCount = 0;

        //TTV Emotes
        if (cfg.Emotes.include_TTV_Emotes == true) {
            let emotes = msgObj.getEmotesSync();

            let TTVEmotes = 0;

            for (let emote in emotes) {
                TTVEmotes += emotes[emote].length;
            }

            if (TTVEmotes > cfg.Emotes.TTV_Emote_Limit) {
                return Promise.resolve({ msgObj, message: cfg.Emotes.message, punishment: PUNISHMENT.DELETE, reason: "Used too many TTV Emotes", exact_reason: TTVEmotes });
            }

            emoteCount += TTVEmotes;
        }

        //BTTV Emotes
        if (cfg.Emotes.include_BTTV_Emotes == true) {
            try {
                let emotes = await msgObj.getBTTVEmotes();
                let BTTVEmotes = 0;

                for (let emote in emotes) {
                    BTTVEmotes += emotes[emote].length;
                }

                if (BTTVEmotes > cfg.Emotes.BTTV_Emote_Limit) {
                    return Promise.resolve({ msgObj, message: cfg.Emotes.message, punishment: PUNISHMENT.DELETE, reason: "Used too many BTTV Emotes", exact_reason: BTTVEmotes });
                }

                emoteCount += BTTVEmotes;
            } catch (err) {
                this.Logger.error(err.message ? err.message : err);
            }
        }

        //FFZ Emotes
        if (cfg.Emotes.include_FFZ_Emotes == true) {
            try {
                let emotes = await msgObj.getFFZEmotes();
                let FFZEmotes = 0;

                for (let emote in emotes) {
                    FFZEmotes += emotes[emote].length;
                }

                if (FFZEmotes > cfg.Emotes.FFZ_Emote_Limit) {
                    return Promise.resolve({ msgObj, message: cfg.Emotes.message, punishment: PUNISHMENT.DELETE, reason: "Used too many FFZ Emotes", exact_reason: FFZEmotes });
                }

                emoteCount += FFZEmotes;
            } catch (err) {
                this.Logger.error(err.message ? err.message : err);
            }
        }

        //Global Emote Limit
        if (emoteCount > cfg.Emotes.global_Emote_Limit) {
            return Promise.resolve({ msgObj, message: cfg.Emotes.message, punishment: PUNISHMENT.DELETE, reason: "Used too many Emotes", exact_reason: emoteCount });
        }


        return Promise.resolve();
    }

    async Check_Message_Length(msgObj) {
        let cfg = this.Config.GetConfig();
        if (cfg.Messages.enabled && cfg.Messages.max_message_length < 0) return Promise.resolve();

        let messageLen = 0;

        if (cfg.Messages.include_TTV_Emotes == false || cfg.Messages.include_BTTV_Emotes == false || cfg.Messages.include_FFZ_Emotes == false ) {
            try {
                messageLen = (await msgObj.getMessageWithoutEmotes(!cfg.Messages.include_BTTV_Emotes, !cfg.Messages.include_FFZ_Emotes, !cfg.Messages.include_TTV_Emotes)).length;
            } catch (err) {
                this.Logger.error(err.message ? err.message : err);
            }
        } else {
            messageLen = msgObj.getMessage().length;
        }
        
        if (cfg.Messages.max_message_length < messageLen) {
            return Promise.resolve({ msgObj, message: cfg.Messages.message, punishment: PUNISHMENT.DELETE, reason: "Message too long", exact_reason: messageLen });
        }

        return Promise.resolve();
    }
}

//Link Filter
class LinkFilter extends Filter {
    constructor(ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        super("Link Filter", ChatModeration, TwitchIRC, TwitchAPI, Logger);

        //Config
        this.Config.AddSettingTemplates([
            { name: 'block_all', type: 'boolean', default: true },
            { name: 'domain_block_message', type: 'string', default: "{user} - This Domain has been blocked!" },
            { name: 'subdomain_block_message', type: 'string', default: "{user} - This Sub-Domain has been blocked!" },
            { name: 'url_block_message', type: 'string', default: "{user} - This URL has been blocked!" },
            { name: 'all_block_message', type: 'string', default: "{user} - Links are NOT allowed!" }
        ]);
        this.Config.Load();
        this.Config.FillConfig();

        //Ready
        this.addReadyRequirement(() => {
            let cfg = this.Config.GetConfig();

            if (!fs.existsSync(PATH.resolve(cfg['File_Dir']))) {
                try {
                    fs.mkdirSync(PATH.resolve(cfg['File_Dir']));
                } catch (err) {
                    this.Logger.error("Corrupted Installation: Word Filter Folder couldnt be created!");
                    return false;
                }
            }

            if (!this.Blacklist) return false;

            return true;
        });
    }

    //SETUP
    async Init() {
        let cfg = this.Config.GetConfig();

        if (!fs.existsSync(PATH.resolve(cfg['File_Dir']))) {
            try {
                fs.mkdirSync(PATH.resolve(cfg['File_Dir']));
            } catch (err) {
                this.Logger.warn("Corrupted Installation: Link Filter Folder couldnt be created!");
                this.disable();
            }
        }

        return this.reload();
    }
    async reload() {
        let cfg = this.Config.GetConfig();

        if (!this.Blacklist)
            this.Blacklist = new Datastore({ filename: PATH.resolve(cfg.File_Dir + 'Blacklist.db'), autoload: true  });
        
        if (!this.Whitelist)
            this.Whitelist = new Datastore({ filename: PATH.resolve(cfg.File_Dir + 'Whitelist.db'), autoload: true  });

        return Promise.resolve();
    }

    async GetSettings() {
        let cfg = this.Config.GetConfig();

        let data = {
            enabled: this.isEnabled(),
            ready: this.isReady(),
            block_all: cfg.block_all,
            all_block_message: cfg.all_block_message,
            url_block_message: cfg.url_block_message,
            subdomain_block_message: cfg.subdomain_block_message,
            domain_block_message: cfg.domain_block_message
        };

        try {
            data['Blacklist'] = await this.CheckOneDBSearch(this.Blacklist, {});
            data['Whitelist'] = await this.CheckOneDBSearch(this.Whitelist, {});
        } catch (err) {

        }

        return Promise.resolve(data);
    }
    async ChangeSetting(req, res) {
        const action = req.body['action'];

        try {
            if (action === 'block') {
                await this.blockURL(req.body['url_data'], (res.locals.user || {}).preferred_username);
            } else if (action === 'unblock') {
                await this.unblockURL(req.body['url_data']);
            } else if (action === 'clear_blocks') {
                await this.clearBlacklist();
            } else if (action === 'allow') {
                await this.allowURL(req.body['url_data'], (res.locals.user || {}).preferred_username);
            } else if (action === 'unallow') {
                await this.unallowURL(req.body['url_data']);
            } else if (action === 'clear_allows') {
                await this.clearWhitelist();
            } else if (action === 'block_all') {
                this.Config.UpdateSetting('block_all', req.body['value']);
            } else if (action === 'enable') {
                if (req.body['value'] === true) this.enable();
                else if (req.body['value'] === false) this.disable();
            } else if (action === 'gobal_message') {
                this.Config.UpdateSetting('all_block_message', req.body['value']);
            } else if (action === 'url_block_message') {
                this.Config.UpdateSetting('url_block_message', req.body['value']);
            } else if (action === 'subdomain_block_message') {
                this.Config.UpdateSetting('subdomain_block_message', req.body['value']);
            } else if (action === 'domain_block_message') {
                this.Config.UpdateSetting('domain_block_message', req.body['value']);
            } else {
                return Promise.reject(new Error('Action not found.'));
            }
        } catch (err) {
            return Promise.reject(err);
        }
        return Promise.resolve();
    }

    //Filter
    async CheckMessage(msgObj, streamData) {
        if (!this.isEnabled()) return Promise.resolve();
        let cfg = this.Config.GetConfig();

        let LINKS = this.findLinks(msgObj.getMessage().toLowerCase());
        if (LINKS.length === 0) return Promise.resolve();

        //Whitelist
        let Whitelist = [];

        try {
            Whitelist = await this.CheckOneDBSearch(this.Whitelist, {});
        } catch (err) {
            this.Logger.error(err.message);
        }

        for (let link of LINKS) {
            let found = Whitelist.find(elt => elt.domain === link.domain || elt.subdomain === link.subdomain || elt.url === link.url);
            if (found) return Promise.resolve();
        }

        //Block All Links not Whitelisted
        if (cfg.block_all == true) return Promise.resolve({ msgObj, message: cfg.all_block_message, punishment: PUNISHMENT.DELETE, reason: "Links are forbidden!", exact_reason: '' });

        //Block only Blacklisted Links
        let Blacklist = [];

        try {
            Blacklist = await this.CheckOneDBSearch(this.Blacklist, {});
        } catch (err) {
            this.Logger.error(err.message);
        }

        for (let link of LINKS) {
            let reason = "";
            let message = "";
            let found = Blacklist.find(elt => {
                if (elt.domain === link.domain) {
                    reason = "Domain";
                    message = cfg.domain_block_message;
                    return true;
                } else if (elt.domain === link.subdomain) {
                    reason = "SubDomain";
                    message = cfg.subdomain_block_message;
                    return true;
                } else if (elt.url === link.url) {
                    reason = "URL";
                    message = cfg.url_block_message;
                    return true;
                }
            });
            if (found) {
                return Promise.resolve({ msgObj, message: message, punishment: PUNISHMENT.DELETE, reason: reason + " is on the Blacklist!", exact_reason: link.url });
            }
        }


        //All Links cool
        return Promise.resolve();
    }
    
    findLinks(messageString) {
        let maybees = messageString.split(" ");
        let links = [];

        for (let maybe of maybees) {
            if (maybe.split(".").length > 1) {
                let cutted = maybe;

                if (maybe.substring(0, 8) == "https://") {
                    cutted = maybe.substring(8);
                } else if (maybe.substring(0, 7) == "http://") {
                    cutted = maybe.substring(7);
                }

                if (maybe.substring(0, 4) == "www.") {
                    cutted = maybe.substring(4);
                }

                links.push({
                    subdomain: this.getSubDomain(cutted),
                    domain: this.getDomain(cutted),
                    url: cutted
                });
            }
        }

        return links;
    }

    getDomain(URL) {
        let subdomainSplitted = this.getSubDomain(URL).split(".");

        if (subdomainSplitted.length < 3) {
            return URL.split("/")[0];
        } else {
            let last = subdomainSplitted[subdomainSplitted.length - 1];
            let penultimate = subdomainSplitted[subdomainSplitted.length - 2];

            if ((last == "uk" || last == "co") && (penultimate == "uk" || penultimate == "co")) {
                return subdomainSplitted[subdomainSplitted.length - 3] + penultimate + "." + last;
            } else {
                return penultimate + "." + last;
            }

            return subdomain.split(".")[1];
        }
    }
    getSubDomain(URL) {
        return URL.split("/")[0].split("?")[0].split("#")[0];
    }

    async blockURL(url_data = {}, by = "Unknown", at = Date.now()) {
        let query = { $or: [url_data['domain'], url_data['subdomain'], url_data['url']] };

        try {
            let urls = await this.CheckOneDBSearch(this.Blacklist, query);
            if (urls.length > 0) return Promise.reject(new Error('URL already on the Blacklist!'));
        } catch (err) {
            return Promise.reject(err);
        }

        url_data['added_by'] = by;
        url_data['added_at'] = at;

        return new Promise((resolve, reject) => {
            this.Blacklist.insert(url_data, function (err, newDocs) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
    async unblockURL(url_data = {}) {
        let query = { $or: [{ domain: url_data['domain'] }, { subdomain: url_data['subdomain'] }, { url: url_data['url'] }] };

        return new Promise((resolve, reject) => {
            this.Blacklist.remove(query, {}, function (err, numRemoved) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
    async clearBlacklist() {
        return new Promise((resolve, reject) => {
            this.Blacklist.remove({}, { multi: true }, function (err, numRemoved) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }

    async allowURL(url_data = {}, by = "Unknown", at = Date.now()) {
        let query = { $or: [url_data['domain'], url_data['subdomain'], url_data['url']] };

        try {
            let urls = await this.CheckOneDBSearch(this.Whitelist, query);
            if (urls.length > 0) return Promise.reject(new Error('URL already on the Whitelist!'));
        } catch (err) {
            return Promise.reject(err);
        }

        url_data['added_by'] = by;
        url_data['added_at'] = at;

        return new Promise((resolve, reject) => {
            this.Whitelist.insert(url_data, function (err, newDocs) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
    async unallowURL(url_data = {}) {
        let query = { $or: [{ domain: url_data['domain'] }, { subdomain: url_data['subdomain'] }, { url: url_data['url'] }] };

        return new Promise((resolve, reject) => {
            this.Whitelist.remove(query, {}, function (err, numRemoved) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
    async clearWhitelist() {
        return new Promise((resolve, reject) => {
            this.Whitelist.remove({}, { multi: true }, function (err, numRemoved) {
                if (err) return reject(new Error(err));
                else return resolve();
            });
        });
    }
}

module.exports.ChatModeration = ChatModeration;