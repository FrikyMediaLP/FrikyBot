const CONSTANTS = require('./../../CONSTANTS.js');

class MessageDatabase extends require('./../PackageBase.js').PackageBase {

    constructor(config, app, twitchIRC, twitchNewApi) {
        super(config, app, twitchIRC, twitchNewApi, "MessageDatabase");

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
                data: this.name                     //Name
            });
        }, false);
    }

    MessageHandler(message) {

    }
}

module.exports.MessageDatabase = MessageDatabase;