const CONSTANTS = require('./../../Util/CONSTANTS.js');
const TWITCHIRC = require('./../../TwitchIRC.js');

const BTTV = require('./../../3rdParty/BTTV.js');
const FFZ = require('./../../3rdParty/FFZ.js');

const express = require('express');
const fs = require('fs');
const PATH = require('path');
const Datastore = require('nedb');

let COMMANDHANDLER;

const PACKAGE_DETAILS = {
    name: "ChatModeration",
    description: "Chat Moderation Filters checking Chat Messages for Spam, Caps, Bad Words etc."
};

const SETTINGS_REQUIERED = {
    "UserLogFile": CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + "ChatModeration/UserLog.db"
};

const PUNISHMENT = {
    WARNING: "WARNING",
    DELETE: "DELETE",
    TIMEOUT: "TIMEOUT",
    BAN: "BAN"
}

class ChatModeration extends require('./../PackageBase.js').PackageBase {
    constructor(expressapp, twitchirc, twitchapi, datacollection, logger) {
        super(PACKAGE_DETAILS, expressapp, twitchirc, twitchapi, datacollection, logger);
    }

    async Init(startparameters) {
        if (!this.isEnabled()) return Promise.resolve();
        
        //UserDatabase
        this.UserArchive = new Datastore({ filename: PATH.resolve(this.Settings.UserLogFile), autoload: true });
        
        //Debug Log
        if (this.Settings.debug == true) {
            this.DebugDataBase = new Datastore({ filename: PATH.resolve(this.Settings.DebugLogFile), autoload: true });
        }

        //Permitted
        this.Permitted = {

        };

        //Setup Filter
        this.Filters = {
            WordFilter: new WordFilter(this, this.TwitchIRC, this.TwitchAPI, this.Logger),
            SpamFilter: new SpamFilter(this, this.TwitchIRC, this.TwitchAPI, this.Logger),
            LinkFilter: new LinkFilter(this, this.TwitchIRC, this.TwitchAPI, this.Logger)
        };

        //Setup Timers
        this.Timers = {

        };

        //Twitch Chat Listener
        this.TwitchIRC.on('chat', (channel, userstate, message, self) => this.MessageEventHandler(channel, userstate, message, self));

        //API ENDPOINTS
        let APIRouter = express.Router();
        APIRouter.get('/filters', (request, response) => {
            let data = {
                enabled: this.isEnabled(),
                Filter: {

                }
            };

            for (let filter in this.Filters) {
                data.Filter[this.Filters[filter].GetName()] = this.Filters[filter].GetPublicSettings();
                data.Filter[this.Filters[filter].GetName()].enabled = this.Filters[filter].isEnabled();
            }

            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: data
            });
        });
        super.setAPIRouter(APIRouter);

        //PACKAGE INTERCONNECT - Adding Commands
        if (this.Settings.disable_Chat_Commands != true) {
            try {
                COMMANDHANDLER = require('./../CommandHandler/CommandHandler.js');
                this.addPackageInterconnectRequest("CommandHandler", (CommandHandlerObj) => {
                    CommandHandlerObj.addHardcodedCommands("!ChatModeration", new COMMANDHANDLER.HCCommand("!ChatModeration", (userMessageObj, commandOrigin, parameters) => this.Chat_Command_ChatModeration(userMessageObj, commandOrigin, parameters),
                        { description: '<p>Set/Change/Enable/Disable/... Chat Moderation Filters using the Twitch Chat.</p>' }));
                    CommandHandlerObj.addHardcodedCommands("!permit", new COMMANDHANDLER.HCCommand("!permit", (userMessageObj, commandOrigin, parameters) => this.Chat_Command_permit(userMessageObj, commandOrigin, parameters),
                        { description: '<p>Permits a User to post any Message otherwise restricted by the FrikyBot ChatModeration Filters! <b>(this doesn´t stop AutoMod or other Twitch Intern Settings)</b></p>' }));
                });
            } catch (err) {
                if (err.message.startsWith('Cannot find module'))
                    this.Logger.error("Command Handler not Found! ChatModeration Commands not available!");
                else
                    this.Logger.error(err.message);
            }
        }

        return Promise.resolve();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));

        try {
            for (let filter in this.Filters) {
                this.Logger.info("Reloading " + this.Filters[filter].GetName() + " ...");
                await this.Filters[filter].reload();
            }
        } catch (err) {
            console.log(err);
        }

        this.Logger.info("ChatModeration (Re)Loaded!");
        return Promise.resolve();
    }

    CheckSettings(settings) {
        if (settings.debug == true && settings.DebugLogFile == undefined) {
            settings.DebugLogFile = CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + "ChatModeration/DebugLog.db";
        }

        return this.AddObjectElementsToOtherObject(settings, SETTINGS_REQUIERED, msg => this.Logger.info("CONFIG UPDATE: " + msg));
    }
    
    //Chat Moderation - Filters
    async MessageEventHandler(channel, userstate, message, self) {
        if (!this.isEnabled()) return Promise.resolve();

        //Dont Check Bot Messages
        if (self)
            return Promise.resolve();
        
        //SKIP PERMITTED
        if (this.Permitted[userstate.username] != undefined) {
            if (this.Permitted[userstate.username] > Date.now()) {
                return Promise.resolve();
            } else {
                delete this.Permitted[userstate.username];
            }
        }

        let msgObj = new TWITCHIRC.Message(channel, userstate, message);

        let streamData = null;

        //SKIP WHEN NOT IN DEBUG
        if (this.Settings.debug != true) {
            //Skip Moderators and up
            if (msgObj.matchUserlevel(CONSTANTS.UserLevel.moderator)) {
                return Promise.resolve();
            }

            //Skip when Streamer is Offline
            try {
                streamData = await this.TwitchAPI.GetStreams({ user_login: channel });

                if (!streamData.data || streamData.data.length == 0) {
                    return Promise.resolve();
                }
            } catch (err) {
                this.Logger.error(err.message);
                console.log(err);
            }
        }
       
        for (let filter in this.Filters) {
            try {
                let filterOutput = await this.Filters[filter].CheckMessage(msgObj, streamData);
                if (typeof filterOutput == "object") {
                    this.Logger.warn("Chat Alert -> " + filterOutput.reason + " -> Punishment: " + filterOutput.punishment + (filterOutput.punishment_length ? (" LENGTH: " + filterOutput.punishment_length) : ""));

                    //Debug Log
                    if (this.DebugDataBase) {
                        this.insertDebug(channel, userstate, message, this.Filters[filter], filterOutput, streamData);
                    }
                    this.insertUser(channel, userstate, message, this.Filters[filter], filterOutput, streamData);

                    return Promise.resolve();
                }
            } catch (err) {
                this.Logger.error(err.message);
                console.log(err);
            }
        }

        return Promise.resolve();
    }

    permitUser(username) {
        this.Permitted[username] = Date.now() + (1000 * 60);
    }

    insertUser(channel, userstate, message, filterObj, filterOutput, streamData) {
        this.UserArchive.insert({
            user: userstate["user-id"],
            username: userstate.username,
            filter: filterObj.GetName(),
            reason: filterOutput.reason,
            punishment: filterOutput.punishment,
            specificIssue: filterOutput.specificIssue,
            message: message,
            time: userstate["tmi-sent-ts"],
            stream_id: streamData ? streamData.id : null,
            occurred_while_debugging: this.DebugDataBase ? true : undefined
        });
    }
    insertDebug(channel, userstate, message, filterObj, filterOutput, streamData) {
        this.DebugDataBase.insert({
            user: userstate["user-id"],
            username: userstate.username,
            userstate: userstate,
            filter: filterObj.GetName(),
            reason: filterOutput.reason,
            punishment: filterOutput.punishment,
            specificIssue: filterOutput.specificIssue,
            message: message,
            time: userstate["tmi-sent-ts"],
            stream_id: streamData ? streamData.id : null
        });
    }
    
    //Chat Moderation - Timers
    addTimer(name, exec, interval) {
        this.Timers[name] = new Timer(name, this, exec, interval);

        if (!this.Timers[name].test()) {
            delete this.Timers[name];
            return null;
        } else {
            return this.Timers[name];
        }
    }
    removeTimer(name) {
        if (this.Timers[name] != undefined) {
            this.Logger.warn("Timer " + this.Timers[name].GetName() + " was REMOVED!");
            this.Timers[name].disable();
            delete this.Timers[name];
            return true;
        }

        return false;
    }

    //Commands
    async Chat_Command_ChatModeration(userMessageObj, commandOrigin, parameters) {
        //Get ChatModeration Status
        if (parameters.length == 1) {
            try {
                let output = "";

                if (this.isEnabled()) {
                    output = "Current Chat Moderation Filters: ";

                    for (let filter in this.Filters) {
                        if (this.Filters[filter].isEnabled())
                            output += this.Filters[filter].GetName() + ", "
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

        //Chat Moderation Timer
        if (parameters.length >= 3 && parameters[1].toLowerCase() == "timer" && this.Timers[parameters[2]] != undefined) {
            //Print Status
            if (parameters.length == 3) {
                this.TwitchIRC.saySync("Timer '" + this.Timers[parameters[2]].GetName() + "' is currently " + (this.Timers[parameters[2]].isEnabled() ? "ENABLED" : "DISABLED") + "!");
                return Promise.resolve();
            }

            //Settings need Mod Status
            if (!userMessageObj.matchUserlevel(CONSTANTS.UserLevel.moderator)) {
                return Promise.resolve();
            }

            //Settings
            if (parameters[3].toLowerCase() == "enable") {
                try {
                    await this.Timers[parameters[2]].enable();
                    await this.TwitchIRC.say("Timer '" + this.Timers[parameters[2]].GetName() + "' is now ENABLED!");
                    return Promise.resolve();
                } catch (err) {
                    console.log(err);
                }
            } else if (parameters[3].toLowerCase() == "disable") {
                try {
                    await this.Timers[parameters[2]].disable();
                    await this.TwitchIRC.say("Timer '" + this.Timers[parameters[2]].GetName() + "' is now DISABLED!");
                    return Promise.resolve();
                } catch (err) {
                    console.log(err);
                }
            } else if (parameters[3].toLowerCase() == "start") {
                if (this.Timers[parameters[2]].start()) {
                    this.TwitchIRC.saySync("Timer '" + this.Timers[parameters[2]].GetName() + "' is now RUNNING!");
                    return Promise.resolve();
                }
            } else if (parameters[3].toLowerCase() == "stop") {
                if (this.Timers[parameters[2]].stop()) {
                    this.TwitchIRC.saySync("Timer '" + this.Timers[parameters[2]].GetName() + "' is now STOPPED!");
                    return Promise.resolve();
                }
            } else if (parameters[3].toLowerCase() == "remove") {
                if (this.removeTimer(parameters[2])) {
                    this.TwitchIRC.saySync("Timer '" + this.Timers[parameters[2]].GetName() + "' was REMOVED!");
                    return Promise.resolve();
                }
            }
        } else if (parameters.length > 3 && parameters[1].toLowerCase() == "timer") {
            if (parameters[3].toLowerCase() == "set" && !isNaN(parameters[4])) {
                try {
                    let message = parameters.reduce((sum, value, index) => {
                        if (index == 5) {
                            sum += value;
                        } else if (index > 5) {
                            sum += " " + value;
                        }
                        return sum;
                    }, "");

                    if (this.addTimer(parameters[2], () => this.TwitchIRC.saySync(message), parseInt(parameters[4]))) {
                        if (this.Timers[parameters[2]].start()) {
                            this.TwitchIRC.saySync("Timer '" + this.Timers[parameters[2]].GetName() + "' was CREATED And STARTED!");
                            return Promise.resolve();
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }

        return Promise.resolve();
    }
    async Chat_Command_permit(userMessageObj, commandOrigin, parameters) {
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

//Parent Class
class Filter {
    constructor(ChatModeration, name, TwitchIRC, TwitchAPI, settings = {}, Logger) {
        this.name = name;
        this.ChatModeration = ChatModeration;
        this.Settings = {
            enabled: true
        };

        //Ensure settings is an object
        if (typeof settings == "object" && settings.length == undefined) {
            for (let setting in settings) {

                //one time nesting
                if (typeof settings[setting] == "object" && settings[setting].length == undefined) {
                    for (let innerSetting in settings[setting]) {
                        //Create New
                        if (this.Settings[setting] == undefined) {
                            this.Settings[setting] = {};
                        }

                        //Add Value
                        if (typeof this.Settings[setting] == "object" && this.Settings[setting].length == undefined) {
                            this.Settings[setting][innerSetting] = settings[setting][innerSetting];
                        }
                    }
                } else {
                    this.Settings[setting] = settings[setting];
                }
            }
        }

        this.TwitchIRC = TwitchIRC;
        this.TwitchAPI = TwitchAPI;
        this.Logger = Logger;
    }

    async CheckMessage(msgObj) {
        return Promise.resolve();
    }
    async reload() {
        return Promise.resolve();
    }

    Issue(msgObj, punishment, reason, specificIssue, punishment_length) {
        return {
            punishment: punishment,
            punishment_length: punishment_length,
            reason: reason,
            specificIssue: specificIssue
        };
    }
    async sendResponse(codedString, msgObj) {
        while (codedString.indexOf("{user}") >= 0) {
            codedString = codedString.substring(0, codedString.indexOf("{user}")) + msgObj.getDisplayName() + codedString.substring(codedString.indexOf("{user}") + 6);
        }
        return this.TwitchIRC.say(codedString);
    }
    async getUserRecord(user_id, stream_id) {
        return new Promise((resolve, reject) => {
            this.ChatModeration.UserArchive.find({ user: user_id, filter: this.name, stream_id: stream_id }, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }
    async executePunishment(msgObj, chat_response, punishment, punishment_length, reason) {
        try {
            if (punishment == PUNISHMENT.WARNING) {

            } else if (punishment == PUNISHMENT.DELETE) {
                await this.TwitchIRC.deleteMessage(msgObj.getID());
            } else if (punishment == PUNISHMENT.TIMEOUT) {
                await this.TwitchIRC.timeout(msgObj.getUsername(), punishment_length, reason);
            } else if (punishment == PUNISHMENT.BAN) {
                await this.TwitchIRC.ban(msgObj.getUsername(), reason);
            } 
            
            await this.sendResponse(chat_response, msgObj);
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    GetName() {
        return this.name;
    }
    GetSettings() {
        return this.Settings;
    }
    GetPublicSettings() {
        return { };
    }
    enable() {
        this.Settings.enabled = true;
    }
    disable() {
        this.Settings.enabled = false;
    }
    isEnabled() {
        return this.Settings.enabled == true;
    }
}
class Timer {
    constructor(name, ChatModeration, exec, interval, settings = {}) {
        this.Name = name;
        this.ChatModeration = ChatModeration;
        
        this.error = false;

        this.Settings = {
            enabled: true
        };

        this.running = false;
        
        if (settings.enabled) {
            this.Settings.enabled = settings.enabled == true;
        }
        
        if (typeof interval == "number") {
            this.Settings.interval = interval;
        } else {
            this.Settings.enabled = false;
            this.error = true;
        }

        if (exec instanceof Function) {
            this.exec = exec;
        } else {
            this.Settings.enabled = false;
            this.error = true;
        }
    }

    start() {
        if (this.isEnabled() && !this.running) {
            this.ChatModeration.Logger.warn("Timer " + this.Name + " was STARTED!");
            this.interval = setInterval(this.exec, this.Settings.interval);
            this.running = true;
            return true;
        }

        return false;
    }
    stop() {
        if (this.interval || this.running) {
            this.ChatModeration.Logger.warn("Timer " + this.Name + " was STOPPED!");
            clearInterval(this.interval);
            this.running = false;
            return true;
        }

        return false;
    }

    test() {
        return this.error == false;
    }

    isEnabled() {
        return this.Settings.enabled == true;
    }
    enable() {
        this.Settings.enabled = true;
    }
    disable() {
        this.Settings.enabled = true;
        this.stop();
    }

    GetName() {
        return this.Name;
    }
}

//Word Filter
class WordFilter extends Filter {
    constructor(ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        let settings = {
            use_Default_Bad_Words: true,
            File_Dir: CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + "ChatModeration/Word Filter/",
            Blacklist_File: "Blacklist.db",
            Default_Bad_Words_File: "Default_Bad_Words.txt",
            CaseSentitive: true,
            message: "{user} - a word u used is on the Blacklist!"
        };

        super(ChatModeration, "Word Filter", TwitchIRC, TwitchAPI, settings, Logger);
        
        let state = this.CheckSetupAndEnviroument();

        if (typeof state == "string") {
            if (this.Logger != null)
                this.Logger.error("Word Filter: " + state);
            else
                console.error(state);
            this.Settings.enabled = false;
        } else {
            this.reload();
        }
    }

    //SETUP
    CheckSetupAndEnviroument() {
        //Settings
        if (this.Settings == undefined) {
            return "Corrupted Installation: Settings corrupted!";
        }
        if (typeof this.Settings.File_Dir != "string") {
            return "Corrupted Installation: File_Dir corrupted!";
        }

        //Settings Values
        if (!fs.existsSync(PATH.resolve(this.Settings.File_Dir))) {
            try {
                fs.mkdirSync(PATH.resolve(this.Settings.File_Dir));
            } catch (err) {
                return "Corrupted Installation: Word Filter Folder couldnt be created!";
            }
        }

        if (this.Settings.use_Default_Bad_Words == true && !fs.existsSync(PATH.resolve(this.Settings.File_Dir + this.Settings.Default_Bad_Words_File))) {
            try {
                fs.writeFileSync(PATH.resolve(this.Settings.File_Dir + this.Settings.Default_Bad_Words_File), "");
            } catch (err) {
                return "Corrupted Installation: Default Bad Words File couldnt be created!";
            }
        }

        return true;
    }
    async reload() {
        let insert = [];
        if (!fs.existsSync(PATH.resolve(this.Settings.File_Dir + this.Settings.Blacklist_File))) {
            let defaultData = this.loadDefaultBlacklist();

            for (let word of defaultData) {
                if (word === "") continue;
                insert.push({
                    word: word,
                    blocked_by: "DEFAULT",
                    blocked_at: Date.now()
                });
            }
        }

        if(!this.Blacklist)
            this.Blacklist = new Datastore({ filename: PATH.resolve(this.Settings.File_Dir + this.Settings.Blacklist_File) });

        return new Promise((resolve, reject) => {
            if (this.Blacklist) {
                this.Blacklist.loadDatabase(err => { if (err) return reject(new Error("Database Loading Error!")); });

                if (insert.length > 0)
                    this.Blacklist.insert(insert, err => { if (err) return reject(new Error("Database Insert Error!")); });
            }

            return resolve();
        });
    }
    GetPublicSettings() {
        return {
            "Case Sensitive Blocking": this.Settings.CaseSentitive
        };
    }

    //Filter
    async CheckMessage(msgObj) {
        if (!this.isEnabled() || !this.Blacklist) {
            return Promise.resolve();
        }

        let messageString = msgObj.getMessage();

        //Use Case Sensitivity?
        if (this.Settings.CaseSentitive == false)
            messageString = messageString.toLowerCase();
        
        //Is Blacklisted?
        try {
            let blocked = await this.CheckOneDBSearch(this.Blacklist, {});

            for (let block of blocked) {
                if (messageString.indexOf(block.word) >= 0) {
                    await this.executePunishment(msgObj, this.Settings.message, PUNISHMENT.DELETE);
                    return Promise.resolve(this.Issue(msgObj, PUNISHMENT.DELETE, "Used a word on the Blacklist", block.word));
                }
            }
        } catch(err) {
            console.log(err);
        }

        return Promise.resolve();
    }

    //UTIL
    loadDefaultBlacklist() {
        try {
            let input = fs.readFileSync(this.Settings.File_Dir + this.Settings.Default_Bad_Words_File).toString();
            return this.ChatModeration.replaceAll(input, "\r", "").split("\n");
        } catch (err) {
            this.Logger.error(err.message);
        }

        return [];
    }
    async CheckOneDBSearch(db, querry) {
        return new Promise((resolve, reject) => {
            db.find(querry, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    addWord(word, username) {
        this.Blacklist.insert({
            word: word,
            blocked_by: username,
            blocked_at: Date.now()
        });
    }
    removeWord(word) {
        this.Blacklist.remove({word: word});
    }
}

//Spam Filter
class SpamFilter extends Filter {
    constructor(ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        let settings = {
            ExcessiveSymbols: {
                enabled: true,
                Emotes: {
                    enabled: true,
                    include_TTV_Emotes: true,
                    TTV_Emote_Limit: 6,
                    include_FFZ_Emotes: true,
                    FFZ_Emote_Limit: 6,
                    include_BTTV_Emotes: true,
                    BTTV_Emote_Limit: 6,
                    global_Emote_Limit: 15,
                    message: "{user} - Hey hey, slow with these Emotes or you might hurt yourself!"
                },
                Caps: {
                    enabled: true,
                    include_Emote_Caps: false,
                    include_TTV_Emotes: true,
                    include_BTTV_Emotes: true,
                    include_FFZ_Emotes: true,
                    Caps_Limit: 20,
                    message: "{user} - Hey hey, stop shouting D:"
                }
            },
            Messages: {
                enabled: false,
                max_message_length: 100,
                include_Emote_Name_length: true,
                include_TTV_Emotes: true,
                include_BTTV_Emotes: true,
                include_FFZ_Emotes: true,
                message: "{user} - Hey, keep it short please :)"
            }
        };

        super(ChatModeration, "Spam Filter", TwitchIRC, TwitchAPI, settings, Logger);

        let state = this.CheckSetupAndEnviroument();

        if (typeof state == "string") {
            if (this.Logger != null)
                this.Logger.error("Spam Filter: " + state);
            else
                console.error(state);
            this.Settings.enabled = false;
        } else {
            this.reload();
        }
    }

    //SETUP
    CheckSetupAndEnviroument() {
        //Settings
        if (this.Settings == undefined) {
            return "Corrupted Installation: Settings corrupted!";
        }
        
        return true;
    }
    GetPublicSettings() {
        return {
            ExcessiveSymbols: {
                enabled: this.Settings.ExcessiveSymbols.enabled,
                Emotes: {
                    enabled: this.Settings.ExcessiveSymbols.Emotes.enabled,
                    "include Twitch Emotes": this.Settings.ExcessiveSymbols.Emotes.include_TTV_Emotes,
                    "Twitch Emote Limit": this.Settings.ExcessiveSymbols.Emotes.TTV_Emote_Limit,
                    "include FFZ Emotes": this.Settings.ExcessiveSymbols.Emotes.include_FFZ_Emotes,
                    "FFZ Emote Limit": this.Settings.ExcessiveSymbols.Emotes.FFZ_Emote_Limit,
                    "include BTTV Emotes": this.Settings.ExcessiveSymbols.Emotes.include_BTTV_Emotes,
                    "BTTV Emote Limit": this.Settings.ExcessiveSymbols.Emotes.BTTV_Emote_Limit,
                    "global Emote Limit": this.Settings.ExcessiveSymbols.Emotes.global_Emote_Limit
                },
                Caps: {
                    enabled: this.Settings.ExcessiveSymbols.Caps.enabled,
                    "include Emote Caps": this.Settings.ExcessiveSymbols.Caps.include_Emote_Caps,
                    "include Twitch Emote Caps": this.Settings.ExcessiveSymbols.Caps.include_TTV_Emotes,
                    "include BTTV Emote Caps": this.Settings.ExcessiveSymbols.Caps.include_BTTV_Emotes,
                    "include FFZ Emote Caps": this.Settings.ExcessiveSymbols.Caps.include_FFZ_Emotes,
                    "Caps Limit": this.Settings.ExcessiveSymbols.Caps.Caps_Limit
                }
            },
            Messages: {
                enabled: this.Settings.Messages.enabled,
                "maximum message length": this.Settings.Messages.max_message_length,
                "include Emotename length": this.Settings.Messages.include_Emote_Name_length,
                "include Twitch Emotenames": this.Settings.Messages.include_TTV_Emotes,
                "include BTTV Emotenames": this.Settings.Messages.include_BTTV_Emotes,
                "include FFZ Emotenames": this.Settings.Messages.include_FFZ_Emotes
            }
        };
    }

    async reload() {
        this.BTTV_Emotes = [];
        this.FFZ_Emotes = [];

        //Current Chat Channel
        let channelLogin = this.TwitchIRC.getChannel();
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
            else
                console.error(err);
        }


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
            else
                console.error(err);
        }
    }

    //Filter
    async CheckMessage(msgObj, streamData) {
        if (!this.isEnabled()) {
            return Promise.resolve();
        }

        let UserRecord = [];
        let streamID = streamData ? streamData.data ? streamData.data.length > 0 ? streamData.data[0].id : null : null : null;

        try {
            UserRecord = await this.getUserRecord(msgObj.getUserID(), streamID);
        } catch (err) {
            console.log(err);
        }

        let min_penalty = PUNISHMENT.WARNING;
        let punishment_length = undefined;

        if (UserRecord.length >= 2 && UserRecord.length < 5) {
            min_penalty = PUNISHMENT.DELETE;
        } else if (UserRecord.length >= 5 && UserRecord.length < 15) {
            min_penalty = PUNISHMENT.TIMEOUT;

            switch (UserRecord.length) {
                case 5: punishment_length = 10;
                    break;
                case 6: punishment_length = 30;
                    break;
                case 7: punishment_length = 60;
                    break;
                case 8: punishment_length = 600;
                    break;
                case 9: punishment_length = 1800;
                    break;
                case 10: punishment_length = 3600;
                    break;
                case 11: punishment_length = 7200;
                    break;
                case 12: punishment_length = 18000;
                    break;
                case 13: punishment_length = 36000;
                    break;
                case 14: punishment_length = 864000;
                    break;
            }

        } else if (UserRecord.length >= 15) {
            min_penalty = PUNISHMENT.BAN;
        }
        
        //Excessive Symbols
        if (this.Settings.ExcessiveSymbols.enabled == true) {
            //Caps
            if (this.Settings.ExcessiveSymbols.Caps.enabled == true) {

                let messageString = msgObj.getMessage();

                if (this.Settings.ExcessiveSymbols.Caps.include_Emote_Caps == false) {
                    try {
                        messageString = await msgObj.getMessageWithoutEmotes(!this.Settings.ExcessiveSymbols.Caps.include_BTTV_Emotes, !this.Settings.ExcessiveSymbols.Caps.include_FFZ_Emotes);
                    } catch (err) {
                        console.log(err);
                    }
                }

                if ((messageString.match(/[A-Z]/g) || []).length > this.Settings.ExcessiveSymbols.Caps.Caps_Limit) {
                    try {
                        await this.executePunishment(msgObj, this.Settings.ExcessiveSymbols.Caps.message, min_penalty, punishment_length, "Used too much CAPS! Count: " + (messageString.match(/[A-Z]/g) || []).length);
                        return Promise.resolve(this.Issue(msgObj, min_penalty, "Used too much CAPS", (messageString.match(/[A-Z]/g) || []).length, punishment_length));
                    } catch (err) {
                        this.Logger.error(err.message ? err.message : err);
                    }
                }
            }

            //Emotes
            if (this.Settings.ExcessiveSymbols.Emotes.enabled == true) {
                let emoteCount = 0;

                //TTV Emotes
                if (this.Settings.ExcessiveSymbols.Emotes.include_TTV_Emotes == true) {
                    let emotes = msgObj.getEmotesSync();

                    let TTVEmotes = 0;

                    for (let emote in emotes) {
                        TTVEmotes += emotes[emote].length;
                    }

                    if (TTVEmotes > this.Settings.ExcessiveSymbols.Emotes.TTV_Emote_Limit) {
                        try {
                            await this.executePunishment(msgObj, this.Settings.ExcessiveSymbols.Emotes.message, min_penalty, punishment_length, "Used too many TTV Emotes! Count: " + TTVEmotes);
                            return Promise.resolve(this.Issue(msgObj, min_penalty, "Used too many TTV Emotes", TTVEmotes, punishment_length));
                        } catch (err) {
                            this.Logger.error(err.message ? err.message : err);
                        }
                    }

                    emoteCount += TTVEmotes;
                }

                //BTTV Emotes
                if (this.Settings.ExcessiveSymbols.Emotes.include_BTTV_Emotes == true) {
                    try {
                        let emotes = await msgObj.getBTTVEmotes();
                        let BTTVEmotes = 0;

                        for (let emote in emotes) {
                            BTTVEmotes += emotes[emote].length;
                        }

                        if (BTTVEmotes > this.Settings.ExcessiveSymbols.Emotes.BTTV_Emote_Limit) {
                            try {
                                await this.executePunishment(msgObj, this.Settings.ExcessiveSymbols.Emotes.message, min_penalty, punishment_length, "Used too many BTTV Emotes! Count: " + BTTVEmotes);
                                return Promise.resolve(this.Issue(msgObj, min_penalty, "Used too many BTTV Emotes", BTTVEmotes, punishment_length));
                            } catch (err) {
                                this.Logger.error(err.message ? err.message : err);
                            }
                        }

                        emoteCount += BTTVEmotes;
                    } catch (err) {
                        console.log(err);
                    }
                }

                //FFZ Emotes
                if (this.Settings.ExcessiveSymbols.Emotes.include_FFZ_Emotes == true) {
                    try {
                        let emotes = await msgObj.getFFZEmotes();
                        let FFZEmotes = 0;

                        for (let emote in emotes) {
                            FFZEmotes += emotes[emote].length;
                        }

                        if (FFZEmotes > this.Settings.ExcessiveSymbols.Emotes.FFZ_Emote_Limit) {
                            try {
                                await this.executePunishment(msgObj, this.Settings.ExcessiveSymbols.Emotes.message, min_penalty, punishment_length, "Used too many FFZ Emotes! Count: " + FFZEmotes);
                                return Promise.resolve(this.Issue(msgObj, min_penalty, "Used too many FFZ Emotes", FFZEmotes, punishment_length));
                            } catch (err) {
                                this.Logger.error(err.message ? err.message : err);
                            }
                        }

                        emoteCount += FFZEmotes;
                    } catch (err) {
                        console.log(err);
                    }
                }

                //Global Emote Limit
                if (emoteCount > this.Settings.ExcessiveSymbols.Emotes.global_Emote_Limit) {
                    try {
                        await this.executePunishment(msgObj, this.Settings.ExcessiveSymbols.Emotes.message, min_penalty, punishment_length, "Used too many Emotes! Count: " + emoteCount);
                        return Promise.resolve(this.Issue(msgObj, min_penalty, "Used too many Emotes", emoteCount, punishment_length));
                    } catch (err) {
                        this.Logger.error(err.message ? err.message : err);
                    }
                }
            }
        }

        //Messages
        if (this.Settings.Messages.enabled == true) {
            if (this.Settings.Messages.max_message_length > 0) {
                let messageLen = 0;

                if (this.Settings.Messages.include_Emote_Name_length == true) {
                    messageLen = msgObj.getMessage().length;
                } else {
                    try {
                        messageLen = await msgObj.getMessageWithoutEmotes(!this.Settings.Messages.include_BTTV_Emotes, !this.Settings.Messages.include_FFZ_Emotes).length;
                    } catch (err) {
                        console.log(err);
                    }
                }

                if (this.Settings.Messages.max_message_length < messageLen) {
                    try {
                        await this.executePunishment(msgObj, this.Settings.Messages.message, min_penalty, punishment_length);
                        return Promise.resolve(this.Issue(msgObj, "WARNING", "Message too long", messageLen));
                    } catch (err) {
                        this.Logger.error(err.message ? err.message : err);
                    }
                }
            }
        }

        return Promise.resolve();
    }
}

//Link Filter
class LinkFilter extends Filter {
    constructor(ChatModeration, TwitchIRC, TwitchAPI, Logger) {
        let settings = {
            File_Dir: CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + "ChatModeration/Link Filter/",
            Blacklist_File: "Blacklist.db",
            Whitelist_File: "Whitelist.db",
            selectionBlock: true,
            domain_block_message: "{user} - This Domain has been blocked!",
            subdomain_block_message: "{user} - This Sub-Domain has been blocked!",
            url_block_message: "{user} - This URL has been blocked!",
            all_block_message: "{user} - Links are NOT allowed!"
        };

        super(ChatModeration, "Link Filter", TwitchIRC, TwitchAPI, settings, Logger);
        
        let state = this.CheckSetupAndEnviroument();

        if (typeof state == "string") {
            if (this.Logger != null)
                this.Logger.error("Link Filter: " + state);
            else
                console.error(state);
            this.Settings.enabled = false;
        } else {
            this.reload();
        }
    }

    //SETUP
    CheckSetupAndEnviroument() {
        //Settings
        if (this.Settings == undefined) {
            return "Corrupted Installation: Settings corrupted!";
        }

        if (typeof this.Settings.File_Dir != "string") {
            return "Corrupted Installation: File_Dir corrupted!";
        }

        //Settings Values
        if (!fs.existsSync(PATH.resolve(this.Settings.File_Dir))) {
            try {
                fs.mkdirSync(PATH.resolve(this.Settings.File_Dir));
            } catch (err) {
                return "Corrupted Installation: Word Filter Folder couldnt be created!";
            }
        }

        return true;
    }
    GetPublicSettings() {
        return {
            "Selection Block Mode": this.Settings.selectionBlock
        };
    }

    async reload() {
        if (!this.Blacklist)
            this.Blacklist = new Datastore({ filename: PATH.resolve(this.Settings.File_Dir + this.Settings.Blacklist_File) });
        
        if (!this.Whitelist)
            this.Whitelist = new Datastore({ filename: PATH.resolve(this.Settings.File_Dir + this.Settings.Whitelist_File) });

        return new Promise(async (masterresolve, masterreject) => {
            let errors = null;

            //Blacklist
            try {
                await new Promise(async (resolve, reject) => {
                    if (this.Blacklist) {
                        this.Blacklist.loadDatabase(err => { if (err) return reject(new Error("Blacklist Loading Error!")); return resolve(); });
                    }

                    return resolve();
                });
            } catch (err) {
                errors = err;
            }

            //Whitelist
            try {
                await new Promise(async (resolve, reject) => {
                    if (this.Whitelist) {
                        this.Whitelist.loadDatabase(err => { if (err) return reject(new Error("Whitelist Loading Error!")); return resolve(); });
                    }
                });
            } catch (err) {
                errors = err;
            }
            
            if (errors !== null) return masterreject(errors);

            return masterresolve();
        });
    }

    //Filter
    async CheckMessage(msgObj) {
        if (!this.isEnabled()) {
            return Promise.resolve();
        }

        for (let URL of this.findLinks(msgObj.getMessage().toLowerCase())) {
            if (this.Settings.selectionBlock) {
                //selectionBlock -> Only Block on Blacklist
                //Domain ist Blocked?
                try {
                    if (await this.CheckOneDBSearch(this.Blacklist, { domain: this.getDomain(URL) })) {
                        try {
                            await this.executePunishment(msgObj, this.Settings.domain_block_message, PUNISHMENT.DELETE);
                            return Promise.resolve(this.Issue(msgObj, PUNISHMENT.DELETE, "Domain on the Blacklist!", this.getDomain(URL)));
                        } catch (err) {
                            this.Logger.error(err.message ? err.message : err);
                        }
                        return Promise.resolve(this.Issue(msgObj, "DELETE", "Domain on the Blacklist!", this.getDomain(URL)));
                    }
                } catch (err) {
                    this.Logger.error(err.message);
                    console.log(err);
                }

                //SubDomain Blocked
                try {
                    if (await this.CheckOneDBSearch(this.Blacklist, { subdomain: this.getSubDomain(URL) })) {
                        try {
                            await this.executePunishment(msgObj, this.Settings.subdomain_block_message, PUNISHMENT.DELETE);
                            return Promise.resolve(this.Issue(msgObj, "DELETE", "SubDomain on the Blacklist!", this.getSubDomain(URL)));
                        } catch (err) {
                            this.Logger.error(err.message ? err.message : err);
                        }
                    }
                } catch (err) {
                    this.Logger.error(err.message);
                    console.log(err);
                }

                //URL Blocked
                try {
                    if (await this.CheckOneDBSearch(this.Blacklist, { URL: URL })) {
                        try {
                            await this.executePunishment(msgObj, this.Settings.url_block_message, PUNISHMENT.DELETE);
                            return Promise.resolve(this.Issue(msgObj, "DELETE", "URL on the Blacklist!", URL));
                        } catch (err) {
                            this.Logger.error(err.message ? err.message : err);
                        }
                    }
                } catch (err) {
                    this.Logger.error(err.message);
                    console.log(err);
                }
            } else {
                //NON selectionBlock -> Block ALL, unless on Whitelist
                //Domain ist Allowed?
                try {
                    if (await this.CheckOneDBSearch(this.Whitelist, { domain: this.getDomain(URL) })) {
                        return Promise.resolve();
                    }
                } catch (err) {
                    this.Logger.error(err.message);
                    console.log(err);
                }

                //SubDomain Allowed
                try {
                    if (await this.CheckOneDBSearch(this.Whitelist, { subdomain: this.getSubDomain(URL) })) {
                        return Promise.resolve();
                    }
                } catch (err) {
                    this.Logger.error(err.message);
                    console.log(err);
                }

                //URL Allowed
                try {
                    if (await this.CheckOneDBSearch(this.Whitelist, { URL: URL })) {
                        return Promise.resolve();
                    }
                } catch (err) {
                    this.Logger.error(err.message);
                    console.log(err);
                }

                try {
                    await this.executePunishment(msgObj, this.Settings.url_block_message, PUNISHMENT.DELETE);
                    return Promise.resolve(this.Issue(msgObj, "DELETE", "Link is not allowed!", URL));
                } catch (err) {
                    this.Logger.error(err.message ? err.message : err);
                }
            }
        }
        return Promise.resolve();
    }
    async CheckOneDBSearch(db, querry) {
        return new Promise((resolve, reject) => {
            db.find(querry, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    if (docs.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
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
                links.push(cutted);
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
        return URL.split("/")[0];
    }

    blockDomain(domain) {
        domain = domain.toLowerCase();
        this.Blacklist.update({ domain: domain }, { domain: domain }, { upsert: true });
        this.Whitelist.remove({ domain: domain });
    }
    permitDomain(domain) {
        domain = domain.toLowerCase();
        this.Blacklist.remove({ domain: domain });
        this.Whitelist.update({ domain: domain }, { domain: domain }, { upsert: true });
    }

    blockSubDomain(subdomain) {
        subdomain = subdomain.toLowerCase();
        this.Blacklist.update({ subdomain: subdomain }, { subdomain: subdomain }, { upsert: true });
        this.Whitelist.remove({ subdomain: subdomain });
    }
    permitSubDomain(subdomain) {
        subdomain = subdomain.toLowerCase();
        this.Blacklist.remove({ subdomain: subdomain });
        this.Whitelist.update({ subdomain: subdomain }, { subdomain: subdomain }, { upsert: true });
    }

    blockURL(URL) {
        URL = URL.toLowerCase();
        this.Blacklist.update({ URL: URL }, { URL: URL }, { upsert: true });
        this.Whitelist.remove({ URL: URL });
    }
    permitURL(URL) {
        URL = URL.toLowerCase();
        this.Blacklist.remove({ URL: URL });
        this.Whitelist.update({ URL: URL }, { URL: URL }, { upsert: true });
    }
}

module.exports.ChatModeration = ChatModeration;