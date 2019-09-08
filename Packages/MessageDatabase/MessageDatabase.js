const CONSTANTS = require('./../../CONSTANTS.js');
const fs = require('fs');

const proto = {
    Messages: {
        
    },
    MetaData: {
        Date: ""
    }
};

class MessageDatabase extends require('./../PackageBase.js').PackageBase {

    constructor(config, app, twitchIRC, twitchNewApi) {
        super(config, app, twitchIRC, twitchNewApi, "MessageDatabase");

        this.InitAPIEndpoints();

        if (fs.existsSync(config.Raw_File)) {
            console.log('The file exists.');
        } else {
            console.log('The file does not exists.');
            super.writeFile(config.Raw_File, JSON.stringify(proto, null, 4));
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

        super.AddAPIEndpoint('GET', '/', (request, response) => {
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