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

        if (Array.isArray(this.Channel)) {
            this.client = new tmi.client({
                identity: {
                    username: this.Username,
                    password: this.Passwort
                },
                channels: this.Channel
            });
        } else {
            this.client = new tmi.client({
                identity: {
                    username: this.Username,
                    password: this.Passwort
                },
                channels: [
                    this.Channel
                ]
            });
        }

        

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

                if (Array.isArray(this.Channel)) {
                    this.client = new tmi.client({
                        identity: {
                            username: this.Username,
                            password: this.Passwort
                        },
                        channels: this.Channel
                    });
                } else {
                    this.client = new tmi.client({
                        identity: {
                            username: this.Username,
                            password: this.Passwort
                        },
                        channels: [
                            this.Channel
                        ]
                    });
                }
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

    //only one channel - uses first in array
    send(message) {
        if (this.client) {

            if (Array.isArray(this.Channel)) {
                this.client.say(this.Channel[0], message.toString())
                    .then((data) => {
                        //console.log(data);
                    }).catch((err) => {
                        //console.log(err);
                    });
            } else {
                this.client.say(this.Channel, message.toString())
                    .then((data) => {
                        //console.log(data);
                    }).catch((err) => {
                        //console.log(err);
                    });
            }
        } else {
            console.log("Client not defined! Client init went wrong or client disconnected?");
        }
    }

    //multy channel
    say(channel, message) {
        if (this.client) {
            this.client.say(channel, message.toString())
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

        //set Userlevel
        this.userLevel = CONSTANTS.UserLevel.Regular;

        for (let badge in userstate.badges) {
            let tempUL = getRealUserlevel(badge);

            if (tempUL > this.userLevel) {
                this.userLevel = tempUL;
            }
        }
    }

    //transform to
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

    //GET
    getDisplayName() {
        return (this.userstate['display-name'] && this.userstate['display-name'] != "" ? this.userstate['display-name'] : this.userstate.username);
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

    //Checker
    hasBadge(badgeName) {

        if (!this.userstate.badges)
            return false;

        return this.userstate.badges[badgeName] ? true : false;
    }
    matchUserleve(realUserlevelToCheck) {
        if (this.userLevel >= realUserlevelToCheck) {
            return true;
        }
        return false;
    }
}

function getRealUserlevel(name) {
    //Is in Hirachy
    for (let key in CONSTANTS.UserLevel) {
        if (key == name || key.toLowerCase() == name.toLowerCase()) {
            return CONSTANTS.UserLevel[key];
        }
    }

    if (name.lastIndexOf(":") >= 0) {
        name = name.substring(0, name.lastIndexOf(":"));
    }

    if (CONSTANTS.BADGES[name] || CONSTANTS.BADGES[name.toLowerCase()]) {
        return CONSTANTS.UserLevel["Other"];
    }

    return -1;
}

module.exports.TwitchIRC = TwitchIRC;
module.exports.Message = Message;