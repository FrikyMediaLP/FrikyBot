const FETCH = require('node-fetch');

/////////////////////////////////////////////////////////////////////////////////////////////////
//                          BTTV API v3 - LAST UPDATED: June 20th 2020
/////////////////////////////////////////////////////////////////////////////////////////////////

//      This "Library" IS NOT official NOR even close to COMPLETE!

//  Global Emotes: https://api.betterttv.net/3/cached/emotes/global
//  Channel Emotes: https://api.betterttv.net/3/cached/users/twitch/:channel_id
//  Single Emote: https://api.betterttv.net/3/emotes/:emote_id

//  Emote Image: https://cdn.betterttv.net/emote/:emote_id/1x

async function GetGlobalEmotes() {
    return FETCH("https://api.betterttv.net/3/cached/emotes/global")
        .then(data => data.json())
        .then(json => {
            if (json.error) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(typeof json == "object" && json.length != undefined ? json : []);
        })
        .catch(err => Promise.reject(err));
}
async function GetTwitchUser(userID) {
    return FETCH("https://api.betterttv.net/3/cached/users/twitch/" + userID)
        .then(data => data.json())
        .then(json => {
            if (json.message) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(json);
        })
        .catch(err => Promise.reject(err));
}
async function GetEmote(emote_id) {
    return FETCH("https://api.betterttv.net/3/emotes/" + emote_id)
        .then(data => data.json())
        .then(json => {
            if (json.message) {
                return Promise.reject(new Error(json.message));
            }

            return Promise.resolve(json);
        })
        .catch(err => Promise.reject(err));
}
async function GetEmoteImage(emote_id, size = 1) {
    return FETCH('https://cdn.betterttv.net/emote/' + emote_id + '/' + (size < 1 ? 1 : (size > 3 ? 3 : size)) + 'x')
        .then(data => data.text())
        .catch(err => Promise.reject(err));
}

async function GetChannelEmotes(channelID, includeGlobalEmotes = false) {
    let output = [];

    if (includeGlobalEmotes == true) {
        try {
            output = await GetGlobalEmotes();
        } catch (err) {

        }
    }

    try {
        let response = await GetTwitchUser(channelID);

        for (let emote of response.channelEmotes) {
            output.push(emote);
        }

        for (let emote of response.sharedEmotes) {
            output.push(emote);
        }
    } catch (err) {

    }

    return Promise.resolve(output);
}

module.exports.GetGlobalEmotes = GetGlobalEmotes;
module.exports.GetTwitchUser = GetTwitchUser;
module.exports.GetEmote = GetEmote;
module.exports.GetEmoteImage = GetEmoteImage;

module.exports.GetChannelEmotes = GetChannelEmotes;