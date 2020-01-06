const fs = require('fs');
const path = require('path');
const CONSTANTS = require('./CONSTANTS.js');
const FETCH = require('node-fetch');

class DataCollection {
    constructor(config, twitchNewApi) {
        //PRE-INIT
        this.CONFIG = config;
        this.TWITCHNEWAPI = twitchNewApi;

        this.currentStream = null;      //currentStreamData (null when offline)

        this.RAW_BUFFER_STATUS = 0;
        this.RAW_BUFFER = [];

        //Datasets
        this.Leaderboards = [];
        this.Users = {};
        this.Stream = null;

        //INIT
        if (!config.Storage_Dir) {
            this.good = false;
        } else {
            this.good = true;

            this.Leaderboards = [
                new EmoteLeaderboard(this),
                new MessageLeaderboard(this),
                new CommandLeaderboard(this)
            ];

            //ONLINE?
            try {
                this.checkLiveStatus();
            } catch (err) {
                console.log(err);
            }

            //TIME_BASED_STUFF_INTERVAL
            this.TIME_BASED_STUFF_INTERVAL = setInterval(() => {
                //UPDATE STREAM DATA
                try {
                    this.checkLiveStatus();
                } catch (err) {
                    console.log(err);
                }

                //RAW FILE
                this.RAW_BUFFER_STATUS++;

                if (this.RAW_BUFFER_STATUS >= 10) {
                    this.RAW_BUFFER_STATUS = 0;
                    this.exportRAW();
                }

            }, 60000);
        }
    }

    ////////////////////////////////////////////////////////
    //             DATACOLLECTION STRUCTURE
    ////////////////////////////////////////////////////////

    async checkLiveStatus() {
        return new Promise(async (resolve, reject) => {
            let temp = null;
            try {
                //temp = await this.TWITCHNEWAPI.getStream();
                temp = await this.TWITCHNEWAPI.getStreams({ user_login: "itsvex" });
                temp = temp[0];

                this.currentStream = temp;

                //Stream online
                if (this.currentStream) {
                    //Stream just started
                    if (this.Stream == null) {
                        this.Stream = new Stream(this, this.currentStream);
                    } else {
                        //Stream already online
                        try {
                            this.Stream.TimeEvent(this.currentStream);
                        } catch (err) {
                            reject(err);
                        }
                    }
                }

                resolve();
            } catch (err) {
                this.currentStream = null;
                reject(err);
            }
        });
    }
    
    push2RAW(msgJSON) {
        this.RAW_BUFFER.push(
            {
                message: msgJSON,
                stream: this.currentStream ? this.currentStream.id : null
            }
        );
    }
    exportRAW() {
        if (!this.RAW_BUFFER || this.RAW_BUFFER.length == 0) {
            return;
        }

        try {
            let write = JSON.stringify({
                Messages: this.RAW_BUFFER
            }, null, 4);

            let dateTime = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();

            do {
                dateTime = dateTime.replace("-", ".")
            } while (dateTime.indexOf("-") >= 0);

            do {
                dateTime = dateTime.replace(":", "-")
            } while (dateTime.indexOf(":") >= 0);

            let path = this.CONFIG.Storage_Dir + "RAW/" + dateTime;

            writeFile(path, write);
            this.RAW_BUFFER = [];
        } catch (err) {
            console.log(err);
        }
    }

    ////////////////////////////////////////////////////////
    //                   EVENTHANDLERS
    ////////////////////////////////////////////////////////

    async USERJOIN(username) {
        return new Promise(async (resolve, reject) => {
            if (!this.good) {
                reject(new Error("Internal Error!"));
            } else if (!username) {
                reject(new Error("username not supplied!"));
            }
            
            /////////////////////////
            //         USER
            /////////////////////////
            if (this.Users[username]) {
                this.Users[username].JoinEvent(username);
            } else {
                this.Users[username] = new User(this, username, true);
            }
            
            /////////////////////////
            //         STREAM
            /////////////////////////
            if (this.currentStream) {
                if (this.Stream) {
                    try {
                        await this.Stream.JoinEvent(username);
                    } catch (err) {
                        reject(err);
                    }
                }
            }

            ////////////////////////////
            //      UPDATE DATASETS
            ////////////////////////////
            for (let dataset of this.Leaderboards) {
                try {
                    await dataset.JoinEvent(username);
                } catch (err) {
                    console.log(err);
                }
            }

            resolve();
        });
    }

    async addMessage(msgClassObj) {
        return new Promise(async (resolve, reject) => {
            if (!this.good) {
                reject(new Error("Internal Error!"));
            } else if (!msgClassObj) {
                reject(new Error("msgClassObj not supplied!"));
            }


            if (!this.good || !msgClassObj) {
                return;
            }

            ////////////////////////////
            //      UPDATE USER
            ////////////////////////////
            
            if (!this.Users[msgClassObj.userstate.username]) {
                this.Users[msgClassObj.userstate.username] = new User(this, msgClassObj.userstate.username, false);
            } else {
                console.log(this.Users[msgClassObj.userstate.username]);
            }
            this.Users[msgClassObj.userstate.username].MessageEvent(msgClassObj.toJSON());

            /////////////////////////
            //      UPDATE STREAM
            /////////////////////////
            if (this.Stream) {
                try {
                    await this.Stream.MessageEvent(msgClassObj.toJSON());
                } catch (err) {
                    reject(err);
                }
            }

            ////////////////////////////
            //      UPDATE DATASETS
            ////////////////////////////
            for (let dataset of this.Leaderboards) {
                try {
                    await dataset.MessageEvent(msgClassObj.toJSON());
                } catch (err) {
                    console.log(err);
                }
            }
            
            /////////////////////////
            //      RAW OUTPUT
            /////////////////////////
            this.push2RAW(msgClassObj.toJSON());

            resolve();
        });
    }
    
    async addCommand(username, commands) {
        return new Promise(async (resolve, reject) => {
            if (!this.good) {
                reject(new Error("Internal Error!"));
            } else if (!commands) {
                reject(new Error("commands not supplied!"));
            }

            ////////////////////////////
            //      UPDATE USERS
            ////////////////////////////

            if (!this.Users[username]) {
                this.Users[username] = new User(this, username, true);
            }
            this.Users[username].CommandEvent(username, commands);


            ////////////////////////////
            //      UPDATE STREAM
            ////////////////////////////
            if (this.Stream) {
                this.Stream.CommandEvent(username, commands);
            }
            
            ////////////////////////////
            //      UPDATE DATASETS
            ////////////////////////////
            for (let dataset of this.Leaderboards) {
                try {
                    await dataset.CommandEvent(username, commands);
                } catch (err) {
                    console.log(err);
                }
            }

            resolve();
        });
    }
    
    ////////////////////////////////////////////////////////
    //                    RERECORD
    ////////////////////////////////////////////////////////

    //Following soon
}

class Dataset {
    constructor(DCClass, supDir, filename) {
        this.DCClass = DCClass;
        this.template = {};
        this.TWITCHAPI = DCClass.TWITCHNEWAPI ? DCClass.TWITCHNEWAPI : null;

        this.Sup_Storage_Dir = supDir ? supDir : "TEMP";
        this.Filename = filename ? filename : Date.now();

        this.DATA = null;
        this.Changes = false;
    }
    
    //EventHandlers
    async JoinEvent(username) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    async MessageEvent(msgJSON) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    async CommandEvent(username, commands) {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    //INIT/UPDATE/DELETE
    init() {
        this.DATA = null;
    }
    loadData() {
        if (this.isFilePresent()) {
            this.DATA = this.getFileObj();
        } else {
            this.DATA = null;
        }
    }
    saveData() {
        if (this.Changes) {
            if (this.writeFile()) {
                this.Changes = false;
            }
        }
    }
    deleteData() {
        this.deleteFileObj();
    }
    
    //General Processing
    extractEmotes(msgJSON) {
        let emoteObj = {

        };

        for (let emoteID in msgJSON.emotes) {
            //Try to get Emote Name
            let emtName = emoteID;
            try {
                let start = parseInt(msgJSON.emotes[emoteID][0].substring(0, msgJSON.emotes[emoteID][0].indexOf("-")));
                let ende = parseInt(msgJSON.emotes[emoteID][0].substring(msgJSON.emotes[emoteID][0].indexOf("-") + 1));
                emtName = msgJSON.Message.substring(start, ende + 1);
            } catch {
                emtName = emoteID;
            }

            emoteObj[emtName] = {
                id: emoteID,
                name: emtName,
                strIdxs: msgJSON.emotes[emoteID]
            };
        }

        return emoteObj;
    }

    //Extern
    getLiveStatus() {
        if (this.DCClass.currentStream) {
            return true;
        } else {
            return false;
        }
    }

    //FILESYSTEM
    getDir() {
        return this.DCClass.CONFIG.Storage_Dir + this.Sup_Storage_Dir + "/";
    }
    getFilePath() {
        return this.getDir() + this.Filename + ".json";
    }
    isFilePresent() {
        try {
            //File/Path present/valid ?
            fs.accessSync(this.getFilePath(), fs.constants.F_OK);
            return true;
        } catch (err) {
            return false;
        }
    }
    getFileObj() {
        //RETURN NULL: when no File, File read error, Parse error
        //RETURN Obj: when successfull read and parsed
        
        if (this.isFilePresent()) {
            try {
                return JSON.parse(readFile(this.getFilePath()));
            } catch (err) {
                console.log(err);
                return null;
            }
        } else {
            return null;
        }
    }
    deleteFileObj() {
        if (this.isFilePresent()) {
            fs.unlinkSync(this.getFilePath());
        }
    }
    writeFile() {
        try {
            writeFile(this.getFilePath(), JSON.stringify(this.DATA, null, 4));
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    DateToFileFriendly(date) {

        let out = date.substring(0, date.indexOf("T"));

        do {
            out = out.replace("-", ".");
        } while (out.indexOf("-") >= 0);

        out = out + " " + date.substring(date.indexOf("T") + 1, date.indexOf("Z"));

        do {
            out = out.replace(":", "_");
        } while (out.indexOf(":") >= 0);

        return out;
    }
}

class User extends Dataset {
    constructor(DCClass, username, joinCreated) {
        super(DCClass, "Users", username);

        this.username = username;
        this.loadData(username);

        if (this.DATA == null) {
            this.init(username);
        }

        if (joinCreated) {
            this.JoinEvent(username)
                .then(() => {
                    this.saveData();
                })
                .catch(err => console.log(err));
            
        }
    }

    //EventHandlers
    async JoinEvent(username) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.updateUserAPIData();
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }
    async MessageEvent(msgJSON) {
        return new Promise((resolve, reject) => {
            this.addMessage(msgJSON);
            this.saveData();
            resolve();
        });
    }
    async CommandEvent(username, commands) {
        return new Promise((resolve, reject) => {
            this.updateCommandsObj(commands);
            this.saveData();
        });
    }

    //INIT/SPECIAL DATA/
    init(username) {
        this.DATA = {
            username: username ? username : "",
            "display-name": null,
            bio: null,
            profile_image_url: "",
            ID: 0,
            emotes: null,
            commands: null,
            Special: null,
            messages: null,
            offline_msgs: 0,
            createdAt: Date.now()
        };

        this.Changes = true;
    }
    async updateUserAPIData(apiData) {
        //RETURNS a Promise with an updated userObject
        return new Promise(async (resolve, reject) => {
            if (!this.getUsername) {
                reject(new Error("NO username found"));
            } 
            
            if (!apiData) {
                if (this.TWITCHAPI) {
                    apiData = await this.TWITCHAPI.getUserDetails(this.getUsername());
                    if (apiData && apiData.data && apiData.data[0]) {
                        apiData = apiData.data[0];
                    } else {
                        apiData = null;
                    }
                } else {
                    reject(new Error("Twitch API not supplied"));
                }
            }
            
            if (apiData) {
                try {
                    if (apiData["display_name"])
                        this.DATA["display-name"] = apiData["display_name"];
                    if (apiData["profile_image_url"])
                        this.DATA["profile_image_url"] = apiData["profile_image_url"];
                    if (apiData["description"])
                        this.DATA["bio"] = apiData["description"];
                    if (parseInt(apiData["id"]))
                        this.DATA["ID"] = parseInt(apiData["id"]);
                } catch (err) {
                    console.log(err);
                }

                this.Changes = true;
            }
            resolve();
        });
    }

    //Add (mostly used for ReRecord)
    addMessage(msgJSON) {
        //update User Object
        try {
            if (parseInt(msgJSON["user-id"]))
                this.DATA.ID = parseInt(msgJSON["user-id"]);

            if (msgJSON["display-name"])
                this.DATA["display-name"] = msgJSON["display-name"];
        } catch (err) {
            console.log(err);
        }

        if (this.getLiveStatus()) {
            //update User Message Object
            this.updateMessagesObj(msgJSON);

            //Update Emote Data
            this.updateEmotesObj(msgJSON);
        } else {
            //Increment Offline Messages Counter
            this.DATA.offline_msgs++;
        }

        this.Changes = true;
    }

    updateMessagesObj(msgJSON) {

        if (!msgJSON) {
            return;
        }

        //INIT
        if (!this.DATA.messages) {
            this.DATA.messages = {
                total: 0,
                curve: [],
                raw: []
            }
        }

        //PROCESSING
        this.DATA.messages.total++;

        //CURVE
        this.DATA.messages.curve[{
            MessageCount: this.DATA.messages.total,
            Timestamp: this.getMessagesDate(msgJSON["tmi-sent-ts"])
        }];

        //RAW
        this.DATA.messages.raw.push(msgJSON);
    }
    updateEmotesObj(msgJSON, optEmotesObj) {

        if (!msgJSON) {
            return;
        }

        //INIT
        if (!this.DATA.emotes) {
            this.DATA.emotes = {
                total: 0,
                curve: [],
                top: []
            }
        }

        //Extract Emotes if not supplied
        if (!optEmotesObj) {
            optEmotesObj = this.extractEmotes(msgJSON);
        } else {
            optEmotesObj = JSON.parse(JSON.stringify(optEmotesObj));
        }

        //PROCESSING
        for (let objEmote in optEmotesObj) {
            this.DATA.emotes.total += optEmotesObj[objEmote].strIdxs.length;
        }

        //CURVE
        this.DATA.emotes.curve[{
            EmoteCount: this.DATA.emotes.total,
            Timestamp: this.getEmotesDate(msgJSON["tmi-sent-ts"])
        }];

        //TOP
        //Update Existing
        for (let topEmote of this.DATA.emotes.top) {
            for (let objEmote in optEmotesObj) {
                if (objEmote == topEmote.Name) {
                    topEmote.usage += optEmotesObj[objEmote].strIdxs.length;
                    delete optEmotesObj[objEmote];
                }
            }
        }

        //Add Remaining
        for (let objEmote in optEmotesObj) {
            this.DATA.emotes.top.push({
                Name: objEmote,
                usage: optEmotesObj[objEmote].strIdxs.length
            });
        }
    }
    updateCommandsObj(commands) {

        if (!commands || commands.length == 0) {
            return;
        }

        //INIT
        if (!this.DATA.commands) {
            this.DATA.commands = {
                total: 0,
                curve: [],
                top: []
            }
        }

        //PROCESSING
        this.DATA.commands.total += commands.length;

        //CURVE
        this.DATA.commands.curve[{
            CommandCount: this.DATA.commands.total,
            Timestamp: this.getCommandsDate(Date.now() + "")
        }];

        //TOP
        for (let objCommand of commands) {
            let present = false;

            for (let topCommand of this.DATA.commands.top) {
                if (objCommand.Name == topCommand.Name) {
                    topEmote.usage++;
                    present = true;
                    break;
                }
            }

            if (!present) {
                this.DATA.commands.top.push({
                    Name: objCommand.name,
                    usage: 1
                });
            }
        }

        this.Changes = true;
    }

    getUsername() {
        return this.username;
    }
    getMessagesDate(dateIntegerString) {
        let output = dateIntegerString;

        try {
            output = new Date(parseInt(dateIntegerString + ""));

            output = output.getDate() + "." + (output.getMonth() + 1) + "." + output.getFullYear();
        } catch (err) {
            console.log(err);
            output = dateIntegerString;
        }

        return output;
    }
    getEmotesDate(dateIntegerString) {
        let output = dateIntegerString;

        try {
            output = new Date(parseInt(dateIntegerString + ""));

            output = output.getDate() + "." + (output.getMonth() + 1) + "." + output.getFullYear();
        } catch (err) {
            console.log(err);
            output = dateIntegerString;
        }

        return output;
    }
    getCommandsDate(dateIntegerString) {
        let output = dateIntegerString;

        try {
            output = new Date(parseInt(dateIntegerString + ""));

            output = output.getDate() + "." + (output.getMonth() + 1) + "." + output.getFullYear();
        } catch (err) {
            console.log(err);
            output = dateIntegerString;
        }

        return output;
    }
}

class Stream extends Dataset {
    constructor(DCClass, streamData) {
        //Make Date File Friendly (function in super Class)
        let date = streamData.started_at;
        let out = date.substring(0, date.indexOf("T"));

        do {
            out = out.replace("-", ".");
        } while (out.indexOf("-") >= 0);

        out = out + " " + date.substring(date.indexOf("T") + 1, date.indexOf("Z"));

        do {
            out = out.replace(":", "_");
        } while (out.indexOf(":") >= 0);
        
        super(DCClass, "Streams", streamData ? out + " - " + streamData.id : "TEMP");
        
        this.loadData(out + " - " + streamData.id);
        this.channelName = streamData["user_name"];

        if (this.DATA == null) {
            this.init(streamData);

            this.updateViewers()
                .then(() => {
                    this.saveData();
                })
                .catch(err => console.log(err));
        }
    }

    //EventHandlers
    async JoinEvent(username) {
        return new Promise(async (resolve, reject) => {
            try {
                this.addViewer(username);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }
    async MessageEvent(msgJSON) {
        return new Promise((resolve, reject) => {
            this.addMessage(msgJSON);
            resolve();
        });
    }
    async CommandEvent(username, commands) {
        return new Promise((resolve, reject) => {
            this.updateCommandsObj(commands);
        });
    }
    async TimeEvent(streamData) {
        return new Promise(async (resolve, reject) => {
            if (!this.DATA) {
                reject(new Error("Data not initiated!"));
            }

            //GENERAL
            try {
                await this.updateViewers();
            } catch (err) {
                console.log(err);
            }

            if (!this.DATA["titles"].find(elt => elt.text == streamData["title"])) {
                this.DATA["titles"].push({
                    text: streamData["title"],
                    time: Date.now()
                });
            }

            this.DATA["viewers"].curve.push({
                count: streamData["viewer_count"],
                time: Date.now()
            });

            if (!this.DATA["games"].find(elt => elt.id == streamData["game_id"])) {
                this.DATA["games"].push({
                    id: streamData["game_id"],
                    time: Date.now()
                });
            }

            //Messages
            //CURVE
            if (this.DATA.messages) {
                this.DATA.messages.curve[{
                    MessageCount: this.DATA.messages.total,
                    Timestamp: this.getMessagesDate(Date.now() + "")
                }];
            }

            //Emotes
            //CURVE
            if (this.DATA.emotes)
                this.DATA.emotes.curve[{
                    EmoteCount: this.DATA.emotes.total,
                    Timestamp: this.getEmotesDate(Date.now() + "")
                }];

            //Commands
            //CURVE
            if (this.DATA.commands)
                this.DATA.commands.curve[{
                    CommandCount: this.DATA.commands.total,
                    Timestamp: this.getCommandsDate(Date.now() + "")
                }];

            this.Changes = true;
            
            this.saveData();
            resolve();
        });
    }

    //Init / API Data
    init(streamData) {
        this.DATA = {
            titles: [],
            date: streamData ? Date.parse(streamData["started_at"]) : 0,
            messages: null,
            emotes: null,
            commands: null,
            viewers: {
                total: [],
                curve: []
            },
            games: [],
            twitchID: streamData ? streamData["id"] : null
        };

        if (streamData) {
            this.DATA["titles"] = [{
                text: streamData["title"],
                time: Date.parse(streamData["started_at"])
            }];

            this.DATA["viewers"].curve = [{
                count: streamData["viewer_count"],
                time: Date.parse(streamData["started_at"])
            }];

            this.DATA["games"] = [{
                id: streamData["game_id"],
                time: Date.parse(streamData["started_at"])
            }];
        }

        this.Changes = true;
    }
    async updateViewers() {
        return new Promise(async (resolve, reject) => {
            if (!this.DATA) {
                reject(new Error("Data not initiated!"));
            }

            console.log(this.channelName);

            try {
                let data = await FETCH("http://tmi.twitch.tv/group/user/" + this.channelName.toLowerCase() + "/chatters");
                data = await data.json();

                for (let chattertype in data.chatters) {
                    for (let chatter of data.chatters[chattertype]) {
                        if (!this.DATA.viewers.total.find(elt => elt == chatter)) {
                            this.DATA.viewers.total.push(chatter);
                        }
                    }
                }
                this.Changes = true;
                resolve();
            } catch (err) {
                console.log(err);
                resolve();
            }
        });
    }

    //Add (mostly used for ReRecord)
    addMessage(msgJSON) {
        if (this.getLiveStatus()) {
            //update User Message Object
            this.updateMessagesObj(msgJSON);

            //Update Emote Data
            this.updateEmotesObj(msgJSON);
            this.Changes = true;
        }
    }
    addViewer(username) {
        if (!this.DATA.viewers.total.find(elt => elt == username)) {
            this.DATA.viewers.total.push(username);
        }
    }

    updateMessagesObj(msgJSON) {
        if (!msgJSON) {
            return;
        }

        //INIT
        if (!this.DATA.messages) {
            this.DATA.messages = {
                total: 0,
                top: [],
                curve: [],
                raw: []
            }
        }

        this.Changes = true;

        //PROCESSING
        this.DATA.messages.total++;
        
        //RAW
        this.DATA.messages.raw.push(msgJSON);

        //TOP
        //Update Existing
        for (let elt of this.DATA.messages.top) {
            if (elt.name == msgJSON.username) {
                elt.value++;
                return;
            }
        }
        //ADD New
        this.DATA.messages.top.push({
            name: msgJSON.username,
            value: 1
        });
    }
    updateEmotesObj(msgJSON, optEmotesObj) {
        if (!msgJSON) {
            return;
        }

        //INIT
        if (!this.DATA.emotes) {
            this.DATA.emotes = {
                total: 0,
                curve: [],
                top: []
            }
        }

        //Extract Emotes if not supplied
        if (!optEmotesObj) {
            optEmotesObj = this.extractEmotes(msgJSON);
        } else {
            optEmotesObj = JSON.parse(JSON.stringify(optEmotesObj));
        }

        //PROCESSING
        for (let objEmote in optEmotesObj) {
            this.DATA.emotes.total += optEmotesObj[objEmote].strIdxs.length;
        }

        //TOP
        //Update Existing
        for (let topEmote of this.DATA.emotes.top) {
            for (let objEmote in optEmotesObj) {
                if (objEmote == topEmote.Name) {
                    topEmote.usage += optEmotesObj[objEmote].strIdxs.length;
                    delete optEmotesObj[objEmote];
                }
            }
        }

        //Add Remaining
        for (let objEmote in optEmotesObj) {
            this.DATA.emotes.top.push({
                Name: objEmote,
                usage: optEmotesObj[objEmote].strIdxs.length
            });
        }
    }
    updateCommandsObj(commands) {
        if (!commands || commands.length == 0) {
            return;
        }

        //INIT
        if (!this.DATA.commands) {
            this.DATA.commands = {
                total: 0,
                curve: [],
                top: []
            }
        }

        //PROCESSING
        this.DATA.commands.total += commands.length;
        
        //TOP
        for (let objCommand of commands) {
            let present = false;

            for (let topCommand of this.DATA.commands.top) {
                if (objCommand.Name == topCommand.Name) {
                    topEmote.usage++;
                    present = true;
                    break;
                }
            }

            if (!present) {
                this.DATA.commands.top.push({
                    Name: objCommand.name,
                    usage: 1
                });
            }
        }

        this.Changes = true;
    }

    getMessagesDate(dateIntegerString) {
        let output = dateIntegerString;

        try {
            output = new Date(parseInt(dateIntegerString + ""));

            output = output.getDate() + "." + (output.getMonth() + 1) + "." + output.getFullYear() + " " + (output.getHours() + 1) + ":" + (output.getMinutes() + 1);
        } catch (err) {
            console.log(err);
            output = dateIntegerString;
        }

        return output;
    }
    getEmotesDate(dateIntegerString) {
        let output = dateIntegerString;

        try {
            output = new Date(parseInt(dateIntegerString + ""));

            output = output.getDate() + "." + (output.getMonth() + 1) + "." + output.getFullYear() + " " + (output.getHours() + 1) + ":" + (output.getMinutes() + 1);
        } catch (err) {
            console.log(err);
            output = dateIntegerString;
        }

        return output;
    }
    getCommandsDate(dateIntegerString) {
        let output = dateIntegerString;

        try {
            output = new Date(parseInt(dateIntegerString + ""));

            output = output.getDate() + "." + (output.getMonth() + 1) + "." + output.getFullYear() + " " + (output.getHours() + 1) + ":" + (output.getMinutes() + 1);
        } catch (err) {
            console.log(err);
            output = dateIntegerString;
        }

        return output;
    }

    //FileSystem
    createFilename(streamData) {
        if (streamData)
            return this.DateToFileFriendly(streamData.started_at) + " - " + streamData.id;
        else
            return null;
    }
}

class Leaderboard extends Dataset {
    constructor(DCClass, filename, dataName, dataDesc, dataData) {
        super(DCClass, "Leaderboards", filename);

        if(!dataData)
            this.loadData();

        this.init(dataName, dataDesc, this.DATA ? this.DATA.data : null);
    }

    init(name, desc, data) {
        this.DATA = {
            name: name ? name : this.Filename,
            description: desc ? desc : "",
            data: data ? data : []
        };

        this.Changes = true;
    }
    push(name, value) {

        if (!name ||!value) {
            return;
        }
        
        //Update Existing
        for (let elt of this.DATA.data) {
            if (elt.name == name) {
                elt.value += value;
                return;
            }
        }

        this.DATA.data.push({
            name: name,
            value: value
        });
        
        this.Changes = true;
    }
}

class EmoteLeaderboard extends Leaderboard {
    constructor(DCClass) {
        super(DCClass, "Emotes", "Emote Leaderboard", "Emotes sorted by their all time uses");
    }

    //EventHandlers
    async MessageEvent(msgJSON) {
        return new Promise((resolve, reject) => {
            let emotes = this.extractEmotes(msgJSON);

            for (let emote in emotes) {
                this.push(emote, emotes[emote].strIdxs.length);
            }

            this.saveData();
            resolve();
        });
    }
}
class MessageLeaderboard extends Leaderboard {
    constructor(DCClass) {
        super(DCClass, "Messages", "User Leaderboard", "Users sorted by their all time messagecount");
    }

    //EventHandlers
    async MessageEvent(msgJSON) {
        return new Promise((resolve, reject) => {
            this.push(msgJSON["display-name"] ? msgJSON["display-name"] : msgJSON.username, 1);

            this.saveData();
            resolve();
        });
    }
}
class CommandLeaderboard extends Leaderboard {
    constructor(DCClass) {
        super(DCClass, "Commands", "Command Leaderboard", "Commands sorted by their all time uses");
    }

    //EventHandlers
    async CommandEvent(username, commands) {
        return new Promise((resolve, reject) => {

            for (let cmd of commands) {
                this.push(cmd.name, 1);
            }

            this.saveData();
            resolve();
        });
    }
}

//File System
function writeFile(path, data) {
    let fd;

    try {
        fd = fs.openSync(path, 'w');
        fs.writeSync(fd, data);
    } catch (err) {
        /* Handle the error */
        console.log(err);
        return err;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        } else {
            return "fd was undefinded";
        }
    }

    return null;
}
function readFile(path) {
    try {
        //File/Path present/valid ?
        fs.accessSync(path, fs.constants.F_OK);

        //read File
        return fs.readFileSync(path);

    } catch (err) {
        console.log("ERROR: " + err);
        return null;
    }
}

module.exports.DataCollection = DataCollection;