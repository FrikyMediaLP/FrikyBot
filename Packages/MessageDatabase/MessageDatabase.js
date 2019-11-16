const CONSTANTS = require('./../../CONSTANTS.js');
const fs = require('fs');

class MessageDatabase extends require('./../PackageBase.js').PackageBase {

    constructor(config, app, twitchIRC, twitchNewApi, datacollection) {

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
        
        super(config, app, twitchIRC, twitchNewApi, "MessageDatabase", det, datacollection);

        this.InitAPIEndpoints();
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

        if (this.DataCollection)
            this.DataCollection.addMessage(message);
    }
}

module.exports.MessageDatabase = MessageDatabase;