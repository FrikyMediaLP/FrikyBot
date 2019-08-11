const tmi = require('tmi.js');

class TwitchIRC {
    
    constructor(user, pw, channel) {
        console.log("Twitch Connection init...");

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
            this.client.say(this.Channel, message)
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
    }

    toString() {
        return this.userstate['display-name'] + " : " + this.message;
    }

    getUser() {
        return userstate;
    }

    getMessage() {
        return this.message;
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

    hasCommand(command) {
        if (command)
            return (this.message.indexOf(command) >= 0);
        else
            return false;
    }
}


module.exports.TwitchIRC = TwitchIRC;
module.exports.Message = Message;