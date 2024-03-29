let colors = require('colors');
const FrikyDB = require('./FrikyDB.js');
const path = require('path');
const fs = require('fs');

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

        this.CURRENT_RAW_FILE = this.GetTodaysRAWPath();

        if (this.Settings.enableFileOutput == true && fs.existsSync(path.resolve(this.Settings.FileStructure.ROOT))) {
            try {
                this.LogDataBase = new FrikyDB.Collection({ path: path.resolve(this.CURRENT_RAW_FILE) });
            } catch (err) {
                this.warn(err.message);
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
    info(message = "", source = "LOGGER") {
        this.println(message, "INFO", source);
    }
    warn(message = "", source = "LOGGER") {
        this.println(message, "WARN", source);
    }
    error(message = "", source = "LOGGER") {
        this.println(message.split('\n')[0], "ERROR", source);
    }
    async input(message, source = "LOGGER", onInput = async (line) => Promise.resolve()) {
        this.print(message, "INPUT", source);

        let inputLine;
        let done = false;

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
            this.Save2DB(time, source, type, message);
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
        //Save to Latest
        if (!fs.existsSync(path.resolve(this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + "latest.txt"))) return;
        fs.appendFileSync(path.resolve(this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + "latest.txt"), consoleString);

        //Save to Categorie
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
                return;
            }

            if (!fs.existsSync(path.resolve(fpath + filename + ".txt"))) return;
            fs.appendFileSync(path.resolve(fpath + filename + ".txt"), consoleString);
        }
    }
    Save2DB(time = new Date(), source, type, message) {
        if (!this.LogDataBase || !this.Settings.enableFileOutput) return;
        if (this.Settings.Sources[source] && this.Settings.Sources[source].enableFileOutput == false) return;

        try {
            if (this.GetTodaysRAWPath(time) !== this.CURRENT_RAW_FILE) {
                this.CURRENT_RAW_FILE = this.GetTodaysRAWPath(time);
                this.LogDataBase = new FrikyDB.Collection({ path: path.resolve(this.CURRENT_RAW_FILE) });
            }
        } catch (err) {
            return;
        }

        this.LogDataBase.insert({
            time: time.getTime(),
            source: source,
            type: type,
            message: message
        }).catch(err => this.Logger.warn("Connection Logging: " + err.message));
    }

    ResetLatest() {
        if (!fs.existsSync(path.resolve(this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + "latest.txt"))) return;

        try {
            let path_comb = this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + "latest.txt";
            fs.writeFileSync(path.resolve(path_comb), "");
        } catch (err) {
            this.error(err.message);
        }
    }
    GetAllRawLogNames() {
        return fs.readdirSync(path.resolve(this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW));
    }

    //Access Databases
    async GetRawLog(log_name, query = {}, pagination) {
        let log;

        if (log_name === undefined) {
            log = this.LogDataBase;
        } else {
            let raw_path_comb = this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + log_name + ".db";
            log = new FrikyDB.Collection({ path: path.resolve(raw_path_comb) });
        }

        return this.AccessFrikyDB(log, query, pagination);
    }

    async AccessFrikyDB(collection, query = {}, pagination) {
        if (!collection) return Promise.resolve([]);
        if (pagination instanceof Object) pagination = this.GetPaginationString(pagination.first, pagination.cursor, pagination);

        let collection_slice = [];

        try {
            collection_slice = await collection.find(query);
        } catch (err) {
            return Promise.reject(err);
        }

        if (pagination) {
            let pages = this.GetPaginationValues(pagination);
            let first = 10;
            let cursor = 0;
            let opts = {};

            if (pages) {
                first = pages[0] || 10;
                cursor = pages[1] || 0;
                opts = pages[2] || {};
            }

            if (first > 0) opts.pagecount = Math.ceil(collection_slice.length / first);

            if (opts.timesorted) collection_slice = collection_slice.sort((a, b) => {
                if (a.time) return (-1) * (a.time - b.time);
                else if (a.iat) return (-1) * (a.iat - b.iat);
                else return 0;
            });

            if (opts.customsort) collection_slice = collection_slice.sort((a, b) => {
                return (-1) * (a[opts.customsort] - b[opts.customsort]);
            });

            return Promise.resolve({
                data: collection_slice.slice(first * cursor, first * (cursor + 1)),
                pagination: this.GetPaginationString(first, cursor + 1, opts)
            });
        } else {
            return Promise.resolve(collection_slice);
        }
    }
    GetPaginationValues(pagination = "") {
        if (!pagination) return null;
        let out = [10, 0, {}];

        try {
            if (pagination.indexOf('A') >= 0 && pagination.indexOf('B') >= 0 && pagination.indexOf('C') >= 0) {
                out[0] = parseInt(pagination.substring(1, pagination.indexOf('B')));
                out[1] = parseInt(pagination.substring(pagination.indexOf('B') + 1, pagination.indexOf('C')));
            }

            if (pagination.indexOf('T') >= 0) out[2].timesorted = true;
            if (pagination.indexOf('CSS') >= 0 && pagination.indexOf('CSE') >= 0) {
                out[2].customsort = pagination.substring(pagination.indexOf('CSS') + 3, pagination.indexOf('CSE'));
            }
            if (pagination.indexOf('PS') >= 0 && pagination.indexOf('PE') >= 0) out[2].pagecount = parseInt(pagination.substring(pagination.indexOf('PS') + 2, pagination.indexOf('PE')));
        } catch (err) {
            return null;
        }

        return out;
    }
    GetPaginationString(first = 10, cursor = 0, options = {}) {
        let s = "A" + first + "B" + cursor + "C";
        if (options.timesorted) s += "T";
        if (options.customsort) s += "CSS" + options.customsort + "CSE";
        if (options.pagecount !== undefined) s += "PS" + options.pagecount + "PE";
        return s;
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
    GetTodaysRAWPath(time) {
        return this.Settings.FileStructure.ROOT + this.Settings.FileStructure.RAW + this.replaceAll(this.replaceAll((time || new Date()).toLocaleDateString(), '/', '_'), '.', '_') + ".db";
    }
}

module.exports = Logger;