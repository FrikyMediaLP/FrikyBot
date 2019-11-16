const fs = require('fs');
const path = require('path');
const CONSTANTS = require('./CONSTANTS.js');

const overwiew_template = {
    messages: {
        total: 0,
        top: []
    },
    emotes: {
        total: 0,
        top: []
    },
    commands: {
        total: 0,
        top: []
    },
    games: {
        total: 0,
        top: []
    },
    views: {
        total: 0,
        curve: {
            
        }
    }
};
const user_template = {
    username: "",
    "display-name": null,
    bio: null,
    ID: 0,
    emotes: {
        total: 0,
        raw: {
        
        }
    },
    commands: {
        total: 0,
        raw: {
        }
    },
    Special: {

    },
    messages: {
        total: 0,
        curve: {

        },
        raw: [

        ]
    },
    createdAt: Date.now()
};
const leaderboard_template = {
    name: "",
    description: "",
    data: {

    }
};
const stream_template = {
    name: "",
    description: "",
    date: 0,
    messages: {
        total: 0,
        top: [],
        raw: [

        ]
    },
    emotes: {
        total: 0,
        top: []
    },
    commands: {
        total: 0,
        top: []
    },
    games: [],
    twitchID: 0
};

class DataCollection {
    constructor(config, twitchNewApi) {
        this.CONFIG = config;
        this.TWITCHNEWAPI = twitchNewApi;

        if (!config.Storage_Dir) {
            this.good = false;
        } else {
            this.good = true;
        }

        this.isLive = false;

        let THIS = this;

        twitchNewApi.isLive()
            .then(bool => {
                if (bool == true)
                    THIS.isLive = true;
                console.log(this.isLive);
            })
            .catch(err => console.log(err));
    }

    initViewer(username) {
        if (!this.good || !username) {
            return;
        }

        let userFile = this.CONFIG.Storage_Dir + username + ".json";

        try {
            if (fs.existsSync(userFile)) {
                return;
            } else {
                let data2Write = user_template;
                data2Write.username = username;
                dataToWrite.createdAt = Date.now();                       //used for auto Merging (older gets merged with new Name/DisplayName/etc.)

                writeFile(userFile, JSON.stringify(data2Write, null, 2));
            }
        } catch (err) {
            return;
        }
    }
    addMessage(msgObj) {
        if (!this.good || !msgObj) {
            return;
        }

        //OVERVIEW
        this.addMessageToOverview(msgObj);

        //LEADERBOARDS
        this.addEmotesToLeaderboard(msgObj);
        this.addUserToLeaderboard(msgObj);

        //STREAM
        this.addMessageToStream(msgObj);

        //USER
        this.addMessageToUser(msgObj);
    }
    
    //Gerneal
    //Overview
    addMessageToOverview(msgObj) {

    }
    //Leaderboards
    addEmotesToLeaderboard(msgObj) {
        if (!this.good || !msgObj) {
            return;
        }

        let msgJSON = msgObj.toJSON();
        let path2File = this.CONFIG.Storage_Dir + "/Leaderboards/Emotes.json";
        let data2Write = null;

        try {
            if (fs.existsSync(path2File)) {
                data2Write = JSON.parse(readFile(path2File));
            } else {
                data2Write = this.getLeaderboardTemplate();
                data2Write.name = "Emote";
                data2Write.description = "All used Emotes, sorted by their number of uses!";
            }
        } catch (err) {
            return;
        }

        //Update Emotes
        for (let emoteID in msgJSON.emotes) {
            let start = parseInt(msgJSON.emotes[emoteID][0].substring(0, msgJSON.emotes[emoteID][0].indexOf("-")));
            let ende = parseInt(msgJSON.emotes[emoteID][0].substring(msgJSON.emotes[emoteID][0].indexOf("-") + 1));
            let emtName = msgJSON.Message.substring(start, ende + 1);

            if (data2Write.data[emtName]) {
                data2Write.data[emtName].count += msgJSON.emotes[emoteID].length;

                if (data2Write.data[emtName].id != emoteID) {
                    data2Write.data[emtName].id = emoteID;
                }
            } else {
                data2Write.data[emtName] = {
                    count: msgJSON.emotes[emoteID].length,
                    id: emoteID
                };
            }
        }

        //Write File
        writeFile(path2File, JSON.stringify(data2Write, null, 2));
    }
    addUserToLeaderboard(msgObj) {
        if (!this.good || !msgObj) {
            return;
        }

        let msgJSON = msgObj.toJSON();
        let path2File = this.CONFIG.Storage_Dir + "/Leaderboards/Users.json";
        let data2Write = null;

        try {
            if (fs.existsSync(path2File)) {
                data2Write = JSON.parse(readFile(path2File));
            } else {
                data2Write = this.getLeaderboardTemplate();
                data2Write.name = "User";
                data2Write.description = "Users(Chatters) sorted by their Message count!";
            }
        } catch (err) {
            return;
        }

        if (data2Write.data[msgJSON.username]) {
            data2Write.data[msgJSON.username].count++;
            data2Write.data[msgJSON.username]["display-name"] = msgObj.getDisplayName();
        } else {
            data2Write.data[msgJSON.username] = {
                count: 1,
                id: msgJSON["user-id"],
                "display-name": msgObj.getDisplayName()
            };
        }

        //Write File
        writeFile(path2File, JSON.stringify(data2Write, null, 2));
    }
    //User
    addMessageToUser(msgObj) {
        if (!this.good || !msgObj) {
            return;
        }
        let msgJSON = msgObj.toJSON();

        let userFile = this.CONFIG.Storage_Dir + msgJSON.username + ".json";
        let dataToWrite = null;

        try {
            if (fs.existsSync(userFile)) {
                dataToWrite = JSON.parse(readFile(userFile));
            } else {
                dataToWrite = user_template;
                dataToWrite.createdAt = Date.now();                       //used for auto Merging (older gets merged with new Name/DisplayName/etc.)
            }
        } catch (err) {
            return;
        }

        dataToWrite.ID = parseInt(msgJSON["user-id"]);
        dataToWrite.username = msgJSON.username;            //set Username (might change)
        dataToWrite["display-name"] = msgJSON["display-name"];     //set Displayname (might change)

        //Update Message Data
        dataToWrite.messages.total++;
        delete msgJSON["user-id"];
        dataToWrite.messages.raw.push(msgJSON);

        //Update Emote Data
        for (let emoteID in msgJSON.emotes) {
            dataToWrite.emotes.total += msgJSON.emotes[emoteID].length;

            let start = parseInt(msgJSON.emotes[emoteID][0].substring(0, msgJSON.emotes[emoteID][0].indexOf("-")));
            let ende = parseInt(msgJSON.emotes[emoteID][0].substring(msgJSON.emotes[emoteID][0].indexOf("-") + 1));
            let emtName = msgJSON.Message.substring(start, ende + 1);

            if (dataToWrite.emotes.raw[emtName]) {
                dataToWrite.emotes.raw[emtName].count += msgJSON.emotes[emoteID].length;
            } else {
                dataToWrite.emotes.raw[emtName] = {
                    count: msgJSON.emotes[emoteID].length,
                    id: emoteID
                };
            }
        }

        //Update Commands Data
        //  ->  In CommandHandler


        writeFile(userFile, JSON.stringify(dataToWrite, null, 2));
    }
    //Stream
    addMessageToStream(msgObj) {

    }

    //Packages
    //CommandHandler
    addCommand(username, cmdObj, params) {
        if (!this.good || !username || !cmdObj) {
            return;
        }

        let tempCmd = {

        };

        let userFile = this.CONFIG.Storage_Dir + username + ".json";
        let dataToWrite = null;

        let exclude = ["cooldown", "enabled"];
        for (let key in cmdObj) {
            for (let ex of exclude) {
                if (key != ex) {
                    tempCmd[key] = cmdObj[key];
                }
            }
        }

        try {
            if (fs.existsSync(userFile)) {
                dataToWrite = JSON.parse(readFile(userFile));
                dataToWrite.commands.total++;
                if (dataToWrite.commands.raw[tempCmd.name]) {
                    dataToWrite.commands.raw[tempCmd.name].count++;
                } else {
                    dataToWrite.commands.raw[tempCmd.name] = {
                        count: 1,
                        details: {
                            command: tempCmd,
                            params: params
                        }
                    };
                }

                writeFile(userFile, JSON.stringify(dataToWrite, null, 2));
            } else {
                return;
            }
        } catch (err) {
            return;
        }
    }

    //GET STUFF
    getLeaderboardTemplate() {
        return JSON.parse(JSON.stringify(leaderboard_template));
    }
}

//File System
function writeFile(path, data) {
    let fd;

    try {
        fd = fs.openSync(path, 'w');
        fs.writeSync(fd, data);
    } catch (err) {
        /* Handle the error */
        console.log(err);
        return err;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        } else {
            return "fd was undefinded";
        }
    }

    return null;
}
function readFile(path) {
    try {
        //File/Path present/valid ?
        fs.accessSync(path, fs.constants.F_OK);

        //read File
        return fs.readFileSync(path);

    } catch (err) {
        console.log("ERROR: " + err);
        return "ERROR: " + err;
    }
}
function copyFile(file, dir2) {

    //gets file name and adds it to dir2
    var f = path.basename(file);
    var source = fs.createReadStream(file);
    var dest = fs.createWriteStream(path.resolve(dir2, f));

    source.pipe(dest);
    source.on('error', function (err) { console.log(err); });
}

module.exports.DataCollection = DataCollection;