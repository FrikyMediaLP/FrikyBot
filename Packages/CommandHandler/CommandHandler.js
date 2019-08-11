const CONSTANTS = require('./../../CONSTANTS.js');

let COMMAND_CONTENT_REQUIRED = ["prefix", "name", "cooldown", "output_string"];
let CommandTemplate = {
    uid: 123123,
    prefix: "",
    name: "",
    cooldown: "",
    output_string: ""
};

class CommandHandler extends require('./../PackageBase.js').PackageBase{

    constructor(config, app, twitchIRC, twitchNewApi) {
        super(config, app, twitchIRC, twitchNewApi, "CommandHandler");

        this.InitAPIEndpoints();
        this.Commands = [];
        this.Variables = {};

        this.loadCommands();
        this.loadVariables();
    }
    InitAPIEndpoints() {

        /*
         *  ----------------------------------------------------------
         *                      BOT API
         *     /api/MessageDatabase/
         *     - GET:  returns Name
         *  ----------------------------------------------------------
         */

        super.AddAPIEndpoint('GET', '/', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.name                     //Name
            });
        }, false);

        super.AddAPIEndpoint('GET', '/Commands', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.Commands                 //Commands
            });
        }, false);

        super.AddAPIEndpoint('POST', '/Commands', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.Commands                 //Commands
            });
        }, false);

        super.AddAPIEndpoint('GET', '/Variables', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.Variables                //Variables
            });
        }, false);

        super.AddAPIEndpoint('POST', '/Variables', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.Variables                //Variables
            });
        }, false);
    }

    MessageHandler(message) {

        if (this.isHardCodedCommand(message.message.indexOf(cmd.prefix + cmd.name))) {

        } else {
            for (let cmd of this.Commands) {
                if (message.message.indexOf(cmd.prefix + cmd.name) >= 0) {
                    this.executeCommand(cmd, message);
                    break;
                }
            }
        }
    }

    isHardCodedCommand() {

    }

    executeCommand(command, message) {
        if (command) {
            if (command.output_string) {
                let temp = false;
                let output = das;

                do {
                    output = temp;
                    temp = this.replaceVariables((temp ? temp : command.output_string), message, command);
                } while (temp != false);
                
                this.twitchIRC.send(output);
            }
        }
    }

    replaceVariables(command, message, origCommand) {

        if (command.indexOf("$(") >= 0) {
            if (command.indexOf(")", command.indexOf("$(")) >= 0) {
                
                let variables = [];
                let start = 0;
                let open;
                let close;
                
                while (start >= 0 && start < command.length) {
                    if (command.indexOf("$(", start) < 0) break;
                    start = command.indexOf("$(", start) + 2;

                    open = 1;
                    close = 0;

                    let tempStart = start;

                    while (open != close) {
                        if (command.indexOf("$(", tempStart) < command.indexOf(")", tempStart) && command.indexOf("$(", tempStart) >= 0) {
                            open++;
                            tempStart = command.indexOf("$(", tempStart) + 2;
                        } else if (command.indexOf(")", tempStart) >= 0) {
                            close++;
                            tempStart = command.indexOf(")", tempStart) + 1;
                        } else {
                            console.log("ERRRRR");
                            return false;
                        }
                    }
                    
                    variables.push(command.substring(start - 2, tempStart))
                    start = tempStart;
                }

                for (let vari of variables) {

                    let replaced = this.replaceVariables(vari.substring(2, vari.length - 1), message, origCommand);

                    if (replaced == false) {
                        let content = this.getVariableContent(vari, message, origCommand);
                        
                        command = command.substring(0, command.indexOf(vari)) + (content ? content : "") + command.substring(command.indexOf(vari) + vari.length);
                    } else {
                        command = command.substring(0, command.indexOf(vari) + 2) + replaced + command.substring(command.indexOf(vari) + vari.length - 1);
                    }
                }

                return command;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    getVariableContent(variable, message, command) {

        let name = variable.substring(2, (variable.indexOf(" ") >= 0 ? variable.indexOf(" ") : variable.length - 1));
        let parameters = (variable.indexOf(" ") >= 0 ? variable.substring(message.message.indexOf(" ") + 3, variable.length - 1) : "");
        
        console.log(parameters);

        if (name == "toUser") {
            return (message.message.split(" ").length > 1 ? message.message.split(" ")[1] : message.userstate['display-name']);
        } else if (name == "random") {
            try {
                let min = parseInt(parameters.split(" ")[0]);
                let max = parseInt(parameters.split(" ")[1]);
                let rng = Math.floor(Math.random() * max) + min;

                return rng;
            } catch (err) {
                return "";
            }
        } else if (name == "channel") {
            return this.twitchIRC.Channel;
        } else if (name == "game") {
            return "GAR NIX LUL";
        } else if (name == "SR") {
            return "Grandmaster / Top500";
        } else {
            try {
                return message.message.split(" ")[parseInt(name)];
            } catch (err) {
                return "";
            }
        }
    }

    loadCommands() {
        try {

            let s = super.readFile(this.config.Commands_File);

            //read File and convert to JSON (errors if errored before)
            let json = JSON.parse(s);

            let temp = [];

            for (let cmd of json.COMMANDS) {

                //check JSON for Completion
                let completion = super.checkForCompletion(cmd, CommandTemplate, COMMAND_CONTENT_REQUIRED);

                if (completion != "COMPLETE") {
                    console.log("ERROR: Command " + (cmd.uid ? cmd.uid + " " : "") + "not complete: " + completion.red);
                } else {
                    temp.push(cmd);
                }
            }

            this.Commands = temp;
        } catch (err) {
            console.log("ERROR: " + err);
            return err;
        }
    }
    loadVariables() {
        try {

            let s = super.readFile(this.config.Variables_File);

            //read File and convert to JSON (errors if errored before)
            let json = JSON.parse(s);

            let temp = { };

            for (let vari of Object.getOwnPropertyNames(json)) {

                //check JSON for Completion
                let completion = "UNKNOWN ERROR!";

                if (!json[vari].pretitle) {
                    completion = "pretitle missing!"
                } else{
                    if (json[vari].Nightbot) {
                        if (!json[vari].Nightbot.version) {
                            completion = "Nightbot version missing!"
                        } else {
                            if (!json[vari].Nightbot.link) {
                                completion = "Nightbot link missing!"
                            } else {
                                completion = "COMPLETE";
                            }
                        }
                    } else {
                        if (!json[vari].description) {
                            completion = "description missing!";
                        } else {
                            completion = "COMPLETE";
                        }
                    }
                }

                if (completion != "COMPLETE") {
                    console.log("ERROR: Variable " + vari + " not complete: " + completion.red);
                } else {
                    temp[vari] = json[vari];
                }
            }

            this.Variables = temp;
        } catch (err) {
            console.log("ERROR: " + err);
            return err;
        }
    }
}

module.exports.CommandHandler = CommandHandler;