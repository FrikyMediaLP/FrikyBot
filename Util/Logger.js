let colors = require('colors');
const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
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
            max_input_failures: 3,
            enableFileOutput: false,
            FileStructure: {
                ROOT: "Logs/",
                RAW: "RAW/",
                INPUT: "INPUT/",
                WARN: "WARNING/",
                ERROR: "ERROR/"
            },
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
            try {
                let raw_path_comb = this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + new Date().toLocaleDateString() + ".db";
                this.LogDataBase = new Datastore({ filename: path.resolve(raw_path_comb), autoload: true });
            } catch (err) {
                console.log(err);
            }
            this.ResetLatest();
        }
    }

    addSources(sources = {}) {
        if (typeof (sources) == "object" && sources.length == undefined) {
            for (let source in sources) {
                this.Settings.Sources[source] = sources[source];
                this[source] = {
                    info: (message) => { this.info(message, source) },
                    warn: (message) => { this.warn(message, source) },
                    error: (message) => { this.error(message, source) },
                    input: async (message, onInput) => { return this.input(message, source, onInput) },
                    space: (message) => { this.space(message, source) },
                    spaceln: (message) => { this.spaceln(message, source) }
                };
            }
        }
    }

    //CONSOLE - OUTPUT

    //Types
    info(message, source = "LOGGER") {
        this.println(message, "INFO", source);
    }
    warn(message, source = "LOGGER") {
        this.println(message, "WARN", source);
    }
    error(message, source = "LOGGER") {
        this.println(message.split('\n')[0], "ERROR", source);
    }
    async input(message, source = "LOGGER", onInput = async (line) => Promise.resolve()) {
        this.print(message, "INPUT", source);

        let inputLine;
        let done = false;
        let errs = 0;

        do {
            inputLine = null;
            try {
                inputLine = await this.GetConsoleInputLine();
            } catch (err) {
                this.error(err.message, source);
                i++;

                if (errs >= this.Settings.max_input_failures) {
                    this.warn("Console Input CANCLED! Max Retries reached!", source);
                    return Promise.reject(err);
                }
            }
            
            try {
                await onInput(inputLine);
                done = true;
            } catch (err) {
                done = false;
            }
        } while (!done);
        
        return Promise.resolve(inputLine);
    } 

    //Creating Output
    createOutput(message = "", type = "INFO", source = "LOGGER", colored = false) {
        let output = "";
        let curL = 0;

        //TIME
        output += this.GetTimeString(new Date(), curL, colored);
        if (this.Settings.displayTime == true) curL += 1 + 8;

        //SOURCE
        output += this.GetSourceString(source, curL, colored);
        if (this.Settings.displaySource == true) curL += 1 + source.length + 2;

        //TYPE
        output += this.GetTypeString(type, curL, colored);
        if (this.Settings.displayType == true) curL = this.Settings.targetTypeLength + type.length + 2;

        //MESSAGE
        output += this.GetMessageString(message, curL, type, colored);
        curL = this.Settings.targetMsgLength + message.length;

        return output;
    }

    space(message = "", source = "LOGGER") {
        let send = this.GetMessageString(message, 0, null, this.Settings.colorMode);
        let sendBW = this.GetMessageString(message, 0, null, false);

        this.onLog(new Date(), message, "SPACE", source, send, sendBW, false);
    }
    spaceln(message = "", source = "LOGGER") {
        let send = this.GetMessageString(message, 0, null, this.Settings.colorMode);
        let sendBW = this.GetMessageString(message, 0, null, false);

        this.onLog(new Date(), message, "SPACE", source, send, sendBW, true);
    }
    
    print(message = "", type = "INFO", source = "LOGGER") {
        let send = "";
        let sendBW = "";

        if (this.Settings.colorMode == true) {
            send = this.createOutput(message, type, source, true);
            sendBW = this.createOutput(message, type, source, false);
        } else {
            send = this.createOutput(message, type, source, false);
            sendBW = send + "";
        }

        this.onLog(new Date(), message, type, source, send, sendBW, false);
    }
    println(message = "", type = "INFO", source = "LOGGER") {
        let send = "";
        let sendBW = "";

        if (this.Settings.colorMode == true) {
            send = this.createOutput(message, type, source, true);
            sendBW = this.createOutput(message, type, source, false);
        } else {
            send = this.createOutput(message, type, source, false);
            sendBW = send + "";
        }
        
        this.onLog(new Date(), message, type, source, send, sendBW, true);
    }
    
    GetTimeString(time, curL = 0, colored = false) {
        if (this.Settings.displayTime == true) {
            return " " + this.GetTime(time, colored);
        }

        return "";
    }
    GetSourceString(source, curL = 0, colored = false) {
        if (this.Settings.displaySource == true) {
            return " " + this.GetSource(source, colored);
        }

        return "";
    }
    GetTypeString(type, curL = 0, colored = false) {
        let send = "";
        if (this.Settings.displayType == true) {
            if (this.Settings.autoTargetLength && this.Settings.targetTypeLength < curL) {
                this.Settings.targetTypeLength = curL;
            }

            for (let i = curL; i < this.Settings.targetTypeLength; i++) {
                send += " ";
            }

            send += " " + this.GetType(type, colored);
        }

        return send;
    }
    GetMessageString(message, curL = 0, type, colored = false) {
        let send = "";

        if (this.Settings.autoTargetLength && this.Settings.targetMsgLength < curL) {
            this.Settings.targetMsgLength = curL;
        }

        for (let i = curL; i < this.Settings.targetMsgLength; i++) {
            send += " ";
        }

        let coloredMsg = this.GetMessage(message, colored);
        if (colored == true) {
            if (type == "WARN") {
                coloredMsg = coloredMsg.yellow;
            } else if (type == "ERROR") {
                coloredMsg = coloredMsg.red;
            }
        }

        return send + " " + coloredMsg;
    }

    GetTime(date = new Date(), colored = false) {
        return "[" + (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + "]";
    }
    GetSource(source, colored = false) {
        if (colored == true) {
            if (this.Settings.Sources[source] && this.Settings.Sources[source].display) {
                return this.Settings.Sources[source].display();
            }
        }
        
        return "[" + source + "]";
    }
    GetType(type, colored = false) {
        if (colored == true) {
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
    GetMessage(message, colored = false) {
        return message;
    }

    onLog(time = new Date(), message, type, source, outputString, outputStringBW, lineBreak) {
        if (lineBreak === true) {
            console.log(outputString);
        } else if (lineBreak === false) {
            process.stdout.write(outputString);
        }

        //File Export
        if (this.Settings.enableFileOutput) {
            this.Save2DB(time, source, type, outputStringBW);
            this.Save2Log(time, outputStringBW + (lineBreak ? "\n" : ""), type);
        }
    }

    //CONSOLE - INPUT
    async ConsoleYN() {
        let yn = undefined;
        //Console Input
        do {
            let answer = await this.GetConsoleInputLine();
            //Make into String and remove '\' and 'n' Chars from the linebreak
            answer = this.trimInputLine(answer).toLowerCase();

            if (answer === "yes" || answer === "y") {
                yn = true;
            } else if (answer === "no" || answer === "n") {
                yn = false;
            } else {
                process.stdout.write("Write 'Yes' or 'No'! > ");
            }
        } while (yn === undefined);

        return Promise.resolve(yn);
    }
    async GetConsoleInputLine() {
        return new Promise((resolve, reject) => {
            let callback = (data) => {
                process.stdin.removeListener("data", callback);
                resolve(this.trimInputLine(data));
            }
            process.stdin.on("data", callback);
        });
    }
    trimInputLine(answerString) {
        answerString = answerString.toString();
        let last = answerString.length;
        for (let i = answerString.length - 1; i >= 0; i--) {
            if (answerString.charAt(i) < 20) {
                last = i;
            } else {
                break;
            }
        }

        return answerString.substring(0, last);
    }
    
    //File Export
    Save2Log(time = new Date(), consoleString, type = "OUTPUT") {
        let filename = time.toLocaleDateString();
        let fpath = this.Settings.FileStructure.ROOT;

        if (this.Settings.enableFileOutput) {
            if (type === "ERROR") {
                fpath += this.Settings.FileStructure.ERROR;
            } else if (type === "WARN") {
                fpath += this.Settings.FileStructure.WARN;
            } else if (type === "INPUT") {
                fpath += this.Settings.FileStructure.INPUT;
            } else {
                fs.appendFileSync(path.resolve(fpath + this.Settings.FileStructure.RAW + "latest.txt"), consoleString);
                return;
            }

            fs.appendFileSync(path.resolve(fpath + filename + ".txt"), consoleString);
            fs.appendFileSync(path.resolve(this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + "latest.txt"), consoleString);
        }
    }
    Save2DB(time = new Date(), source, type, message) {
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

    ResetLatest() {
        try {
            let path_comb = this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + "latest.txt";
            fs.writeFileSync(path.resolve(path_comb), "");
        } catch (err) {
            console.log(err);
        }
    }

    //UTIL
    identify() {
        return "FrikyBotLogger";
    }
    replaceAll(string, replace, wITH) {
        if (typeof string != "string")
            return string;

        while (string.indexOf(replace) >= 0) {

            string = string.substring(0, string.indexOf(replace)) + wITH + string.substring(string.indexOf(replace) + replace.length);
        }

        return string;
    }
}

module.exports = Logger;