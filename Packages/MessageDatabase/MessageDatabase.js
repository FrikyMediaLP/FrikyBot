const CONSTANTS = require('./../../CONSTANTS.js');

class MessageDatabase extends require('./../PackageBase.js').PackageBase {

    constructor(config, app) {
        super(config, app, "MessageDatabase");

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

        super.AddAPIEndpoint('get', '/', (request, response) => {
            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.name                     //Name
            });
        }, false);
    }

    MessageHandler(message) {
        console.log(message.toString());
    }
}

module.exports.MessageDatabase = MessageDatabase;