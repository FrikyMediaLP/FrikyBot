const FETCH = require('node-fetch');

/////////////////////////////////////////////////////////////////////////////////////////////////
//                          FFZ API v1 - LAST UPDATED: June 20th 2020
/////////////////////////////////////////////////////////////////////////////////////////////////

//      This "Library" IS NOT official NOR even close to COMPLETE!
//      More/Detailed Infos: https://www.frankerfacez.com/developers


const ROOT = "http://api.frankerfacez.com/v1/";
//  Emote Image: https://cdn.frankerfacez.com/emote/{emote_id}/{version}

/////////////////////////////////////////////////////////////////////////
//             Endoints with Parameter Support
/////////////////////////////////////////////////////////////////////////
// - Params in form: { name: value }
//      Value can be an array -> contents will be connected like this: 
//       -> ?name=value0&name=value1&...
/////////////////////////////////////////////////////////////////////////

async function GetBadges(includeUsers = false) {
    if (includeUsers == true) {
        return FETCH(ROOT + "badges")
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json);
            })
            .catch(err => Promise.reject(err));
    } else if(includeUsers == false) {
        return FETCH(ROOT + "_badges")
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.badges);
            })
            .catch(err => Promise.reject(err));
    }

    return Promise.reject(new Error("Invalid Input!"));
}
async function GetBadge(badge, includeUsers = false) {
    if (includeUsers == true) {
        return FETCH(ROOT + "badge/" + badge)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json);
            })
            .catch(err => Promise.reject(err));
    } else if(includeUsers == false) {
        return FETCH(ROOT + "_badge/" + badge)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.badge);
            })
            .catch(err => Promise.reject(err));
    }

    return Promise.reject(new Error("Invalid Input!"));
}

async function GetEmote(id) {
    return FETCH(ROOT + "emote/" + id)
        .then(data => data.json())
        .then(json => {
            if (json.error) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(json.emote);
        })
        .catch(err => Promise.reject(err));
}
async function GetEmoticons(params = { }) {
    return FETCH(ROOT + "emoticons" + getQuerryFromParams(params))
        .then(data => data.json())
        .then(json => {
            if (json.error) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(json);
        })
        .catch(err => Promise.reject(err));
}

async function GetRoomByName(name, includeSets = false) {
    if (includeSets == true) {
        return FETCH(ROOT + "room/" + name)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json);
            })
            .catch(err => Promise.reject(err));
    } else if (includeSets == false) {
        return FETCH(ROOT + "_room/" + name)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.badge);
            })
            .catch(err => Promise.reject(err));
    }

    return Promise.reject(new Error("Invalid Input!"));
}
async function GetRoomByID(id, includeSets = false) {
    if (includeSets == true) {
        return FETCH(ROOT + "room/id/" + id)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json);
            })
            .catch(err => Promise.reject(err));
    } else if (includeSets == false) {
        return FETCH(ROOT + "_room/id/" + id)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.room);
            })
            .catch(err => Promise.reject(err));
    }

    return Promise.reject(new Error("Invalid Input!"));
}

async function GetGlobalSet() {
    return FETCH(ROOT + "set/global")
        .then(data => data.json())
        .then(json => {
            if (json.error) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(json);
        })
        .catch(err => Promise.reject(err));
}
async function GetSet(id) {
    return FETCH(ROOT + "set/" + id)
        .then(data => data.json())
        .then(json => {
            if (json.error) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(json);
        })
        .catch(err => Promise.reject(err));
}

async function GetUserByName(name, includeSets = false) {
    if (includeSets == true) {
        return FETCH(ROOT + "user/" + name)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.user);
            })
            .catch(err => Promise.reject(err));
    } else if (includeSets == false) {
        return FETCH(ROOT + "_user/" + name)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.badge);
            })
            .catch(err => Promise.reject(err));
    }

    return Promise.reject(new Error("Invalid Input!"));
}
async function GetUserByID(id, includeSets = false) {
    if (includeSets == true) {
        return FETCH(ROOT + "user/id/" + id)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.user);
            })
            .catch(err => Promise.reject(err));
    } else if (includeSets == false) {
        return FETCH(ROOT + "_user/id/" + id)
            .then(data => data.json())
            .then(json => {
                if (json.error) {
                    return Promise.reject(new Error(json.message));
                }

                return Promise.resolve(json.badge);
            })
            .catch(err => Promise.reject(err));
    }

    return Promise.reject(new Error("Invalid Input!"));
}

function getQuerryFromParams(Params = {}) {
    let querry = "";

    for (let param in Params) {
        if (Array.isArray(Params[param])) {
            for (let value of Params[param]) {
                querry += "&" + param + "=" + value;
            }

        } else {
            querry += "&" + param + "=" + Params[param];
        }
    }
    if (querry == "") {
        return "";
    } else {
        return "?" + querry.substring(1);
    }
}

module.exports.GetBadges = GetBadges;
module.exports.GetBadge = GetBadge;

module.exports.GetEmote = GetEmote;
module.exports.GetEmoticons = GetEmoticons;

module.exports.GetRoomByName = GetRoomByName;
module.exports.GetRoomByID = GetRoomByID;

module.exports.GetGlobalSet = GetGlobalSet;
module.exports.GetSet = GetSet;

module.exports.GetUserByName = GetUserByName;
module.exports.GetUserByID = GetUserByID;