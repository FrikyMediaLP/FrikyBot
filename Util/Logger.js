let colors = require('colors');
const Datastore = require('nedb');
const path = require('path');
const CONSTANTS = require('./CONSTANTS.js');

class Logger {
    constructor(settings = {}) {
        this.Settings = {
            targetTypeLength: 0,
            targetMsgLength: 0,
            autoTargetLength: true,
            displayTime: true,
            displaySource: true,
            displayType: true,
            colorMode: true,
            enableFileOutput: false,
            outputFile: "LOG.db",
            Sources: {

            }
        };

        //Ensure settings is an object
        if (typeof settings == "object" && settings.length == undefined) {
            for (let setting in settings) {
                //one time nesting
                if (typeof settings[setting] == "object" && settings[setting].length == undefined) {
                    for (let innerSetting in settings[setting]) {
                        this.Settings[setting][innerSetting] = settings[setting][innerSetting];
                    }
                } else {
                    this.Settings[setting] = settings[setting];
                }
            }
        }

        if (this.Settings.enableFileOutput == true) {
            let file = this.Settings.outputFile;

            if (file == "LOG.db") {
                file = "LOG - " + Date.now() + ".db";
            }

            try {
                this.LogDataBase = new Datastore({ filename: path.resolve("./DATA/Log/" + file), autoload: true });
            } catch (err) {
                console.log(err);
            }
        }
    }

    addSources(sources = {}) {
        if (typeof (sources) == "object" && sources.length == undefined) {
            for (let source in sources) {
                this.Settings.Sources[source] = sources[source];
                this[source] = {
                    info: (message) => { this.info(message, source) },
                    warn: (message) => { this.warn(message, source) },
                    error: (message) => { this.error(message, source) }
                };
            }
        }
    }
     
    //BASE
    print(message = "", type = "INFO", source = "LOGGER") {
        let send = "";
        let curL = 0;
        let time = new Date();

        //TIME
        if (this.Settings.displayTime == true) {
            send += " " + this.GetTime(time);
            curL += 1 + 8;
        }

        //SOURCE
        if (this.Settings.displaySource == true) {
            send += " " + this.GetSource(source);
            curL += 1 + source.length + 2;
        }
        
        //TYPE
        if (this.Settings.displayType == true) {
            if (this.Settings.autoTargetLength && this.Settings.targetTypeLength < curL) {
                this.Settings.targetTypeLength = curL;
            }
            
            for (let i = curL; i < this.Settings.targetTypeLength; i++) {
                send += " ";
            }
            
            send += " " + this.GetType(type);
            curL = this.Settings.targetTypeLength + type.length + 2;
        }
        
        //MESSAGE
        if (this.Settings.autoTargetLength && this.Settings.targetMsgLength < curL) {
            this.Settings.targetMsgLength = curL;
        }
        
        for (let i = curL; i < this.Settings.targetMsgLength; i++) {
            send += " ";
        }
        
        curL = this.Settings.targetMsgLength + message.length;

        //OUTPUT
        let coloredMsg = this.GetMessage(message);
        if (this.Settings.colorMode) {
            if (type == "WARN") {
                coloredMsg = coloredMsg.yellow;
            } else if (type == "ERROR") {
                coloredMsg = coloredMsg.red;
            }
        }

        console.log(send + " " + coloredMsg);

        if (this.LogDataBase && this.Settings.enableFileOutput) {
            if ((this.Settings.Sources[source] && this.Settings.Sources[source].enableFileOutput != false) || !this.Settings.Sources[source]) {
                this.LogDataBase.insert({
                    time: time.getTime(),
                    source: source,
                    type: type,
                    message: message
                });
            }
        }
    }

    info(message, source = "LOGGER") {
        this.print(message, "INFO", source);
    }
    warn(message, source = "LOGGER") {
        this.print(message, "WARN", source);
    }
    error(message, source = "LOGGER") {
        this.print(message.split('\n')[0], "ERROR", source);
    }
    
    GetTime(date = new Date()) {
        return "[" + (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + "]";
    }
    GetSource(source) {
        if (this.Settings.colorMode) {
            if (this.Settings.Sources[source] && this.Settings.Sources[source].display) {
                return this.Settings.Sources[source].display();
            }
        }
        
        return "[" + source + "]";
    }
    GetType(type) {
        if (this.Settings.colorMode) {
            if (type == "INFO") {
                return (" INFO ").inverse;
            } else if (type == "WARN") {
                return (" WARN ").inverse.yellow;
            } else if (type == "ERROR") {
                return (" ERROR ").inverse.red;
            } else if (type == undefined) {
                return "";
            }
        }

        return "[" + type + "]";
    }
    GetMessage(message) {
        return message;
    }
    
    //UTIL
    identify() {
        return "FrikyBotLogger";
    }
}

module.exports = Logger;