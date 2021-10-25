let FILES = [];
let CONFIGS = {};

let PREVIEW_VOICE = null;
let CURRENT_VOICE = null;
let VOICES = [];

let TTS_TEXT = 'I really enjoy your Streams - thank you! <3';
let TTS_VOLUME = 0.5;
let TTS_PITCH = 1;

const ALERT_SETTINGS_INFO = {
    message: {
        name: 'Message'
    },
    font: {
        name: 'Font'
    },
    size: {
        name: 'Font Size'
    },
    color: {
        name: 'Font Color'
    },
    bold: {
        name: 'Bold Font Weight'
    },
    tts: {
        name: 'Text 2 Speech',
        notice: 'The TTS Text played on Test can be changed in the TTS Settings below!'
    },
    tts_volume: {
        name: 'TTS Volume'
    },
    layout: {
        name: 'Layout Type'
    },
    effect: {
        name: 'Transition Effect'
    },
    image: {
        name: 'Alert Image',
        notice: 'Video Files will be muted, when Sound-Files are selected'
    },
    sound: {
        name: 'Alert Sound'
    },
    file_volume: {
        name: 'File Volume'
    },
    on_time: {
        name: 'Alert On-Time'
    },
    delay: {
        name: 'Alert Delay'
    },
    css: {
        name: 'Custom CSS'
    },
    js: {
        name: 'Custom Javascript',
        notice: 'Running unknown Javascript is VERY risky!! Try to verify every code you didnt write yourself!'
    }
};
let DEFAULT_ALERT_SETTINGS = [];
let ALERT_VARIABLES = {};
let last_trigger_timeout = false;

const TEST_DATA_ARRAY = [
    { "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "title": "[GER] Battlefield 2042 Beta HYYYPEEEEE !sammeln !wer", "language": "de", "category_id": "514974", "category_name": "Battlefield 2042", "is_mature": true, "type": "eventsub", "topic": "channel.update", "_id": "0hvQFfX025ibCjjY" }
    , { "type": "chat", "topic": "raided", "channel": "#frikymedialp", "username": "FelixS45", "viewers": 5, "idx-3": { "badge-info": null, "badges": { "turbo": "1" }, "color": "#00A1FF", "display-name": "FelixS45", "emotes": null, "flags": null, "id": "a02eae6b-63d6-4771-98bc-a37c5a58b4cf", "login": "felixs45", "mod": false, "msg-id": "raid", "msg-param-displayName": "FelixS45", "msg-param-login": "felixs45", "msg-param-profileImageURL": "https://static-cdn.jtvnw.net/jtv_user_pictures/c19f6495-f8c1-4e0e-bb38-83975e9cf549-profile_image-70x70.png", "msg-param-viewerCount": "5", "room-id": "38921745", "subscriber": false, "system-msg": "5 raiders from FelixS45 have joined!", "tmi-sent-ts": "1633502929567", "user-id": "66818086", "user-type": null, "emotes-raw": null, "badge-info-raw": null, "badges-raw": "turbo/1", "message-type": "raid" }, "_id": "3HjRLH0jDOpuna2v" }
    , { "type": "chat", "topic": "subgift", "channel": "#frikymedialp", "username": "AnAnonymousGifter", "streakMonths": 0, "recipient": "MrPosh1909", "methods": { "prime": false, "plan": "1000", "planName": "Channel Subscription (frikymedialp)" }, "userstate": { "badge-info": null, "badges": null, "color": null, "display-name": "AnAnonymousGifter", "emotes": null, "flags": null, "id": "66be845f-2c21-4d4d-a65a-9a93590513d7", "login": "ananonymousgifter", "mod": false, "msg-id": "subgift", "msg-param-fun-string": "FunStringThree", "msg-param-gift-months": true, "msg-param-months": "11", "msg-param-origin-id": "57 15 b3 09 2f e2 f0 e9 23 e2 d9 ed 62 00 9f 50 39 6e bb 46", "msg-param-recipient-display-name": "MrPosh1909", "msg-param-recipient-id": "137849570", "msg-param-recipient-user-name": "mrposh1909", "msg-param-sub-plan-name": "Channel Subscription (frikymedialp)", "msg-param-sub-plan": "1000", "room-id": "38921745", "subscriber": false, "system-msg": "An anonymous user gifted a Tier 1 sub to MrPosh1909! ", "tmi-sent-ts": "1633516103990", "user-id": "274598607", "user-type": null, "emotes-raw": null, "badge-info-raw": null, "badges-raw": null, "message-type": "subgift" }, "_id": "3I0sSfN84SKSqIAi" }
    , { "user_id": "44108063", "user_login": "swiiftiroin", "user_name": "SwiIFTIRoIN", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "is_gift": true, "type": "eventsub", "topic": "channel.subscribe", "_id": "51P7yoFjUqI7rJjg" }
    , { "user_id": "88242024", "user_login": "th3b0stlp", "user_name": "Th3b0stlp", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "is_gift": false, "type": "eventsub", "topic": "channel.subscribe", "_id": "5j4BscU6t3rDJ3OR" }
    , { "type": "chat", "topic": "subgift", "channel": "#frikymedialp", "username": "MrPosh1909", "streakMonths": 0, "recipient": "CaTazztrophe", "methods": { "prime": false, "plan": "1000", "planName": "Channel Subscription (frikymedialp)" }, "userstate": { "badge-info": { "founder": "11" }, "badges": { "founder": "0", "bits-leader": "3" }, "color": "#215EC0", "display-name": "MrPosh1909", "emotes": null, "flags": null, "id": "afc29780-ea95-4a03-87ac-57bc3689a6ee", "login": "mrposh1909", "mod": false, "msg-id": "subgift", "msg-param-gift-months": true, "msg-param-months": "7", "msg-param-origin-id": "c3 ba 8f 87 86 b3 38 8a ea 9a bf 23 dc 83 d3 5b a8 b0 5e 9c", "msg-param-recipient-display-name": "CaTazztrophe", "msg-param-recipient-id": "62518333", "msg-param-recipient-user-name": "catazztrophe", "msg-param-sender-count": false, "msg-param-sub-plan-name": "Channel Subscription (frikymedialp)", "msg-param-sub-plan": "1000", "room-id": "38921745", "subscriber": true, "system-msg": "MrPosh1909 gifted a Tier 1 sub to CaTazztrophe!", "tmi-sent-ts": "1633516229870", "user-id": "137849570", "user-type": null, "emotes-raw": null, "badge-info-raw": "founder/11", "badges-raw": "founder/0,bits-leader/3", "message-type": "subgift" }, "_id": "6mmyHqBk7j8gn4Ga" }
    , { "type": "chat", "topic": "resub", "channel": "#frikymedialp", "username": "freezycan", "months": 0, "message": "PogChamp", "userstate": { "badge-info": { "subscriber": "30" }, "badges": { "subscriber": "12", "premium": "1" }, "color": "#D2691E", "display-name": "freezycan", "emotes": { "305954156": ["0-7"] }, "flags": null, "id": "43d21f0c-bb0d-4d67-a2b3-3dc6365fdfe2", "login": "freezycan", "mod": false, "msg-id": "resub", "msg-param-cumulative-months": "30", "msg-param-months": false, "msg-param-multimonth-duration": false, "msg-param-multimonth-tenure": false, "msg-param-should-share-streak": false, "msg-param-sub-plan-name": "Channel Subscription (frikymedialp)", "msg-param-sub-plan": "1000", "msg-param-was-gifted": "false", "room-id": "38921745", "subscriber": true, "system-msg": "freezycan subscribed at Tier 1. They've subscribed for 30 months!", "tmi-sent-ts": "1633515898381", "user-id": "97008170", "user-type": null, "emotes-raw": "305954156:0-7", "badge-info-raw": "subscriber/30", "badges-raw": "subscriber/12,premium/1", "message-type": "resub" }, "methods": { "prime": false, "plan": "1000", "planName": "Channel Subscription (frikymedialp)" }, "_id": "7PYjiwm2N4FLephH" }
    , { "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "total": 1, "cumulative_total": 2, "is_anonymous": false, "type": "eventsub", "topic": "channel.subscription.gift", "_id": "7TvWMPm6JpGgPVNu" }
    , { "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "title": "[GER] Battlefield 2042 Beta HYYYPEEEEE !sammeln", "language": "de", "category_id": "514974", "category_name": "Battlefield 2042", "is_mature": true, "type": "eventsub", "topic": "channel.update", "_id": "99A2hzVPlxEPdYI8" }
    , { "user_id": "64658988", "user_login": "shoxx147", "user_name": "Shoxx147", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "followed_at": "2021-10-06T10:52:56.316267581Z", "type": "eventsub", "topic": "channel.follow", "_id": "9fs2LetFm56yf16Q" }
    , { "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "total": 1, "cumulative_total": 1, "is_anonymous": false, "type": "eventsub", "topic": "channel.subscription.gift", "_id": "CARaC7WPoXiqC85A" }
    , { "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "type": "eventsub", "topic": "stream.offline", "_id": "Echb7zzQqqNTn83e" }
    , { "user_id": "97008170", "user_login": "freezycan", "user_name": "freezycan", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "message": { "text": "PogChamp", "emotes": [{ "begin": 0, "end": 7, "id": "305954156" }] }, "tier": "1000", "cumulative_months": 30, "streak_months": 0, "duration_months": 0, "type": "eventsub", "topic": "channel.subscription.message", "_id": "GHyx7dGJM3tUPEt3" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 2600, "top_contributions": [{ "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "type": "subscription", "total": 1000 }], "started_at": "2021-10-06T10:28:23.873731509Z", "last_contribution": { "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "type": "subscription", "total": 500 }, "level": 2, "goal": 1800, "progress": 1000, "expires_at": "2021-10-06T10:33:23.873731509Z", "type": "eventsub", "topic": "channel.hype_train.progress", "_id": "KbaoZ31jX6xztqJI" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 1600, "top_contributions": [{ "user_id": "97008170", "user_login": "freezycan", "user_name": "freezycan", "type": "subscription", "total": 500 }], "started_at": "2021-10-06T10:28:23.873731509Z", "last_contribution": { "user_id": "274598607", "user_login": "ananonymousgifter", "user_name": "AnAnonymousGifter", "type": "subscription", "total": 500 }, "level": 2, "goal": 1800, "progress": 0, "expires_at": "2021-10-06T10:33:23.873731509Z", "type": "eventsub", "topic": "channel.hype_train.progress", "_id": "M2OYgnQkjBXtS6TI" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 3600, "top_contributions": [{ "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "type": "subscription", "total": 1000 }], "started_at": "2021-10-06T10:28:23.873731509Z", "last_contribution": { "user_id": "88242024", "user_login": "th3b0stlp", "user_name": "Th3b0stlp", "type": "subscription", "total": 1000 }, "level": 3, "goal": 2100, "progress": 200, "expires_at": "2021-10-06T10:35:36.59035143Z", "type": "eventsub", "topic": "channel.hype_train.progress", "_id": "M93U72vhQtaFOHqy" }
    , { "type": "chat", "topic": "cheer", "channel": "#frikymedialp", "userstate": { "badge-info": null, "badges": { "glitchcon2020": "1" }, "bits": "100", "color": "#215EC0", "display-name": "MrPosh1909", "emotes": null, "flags": null, "id": "af8bea06-cc14-4630-bdba-42a341fcfb0f", "mod": false, "room-id": "38921745", "subscriber": false, "tmi-sent-ts": "1633516046081", "turbo": false, "user-id": "137849570", "user-type": null, "emotes-raw": null, "badge-info-raw": null, "badges-raw": "glitchcon2020/1", "username": "mrposh1909", "message-type": "chat" }, "message": "Cheer100 Bits Check", "_id": "MwOhM7C04s1mML0t" }
    , { "user_id": null, "user_login": null, "user_name": null, "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "total": 1, "cumulative_total": null, "is_anonymous": true, "type": "eventsub", "topic": "channel.subscription.gift", "_id": "Ne3GVTFP8OydNrky" }
    , { "user_id": "729959750", "user_login": "destroyvzdp", "user_name": "destroyvzdp", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "followed_at": "2021-10-06T12:55:45.333139538Z", "type": "eventsub", "topic": "channel.follow", "_id": "NmKDFsoWWpld5dVI" }
    , { "user_id": "88242024", "user_login": "th3b0stlp", "user_name": "Th3b0stlp", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "message": { "text": "", "emotes": null }, "tier": "2000", "cumulative_months": 9, "streak_months": 0, "duration_months": 1, "type": "eventsub", "topic": "channel.subscription.message", "_id": "Nxufx0nZDeKdENWX" }
    , { "user_id": "62518333", "user_login": "catazztrophe", "user_name": "CaTazztrophe", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "is_gift": true, "type": "eventsub", "topic": "channel.subscribe", "_id": "ROgLNQJ04fgwh5AC" }
    , { "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "title": "[GER] Battlefield 2042 Beta HYYYPEEEEE", "language": "de", "category_id": "509658", "category_name": "Just Chatting", "is_mature": true, "type": "eventsub", "topic": "channel.update", "_id": "Ri7w84aMmsDCUJr2" }
    , { "user_id": "524636289", "user_login": "aboobstar", "user_name": "aboobstar", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "followed_at": "2021-10-06T08:02:04.693353254Z", "type": "eventsub", "topic": "channel.follow", "_id": "UlDJez2Z5y7FWEYK" }
    , { "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "is_gift": true, "type": "eventsub", "topic": "channel.subscribe", "_id": "WhLMdOhNem7FKONW" }
    , { "type": "chat", "topic": "resub", "channel": "#frikymedialp", "username": "Th3b0stlp", "months": 0, "message": null, "userstate": { "badge-info": { "subscriber": "9" }, "badges": { "subscriber": "9", "sub-gift-leader": "1" }, "color": "#F100FF", "display-name": "Th3b0stlp", "emotes": null, "flags": null, "id": "63b9dc50-56e9-41ca-8623-9195817c9b15", "login": "th3b0stlp", "mod": false, "msg-id": "resub", "msg-param-cumulative-months": "9", "msg-param-months": false, "msg-param-multimonth-duration": true, "msg-param-multimonth-tenure": false, "msg-param-should-share-streak": false, "msg-param-sub-plan-name": "Channel Subscription (frikymedialp): $9.99 Sub", "msg-param-sub-plan": "2000", "msg-param-was-gifted": "false", "room-id": "38921745", "subscriber": true, "system-msg": "Th3b0stlp subscribed at Tier 2. They've subscribed for 9 months!", "tmi-sent-ts": "1633516236744", "user-id": "88242024", "user-type": null, "emotes-raw": null, "badge-info-raw": "subscriber/9", "badges-raw": "subscriber/9,sub-gift-leader/1", "message-type": "resub" }, "methods": { "prime": false, "plan": "2000", "planName": "Channel Subscription (frikymedialp): $9.99 Sub" }, "_id": "WhOn8NxZe6LIhXyO" }
    , { "user_id": "88242024", "user_login": "th3b0stlp", "user_name": "Th3b0stlp", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "message": { "text": "", "emotes": null }, "tier": "1000", "cumulative_months": 9, "streak_months": 0, "duration_months": 0, "type": "eventsub", "topic": "channel.subscription.message", "_id": "Z1k4aVIrkJug53AQ" }
    , { "user_id": "64658988", "user_login": "shoxx147", "user_name": "Shoxx147", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "1000", "is_gift": false, "type": "eventsub", "topic": "channel.subscribe", "_id": "ZgBmUWpLgHb2JhuW" }
    , { "user_id": "64658988", "user_login": "shoxx147", "user_name": "Shoxx147", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "message": { "text": "", "emotes": null }, "tier": "1000", "cumulative_months": 1, "streak_months": 0, "duration_months": 0, "type": "eventsub", "topic": "channel.subscription.message", "_id": "Zlgro0Sr4i9DrK9F" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 3600, "top_contributions": [{ "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "type": "subscription", "total": 1000 }], "started_at": "2021-10-06T10:28:23.873731509Z", "level": 3, "ended_at": "2021-10-06T10:35:37.424283914Z", "cooldown_ends_at": "2021-10-06T11:35:37.424283914Z", "type": "eventsub", "topic": "channel.hype_train.end", "_id": "ZnDguKNcDhG03MLm" }
    , { "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "title": "[GER] Battlefield 2042 Beta HYYYPEEEEE !sammeln", "language": "de", "category_id": "509658", "category_name": "Just Chatting", "is_mature": true, "type": "eventsub", "topic": "channel.update", "_id": "bIj2beSb1Nq1gEe1" }
    , { "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "is_anonymous": false, "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "message": "Cheer100 Bits Check", "bits": 100, "type": "eventsub", "topic": "channel.cheer", "_id": "bnWmQjWmaSgsrELE" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 1600, "top_contributions": [{ "user_id": "97008170", "user_login": "freezycan", "user_name": "freezycan", "type": "subscription", "total": 500 }], "started_at": "2021-10-06T10:28:23.873731509Z", "last_contribution": { "user_id": "274598607", "user_login": "ananonymousgifter", "user_name": "AnAnonymousGifter", "type": "subscription", "total": 500 }, "level": 2, "goal": 1800, "progress": 0, "expires_at": "2021-10-06T10:33:23.873731509Z", "type": "eventsub", "topic": "channel.hype_train.progress", "_id": "cRVtR5Jubb9GGXAy" }
    , { "user_id": "88242024", "user_login": "th3b0stlp", "user_name": "Th3b0stlp", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "tier": "2000", "is_gift": false, "type": "eventsub", "topic": "channel.subscribe", "_id": "dlcDe6cmJQJLNxpc" }
    , { "type": "chat", "topic": "raided", "channel": "#frikymedialp", "username": "Th3b0stlp", "viewers": 1, "idx-3": { "badge-info": { "subscriber": "9" }, "badges": { "subscriber": "2009", "sub-gift-leader": "1" }, "color": "#F100FF", "display-name": "Th3b0stlp", "emotes": null, "flags": null, "id": "ed4244df-bf86-4b2b-a397-15a91de3443d", "login": "th3b0stlp", "mod": false, "msg-id": "raid", "msg-param-displayName": "Th3b0stlp", "msg-param-login": "th3b0stlp", "msg-param-profileImageURL": "https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png", "msg-param-viewerCount": true, "room-id": "38921745", "subscriber": true, "system-msg": "1 raiders from Th3b0stlp have joined!", "tmi-sent-ts": "1633530139012", "user-id": "88242024", "user-type": null, "emotes-raw": null, "badge-info-raw": "subscriber/9", "badges-raw": "subscriber/2009,sub-gift-leader/1", "message-type": "raid" }, "_id": "gRyuSbFuS1IRxmDu" }
    , { "id": "40060325243", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "type": "eventsub", "started_at": "2021-10-06T06:38:26Z", "topic": "stream.online", "_id": "iNVbwjGufZGbGtJp" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 2100, "top_contributions": [{ "user_id": "97008170", "user_login": "freezycan", "user_name": "freezycan", "type": "subscription", "total": 500 }], "started_at": "2021-10-06T10:28:23.873731509Z", "last_contribution": { "user_id": "88242024", "user_login": "th3b0stlp", "user_name": "Th3b0stlp", "type": "subscription", "total": 500 }, "level": 2, "goal": 1800, "progress": 500, "expires_at": "2021-10-06T10:33:23.873731509Z", "type": "eventsub", "topic": "channel.hype_train.progress", "_id": "iVqMxM5EBuJahz2F" }
    , { "type": "chat", "topic": "resub", "channel": "#frikymedialp", "username": "Th3b0stlp", "months": 0, "message": null, "userstate": { "badge-info": { "subscriber": "9" }, "badges": { "subscriber": "9", "sub-gift-leader": "1" }, "color": "#F100FF", "display-name": "Th3b0stlp", "emotes": null, "flags": null, "id": "88e80b23-431b-4dea-99b8-a7292b026111", "login": "th3b0stlp", "mod": false, "msg-id": "resub", "msg-param-cumulative-months": "9", "msg-param-months": false, "msg-param-multimonth-duration": false, "msg-param-multimonth-tenure": false, "msg-param-should-share-streak": false, "msg-param-sub-plan-name": "Channel Subscription (frikymedialp)", "msg-param-sub-plan": "Prime", "msg-param-was-gifted": "false", "room-id": "38921745", "subscriber": true, "system-msg": "Th3b0stlp subscribed with Prime. They've subscribed for 9 months!", "tmi-sent-ts": "1633516156107", "user-id": "88242024", "user-type": null, "emotes-raw": null, "badge-info-raw": "subscriber/9", "badges-raw": "subscriber/9,sub-gift-leader/1", "message-type": "resub" }, "methods": { "prime": true, "plan": "Prime", "planName": "Channel Subscription (frikymedialp)" }, "_id": "jlkXStc6XnCV40Ij" }
    , { "id": "40060325243", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "type": "eventsub", "started_at": "2021-10-06T06:38:26Z", "topic": "stream.online", "_id": "jw88aiRDN3zcrkod" }
    , { "user_id": "166702078", "user_login": "mxlanix", "user_name": "mxlanix", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "followed_at": "2021-10-06T07:08:59.194739744Z", "type": "eventsub", "topic": "channel.follow", "_id": "ox8T9I8tJU0TvF67" }
    , { "type": "chat", "topic": "submysterygift", "channel": "#frikymedialp", "username": "MrPosh1909", "numbOfSubs": 1, "methods": { "prime": false, "plan": "1000", "planName": null }, "userstate": { "badge-info": { "founder": "11" }, "badges": { "founder": "0", "bits-leader": "3" }, "color": "#215EC0", "display-name": "MrPosh1909", "emotes": null, "flags": null, "id": "07a4b046-31da-4c89-8a90-dc5eec1149fd", "login": "mrposh1909", "mod": false, "msg-id": "submysterygift", "msg-param-mass-gift-count": true, "msg-param-origin-id": "c3 ba 8f 87 86 b3 38 8a ea 9a bf 23 dc 83 d3 5b a8 b0 5e 9c", "msg-param-sender-count": "2", "msg-param-sub-plan": "1000", "room-id": "38921745", "subscriber": true, "system-msg": "MrPosh1909 is gifting 1 Tier 1 Subs to FrikyMediaLP's community! They've gifted a total of 2 in the channel!", "tmi-sent-ts": "1633516226000", "user-id": "137849570", "user-type": null, "emotes-raw": null, "badge-info-raw": "founder/11", "badges-raw": "founder/0,bits-leader/3", "message-type": "submysterygift" }, "_id": "p9smLOcN2hkTDKl3" }
    , { "type": "chat", "topic": "subscription", "channel": "#frikymedialp", "username": "Shoxx147", "method": { "prime": true, "plan": "Prime", "planName": "Channel Subscription (frikymedialp)" }, "message": null, "userstate": { "badge-info": null, "badges": { "premium": "1" }, "color": "#FF4800", "display-name": "Shoxx147", "emotes": null, "flags": null, "id": "031c33ed-1b1c-48b3-b139-3b11a71dd0bd", "login": "shoxx147", "mod": false, "msg-id": "sub", "msg-param-cumulative-months": true, "msg-param-months": false, "msg-param-multimonth-duration": false, "msg-param-multimonth-tenure": false, "msg-param-should-share-streak": false, "msg-param-sub-plan-name": "Channel Subscription (frikymedialp)", "msg-param-sub-plan": "Prime", "msg-param-was-gifted": "false", "room-id": "38921745", "subscriber": true, "system-msg": "Shoxx147 subscribed with Prime.", "tmi-sent-ts": "1633517584864", "user-id": "64658988", "user-type": null, "emotes-raw": null, "badge-info-raw": null, "badges-raw": "premium/1", "message-type": "sub" }, "_id": "rTsz6s3dc0yPPIWw" }
    , { "id": "fc80f979-f3bd-4dd9-9db6-a118c4382086", "broadcaster_user_id": "38921745", "broadcaster_user_login": "frikymedialp", "broadcaster_user_name": "FrikyMediaLP", "total": 1600, "top_contributions": [{ "user_id": "97008170", "user_login": "freezycan", "user_name": "freezycan", "type": "subscription", "total": 500 }, { "user_id": "137849570", "user_login": "mrposh1909", "user_name": "MrPosh1909", "type": "bits", "total": 100 }], "started_at": "2021-10-06T10:28:23.873731509Z", "last_contribution": { "user_id": "274598607", "user_login": "ananonymousgifter", "user_name": "AnAnonymousGifter", "type": "subscription", "total": 500 }, "goal": 1800, "progress": 0, "expires_at": "2021-10-06T10:33:23.873731509Z", "type": "eventsub", "topic": "channel.hype_train.begin", "_id": "wLZpFB12F8Tqfyse" }
    , { "type": "chat", "topic": "subgift", "channel": "#frikymedialp", "username": "MrPosh1909", "streakMonths": 0, "recipient": "SwiIFTIRoIN", "methods": { "prime": false, "plan": "1000", "planName": "Channel Subscription (frikymedialp)" }, "userstate": { "badge-info": null, "badges": { "bits-leader": "3" }, "color": "#215EC0", "display-name": "MrPosh1909", "emotes": null, "flags": null, "id": "a4bf240b-e6a3-494c-b856-ad35d860c909", "login": "mrposh1909", "mod": false, "msg-id": "subgift", "msg-param-gift-months": true, "msg-param-months": "5", "msg-param-origin-id": "33 b5 26 f5 cf 03 6c 1b d5 2a 55 df 4f 75 50 15 ae ef ee 1f", "msg-param-recipient-display-name": "SwiIFTIRoIN", "msg-param-recipient-id": "44108063", "msg-param-recipient-user-name": "swiiftiroin", "msg-param-sender-count": true, "msg-param-sub-plan-name": "Channel Subscription (frikymedialp)", "msg-param-sub-plan": "1000", "room-id": "38921745", "subscriber": false, "system-msg": "MrPosh1909 gifted a Tier 1 sub to SwiIFTIRoIN! This is their first Gift Sub in the channel!", "tmi-sent-ts": "1633516073193", "user-id": "137849570", "user-type": null, "emotes-raw": null, "badge-info-raw": null, "badges-raw": "bits-leader/3", "message-type": "subgift" }, "_id": "xxXR8zjZiOyyYuVh" }
];

window.addEventListener('resize', Alert_Settings_updatePreviewRatio);

function init() {
    OUTPUT_create();

    GetVoices()
        .then(fetchSetting)
        .then(json => {
            //Set Info
            FILES = json.files;
            CONFIGS = json.cfg.Alerts;
            DEFAULT_ALERT_SETTINGS = json.DEFAULT_ALERT_SETTINGS;
            ALERT_VARIABLES = json.ALERT_VARIABLES;

            //Overlay
            updateOverlaySettings(json.SUPPORTED_ALERTS, json.cfg, json.hostname);

            let cols = "";
            //Create Topics in Order
            for (let alert of json.SUPPORTED_ALERTS)
                if (json.cfg.Alerts[alert]) {
                    addAlert(alert, json.cfg.Alerts[alert]);
                    cols += "auto ";
                }

            //Create rest Topcis
            for (let topic in json.cfg.Alerts)
                if (!json.SUPPORTED_ALERTS.find(elt => elt === topic)) {
                    addAlert(topic, json.cfg.Alerts[topic]);
                    cols += "auto ";
                }
            
            document.getElementById('Event_UI').style.gridTemplateColumns = cols;

            //TTS
            CURRENT_VOICE = VOICES.find(elt => elt.name === json.cfg.TTS_VOICE);
            PREVIEW_VOICE = CURRENT_VOICE;
            document.getElementById('TTS_VOLUME').value = json.cfg.TTS_VOLUME;
            TTS_PITCH = json.cfg.TTS_PITCH;
            document.getElementById('TTS_PITCH').value = TTS_PITCH;
            document.getElementById('TTS_PITCH_NR').value = Math.round((TTS_PITCH - 1 + Number.EPSILON) * 100) / 100;
            createVoice(json.cfg['TTS_VOICE']);

            checkHash();
            SWITCHBUTTON_AUTOFILL();
            OUTPUT_create();
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err.message);
        });
}
function checkHash() {
    let hash = GetURLHashArray();
    
    for (let elt of hash) {
    //Main Topic
        let topic = document.getElementById("EVENT_TOPIC_" + elt.name.toUpperCase());
        if (topic) {
            topic.style.display = "block";

            for (let doc_elt of document.getElementById("Event_UI").childNodes) {
                if (doc_elt instanceof Element && doc_elt.innerHTML.toLowerCase() === elt.name.toLowerCase()) doc_elt.id = "selected_topic";
            }
            Alert_Settings_updatePreviewRatio();
        }
    }
}

async function fetchSetting() {
    return fetch('/api/Alerts/settings', getAuthHeader()).then(STANDARD_FETCH_RESPONSE_CHECKER);
}

//Alert Overlay
function updateOverlaySettings(alerts = [], cfg = {}, hostname = 'localhost') {
    document.getElementById('Alert_Overlay_Link').value = "http://" + hostname + '/Alerts/overlay/' + cfg.Overlay_Token;

    let s = '';
    for (let alert of alerts) s += '<button onclick="OverlayTestAlert(' + "'" + alert + "'" + ')">Test ' + alert + '</button>';
    document.getElementById('Alert_Overlay_Tests').innerHTML = s;
}
function OverlayTestAlert(alert) {
    if (!alert) return;
    
    fetch('/api/alerts/trigger/' + alert, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo("Alert Test Sent!");
        })
        .catch(err => {
            OUTPUT_showError('Internal Error.');
        });
}
function OverlayToggle() {
    let input = document.getElementById('Alert_Overlay_Link');
    let btn = document.getElementById('OVERLAY_TOGGLE');

    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = 'HIDE';
    } else {
        input.type = 'password';
        btn.innerHTML = 'SHOW';
    }
}
function OverlayOpen() {
    let input = document.getElementById('Alert_Overlay_Link');
    window.open(input.value, '_blank').focus();
}
function OverlayCopy() {
    let input = document.getElementById('Alert_Overlay_Link');
    copyToClipboard(input.value);
    OUTPUT_showInfo("Overlay Link copied to Clipboard!");
}

//Alerts Settings
function addAlert(name = "") {
    document.getElementById('Event_UI').innerHTML += '<div onclick="Alert_Settings_selectAlert(this)">' + name.toUpperCase() + '</div>';
}
function Alert_Settings_selectAlert(elt) {
    for (let child of document.getElementById('Event_UI').childNodes) child.id = "";

    elt.id = "selected_topic";
    OUTPUT_hide(document.getElementById('Alert_Preview_Output'));
    OUTPUT_hide(document.getElementById('EVENT_SETTINGS_SAVE_OUTPUT'));

    let name = elt.innerHTML.toLowerCase();
    let settings = CONFIGS[name];

    let notices = [];

    //CUSTOM SETTINGS
    let customs = '';
    for (let setting in ALERT_SETTINGS_INFO) {
        if (settings[setting] === undefined) continue;
        if (DEFAULT_ALERT_SETTINGS.find(elt => elt.name === setting)) continue;

        //Header
        customs += '<div>';
        customs += ALERT_SETTINGS_INFO[setting].name;

        if (name === 'bits' && setting === 'tts') {
            notices.push('TTS irgnores the Bits-Emotes and reads the rest out loud.');
            customs += '<span class="LEGEND_ID">' + (notices.length) + '</span>';
        } else if (ALERT_SETTINGS_INFO[setting].notice) {
            notices.push(ALERT_SETTINGS_INFO[setting].notice);
            customs += '<span class="LEGEND_ID">' + (notices.length) + '</span>';
        }
        customs += '</div>';

        //Content
        customs += '<div>' + Alert_Settings_createSetting(setting, settings[setting], "") + '</div>';
    }
    document.getElementById('EVENT_SETTINGS_CUSTOM').innerHTML = customs;

    //Variables
    let varis = '';
    for (let vari of ALERT_VARIABLES[name]) {
        //Header
        varis += '<div>{' + vari.name + '}</div>';

        //Header
        varis += '<div style="text-align: center;">' + vari.type + '</div>';

        //Content
        varis += '<div>' + vari.desc + '</div>';
    }
    document.getElementById('EVENT_SETTINGS_VARIABLES').innerHTML = varis;

    //GENERAL SETTINGS
    let general = '';
    for (let setting in ALERT_SETTINGS_INFO) {
        if (settings[setting] === undefined) continue;
        if (!DEFAULT_ALERT_SETTINGS.find(elt => elt.name === setting)) continue;

        //Header
        general += '<div>';
        general += ALERT_SETTINGS_INFO[setting].name;
        if (ALERT_SETTINGS_INFO[setting].notice) {
            notices.push(ALERT_SETTINGS_INFO[setting].notice);
            general += '<span class="LEGEND_ID">' + (notices.length) + '</span>';
        }
        general += '</div>';

        //Content
        general += '<div>' + Alert_Settings_createSetting(setting, settings[setting], "") + '</div>';
    }
    document.getElementById('EVENT_SETTINGS_GENERAL').innerHTML = general;

    //PREVIEW
    notices.push('Preview Text Size doesnt translate well to the actual Overlay! Keep that in mind!');

    //Enable
    SWITCHBUTTON_TOGGLE(document.getElementById('EVENT_SETTINGS_ENABLE'), settings.enabled === true);

    //Legend
    let legend = '';
    for (let i = 0; i < notices.length; i++) {
        legend += '<span>' + (i + 1) + '</span><span>' + notices[i] + '</span>';
    }
    document.getElementById('EVENT_SETTINGS_LEGEND').innerHTML = legend;
    
    document.getElementById('EVENT_TOPIC_').style.display = 'block';
    Alert_Settings_updatePreviewRatio();
    SWITCHBUTTON_AUTOFILL();
    OUTPUT_create();
}

function Alert_Settings_createSetting(type = '', value, topic) {
    if (type === 'size') return '<input type="number" min="1" step="1" value="' + value + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" />';
    else if (type === 'color') return '<input type="color" value="' + value + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" />';
    else if (type === 'tts_volume' || type === 'file_volume') {
        let s = '<div class="ALERT_SETTING_SLIDER_WRAPPER">';
        s += '<input type="range" step="1" min="0" value="' + value + '" max="100" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" oninput="Alert_Settings_sliderChange(this.value, ' + "'" + topic + "', '" + type + "'" + ')"/>';
        s += '<div><input type="number" step="1" min="0" value="' + value + '" max="100" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" oninput="Alert_Settings_sliderChange(this.value, ' + "'" + topic + "', '" + type + "'" + ')"/>%</div>';
        return s + '</div>';
    } else if (type === 'bold') return '<switchbutton value="' + (value === true) + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '"></switchbutton>';
    else if (type === 'layout') {
        let s = '<div class="EVENT_LAYOUT ALERT_SETTING_INPUT_' + topic + '" onclick="Alert_Settings_changeLayout(event, this)" data-setting="' + type + '">';
        for (let i = 1; i < 7; i++) s += '<img src="/Alerts/images/layout_' + i + '.png" ' + (value === i ? 'selected' : '') + '/>';
        s += '</div>';
        return s;
    }
    else if (type === 'effect') return MISC_SELECT_create(TRIGGER_EFFECTS, (() => {
        let i = -1;
        TRIGGER_EFFECTS.find((elt, idx) => {
            if (elt === value) {
                i = idx;
                return true;
            }
        });
        return i < 0 ? 0 : i;
    })(), null, null, 'ALERT_SETTING_INPUT_' + topic, 'data-setting="' + type + '"');
    else if (type === 'image') {
        return MISC_createFileLibrary(FILES, 'All Image/Video Files', 'images', value, 'ALERT_SETTING_INPUT_' + topic, 'data-setting="' + type + '"', '/api/Alerts/files');
    }
    else if (type === 'sound') {
        return MISC_createFileLibrary(FILES, 'All Sound/Music Files', 'sounds', value, 'ALERT_SETTING_INPUT_' + topic, 'data-setting="' + type + '"', '/api/Alerts/files');
    }
    else if (type === 'font') return MISC_SELECT_create(FONTS_LIST, (() => {
        let i = -1;
        FONTS_LIST.find((elt, idx) => {
            if (elt === value) {
                i = idx;
                return true;
            }
        });
        return i < 0 ? 0 : i;
    })(), null, null, 'ALERT_SETTING_INPUT_' + topic, 'data-setting="' + type + '"');
    else if (type === 'on_time') return '<input type="number" min="0" step="1" value="' + value + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" />s';
    else if (type === 'delay') return '<input type="number" min="0" step="1" value="' + value + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" />s';
    else if (type === 'tts') return '<switchbutton value="' + (value === true) + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '"></switchbutton>';
    else if (type === 'css') return '<textarea class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '">' + value + '</textarea>';
    else if (type === 'js') return '<textarea class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '">' + value + '</textarea>';
    else return '<input type="text" value="' + value + '" class="ALERT_SETTING_INPUT_' + topic + '" data-setting="' + type + '" />';
}
function Alert_Settings_getSettingValue(type, elt) {
    if (['message', 'color', 'bold', 'tts'].find(ele => ele === type)) {
        return elt.value;
    } else if (['size', 'on_time', 'delay', 'tts_volume', 'file_volume'].find(ele => ele === type)) {
        return parseInt(elt.value);
    } else if ('layout' === type) {
        let i = 0;
        for (let child of elt.childNodes) {
            if (child instanceof Element) {
                i++;
                if (child.hasAttribute('selected')) return i;
            }
        }
        return null;
    } else if ('image' === type || 'sound' === type) {
        return MISC_FileLibrary_getSelectedFile(elt) || '';
    } else if ('effect' === type || 'font' === type) {
        return MISC_SELECT_GetValue(elt);
    } else if ('css' === type || 'js' === type) {
        return elt.value;
    }

    return null;
}

function Alert_Settings_sliderChange(value, topic, type) {
    for (let elt of document.getElementsByClassName('ALERT_SETTING_INPUT_' + topic)) {
        if (elt instanceof Element && elt.dataset.setting === type) elt.value = value;
    }
}
function Alert_Settings_changeLayout(e, elt) {
    if (e.target.tagName !== 'IMG') return;

    for (let child of elt.childNodes) if (child instanceof Element) child.removeAttribute('selected');

    e.target.setAttribute('selected', 'true');
}

function Alert_Settings_updatePreviewRatio() {
    let elt = document.getElementById('Alert_Preview');
    elt.style.height = ((elt.clientWidth / 16) * 9) + "px";
}

function Alert_Settings_checkSettings(cfg = {}) {
    if (cfg.layout < 6 && cfg.image === '') return "No Image selected!";
    if (cfg.layout != 5 && cfg.message === '') return "Empty Text!";

    return true;
}
function Alert_Settings_collectSettings() {
    let cfg = {};

    for (let elt of document.getElementsByClassName('ALERT_SETTING_INPUT_')) {
        cfg[elt.dataset.setting] = Alert_Settings_getSettingValue(elt.dataset.setting, elt);
    }

    return cfg;
}

async function Alert_Test() {
    if (last_trigger_timeout) return Promise.resolve();

    let alert = null;
    for (let child of document.getElementById('Event_UI').childNodes) if (child.id !== "") alert = child.innerHTML.toLowerCase();
    
    //Collect Setting Data
    let cfg = Alert_Settings_collectSettings();
    console.log(cfg);

    //Add TTS - just debug
    if (cfg.tts === true) {
        cfg.tts = TTS_TEXT;
        cfg.tts_volume = TTS_VOLUME;
        cfg.tts_pitch = TTS_PITCH;
        cfg.tts_voice = PREVIEW_VOICE;
    }
    
    let error = Alert_Settings_checkSettings(cfg);
    if (typeof error === 'string') return OUTPUT_showError(error, document.getElementById('Alert_Preview_Output'));
    else OUTPUT_hideError(document.getElementById('Alert_Preview_Output'));
    
    last_trigger_timeout = true;
    
    //Create Alert
    document.getElementById('Alert_Preview').innerHTML = createAlertHTML(alert, cfg, alert.toUpperCase(), Event_Test_OnAlertEnd);

    //Local Delay Timer
    MISC_createTimer(cfg.delay, document.getElementById('Alert_Preview_Timer')).catch(err => err);

    //Trigger
    triggerAlert(alert.toUpperCase(), cfg, Event_Test_OnAlertEnd);

    //Local On Time(r)
    MISC_createTimer(cfg.on_time, document.getElementById('Alert_Preview_Timer')).catch(err => err);

    return Promise.resolve();
}
function Event_Test_OnAlertEnd(id) {
    last_trigger_timeout = false;
}

function EVENT_SETTINGS_SAVE() {
    let alert = null;
    for (let child of document.getElementById('Event_UI').childNodes) if (child.id !== "") alert = child.innerHTML.toLowerCase();

    //Collect Setting Data
    let cfg = Alert_Settings_collectSettings();

    //Check Layout and Sounds/Images
    let error = Alert_Settings_checkSettings(cfg);
    if (typeof error === 'string') return OUTPUT_showError(error, document.getElementById('EVENT_SETTINGS_SAVE_OUTPUT'));
    else OUTPUT_hideError(document.getElementById('EVENT_SETTINGS_SAVE_OUTPUT'));
    
    let opts = getAuthHeader();
    opts.method = 'PUT';
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify({ alerts: [alert], cfg });

    //Save
    fetch('/api/alerts/settings/alert', opts)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            Event_Settings_updateGlobalConfig([alert], json.cfg);

            if (json.halted) OUTPUT_showError(json.halted, document.getElementById('EVENT_SETTINGS_SAVE_OUTPUT'));
            else OUTPUT_hideError(document.getElementById('EVENT_SETTINGS_SAVE_OUTPUT'));
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message, document.getElementById('EVENT_SETTINGS_SAVE_OUTPUT'));
        });
}
function Event_Settings_updateGlobalConfig(alerts = [], cfg = {}) {
    for (let alert of alerts) {
        CONFIGS[alert.toLowerCase()] = cfg[alert.toLowerCase()];
    }
}

// TTS
async function GetVoices() {
    VOICES = [];

    return new Promise((resolve, reject) => {
        let inter = setInterval(() => {
            VOICES = window.speechSynthesis.getVoices();
            if (VOICES.length > 0) {
                CURRENT_VOICE = VOICES[0];
                PREVIEW_VOICE = VOICES[0];
                clearInterval(inter);
                return resolve();
            }
        }, 100);
    });
}
function createVoice(selected_voice) {
    //Create Cats
    let cats = [];
    for (let voice of VOICES) {
        let cat = cats.find(elt => name === voice.lang.split("-")[0]);

        if (cat) cat.voices.push(voice);
        else cats.push({ name: voice.lang.split("-")[0], voices: [voice] });
    }

    let s = "";
    let selected = VOICES.find(elt => selected_voice ? elt.name === selected_voice : elt.default === true);

    for (let cat of cats) {
        for (let voice of cat.voices) {
            s += '<div>' + voice.name + '</div>';
            s += '<div>' + voice.lang + '</div>';
            s += '<div>';
            s += '<button onclick="PREVIEW_VOICE = VOICES.find(elt => elt.name === ' + "'" + voice.name + "'" + '); text2speech(TTS_TEXT, TTS_VOLUME, TTS_PITCH, PREVIEW_VOICE);">Play</button>';
            s += '<button class="TTS_SELECT_BTN" ' + (selected.name === voice.name ? 'disabled' : '') + ' onclick="TTS_select(this, ' + "'" + voice.name + "'" + ')">Select</button>';
            s += '</div>';
        }
    }

    document.getElementById("TTS_VOICE").innerHTML = s;
}
function TTS_select(btn, name) {
    let prev = null;

    //Disable all
    for (let elt of document.getElementsByClassName("TTS_SELECT_BTN")) {
        if (elt.disabled === true) prev = elt;
        elt.disabled = true;
    }

    let opt = getAuthHeader();
    opt.method = "PUT";
    opt.headers['Content-Type'] = "application/json";
    opt.body = JSON.stringify({ setting: 'voice', value: name });

    fetch('/api/Alerts/settings/tts', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json['voice'] !== name) return Promise.reject(new Error('500 - Internal Error.'));

            CURRENT_VOICE = name;

            //Enable all
            for (let elt of document.getElementsByClassName("TTS_SELECT_BTN")) {
                elt.disabled = false;
            }

            //Disable new
            btn.disabled = true;
            OUTPUT_showInfo("Voices Changed!");
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err.message);

            //Enable all
            for (let elt of document.getElementsByClassName("TTS_SELECT_BTN")) {
                elt.disabled = false;
            }

            //Disable old
            if (prev) prev.disabled = true;
        });
}
function TTS_show() {
    document.getElementById("TTS_TEST_UI").classList.toggle("show");
    document.getElementById("TTS_VOICE").classList.toggle("show");
}
function TTS_Pitch_input(value) {
    TTS_PITCH = parseFloat(value);
    
    document.getElementById("TTS_PITCH_NR").value = Math.round((TTS_PITCH - 1 + Number.EPSILON) * 100) / 100;
    document.getElementById("TTS_PITCH").value = TTS_PITCH;
    
    document.getElementById("TTS_PITCH_SAVE").disabled = false;
}
function TTS_Pitch_Save() {
    let opt = getAuthHeader();
    opt.method = "PUT";
    opt.headers['Content-Type'] = "application/json";
    opt.body = JSON.stringify({ setting: 'pitch', value: TTS_PITCH });
    
    fetch('/api/Alerts/settings/tts', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json['pitch'] !== TTS_PITCH) return Promise.reject(new Error('500 - Internal Error.'));
            if (json['pitch'] === TTS_PITCH) document.getElementById("TTS_PITCH_SAVE").disabled = true;
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err.message);
        });
}