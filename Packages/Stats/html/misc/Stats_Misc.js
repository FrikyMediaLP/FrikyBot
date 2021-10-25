let BADGE_DATA = {};
const TYPE_IMAGES = {
    'ffz': "/images/icons/FFZ.png",
    "bttv": "/images/icons/BTTV.png",
    "ttv": "/images/icons/twitch_colored.png"
};

//USER
function createSimpleUser(user) {
    let s = "";

    s += '<div class="SIMPLE_USER">';

    //HEADER
    s += '<h1 class="USER_HEADER">';
    s += '<a href="/stats/user/' + user.user_id + '">';
    s += '<span class="USER_NAME">' + user.user_name + '</span>';
    s += '<span class="USER_ID" title="User ID">' + user.user_id + '</span>';
    s += '</a>';
    s += '<span class="USER_BADGES">';
    for (let badge in user.badges) {
        if (badge === 'subscriber') {
            let month = parseInt(user.badge_info['subscriber']) || 0;
            s += '<img src="' + getSubBadge(month) + '" title="Subscriber Month: ' + month + '" />'
        }

        if (!BADGE_DATA[badge] || !BADGE_DATA[badge].versions[user.badges[badge]]) continue;
        s += getImgFromBadge(BADGE_DATA[badge].versions[user.badges[badge]], 1);
    }
    s += '</span>';
    s += '</h1>';

    s += '<div class="USER_STATS_WRAPPER">';

    //Totals
    s += '<div class="STAT_TABLE">';
    s += '<p>TOTAL STATS</p>';
    s += '<div>';
    s += '<div class="STAT_TABLE_ELEMENT">';
    s += '<p class="STAT_NAME">TOTAL MESSAGES</p>';
    s += '<p class="STAT_VALUE">' + user.message_count + '</p>';
    s += '</div>';

    s += '<div class="STAT_TABLE_ELEMENT">';
    s += '<p class="STAT_NAME">TOTAL EMOTES</p>';
    s += '<p class="STAT_VALUE">' + user.emote_count + '</p>';
    s += '</div>';

    s += '</div>';
    s += '</div>';

    //Emotes
    s += '<div class="STAT_TABLE STAT_TABLE_INDEXED">';
    s += '<p>TOP EMOTES</p>';
    s += '<div>';

    let i = 1;
    for (let emote of user.emotes.sort((a, b) => b.count - a.count)) {
        if (i === 5) break;

        s += '<div class="STAT_TABLE_ELEMENT">';
        s += '<p class="STAT_IDX">' + (i++) + '</p>';
        s += '<p class="STAT_NAME"><img src="' + getImageURLOfEmote(emote.type, emote.emote_id, 2) + '" /><span>' + emote.emote_name + '</span></p>';
        s += '<p class="STAT_VALUE">' + emote.count + '</p>';
        s += '</div>';
    }

    s += '</div>';
    s += '</div>';

    s += '</div>';

    s += '</div>';

    return s + '</div>';
}

//EMOTE
function createSimpleEmote(emote) {
    let s = "";

    s += '<div class="SIMPLE_EMOTE">';

    //HEADER
    s += '<h1 class="EMOTE_HEADER">';
    s += '<a href="emotes/' + emote.emote_id + '">';
    s += '<img class="EMOTE_IMG" src="' + getImageURLOfEmote(emote.type, emote.emote_id, 3) + '" />';
    s += '<span class="EMOTE_NAME">' + emote.emote_name + '</span>';
    s += '<span class="EMOTE_ID" title="Emote ID">' + emote.emote_id + '</span>';
    s += '</a>';
    s += '<img class="EMOTE_TYPE" title="Emote Origin: ' + emote.type.toUpperCase() + '" src="' + TYPE_IMAGES[emote.type] + '" />';
    s += '</h1>';

    s += '<div class="EMOTE_STATS_WRAPPER">';

    //Totals
    s += '<div class="STAT_TABLE">';
    s += '<p>TOTAL STATS</p>';
    s += '<div>';
    s += '<div class="STAT_TABLE_ELEMENT">';
    s += '<p class="STAT_NAME">TOTAL USAGE</p>';
    s += '<p class="STAT_VALUE">' + emote.count + '</p>';
    s += '</div>';

    s += '</div>';
    s += '</div>';

    //Users
    s += '<div class="STAT_TABLE STAT_TABLE_INDEXED">';
    s += '<p>TOP USERS</p>';
    s += '<div>';
    let i = 1;
    for (let user of emote.users.sort((a, b) => b.count - a.count)) {
        if (i === 5) break;

        s += '<div class="STAT_TABLE_ELEMENT">';
        s += '<p class="STAT_IDX">' + (i++) + '</p>';
        s += '<p class="STAT_NAME">' + user.user_name + '</p>';
        s += '<p class="STAT_VALUE">' + user.count + '</p>';
        s += '</div>';
    }
    s += '</div>';
    s += '</div>';

    s += '</div>';

    return s + '</div>';
}

//STREAM
function createStream(stream) {
    let s = "";

    s += '<div>';
    s += '<h1>' + stream.titles[0].name + '</h1>';


    s += '</div>';

    return s;
}
function createSimpleStream(stream) {
    let s = "";

    s += '<div class="SIMPLE_STREAM">';

    //HEADER
    s += '<h1 class="STREAM_HEADER">';
    s += '<a href="/Stats/Streams/' + stream.stream_id + '">';
    s += '<span class="STREAM_NAME">Stream from ' + (new Date(stream.started_at)).toLocaleDateString("de-DE") + " " + (new Date(stream.started_at)).toLocaleTimeString("de-DE").split(":").slice(0,2).join(":");
    s += '<span class="STREAM_ID" title="Stream ID">' + stream.stream_id + '</span>';
    s += '</span>';
    s += '</a>';
    s += '</h1>';

    s += '<h2 title="First Stream Title">' + stream.titles[0].name + '</h2>';

    s += '<div class="STREAM_STATS_WRAPPER">';
    
    //Totals
    s += '<div class="STAT_TABLE">';
    s += '<p>TOTAL STATS</p>';
    s += '<div>';

    s += '<div class="STAT_TABLE_ELEMENT">';
    s += '<p class="STAT_NAME">TOTAL MESSAGES</p>';
    s += '<p class="STAT_VALUE">' + stream.messages.length + '</p>';
    s += '</div>';

    s += '<div class="STAT_TABLE_ELEMENT">';
    s += '<p class="STAT_NAME">TOTAL EMOTES</p>';
    s += '<p class="STAT_VALUE">' + stream.emotes.length + '</p>';
    s += '</div>';

    s += '</div>';
    s += '</div>';

    //Users
    s += '<div class="STAT_TABLE STAT_TABLE_INDEXED">';
    s += '<p>TOP CHATTERS</p>';
    s += '<div>';

    s += '</div>';
    s += '</div>';

    s += '</div>';

    return s + '</div>';
}

//UTIL Emotes
function getImageURLOfEmote(type, emote_id, scale = 1) {
    if (type === 'ttv') return getTTVImage(emote_id, scale);
    else if (type === 'bttv') return getBTTVImage(emote_id, scale);
    else if (type === 'ffz') return getFFZImage(emote_id, scale);
    return "";
}
function getTTVImage(emote_id, scale = 1) {
    return "https://static-cdn.jtvnw.net/emoticons/v2/" + emote_id + "/default/light/" + scale + ".0";
}
function getBTTVImage(emote_id, scale = 1) {
    return "https://cdn.betterttv.net/emote/" + emote_id + "/" + scale + "x";
}
function getFFZImage(emote_id, scale = 1) {
    if (scale > 2) scale = 4;
    return "https://cdn.frankerfacez.com/emote/" + emote_id + "/" + scale;
}

//UTIL Badges
async function updateBadgeData() {
    try {
        BADGE_DATA = (await fetch('https://badges.twitch.tv/v1/badges/global/display').then(data => data.json())).badge_sets;
    } catch (err) {

    }

    return Promise.resolve(BADGE_DATA);
}
function getImgFromBadge(obj, res) {
    if (!obj || !obj.title || !obj.description || !obj.image_url_1x || !obj.image_url_2x || !obj.image_url_4x || !obj.click_action) {
        return null;
    }

    let temp = '<img src="' + obj['image_url_' + (res ? res : 1) + 'x'] + '" title="' + obj.title + '" />';

    if (obj.click_action == "visit_url") {
        return '<a href="' + obj.click_url + '" target="_blank">' + temp + '</a>'
    } else {
        return temp;
    }
}
function getSubBadge(month) {
    if (month > 96) return "/images/Badges/subscriber_96.png";
    if (month > 84) return "/images/Badges/subscriber_84.png";
    if (month > 72) return "/images/Badges/subscriber_72.png";
    if (month > 60) return "/images/Badges/subscriber_60.png";
    if (month > 48) return "/images/Badges/subscriber_48.png";
    if (month > 36) return "/images/Badges/subscriber_36.png";
    if (month > 24) return "/images/Badges/subscriber_24.png";
    if (month > 12) return "/images/Badges/subscriber_12.png";
    if (month > 9) return "/images/Badges/subscriber_9.png";
    if (month > 6) return "/images/Badges/subscriber_6.png";
    if (month > 3) return "/images/Badges/subscriber_3.png";
    return "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1";
}