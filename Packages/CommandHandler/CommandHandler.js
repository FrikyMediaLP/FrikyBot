const CONSTANTS = require('./../../CONSTANTS.js');

let COMMAND_CONTENT_REQUIRED = ["prefix", "name", "cooldown", "output", "enabled"];
let CommandTemplate = {
    uid: 123123,
    name: "",
    cooldown: "",
    output: "",
    detection_type: "",
    enabled: false
};

class CommandHandler extends require('./../PackageBase.js').PackageBase{

    constructor(config, app, twitchIRC, twitchNewApi, datacollection) {

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

        super(config, app, twitchIRC, twitchNewApi, "CommandHandler", det, datacollection);

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

    MessageHandler(messageObj) {
        let detectedCmds = this.checkMessage(messageObj);
        let lastEnd = 0;

        //Check All Commands
        for (let i = 0; i < detectedCmds.length; i++) {
            
            let checkedMsgObj = detectedCmds[i];
            let commandObj = checkedMsgObj.command;
            let parameters = messageObj.message;

            //get limited Parameters
            if (i < detectedCmds.length - 1) {
                let next = parameters.indexOf(detectedCmds[i + 1].command.name, lastEnd);
                parameters = parameters.substring(lastEnd, next-1);
                lastEnd = next;
            } else {
                parameters = parameters.substring(lastEnd);
            }

            //Detection Type CHECK - Block NOW
            if (commandObj.detection_type == "beginning_only_detection" || commandObj.detection_type == "multi_detection") {     //beginning_only_detection OR multi_detection -> cur command Name at index = 0
                if (messageObj.message.indexOf(commandObj.name) != 0) {
                    continue;
                }
            }

            //Split by type
            if (checkedMsgObj.type == "HARDCODED") {
                if (this.checkHCEnvironment(commandObj, messageObj)) {
                    this.executeHCCommand(commandObj, messageObj, parameters);
                }
            } else if (checkedMsgObj.type == "CUSTOM") {
                if (this.checkCuEnvironment(commandObj, messageObj)) {
                    this.executeCuCommand(commandObj, messageObj, parameters);
                }
            }

            //DATACOLLECTION
            if (this.DataCollection)
                this.DataCollection.addCommand(messageObj.userstate.username, commandObj, parameters);

            //Detection Type CHECK - Block NEXT
            if (commandObj.detection_type != "multi_detection" && commandObj.detection_type != "multi_inline_detection") {       //NO multi_detection AND NO multi_inline_detection -> block following Cmds
                break;
            }
        }
    }

    //Check for All Commands 
    checkMessage(messageObj) {
        let out = [];
        
        for (let hcCMD of this.Commands.Hardcoded) {
            if (hcCMD.enabled && messageObj.message.indexOf(hcCMD.name) >= 0) {
                out.push({
                    type: "HARDCODED",
                    command: hcCMD,
                    index: messageObj.message.indexOf(hcCMD.name)
                });
            }
        }
        
        for (let cuCMD of this.Commands.Custom) {
            if (cuCMD.enabled && messageObj.message.indexOf(cuCMD.name) >= 0) {
                out.push({
                    type: "CUSTOM",
                    command: cuCMD,
                    index: messageObj.message.indexOf(cuCMD.name)
                });
            }
        }

        out.sort((a, b) => {
            return a.index - b.index;
        });

        return out;
    }
    checkHCEnvironment(commandObj, messageObj) {
        //Check Userlevel Access
        if (!this.checkUserlevel(messageObj, super.getRealUserlevel(commandObj.userlevel))) {
            return false;
        }
        
        return true;
    }
    checkCuEnvironment(commandObj, messageObj) {
        //Check Userlevel Access
        if (!this.checkUserlevel(messageObj, super.getRealUserlevel(commandObj.userlevel))) {
            return false;
        }
        return true;
    }
    checkUserlevel(messageObj, commandLevel) {
        return messageObj.matchUserleve(commandLevel);
    }

    //Execute
    executeHCCommand(commandObj, messageObj, parameters) {
        if (commandObj.name == "!game") {
            this.game(messageObj, parameters);
        } else if (commandObj.name == "!resetData") {
            this.resetData(messageObj, parameters);
        }
    }
    executeCuCommand(commandObj, messageObj, parameters) {
        let out = this.fillCommandVariables(commandObj, messageObj, parameters);
        
        if (typeof out == "string")
            this.twitchIRC.send(out);
        else
            console.log("ERROR: No Command Execution");
    }
    
    //Command Variables
    fillCommandVariables(commandObj, message, parameters) {
        if (commandObj) {
            if (commandObj.output) {
                let temp = false;
                let first = 0;
                let output = temp;

                do {
                    output = temp;
                    temp = this.replaceVariables((temp ? temp : commandObj.output), message, commandObj, parameters);
                    first++;
                } while (temp != false);

                return (!output && first <= 1) ? commandObj.output : output;
            }
        }
    }
    replaceVariables(filledString, messageObj, origCommand, parameters) {

        if (filledString.indexOf("$(") >= 0) {
            if (filledString.indexOf(")", filledString.indexOf("$(")) >= 0) {
                
                let variables = this.extractVariables(filledString);

                if (variables == false) {       //Command Output Grammar ERROR
                    return false;
                }

                for (let vari of variables) {

                    let replaced = this.replaceVariables(vari.substring(2, vari.length - 1), messageObj, origCommand, parameters);

                    if (replaced == false) {
                        let content = this.getVariableContent(vari, messageObj, origCommand, parameters);
                        
                        filledString = filledString.substring(0, filledString.indexOf(vari)) + (content ? content : "") + filledString.substring(filledString.indexOf(vari) + vari.length);
                    } else {
                        filledString = filledString.substring(0, filledString.indexOf(vari) + 2) + replaced + filledString.substring(filledString.indexOf(vari) + vari.length - 1);
                    }
                }

                return filledString;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    extractVariables(commandOutString) {
        let variables = [];
        if (commandOutString.indexOf("$(") >= 0) {
            if (commandOutString.indexOf(")", commandOutString.indexOf("$(")) >= 0) {
                let start = 0;
                let open;
                let close;

                while (start >= 0 && start < commandOutString.length) {
                    if (commandOutString.indexOf("$(", start) < 0) break;
                    start = commandOutString.indexOf("$(", start) + 2;

                    open = 1;
                    close = 0;

                    let tempStart = start;

                    while (open != close) {
                        if (commandOutString.indexOf("$(", tempStart) < commandOutString.indexOf(")", tempStart) && commandOutString.indexOf("$(", tempStart) >= 0) {
                            open++;
                            tempStart = commandOutString.indexOf("$(", tempStart) + 2;
                        } else if (commandOutString.indexOf(")", tempStart) >= 0) {
                            close++;
                            tempStart = commandOutString.indexOf(")", tempStart) + 1;
                        } else {
                            console.log("Command Grammar ERROR: Probably missing ( or )!");
                            return false;
                        }
                    }

                    variables.push(commandOutString.substring(start - 2, tempStart))
                    start = tempStart;
                }
            }
        }
        return variables;
    }
    getVariableContent(variable, messageObj, origCommand, parameters) {
        let name = variable.substring(2, (variable.indexOf(" ") >= 0 ? variable.indexOf(" ") : variable.length - 1));

        if (name == "toUser") {
            //Nighbot inspired
            return (parameters.split(" ").length > 1 ? parameters.split(" ")[1] : messageObj.userstate['display-name']);
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
            let SR = parseInt(variable.split(" ")[1]);
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
            if (parameters.split(" ")[parseInt(name)]) {
                return parameters.split(" ")[parseInt(name)];
            }

            //otherwise search after a variable name in the variable.json file
            let curVarObj = this.Variables;

            for (let part of name.substring(0, name.lastIndexOf(".")).split(".")) {

                if (curVarObj[part]) {
                    curVarObj = curVarObj[part];
                }
            }

            if (curVarObj[name.split(".")[name.split(".").length - 1]]) {
                //replace or output
                if (parameters.split(" ").length >= 2) {
                    //replace
                    this.Variables = super.ReplaceObjectContents(this.Variables, name, parameters.split(" ")[1]);

                    super.writeFile(this.config.Variables_File, JSON.stringify(this.Variables, null, 4));
                    return parameters.split(" ")[1];
                } else {
                    //output
                    return curVarObj[name.split(".")[name.split(".").length - 1]];
                }
            } else {
                //init
                if (parameters.split(" ").length == 2 && !super.StringContains(parameters.split(" ")[1], [" ", "\"", ","])) {
                    this.Variables = super.ReplaceObjectContents(this.Variables, name, variable.split(" ")[1]);

                    super.writeFile(this.config.Variables_File, JSON.stringify(this.Variables, null, 4));
                    return variable.split(" ")[1];
                }
            }

            return "";
        }
    }

    //Hardcoded Commands
    game(messageObj, parameters) {
        if (messageObj.getUserLevel() >= CONSTANTS.UserLevel.Moderator) {
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
            this.twitchIRC.send("@" + (parameters == "" ? messageObj.getDisplayName() : parameters) + " -> Friky spielt grade " + this.getVariableContent("$(game)", "", ""));
        }
    }
    resetData(messageObj, parameters) {
        if (messageObj.getUserLevel() >= CONSTANTS.UserLevel.Moderator) {
            if (parameters.split(" ").length >= 2) {
                this.twitchIRC.send("@" + messageObj.getDisplayName() + " - Resetting @" + this.getVariableContent("$(toUser)", messageObj, null, parameters) + "´s Data!");
            } else {
                this.twitchIRC.send("@" + messageObj.getDisplayName() + " - No User specified!");
            }
        }
    }
    
    //Load Local Data
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