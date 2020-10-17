const tmi = require('tmi.js');
const CONSTANTS = require('./Util/CONSTANTS.js');

const BTTV = require('./3rdParty/BTTV.js');
const FFZ = require('./3rdParty/FFZ.js');

class TwitchIRC {
    constructor(user, pw, channel = [], logger) {
        logger.addSources({
            TwitchIRC: {
                display: () => " TwitchIRC ".inverse.brightMagenta
            }
        });
        this.setLogger(logger.TwitchIRC);

        //Connection client
        this.client = undefined;
        if (!this.SetupClient(user, pw, channel)) {
            this.Logger.warn("Client not Setup correctly!");
        }
    }

    SetupClient(user, pw, channel) {
        if (!(user && pw && channel)) {
            return false;
        }

        let options = {
            connection: {
                reconnect: true,
                secure: true
            },
            identity: {
                username: user,
                password: pw
            },
            channels: channel
        };

        if (this.Logger) {
            options.logger = this.Logger.TwitchIRC;
        }

        if (Array.isArray(channel)) {
            options.channels = channel;
        } else {
            options.channels = [channel];
        }

        this.client = new tmi.client(options);
        return true;
    }
    async Connect(user, pw, channel) {
        //Change Login settings?
        this.SetupClient(user, pw, channel);

        //Client defined?
        if (this.client) {
            return this.client.connect();
        } else {
            return Promise.reject(new Error("Client not defined! Client init went wrong or client disconnected?"));
        }
    }

    on(eventName, callback) {
        if (this.client) {
            this.client.on(eventName, callback);
            return true;
        }

        return false;
    }
    
    //COMMANDS
    async say(message = "", channel = this.getChannel()) {
        if (this.client) {
            return this.client.say(channel, message.toString());
        }

        return Promise.reject(new Error("Client not Setup correctly!"));
    }
    saySync(message = "", channel = this.getChannel()) {
        this.say(message, channel)
            .then((data) => {
                // data returns [channel]
            }).catch((err) => this.Logger.error(err.message));
    }

    async deleteMessage(id, channel = this.getChannel()) {
        return this.client.deletemessage(channel, id);
    }
    deleteMessageSync(id, channel = this.getChannel()) {
        this.deleteMessage(channel, id)
            .then((data) => {
                // data returns [channel]
            }).catch((err) => {
                //
            });
    }

    async timeout(username, length, reason, channel = this.getChannel()) {
        return this.client.timeout(channel, username, length, reason);
    }
    timeoutSync(username, length, reason, channel = this.getChannel()) {
        this.timeout(username, length, reason, channel)
            .then((data) => {
                // data returns [channel, username, seconds, reason]
            }).catch((err) => {
                //
            });
    }

    async ban(username, reason, channel = this.getChannel()) {
        return this.client.ban(channel, username, reason);
    }
    banSync(username, reason, channel = this.getChannel()) {
        this.ban(username, reason, channel)
            .then((data) => {
                // data returns [channel, username, reason]
            }).catch((err) => {
                //
            });
    }

    //CLIENT CONNECTION
    getUsername() {
        if (this.client)
            return this.client.getUsername();

        return null;
    }
    getChannels() {
        if (this.client)
            return this.client.getChannels();

        return null;
    }
    getChannel() {
        if (this.client)
            if (this.client.getChannels().length > 0)
                return this.client.getChannels()[0];

        return null;
    }
    getOptions() {
        if (this.client)
            return this.client.getOptions();

        return null;
    }
    readyState() {
        if (this.client)
            return this.client.readyState();

        return null;
    }

    //UTIL
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

class Message {
    constructor(channel, userstate, message) {
        this.message = message;
        this.channel = channel;
        this.userstate = userstate;

        //set Userlevel
        this.userLevel = "regular";
        
        for (let constant in CONSTANTS.UserLevel) {

            if (this.userLevel != "regular")
                break;

            for (let badge in userstate.badges) {
                if (badge == constant) {
                    this.userLevel = constant;
                    break;
                }
            }
        }
    }

    //transform to
    toString() {
        return this.getDisplayName() + " [" + this.getUserLevelAsText() + "] : " + this.message;
    }
    toJSON() {

        let temp = JSON.parse(JSON.stringify(this.userstate));
        temp.Message = this.message;

        //Attributes to remove
        let exclude = ["message-type", "badges-raw", "badge-info-raw", "emotes-raw", "user-type", "subscriber", "turbo", "flags"];
        for (let key of exclude) {
            if (temp[key] || temp[key] == null || temp[key] == false) {
                delete temp[key];
            }
        }
        
        return temp;
    }

    //SET
    async checkFollow(API) {
        if(!API)
            return Promise.reject(new Error("No API found!"));
        
        let response = await API.GetUsersFollows({ from_id: this.userstate["user-id"], to_id: this.userstate["room-id"] });
        
        if (response && response.total && response.total == 1) {
            if (this.userLevel < CONSTANTS.UserLevel.Partner) {
                this.userLevel = CONSTANTS.UserLevel.Follower;
            }
            return Promise.resolve(true);
        }

        return Promise.resolve(false);
    }

    //GET
    getDisplayName() {
        return (this.userstate['display-name'] && this.userstate['display-name'] != "" ? this.userstate['display-name'] : this.userstate.username);
    }
    getUsername() {
        return this.userstate.username;
    }

    getUser() {
        return userstate;
    }
    getUserID() {
        return this.userstate["user-id"];
    }
    getChannel() {
        return this.channel;
    }
    getRoomID() {
        return this.userstate["room-id"];
    }
    getMessage() {
        return this.message;
    }
    getID() {
        return this.userstate.id;
    }
    getTime() {
        let t = new Date(parseInt(this.userstate["tmi-sent-ts"]));

        let s = t.getHours() + ":";

        if (t.getHours() < 10) {
            s = "0" + s;
        }

        if (t.getMinutes() < 10) {
            s += "0";
        }

        s += t.getMinutes();

        return s;
    }

    getEmotesSync() {
        return this.userstate.emotes ? this.userstate.emotes : {};
    }
    async getEmotes(includeBTTV = false, includeFFZ = false) {
        let Emotes = this.userstate.emotes ? JSON.parse(JSON.stringify(this.userstate.emotes)) : {};

        if (includeBTTV) {
            try {
                let BTTV = await this.getBTTVEmotes();
                for (let emote in BTTV) {
                    Emotes[emote] = BTTV[emote];
                }
            } catch (err) {
                console.log(err);
            }
        }

        if (includeFFZ) {
            try {
                let FFZ = await this.getFFZEmotes();
                for (let emote in FFZ) {
                    Emotes[emote] = FFZ[emote];
                }
            } catch (err) {
                console.log(err);
            }
        }

        return Promise.resolve(Emotes);
    }
    async getMessageWithoutEmotes(keepBTTV = true, keepFFZ = true) {
        //Only Emotes -> no Messages
        if (this.isEmoteOnly())
            return Promise.resolve("");
        
        //Check Mesage for TTV, BTTV and FFZ Emotes
        let sorted_emotes = [];

        try {
            let Emotes = await this.getEmotes(!keepBTTV, !keepFFZ);
            for (let emote_id in Emotes) {
                let emotePlaces = Emotes[emote_id];

                for (let emote of emotePlaces) {
                    let start = parseInt(emote.substring(0, emote.indexOf("-")));
                    let end = parseInt(emote.substring(emote.indexOf("-") + 1));

                    sorted_emotes.push({
                        start: start,
                        end: end
                    });
                }
            }
        } catch (err) {
            console.log(err);
        }

        if (sorted_emotes.length == 0) {
            return Promise.resolve(this.getMessage());
        }

        sorted_emotes.sort((a, b) => {
            if (a.start < b.start)
                return -1;
            return 1;
        });

        //Cut Text
        let message = this.getMessage();
        
        //Before
        let output = message.substring(0, sorted_emotes[0].start);
        //Middle
        for (let i = 0; i < sorted_emotes.length - 1; i++) {
            output += message.substring(sorted_emotes[i].end + 1, sorted_emotes[i + 1].start);
        }
        //After
        output += message.substring(sorted_emotes[sorted_emotes.length - 1].end + 1);
        
        return Promise.resolve(output);
    }
    isEmoteOnly() {
        return this.userstate["emote-only"] == true;
    }
    async getFFZEmotes() {
        let emotes = {};

        try {
            let ffz_room = await FFZ.GetRoomByName(this.getChannel().substring(1), true);
            let start = 0;

            for (let word of this.getMessage().split(" ")) {
                let found = false;
                for (let set in ffz_room.sets) {
                    for (let emote of ffz_room.sets[set].emoticons) {
                        if (word == emote.name) {
                            if (emotes[word] == undefined) {
                                emotes[word] = [start + "-" + (start + word.length - 1)];
                            } else {
                                emotes[word].push(start + "-" + (start + word.length - 1));
                            }
                            found = true;
                            break;
                        }

                        if (found) {
                            break;
                        }
                    }
                }

                start += word.length + 1
            }
        } catch (err) {
            console.log(err);
        }

        return Promise.resolve(emotes);
    }
    async getBTTVEmotes() {
        let emotes = {};

        try {
            let bttv_emotes = await BTTV.GetChannelEmotes(this.getRoomID(), true);
            let start = 0;

            for (let word of this.getMessage().split(" ")) {
                for (let emote of bttv_emotes) {
                    if (word == emote.code) {
                        if (emotes[word] == undefined) {
                            emotes[word] = [start + "-" + (start + word.length - 1)];
                        } else {
                            emotes[word].push(start + "-" + (start + word.length - 1));
                        }
                        break;
                    }
                }

                start += word.length + 1
            }
        } catch (err) {
            console.log(err);
        }

        return Promise.resolve(emotes);
    }

    getMessageDetails() {
        return {
            emotes: this.userstate.emotes,
            id: this.userstate.id,
            tmi_sent_ts: this.userstate["tmi-sent-ts"],
            message: this.message
        };
    }

    getUserLevel() {
        return CONSTANTS.UserLevel[this.userLevel];
    }
    getUserLevelAsText() {
        return this.userLevel.charAt(0).toUpperCase() + this.userLevel.substring(1);
    }

    //Checker
    hasBadge(badgeName) {
        if (!this.userstate.badges)
            return false;

        return this.userstate.badges[badgeName] ? true : false;
    }
    matchUserlevel(userLevel, strictLevel = 0) {
        if (typeof (userLevel) == "string") {
            if (userLevel.indexOf(":") >= 0) {
                let badge = userLevel.substring(0, userLevel.indexOf(":"));
                let version = userLevel.substring(userLevel.indexOf(":") + 1);

                //#ModsMasterrace
                if (strictLevel == 0 && this.getUserLevel() >= CONSTANTS.UserLevel.other) {
                    return true;
                } else if (isNaN(this.userstate.badges[badge])) {
                    if (this.userstate.badges[badge] == version) {
                        return true;
                    }
                } else {
                    //Badge matters - but not the version
                    if (strictLevel == 1) {
                        if (parseInt(this.userstate.badges[badge]) <= version) {
                            return true;
                        } 
                    //Badge and Version matter - but lower Version count too
                    } else if (strictLevel == 2) {
                        if (parseInt(this.userstate.badges[badge]) >= version) {
                            return true;
                        }
                    //Badge and Version matter - EXACT version match
                    } else {
                        if (parseInt(this.userstate.badges[badge]) == version) {
                            return true;
                        }
                    }
                }
            } else if (this.getUserLevel() >= CONSTANTS.UserLevel[userLevel.toLowerCase()]) {
                return true;
            }

            return false;
        } else if (typeof (userLevel) == "number") {
            if (this.getUserLevel() >= userLevel) {
                return true;
            }
        }
        return false;
    }
}

module.exports.TwitchIRC = TwitchIRC;
module.exports.Message = Message;