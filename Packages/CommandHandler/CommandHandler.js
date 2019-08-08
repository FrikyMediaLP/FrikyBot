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

    constructor(config, app) {
        super(config, app, "CommandHandler");

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

        super.AddAPIEndpoint('get', '/', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.name                     //Name
            });
        }, false);

        super.AddAPIEndpoint('get', '/Commands', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.Commands                 //Commands
            });
        }, false);

        super.AddAPIEndpoint('get', '/Variables', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.Variables                //Variables
            });
        }, false);
    }

    MessageHandler(message) {
        console.log(message.toString());

        for (let cmd of this.Commands) {
            if (message.message.indexOf(cmd.prefix + cmd.name) >= 0) {
                this.convertCommand(cmd);
                break;
            }
        }
    }

    convertCommand(command) {

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