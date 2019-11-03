const CONSTANTS = require('./../../CONSTANTS.js');

class CustomChat extends require('./../PackageBase.js').PackageBase{

    constructor(config, app, twitchIRC, twitchNewApi) {

        //Create Details
        let det = {
            Description: "Displays Twitch Chat Messages in a custom FrikyBot Chat (soon maybe with multiple broadcasterchats)",
            Capabilities: {
                HTML: {
                    html: "../CustomChat",
                    title: "See the Twitch Chat from another more custom source!"
                },
                Overlay: {
                    title: "Includes Overlay versions to be displayed in e.g. OBS!"
                },
            },
            Settings: {
                enabled: ((config.enabled == undefined || config.enabled == true) ? true : false)
            }
        };

        super(config, app, twitchIRC, twitchNewApi, "CustomChat", det);

        this.InitAPIEndpoints();
        
        this.LoginNames = ["FrikyMediaLP", "FitzyHere"];
        this.ChannelDetails = {};

        this.updateStreamerData();
    }

    InitAPIEndpoints() {

        /*
         *  ----------------------------------------------------------
         *                      BOT API
         *     /api/CustomChat/
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

        super.AddAPIEndpoint('GET', '/MetaData', (request, response) => {

            let data = {
                Channel: this.ChannelDetails,
                Live: false
            };

            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: data                          //Metadata of current Streamers and their IDS (if found/supplied)
            });
        }, false);
    }

    MessageHandler(message) {

    }

    async updateStreamerData() {
        this.ChannelDetails = {};

        let data = await this.twitchNewApi.getUserDetails(this.LoginNames);
        
        if (data) {
            for (let i = 0; i < data.data.length; i++) {
                this.ChannelDetails[this.LoginNames[i]] = data.data[i];
            }
        } else {
            for (let i = 0; i < this.LoginNames; i++) {
                this.ChannelDetails[this.LoginNames[i]] = {
                    login: this.LoginNames[i].toLowerCase()
                };
            }
        }
    }
}
module.exports.CustomChat = CustomChat;