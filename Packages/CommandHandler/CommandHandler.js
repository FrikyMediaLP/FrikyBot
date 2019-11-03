const CONSTANTS = require('./../../CONSTANTS.js');

let COMMAND_CONTENT_REQUIRED = ["prefix", "name", "cooldown", "output", "enabled"];
let CommandTemplate = {
    uid: 123123,
    prefix: "",
    name: "",
    cooldown: "",
    output: "",
    enabled: false
};

class CommandHandler extends require('./../PackageBase.js').PackageBase{

    constructor(config, app, twitchIRC, twitchNewApi) {

        //Create Details
        let det = {
            Description: "Typical Command Handler as you know it!",
            Capabilities: {
                Chat: {
                    title: "Uses the TwitchIRC Chat to check Chat Messages for Commands!"
                },
                MessageHandler: {
                    title: "If supplied, Commands can be tracked by the MessageHandler Package!",
                    depended: false
                },
                TwitchAPI: {
                    title: "Uses the Twitch NEW API to execute Commands/get User specific Data or change Stream Details"
                }
            },
            Settings: {
                enabled: ((config.enabled == undefined || config.enabled == true) ? true : false)
            }
        };

        super(config, app, twitchIRC, twitchNewApi, "CommandHandler", det);

        this.InitAPIEndpoints();
        this.Commands = [];
        this.CommandVariables = {};
        this.Variables = {};

        this.loadCommands();
        this.loadCommandVariables();
        this.loadVariables();
    }
    InitAPIEndpoints() {

        /*
         *  ----------------------------------------------------------
         *                      BOT API
         *     /api/CommandHandler/
         *     - GET:  returns Name
         *  ----------------------------------------------------------
         */
        
        super.AddAPIEndpoint('GET', '/', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: {                             //Details
                    [this.name]: this.details
                }
            });
        }, false);

        super.AddAPIEndpoint('GET', '/Commands', (request, response) => {
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
                data: this.CommandVariables                //Variables
            });
        }, false);
    }

    MessageHandler(message) {

        for (let cmd of this.Commands.Hardcoded) {
            if (cmd.enabled && message.message.indexOf(cmd.prefix + cmd.name) >= 0) {
                if(this.isHardCodedCommand(message))                                        //check and execute and return - when not pressent or no access then
                    return;                                                                 
                break;                                                                      //just break and check custom commands
            }
        }

        for (let cmd of this.Commands.Custom) {
            if (cmd.enabled && message.message.indexOf(cmd.prefix + cmd.name) >= 0) {
                this.executeCommand(cmd, message);
                return;
            }
        }
    }
    isHardCodedCommand(message) {

        let commandName = message.message.split(" ")[0];
        let parameters = (message.message.split(" ").length == 1 ? "" : message.message.substring((message.message.indexOf(" ") + 1)));
        
        if (commandName == "!game") {
            if (message.getUserLevel() >= CONSTANTS.UserLevel.Moderator) {
                //print Game
                if (parameters == "") {
                    this.twitchIRC.send("Friky spielt grade " + this.getVariableContent("$(game)", "", ""));
                } else {
                    //print Game
                    if (parameters.charAt(0) == "@") {
                        this.twitchIRC.send(parameters + " -> Friky spielt grade " + this.getVariableContent("$(game)", "", ""));
                    } else {
                        //nothing for now - wait till TwitchNewAPI implemented
                    }
                }
            } else {
                this.twitchIRC.send("@" + (parameters == "" ? message.getDisplayName() : parameters) + " -> Friky spielt grade " + this.getVariableContent("$(game)", "", ""));
            }
            return true;
        }

        return false;
    }
    
    getVariableContent(variable, message, command) {
        
        let name = variable.substring(2, (variable.indexOf(" ") >= 0 ? variable.indexOf(" ") : variable.length - 1));
        let parameters = (variable.indexOf(" ") >= 0 ? variable.substring(message.message.indexOf(" ") + 3, variable.length - 1) : "");
        
        if (name == "toUser") {
            //Nighbot inspired
            return (message.message.split(" ").length > 1 ? message.message.split(" ")[1] : message.userstate['display-name']);
        } else if (name == "random") {
            try {
                let min = parseInt(parameters.split(" ")[1]);
                let max = parseInt(parameters.split(" ")[2]);
                let rng = Math.floor(Math.random() * max) + min;

                return rng;
            } catch (err) {
                return "";
            }
        } else if (name == "channel") {
            return this.twitchIRC.Channel;
        } else if (name == "game") {
            //placeholder for now - wait till TwitchNewAPI implemented
            return "GAR NIX LUL";
        } else if (name == "OWRankName") {
            //return the Rankname of a given SR
            let SR = parseInt(parameters.split(" ")[1]);
            if (SR < 1500) {
                return "Bronze";
            } else if (SR < 2000) {
                return "Silver";
            } else if (SR < 2500) {
                return "Gold";
            } else if (SR < 3000) {
                return "Platin";
            } else if (SR < 3500) {
                return "Diamond";
            } else if (SR < 4000) {
                return "Master";
            } else if (SR < 5000) {
                return "Grandmaster";
            } else {
                return "";
            }
        } else {

            //has number -> use Nighbot inspired - (Argument)
            if (message.message.split(" ")[parseInt(name)]) {
                return message.message.split(" ")[parseInt(name)];
            }

            //otherwise search after a variable name in the variable.json file
            let curVarObj = this.Variables;

            for (let part of name.substring(0, name.lastIndexOf(".")).split(".")) {

                if (curVarObj[part]) {
                    curVarObj = curVarObj[part];
                }
            }

            if (curVarObj[name.split(".")[name.split(".").length-1]]) {
                //replace or output
                if (message.message.split(" ").length >= 2) {
                    //replace

                    this.Variables = super.ReplaceObjectContents(this.Variables, name, message.message.split(" ")[1]);
                    
                    super.writeFile(this.config.Variables_File, JSON.stringify(this.Variables, null, 4));
                    return message.message.split(" ")[1];
                } else {
                    //output
                    return curVarObj[name.split(".")[name.split(".").length - 1]];
                }
            } else {
                //init
                if (parameters.split(" ").length == 2 && !super.StringContains(parameters.split(" ")[1], [" ", "\"", ","])) {
                    this.Variables = super.ReplaceObjectContents(this.Variables, name, parameters.split(" ")[1]);
                    
                    super.writeFile(this.config.Variables_File, JSON.stringify(this.Variables, null, 4));
                    return parameters.split(" ")[1];
                }
            }

            return "";
        }
    }

    executeCommand(command, message) {
        if (command) {
            if (command.output_string) {
                let temp = false;
                let output = temp;

                do {
                    output = temp;
                    temp = this.replaceVariables((temp ? temp : command.output_string), message, command);
                } while (temp != false);

                if (typeof output == "string")
                    this.twitchIRC.send(output);
            }
        }
    }
    replaceVariables(command, message, origCommand) {

        if (command.indexOf("$(") >= 0) {
            if (command.indexOf(")", command.indexOf("$(")) >= 0) {
                
                let variables = this.extractVariables(command);

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
    extractVariables(command) {
        let variables = [];
        if (command.indexOf("$(") >= 0) {
            if (command.indexOf(")", command.indexOf("$(")) >= 0) {
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
            }
        }
        return variables;
    }
    loadCommands() {
        try {

            let s = super.readFile(this.config.Commands_File);

            //read File and convert to JSON (errors if errored before)
            let json = JSON.parse(s);

            let temp = {
                Hardcoded: [],
                Custom: [],
            };

            //Hardcoded Commands
            for (let cmd of json.COMMANDS.Hardcoded) {

                //check JSON for Completion
                let completion = super.checkForCompletion(cmd, CommandTemplate, COMMAND_CONTENT_REQUIRED);

                if (completion != "COMPLETE") {
                    console.log("ERROR: Command " + (cmd.uid ? cmd.uid + " " : "") + "not complete: " + completion.red);
                } else {
                    temp.Hardcoded.push(cmd);
                }
            }

            //Custom Commands
            for (let cmd of json.COMMANDS.Custom) {

                //check JSON for Completion
                let completion = super.checkForCompletion(cmd, CommandTemplate, COMMAND_CONTENT_REQUIRED);

                if (completion != "COMPLETE") {
                    console.log("ERROR: Command " + (cmd.uid ? cmd.uid + " " : "") + "not complete: " + completion.red);
                } else {
                    temp.Custom.push(cmd);
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

            this.Variables = json;
        } catch (err) {
            console.log("ERROR: " + err);
            return err;
        }
    }
    loadCommandVariables() {
        try {

            let s = super.readFile(this.config.Command_Variables_File);

            //read File and convert to JSON (errors if errored before)
            let json = JSON.parse(s);

            let temp = {};

            for (let vari of Object.getOwnPropertyNames(json)) {

                //check JSON for Completion
                let completion = "UNKNOWN ERROR!";

                if (!json[vari].pretitle) {
                    completion = "pretitle missing!"
                } else {
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

            this.CommandVariables = temp;
        } catch (err) {
            console.log("ERROR: " + err);
            return err;
        }
    }
}

module.exports.CommandHandler = CommandHandler;