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

        this.testData = {
            "username": "frikymedialp",
            "display-name": "FrikyMediaLP",
            "bio": "Hey, ich bin Lets Player!",
            "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/ea705c13-94fc-42ff-b4c3-fc04b5e36564-profile_image-300x300.png",
            "ID": 38921745,
            "emotes": {
                "total": 0,
                "raw": {}
            },
            "commands": {
                "total": 1,
                "raw": {

                }
            },
            "Special": {},
            "messages": {
                "total": 0,
                "curve": {},
                "raw": [

                ]
            },
            "createdAt": 1574778525091
        };
    }

    InitAPIEndpoints() {

        /*
         *  ----------------------------------------------------------
         *                      BOT API
         *     /api/MessageDatabase/
         *     - GET:  returns Name
         *     
         *     /api/MessageDatabase/MetaData
         *     /api/MessageData/Streams  /api/MessageData/Streams?id=<ID>
         *     /api/MessageData/Users    /api/MessageData/Users?id=<ID>       /api/MessageData/Users?name=<NAME>
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



        //CHECK THIS AGAIN
        super.AddAPIEndpoint('GET', '/Streams', (request, response) => {

            if (Object.getOwnPropertyNames(request.query).length == 0) {
                response.json({
                    status: CONSTANTS.STATUS_SUCCESS,               //Sending Success confimation
                    req: request.body,                              //Mirror-Request (for debug reasons / sending error detection)
                    data: { er: "Streams will be added soon(TM)!" } //All Streams
                });
                return;
            } else {
                //Check Streams for matching query
                //this.datacollection(request.query, );

                let data = {};

                response.json({
                    status: CONSTANTS.STATUS_SUCCESS, //Sending Success confimation
                    req: request.body,                //Mirror-Request (for debug reasons / sending error detection)
                    data: data                        //Streams return by Query
                });
                return;
            }

            response.json({
                status: CONSTANTS.STATUS_FAILED,             //Sending Failed confimation
                req: request.originalUrl,                    //Mirror-URL (for debug reasons / sending error detection)
                data: { err: "No Data found to this request" } //Error
            });
        }, false);

        super.AddAPIEndpoint('GET', '/test', (request, response) => {

            response.json({
                status: CONSTANTS.STATUS_FAILED,             //Sending Failed confimation
                req: request.originalUrl,                    //Mirror-URL (for debug reasons / sending error detection)
                data: this.convertUser(this.testData) //test
            });
        }, false);
    }

    async MessageHandler(message) {
        return new Promise(async (resolve, reject) => {
            console.log("[" + message.getTime() + "] " + message.toString());

            if (this.DataCollection) {
                try {
                    await this.DataCollection.addMessage(message);
                } catch (err) {
                    reject(err);
                }
            }
            
            resolve();
        });
    }
}

module.exports.MessageDatabase = MessageDatabase;