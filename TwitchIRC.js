const tmi = require('tmi.js');
const CONSTANTS = require('./CONSTANTS.js');

class TwitchIRC {
    
    constructor(user, pw, channel) {
        console.log("Twitch IRC Connection init...");

        //User settings
        this.Username = undefined;
        this.Passwort = undefined;
        this.Channel = undefined;

        //Connection client
        this.client = undefined;

        //set Login settings
        if (user && pw && channel) {
            this.Username = user;
            this.Passwort = pw;
            this.Channel = channel;
        } else {
            console.log("Fill in User, Password AND Channel!");
            return;
        }
        
        this.client = new tmi.client({
            identity: {
                username: this.Username,
                password: this.Passwort
            },
            channels: [
                this.Channel
            ]
        });

        //Handle Ping - Pong  (does automatically)
        //client.on('ping', () => { client.ping(); console.log("PING PONG"); });
    }

    //use this to Connect to Twitch Chat
    Connect(user, pw, channel) {

        //Change Login settings?
        if (user || pw || channel) {
            if (user && pw && channel) {
                this.Username = user;
                this.Passwort = pw;
                this.Channel = channel;

                this.client = new tmi.client({
                    identity: {
                        username: this.Username,
                        password: this.Passwort
                    },
                    channels: [
                        this.Channel
                    ]
                });
            } else {
                console.log("Fill in User, Password AND Channel to change one of them!");
                return;
            }
        }

        //Client defined?
        if (this.client) {
            this.client.connect();
        } else {
            console.log("Client not defined! Client init went wrong or client disconnected?");
        }
    }

    on(event, handler) {
        if (this.client) {
            this.client.on(event, handler);
        } else {
            console.log("Client not defined! Client init went wrong or client disconnected?");
        }
    }

    send(message) {
        if (this.client) {
            this.client.say(this.Channel, message.toString())
                .then((data) => {
                    //console.log(data);
                }).catch((err) => {
                    //console.log(err);
                });
        } else {
            console.log("Client not defined! Client init went wrong or client disconnected?");
        }
    }

}

class Message {
    constructor(channel, userstate, message) {
        this.message = message;
        this.channel = channel;
        this.userstate = userstate;

        if (this.hasBadge("staff")) {
            this.userLevel = CONSTANTS.UserLevel.Staff;
        } else if (this.hasBadge("admin")) {
            this.userLevel = CONSTANTS.UserLevel.Admin;
        } else if (this.hasBadge("broadcaster")) {
            this.userLevel = CONSTANTS.UserLevel.Broadcaster;
        } else if (this.hasBadge("global_mod")) {
            this.userLevel = CONSTANTS.UserLevel.GlobalMod;
        } else if (this.hasBadge("moderator") || userstate.mod == 1) {
            this.userLevel = CONSTANTS.UserLevel.Moderator;
        } else if (this.hasBadge("vip")) {
            this.userLevel = CONSTANTS.UserLevel.VIP;
        } else if (this.hasBadge("subscriber")) {
            this.userLevel = CONSTANTS.UserLevel.Subscriber;
        } else {
            this.userLevel = CONSTANTS.UserLevel.Regular;
        }
    }

    getDisplayName() {
        return (this.userstate['display-name'] && this.userstate['display-name'] != "" ? this.userstate['display-name'] : this.userstate.username);
    }

    toString() {
        return this.userstate['display-name'] + " : " + this.message;
    }

    toJSON() {

        let temp = this.userstate;
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

    getUser() {
        return userstate;
    }

    getMessage() {
        return this.message;
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

    getMessageDetails() {
        return {
            emotes: this.userstate.emotes,
            flags: this.userstate.flags,
            id: this.userstate.id,
            tmi_sent_ts: this.userstate["tmi-sent-ts"],
            message: this.message
        };
    }

    getUserLevel() {
        return this.userLevel;
    }

    getUserLevelAsText() {
       return Object.getOwnPropertyNames(CONSTANTS.UserLevel)[Object.getOwnPropertyNames(CONSTANTS.UserLevel).length - 1 - this.userLevel];
    }

    hasBadge(badgeName) {
        return this.userstate.badges[badgeName] ? true : false;
    }
}


module.exports.TwitchIRC = TwitchIRC;
module.exports.Message = Message;