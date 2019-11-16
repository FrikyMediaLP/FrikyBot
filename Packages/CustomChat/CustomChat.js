const CONSTANTS = require('./../../CONSTANTS.js');

class CustomChat extends require('./../PackageBase.js').PackageBase{

    constructor(config, app, twitchIRC, twitchNewApi, datacollection) {

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

        super(config, app, twitchIRC, twitchNewApi, "CustomChat", det, datacollection);

        this.InitAPIEndpoints();
        
        this.LoginNames = ["FrikyMediaLP", "Flocke"];
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

        let data = await this.twitchNewApi.getUserDetails(this.LoginNames);
        let FFZ_Data = {};

        for (let channel of this.LoginNames) {
            console.log("Loading FFZ from channel: " + channel);
            let dt = await this.twitchNewApi.request("https://api.frankerfacez.com/v1/room/" + channel.toLowerCase(), {}, json => { return json; }, true);

            if (dt.indexOf("<!DOCTYPE html>") >= 0) {
                continue;
            }

            dt = await JSON.parse(dt);

            if (dt) {
                if (dt.error)
                    continue;

                for (let set in dt.sets) {
                    for (let emt of dt.sets[set].emoticons) {
                        FFZ_Data[emt.name] = emt;
                    }
                }
            }
        }


        this.ChannelDetails = {};

        if (data) {
            for (let i = 0; i < data.data.length; i++) {
                this.ChannelDetails[this.LoginNames[i]] = data.data[i];
            }
        } else {
            console.log("Data Undefined: Token no more valid?");
            for (let i = 0; i < this.LoginNames; i++) {
                this.ChannelDetails[this.LoginNames[i]] = {
                    login: this.LoginNames[i].toLowerCase()
                };
            }
        }
        console.log("CHANNELS UPDATED!");

        this.ChannelDetails.FFZ_DATA = FFZ_Data;
    }
}
module.exports.CustomChat = CustomChat;