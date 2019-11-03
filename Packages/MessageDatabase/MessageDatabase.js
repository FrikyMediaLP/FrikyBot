const CONSTANTS = require('./../../CONSTANTS.js');
const fs = require('fs');

const proto = {
    Messages: [
        
    ],
    MetaData: {
        Date: Date.now()
    }
};

class MessageDatabase extends require('./../PackageBase.js').PackageBase {

    constructor(config, app, twitchIRC, twitchNewApi) {

        //Create Details
        let det = {
            Description: "Collects Chat Messages and tracks activities and display them in user friendly ways!",
            Capabilities: {
                Chat: {
                    title: "Collects User-Chat-Data! ONLY Data from the Twitch IRC Connection is collected!"
                },
                Stats: {
                    title: "Displays Collected data in user friendly ways!"
                }
            },
            Settings: {
                enabled: ((config.enabled == undefined || config.enabled == true) ? true : false)
            }
        };
        
        super(config, app, twitchIRC, twitchNewApi, "MessageDatabase", det);

        this.InitAPIEndpoints();

        if (!fs.existsSync(config.Raw_File)) {
            console.log('Data collection file does not exists. Creating new ...');
            super.writeFile(config.Raw_File, JSON.stringify(proto, null, 4));
        }


        this.CurrentCollection = [];
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
                data: {                             //Details
                    [this.name]: this.details
                }
            });
        }, false);
    }

    MessageHandler(message) {
        console.log("[" + message.getTime() + "] " + message.toString());

        this.CurrentCollection.push(message.toJSON());

        super.writeFile(this.config.Raw_File, JSON.stringify(this.CurrentCollection, null, 4));
    }
}

module.exports.MessageDatabase = MessageDatabase;