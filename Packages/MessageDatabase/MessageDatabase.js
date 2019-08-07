const CONSTANTS = require('./../../CONSTANTS.js');

class MessageDatabase extends require('./../PackageBase.js').PackageBase {

    constructor(config, app) {
        super(config, app, "MessageDatabase");

        this.InitAPIEndpoints();
    }

    AddAPIEndpoint(type, path, callback) {
        if (type == "get") {
            this.app.get('/api/' + this.name + path, callback);
        } else if(type == "post"){
            this.app.post('/api/' + this.name + path, callback);
        }
    }

    InitAPIEndpoints() {

        /*
         *  ----------------------------------------------------------
         *                      BOT API
         *     /api/MessageDatabase/
         *     - GET:  returns Name
         *  ----------------------------------------------------------
         */

        this.AddAPIEndpoint('get', '/', (request, response) => {

            response.json({
                status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                data: this.name                     //Name
            });
        });
    }
}

module.exports.MessageDatabase = MessageDatabase;