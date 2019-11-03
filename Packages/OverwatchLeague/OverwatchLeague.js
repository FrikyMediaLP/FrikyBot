const CONSTANTS = require('./../../CONSTANTS.js');

class OverwatchLeague extends require('./../PackageBase.js').PackageBase {

    constructor(config, app, twitchIRC, twitchNewApi) {

        //Create Details
        let det = {
            Description: "Uses the official, undocumented OWL API to display Match and Map stats",
            Capabilities: {
                HTML: {
                    html: "../OverwatchLeague",
                    title: "Watch OWL Match Stats AFAP from the OWL API!"
                },
                Overlay: {
                    title: "Includes Overlay versions to be displayed in e.g. OBS!"
                },
                "3rdPartyAPI": {
                    title: "Uses the official, undocumented Overwatch League API!"
                }
            },
            Settings: {
                enabled: ((config.enabled == undefined || config.enabled == true) ? true : false)
            }
        };
        
        super(config, app, twitchIRC, twitchNewApi, "OverwatchLeague", det);

        this.InitAPIEndpoints();
    }

    InitAPIEndpoints() {

        /*
         *  ----------------------------------------------------------
         *                      BOT API
         *     /api/OverwatchLeague/
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

    }
}

module.exports.OverwatchLeague = OverwatchLeague;