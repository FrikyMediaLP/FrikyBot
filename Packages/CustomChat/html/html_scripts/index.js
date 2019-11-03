//UTIL Stuff
let TwitchChatColors = ["red", "green", "blue", "yellow", "orange", "gray", "purple", "lime", "gold"];
let RandomsChatUserColors = [];
let currentChannels = [];
let currentChannelsDetails = {};
let CLIENT = null;

let thistime = false;

//Chat General
let autoScrollStatus = true;
let LAST = null;

//TWITCH EMOTES/BADGES/...
let BADGES = null;
let TTV_EMOTES = [
    {
        "code": "PorscheWIN",
        "id": 300745158
    },
    {
        "code": "SingsNote",
        "id": 300116350
    },
    {
        "code": "SingsMic",
        "id": 300116349
    },
    {
        "code": "TwitchSings",
        "id": 300116344
    },
    {
        "code": "SoonerLater",
        "id": 2113050
    },
    {
        "code": "HolidayTree",
        "id": 1713825
    },
    {
        "code": "HolidaySanta",
        "id": 1713822
    },
    {
        "code": "HolidayPresent",
        "id": 1713819
    },
    {
        "code": "HolidayOrnament",
        "id": 1713818
    },
    {
        "code": "HolidayLog",
        "id": 1713816
    },
    {
        "code": "HolidayCookie",
        "id": 1713813
    },
    {
        "code": "GunRun",
        "id": 1584743
    },
    {
        "code": "PixelBob",
        "id": 1547903
    },
    {
        "code": "FBPenalty",
        "id": 1441289
    },
    {
        "code": "FBChallenge",
        "id": 1441285
    },
    {
        "code": "FBCatch",
        "id": 1441281
    },
    {
        "code": "FBBlock",
        "id": 1441276
    },
    {
        "code": "FBSpiral",
        "id": 1441273
    },
    {
        "code": "FBPass",
        "id": 1441271
    },
    {
        "code": "FBRun",
        "id": 1441261
    },
    {
        "code": "GenderFluidPride",
        "id": 1297281
    },
    {
        "code": "NonBinaryPride",
        "id": 1297279
    },
    {
        "code": "MaxLOL",
        "id": 1290325
    },
    {
        "code": "IntersexPride",
        "id": 1221184
    },
    {
        "code": "TwitchRPG",
        "id": 1220086
    },
    {
        "code": "PansexualPride",
        "id": 1130349
    },
    {
        "code": "AsexualPride",
        "id": 1130348
    },
    {
        "code": "TransgenderPride",
        "id": 1064995
    },
    {
        "code": "GayPride",
        "id": 1064991
    },
    {
        "code": "LesbianPride",
        "id": 1064988
    },
    {
        "code": "BisexualPride",
        "id": 1064987
    },
    {
        "code": "PinkMercy",
        "id": 1003190
    },
    {
        "code": "MercyWing2",
        "id": 1003189
    },
    {
        "code": "MercyWing1",
        "id": 1003187
    },
    {
        "code": "PartyHat",
        "id": 965738
    },
    {
        "code": "EarthDay",
        "id": 959018
    },
    {
        "code": "TombRaid",
        "id": 864205
    },
    {
        "code": "PopCorn",
        "id": 724216
    },
    {
        "code": "FBtouchdown",
        "id": 626795
    },
    {
        "code": "PurpleStar",
        "id": 624501
    },
    {
        "code": "GreenTeam",
        "id": 530890
    },
    {
        "code": "RedTeam",
        "id": 530888
    },
    {
        "code": "TPFufun",
        "id": 508650
    },
    {
        "code": "TwitchVotes",
        "id": 479745
    },
    {
        "code": "DarkMode",
        "id": 461298
    },
    {
        "code": "HSWP",
        "id": 446979
    },
    {
        "code": "HSCheers",
        "id": 444572
    },
    {
        "code": "PowerUpL",
        "id": 425688
    },
    {
        "code": "PowerUpR",
        "id": 425671
    },
    {
        "code": "LUL",
        "id": 425618
    },
    {
        "code": "EntropyWins",
        "id": 376765
    },
    {
        "code": "TPcrunchyroll",
        "id": 323914
    },
    {
        "code": "TwitchUnity",
        "id": 196892
    },
    {
        "code": "Squid4",
        "id": 191767
    },
    {
        "code": "Squid3",
        "id": 191764
    },
    {
        "code": "Squid2",
        "id": 191763
    },
    {
        "code": "Squid1",
        "id": 191762
    },
    {
        "code": "CrreamAwk",
        "id": 191313
    },
    {
        "code": "CarlSmile",
        "id": 166266
    },
    {
        "code": "TwitchLit",
        "id": 166263
    },
    {
        "code": "TehePelo",
        "id": 160404
    },
    {
        "code": "TearGlove",
        "id": 160403
    },
    {
        "code": "SabaPing",
        "id": 160402
    },
    {
        "code": "PunOko",
        "id": 160401
    },
    {
        "code": "KonCha",
        "id": 160400
    },
    {
        "code": "Kappu",
        "id": 160397
    },
    {
        "code": "InuyoFace",
        "id": 160396
    },
    {
        "code": "BigPhish",
        "id": 160395
    },
    {
        "code": "BegWan",
        "id": 160394
    },
    {
        "code": "ArigatoNas",
        "id": 160393
    },
    {
        "code": "ThankEgg",
        "id": 160392
    },
    {
        "code": "MorphinTime",
        "id": 156787
    },
    {
        "code": "BlessRNG",
        "id": 153556
    },
    {
        "code": "TheIlluminati",
        "id": 145315
    },
    {
        "code": "TBAngel",
        "id": 143490
    },
    {
        "code": "MVGame",
        "id": 142140
    },
    {
        "code": "NinjaGrumpy",
        "id": 138325
    },
    {
        "code": "PartyTime",
        "id": 135393
    },
    {
        "code": "RlyTho",
        "id": 134256
    },
    {
        "code": "UWot",
        "id": 134255
    },
    {
        "code": "YouDontSay",
        "id": 134254
    },
    {
        "code": "KAPOW",
        "id": 133537
    },
    {
        "code": "ItsBoshyTime",
        "id": 133468
    },
    {
        "code": "CoolStoryBob",
        "id": 123171
    },
    {
        "code": "TriHard",
        "id": 120232
    },
    {
        "code": "SuperVinlin",
        "id": 118772
    },
    {
        "code": "FreakinStinkin",
        "id": 117701
    },
    {
        "code": "Poooound",
        "id": 117484
    },
    {
        "code": "CurseLit",
        "id": 116625
    },
    {
        "code": "BatChest",
        "id": 115234
    },
    {
        "code": "BrainSlug",
        "id": 115233
    },
    {
        "code": "PrimeMe",
        "id": 115075
    },
    {
        "code": "StrawBeary",
        "id": 114876
    },
    {
        "code": "RaccAttack",
        "id": 114870
    },
    {
        "code": "UncleNox",
        "id": 114856
    },
    {
        "code": "WTRuck",
        "id": 114847
    },
    {
        "code": "TooSpicy",
        "id": 114846
    },
    {
        "code": "Jebaited",
        "id": 114836
    },
    {
        "code": "DogFace",
        "id": 114835
    },
    {
        "code": "BlargNaut",
        "id": 114738
    },
    {
        "code": "TakeNRG",
        "id": 112292
    },
    {
        "code": "GivePLZ",
        "id": 112291
    },
    {
        "code": "imGlitch",
        "id": 112290
    },
    {
        "code": "pastaThat",
        "id": 112289
    },
    {
        "code": "copyThis",
        "id": 112288
    },
    {
        "code": "UnSane",
        "id": 111792
    },
    {
        "code": "DatSheffy",
        "id": 111700
    },
    {
        "code": "TheTarFu",
        "id": 111351
    },
    {
        "code": "PicoMause",
        "id": 111300
    },
    {
        "code": "TinyFace",
        "id": 111119
    },
    {
        "code": "DrinkPurple",
        "id": 110785
    },
    {
        "code": "DxCat",
        "id": 110734
    },
    {
        "code": "RuleFive",
        "id": 107030
    },
    {
        "code": "VoteNay",
        "id": 106294
    },
    {
        "code": "VoteYea",
        "id": 106293
    },
    {
        "code": "PJSugar",
        "id": 102556
    },
    {
        "code": "DoritosChip",
        "id": 102242
    },
    {
        "code": "OpieOP",
        "id": 100590
    },
    {
        "code": "FutureMan",
        "id": 98562
    },
    {
        "code": "ChefFrank",
        "id": 90129
    },
    {
        "code": "StinkyCheese",
        "id": 90076
    },
    {
        "code": "NomNom",
        "id": 90075
    },
    {
        "code": "SmoocherZ",
        "id": 89945
    },
    {
        "code": "cmonBruh",
        "id": 84608
    },
    {
        "code": "KappaWealth",
        "id": 81997
    },
    {
        "code": "MikeHogu",
        "id": 81636
    },
    {
        "code": "VoHiYo",
        "id": 81274
    },
    {
        "code": "KomodoHype",
        "id": 81273
    },
    {
        "code": "SeriousSloth",
        "id": 81249
    },
    {
        "code": "OSFrog",
        "id": 81248
    },
    {
        "code": "OhMyDog",
        "id": 81103
    },
    {
        "code": "KappaClaus",
        "id": 74510
    },
    {
        "code": "KappaRoss",
        "id": 70433
    },
    {
        "code": "MingLee",
        "id": 68856
    },
    {
        "code": "SeemsGood",
        "id": 64138
    },
    {
        "code": "twitchRaid",
        "id": 62836
    },
    {
        "code": "bleedPurple",
        "id": 62835
    },
    {
        "code": "duDudu",
        "id": 62834
    },
    {
        "code": "riPepperonis",
        "id": 62833
    },
    {
        "code": "NotLikeThis",
        "id": 58765
    },
    {
        "code": "DendiFace",
        "id": 58135
    },
    {
        "code": "CoolCat",
        "id": 58127
    },
    {
        "code": "KappaPride",
        "id": 55338
    },
    {
        "code": "ShadyLulu",
        "id": 52492
    },
    {
        "code": "ArgieB8",
        "id": 51838
    },
    {
        "code": "CorgiDerp",
        "id": 49106
    },
    {
        "code": "HumbleLife",
        "id": 46881
    },
    {
        "code": "PraiseIt",
        "id": 38586
    },
    {
        "code": "TTours",
        "id": 38436
    },
    {
        "code": "mcaT",
        "id": 35063
    },
    {
        "code": "NotATK",
        "id": 34875
    },
    {
        "code": "HeyGuys",
        "id": 30259
    },
    {
        "code": "Mau5",
        "id": 30134
    },
    {
        "code": "PRChase",
        "id": 28328
    },
    {
        "code": "WutFace",
        "id": 28087
    },
    {
        "code": "BuddhaBar",
        "id": 27602
    },
    {
        "code": "PermaSmug",
        "id": 27509
    },
    {
        "code": "panicBasket",
        "id": 22998
    },
    {
        "code": "BabyRage",
        "id": 22639
    },
    {
        "code": "HassaanChop",
        "id": 20225
    },
    {
        "code": "TheThing",
        "id": 7427
    },
    {
        "code": "EleGiggle",
        "id": 4339
    },
    {
        "code": "RitzMitz",
        "id": 4338
    },
    {
        "code": "YouWHY",
        "id": 4337
    },
    {
        "code": "PipeHype",
        "id": 4240
    },
    {
        "code": "BrokeBack",
        "id": 4057
    },
    {
        "code": "ANELE",
        "id": 3792
    },
    {
        "code": "PanicVis",
        "id": 3668
    },
    {
        "code": "GrammarKing",
        "id": 3632
    },
    {
        "code": "PeoplesChamp",
        "id": 3412
    },
    {
        "code": "SoBayed",
        "id": 1906
    },
    {
        "code": "BigBrother",
        "id": 1904
    },
    {
        "code": "Keepo",
        "id": 1902
    },
    {
        "code": "Kippa",
        "id": 1901
    },
    {
        "code": "RalpherZ",
        "id": 1900
    },
    {
        "code": "TF2John",
        "id": 1899
    },
    {
        "code": "ThunBeast",
        "id": 1898
    },
    {
        "code": "WholeWheat",
        "id": 1896
    },
    {
        "code": "DAESuppy",
        "id": 973
    },
    {
        "code": "FailFish",
        "id": 360
    },
    {
        "code": "HotPokket",
        "id": 357
    },
    {
        "code": "4Head",
        "id": 354
    },
    {
        "code": "ResidentSleeper",
        "id": 245
    },
    {
        "code": "FUNgineer",
        "id": 244
    },
    {
        "code": "PMSTwin",
        "id": 92
    },
    {
        "code": "PogChamp",
        "id": 88
    },
    {
        "code": "ShazBotstix",
        "id": 87
    },
    {
        "code": "BibleThump",
        "id": 86
    },
    {
        "code": "AsianGlow",
        "id": 74
    },
    {
        "code": "DBstyle",
        "id": 73
    },
    {
        "code": "BloodTrail",
        "id": 69
    },
    {
        "code": "HassanChop",
        "id": 68
    },
    {
        "code": "OneHand",
        "id": 66
    },
    {
        "code": "FrankerZ",
        "id": 65
    },
    {
        "code": "SMOrc",
        "id": 52
    },
    {
        "code": "ArsonNoSexy",
        "id": 50
    },
    {
        "code": "PunchTrees",
        "id": 47
    },
    {
        "code": "SSSsss",
        "id": 46
    },
    {
        "code": "Kreygasm",
        "id": 41
    },
    {
        "code": "KevinTurtle",
        "id": 40
    },
    {
        "code": "PJSalt",
        "id": 36
    },
    {
        "code": "SwiftRage",
        "id": 34
    },
    {
        "code": "DansGame",
        "id": 33
    },
    {
        "code": "GingerPower",
        "id": 32
    },
    {
        "code": "BCWarrior",
        "id": 30
    },
    {
        "code": "MrDestructoid",
        "id": 28
    },
    {
        "code": "JonCarnage",
        "id": 26
    },
    {
        "code": "Kappa",
        "id": 25
    },
    {
        "code": "RedCoat",
        "id": 22
    },
    {
        "code": "TheRinger",
        "id": 18
    },
    {
        "code": "StoneLightning",
        "id": 17
    },
    {
        "code": "OptimizePrime",
        "id": 16
    },
    {
        "code": "JKanStyle",
        "id": 15
    },
    {
        "code": "R-?\\)",
        "id": 14
    },
    {
        "code": "\\;-?(p|P)",
        "id": 13
    },
    {
        "code": "\\:-?(p|P)",
        "id": 12
    },
    {
        "code": "\\;-?\\)",
        "id": 11
    },
    {
        "code": "\\:-?[\\\\/]",
        "id": 10
    },
    {
        "code": "\\&lt\\;3",
        "id": 9
    },
    {
        "code": "\\:-?(o|O)",
        "id": 8
    },
    {
        "code": "B-?\\)",
        "id": 7
    },
    {
        "code": "[oO](_|\\.)[oO]",
        "id": 6
    },
    {
        "code": "\\:-?[z|Z|\\|]",
        "id": 5
    },
    {
        "code": "\\&gt\\;\\(",
        "id": 4
    },
    {
        "code": "\\:-?D",
        "id": 3
    },
    {
        "code": "\\:-?\\(",
        "id": 2
    },
    {
        "code": "\\:-?\\)",
        "id": 1
    }
];      //HARD CODED Cause Kraken outdated

//Broadcasters Sub-Icons/Badges/...
let BROADCASTER_BADGES = {};

//FFZ EMOTES
let FFZ_EMOTES = {};

//BTTV EMOTES
let BTTV_EMOTES = {};

async function setup() {
    noCanvas();

    if (!isLoggedIn()) {
        document.getElementById("master").innerHTML = "PLEASE LOG IN FIRST TO USE THIS CUSTOM CHAT!";
        frameRate(0);
        return;
    }

    frameRate(0.1);

    document.getElementById("master").addEventListener("wheel", (event) => {
        if (event.wheelDeltaY > 0) {
            autoScrollEnable(false);
        }
    });

    await update();

    await loadBadges();

    let methObj = {
        plan: "Prime",
        planName: "Channel Subscription (fitzyhere)",
        prime: true
    };
    let objasdasdasd = {
        "badge-info": "subscriber/0",
        badges: { subscriber: "0", premium: "1" },
        "badges-raw": "subscriber/0,premium/1",
        color: null,
        "display-name": "LordWhiskey713",
        emotes: null,
        "emotes-raw": null,
        flags: null,
        id: "7d5f72c0-b4e5-4773-b3ac-f09be69b0c6b",
        login: "lordwhiskey713",
        "message-type": "sub",
        mod: false,
        "msg-id": "sub",
        "msg-param-cumulative-months": true,
        "msg-param-months": false,
        "msg-param-should-share-streak": false,
        "msg-param-sub-plan": "Prime",
        "msg-param-sub-plan-name": "Channel\sSubscription\s(fitzyhere)",
        "room-id": "23155607",
        subscriber: true,
        "system-msg": "LordWhiskey713\ssubscribed\swith\sTwitch\sPrime.",
        "tmi-sent - ts": "1570727953117",
        "user-id": "208688964",
        "user-type": null
    };

    //createSubChatMessage("#frikymedialp", "FrikyMediaLP", methObj, "TEST SUBSCRIPTION!", objasdasdasd).parent(select("#master"));
}

function draw() {
    update();
}

async function update() {
    await fetch("/api/CustomChat/Metadata")
        .then(data => data.json())
        .then(json => {

            if (!json || !json.data || !json.data.Channel) {
                return;
            }

            let temp = [];

            for (let chan of Object.getOwnPropertyNames(json.data.Channel)) {
                temp.push("#" + json.data.Channel[chan].login);
            }

            if (!checkIfSame(temp, currentChannels)) {
                currentChannelsDetails = json.data.Channel;
                currentChannels = temp;

                updateUI();
                connect_to_Twitch(getCookie("Username"), getCookie("OAuth"), currentChannels);
            }

            return;
        })
        .catch(err => console.log(err));

    Promise.resolve();
}

//UI
async function updateUI() {
    //Header
    let s = "";
    
    for (let channel of currentChannels) {
        s += channel.substring(1).toLowerCase() + "/";
    }

    s = s.substring(0, s.lastIndexOf('/'));
    
    //Update Header
    document.getElementById("chatHeader").innerHTML = s.toUpperCase() + " - CHAT";

    //Update Sending Channel Selector
    let ol = "";
    let first = true;

    for (let chan of currentChannels) {
        if (first) {
            ol += "<button id='selectedChannel' onclick='switchChannel(this);'>&bull; " + chan.substring(1).toUpperCase() + "</button>";
            first = false;
        } else
            ol += "<button onclick='switchChannel(this);'>" + chan.substring(1).toUpperCase() + "</button>";
    }

    select("#dropdown-content").html(ol);

    //Load Sub-Badges
    let ids = [];
    let streamerNames = [];
    for (let detail of Object.getOwnPropertyNames(currentChannelsDetails)) {
        ids.push(currentChannelsDetails[detail].id);
        streamerNames.push("#" + currentChannelsDetails[detail].login);
    }
   
    await loadSubBadges(streamerNames, ids);

    //Load FFZ / BTTV of Channel
    await loadFFZ(currentChannels);
    await loadBTTV(currentChannels);

    Promise.resolve();
}

//Twitch IRC
function connect_to_Twitch(username, password, channels) {
    let options = {
        debug: false,
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: username,
            password: "oauth:" + password
        },
        channels: channels
    };

    CLIENT = new tmi.client(options);

    // Connect the client to the server..
    CLIENT.connect();

    CLIENT.on("message", (channel, userstate, message, self) => {
        
        //if (!thistime && self) { return; } // Ignore messages from the bot
        
        thistime = false;

        let temp = userstate;
        temp.Channel = channel;
        temp.Message = message;

        //Attributes to remove
        let exclude = ["message-type", "badges-raw", "badge-info-raw", "emotes-raw", "user-type", "subscriber", "turbo", "flags"];
        for (let key of exclude) {
            if (temp[key] || temp[key] == null || temp[key] == false) {
                delete temp[key];
            }
        }

        let last = createChatMessage(temp).parent(select("#master"));

        //check for Emotes -> send from Browser
        if (userstate["emote-sets"]) {
            last.html(replaceWitTTV(last.html()));
        }

        LAST = last;

        //autoscroll
        if (autoScrollStatus && last) {
            if (document.getElementById('bottom')) {
                document.getElementById('bottom').id = "";
            }

            last.id("bottom");
            document.getElementById('bottom').scrollIntoView();
        }
    });

    CLIENT.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
        let senderCount = ~~userstate["msg-param-sender-count"];

        console.log("");
        console.log("GIFT");
        console.log(channel);
        console.log(username);
        console.log(numbOfSubs);
        console.log(methods);
        console.log(userstate);
        console.log(senderCount);
    });

    CLIENT.on("subscription", (channel, username, method, message, userstate) => {
        let div = createSubChatMessage(channel, username, method, message, userstate);

        console.log("");
        console.log("SUB");
        console.log(channel);
        //#fitzyhere

        console.log(username);
        //LordWhiskey713

        console.log(method);

        console.log(message);
        //null

        console.log(userstate);

        LAST = div;

        if (autoScrollStatus) {
            if (document.getElementById('bottom')) {
                document.getElementById('bottom').id = "";
            }

            div.id("bottom");
            document.getElementById('bottom').scrollIntoView();
        }
    });
}

//Load Twitch Stuff
async function loadBadges() {
    await fetch("https://badges.twitch.tv/v1/badges/global/display?language=en")
        .then(data => data.json())
        .then(json => {
            BADGES = json;
            console.log(json);
        })
        .catch(err => console.log(err));

    Promise.resolve();
}
async function loadSubBadges(channels, channel_ids) {
    
    let i = 0;

    for (let id of channel_ids) {

        if (!id || !channels[i]) break;

        await fetch("https://badges.twitch.tv/v1/badges/channels/" + id + "/display")
            .then(data => data.json())
            .then(json => {
                if (!json.error) {
                    BROADCASTER_BADGES[channels[i]] = json.badge_sets;
                }
            })
            .catch(err => console.log(err));

        i++;
    }
    Promise.resolve();
}

//Print Message
function createChatMessage(msgObj) {
    let text = "";

    text += createBadgeDiv(msgObj);

    text += "<span>[<span class='Name' style='color: ";

    if (msgObj.color) {
        text += msgObj.color;
    } else {
        text += TwitchChatColors[Math.floor(Math.random() * TwitchChatColors.length)];
    }

    text += ";'>";

    if (msgObj["display-name"] != "") {
        text += msgObj["display-name"];
    } else {
        text += msgObj.username;
    }

    text += "</span>]</span> " + createMessageSpan(msgObj);

    let div = createDiv(text);
    
    if (hasHighlighted(msgObj.Message))
        div.class("HIGHLIGHTED");

    return div;
}
function createBadgeDiv(msgObj) {

    if (!BADGES) fetchBadges();

    let s = '<span class="MessageBadgeSpan"><img src="images/channel_' + getChannelIDX(msgObj.Channel) + '.png"/>';

    if (msgObj.badges) {
        for (let BadgeName of Object.getOwnPropertyNames(msgObj.badges)) {
            
            let version = msgObj.badges[BadgeName];
            let curBadge = null;

            if (BadgeName == "subscriber") {
                curBadge = (BROADCASTER_BADGES ? (BROADCASTER_BADGES[msgObj.Channel] ? (BROADCASTER_BADGES[msgObj.Channel].subscriber ? (BROADCASTER_BADGES[msgObj.Channel].subscriber.versions[version] ? (BROADCASTER_BADGES[msgObj.Channel].subscriber.versions[version]) : null) : null) : null) : null);
            } else if (BadgeName == "bits") {
                curBadge = (BROADCASTER_BADGES ? (BROADCASTER_BADGES[msgObj.Channel] ? (BROADCASTER_BADGES[msgObj.Channel].subscriber ? (BROADCASTER_BADGES[msgObj.Channel].subscriber.versions[version] ? (BROADCASTER_BADGES[msgObj.Channel].subscriber.versions[version]) : null) : null) : null) : null);
            } else {
                curBadge = BADGES.badge_sets[BadgeName].versions[version];
            }

            if (curBadge) {

                let b = "";

                if (curBadge.click_action == "visit_url") {
                    b += '<a href="' + curBadge.click_url + '" target="_blank">';
                }
                
                b += '<img src="' + curBadge.image_url_1x + '"';
                
                if (curBadge.title) {
                    b += ' title="' + curBadge.title + '"';
                }

                b += "/>"

                if (curBadge.click_action == "visit_url") {
                    b += "</a>"
                }

                s += b;
            }
        }
    }
    s += "</span>"

    return s;
}
function createMessageSpan(msgObj) {

    let s = "";

    if (msgObj.emotes) {

        let prelastEmoteIdx = 0;
        let lastEmoteIdx = -2;

        do {
            let ans = findNextEmote(msgObj.emotes, lastEmoteIdx+1);
            if (ans[0] != -1) {

                let name = msgObj.Message.substring(ans[0], ans[1]+1)
                
                //Add + Check for Links
                s += replaceLinks(msgObj.Message.substring(lastEmoteIdx + 1, ans[0]));

                s += '<div class="MessageMessageDiv"><img src="https://static-cdn.jtvnw.net/emoticons/v1/' + ans[2] + '/1.0" title="' + name + '" alt="' + name + '"></div>';
                prelastEmoteIdx = ans[1]+1;
            }
            lastEmoteIdx = ans[1];
        } while (lastEmoteIdx != -1);

        //Add + Check for Links
        s += replaceLinks(msgObj.Message.substring(prelastEmoteIdx));

    } else {
        s += replaceLinks(msgObj.Message);
    }

    //Check for FFZ
    s = replaceWithFFZ(s);

    //Check for BTTV
    s = replaceWithBTTV(s);

    return '<span class="MessageMessage">' + s + "</span>";
}

//PrintSub
function createSubChatMessage(channel, username, method, message, userstate) {
    
    let top = "";
    let bottom = "";

    if (method.prime && method.plan == "Prime") {
        top = username + " just subscribed to " + channel.substring(1) + " with Twitch Prime!";
    } else {
        top = username + " just subscribed to " + channel.substring(1) + "!";
        console.log(method);
    }

    let s = '<img src="images/channel_' + getChannelIDX(channel) + '.png"/ > ';
    s += '<img src="' + BADGES.badge_sets.subscriber.versions["0"].image_url_4x + '"/ > ';
    
    let div = createDiv(s + '<span>' + top + '</span>' + (message ? "<div>" + bottom + "</div>" : ""));
    div.class("SUB");

    return div;
}

function findNextEmote(emotes, lastIdx) {

    let curClosest = -1;
    let curClosestEnd = -1;
    let curClosestName = "";

    for (let emote of Object.getOwnPropertyNames(emotes)) {
        for (let i = 0; i < emotes[emote].length; i++) {
            let start = parseInt(emotes[emote][i].substring(0, emotes[emote][i].indexOf('-')));
            let ende = parseInt(emotes[emote][i].substring(emotes[emote][i].indexOf('-') + 1));

            if ((curClosest == -1 || start < curClosest) && start > lastIdx) {
                curClosest = start;
                curClosestEnd = ende;
                curClosestName = emote;
            }
        }
    }

    return [curClosest, curClosestEnd, curClosestName];
}
function replaceLinks(htmlMessage) {

    let s = "";

    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

    for (let word of htmlMessage.split(" ")) {
        if (word.indexOf("http://") >= 0 || word.indexOf("https://") >= 0) {
            s += ' <a href="' + word + '" style="color: #9e53c9">' + word + '</a>';
        } else if (!!pattern.test(word)) {
            s += ' <a href="http://' + word + '" style="color: #9e53c9">' + word + '</a>';
        }else {
            s += " " + word;
        }
    }
    return s.substring(1);
}
function checkForEmotes(s, level) {
    //Twitch
    for (let emote of TTV_EMOTES) {
        if (emote.code.indexOf(s) == 0) {
            return {
                src: "TTV",
                Emote: emote
            };
        }
    }

    if (level == 0) {
        return null;
    }

    //BTTV
    for (let emote of Object.getOwnPropertyNames(BTTV_EMOTES)) {
        if (emote.indexOf(s) == 0) {
            return {
                src: "BTTV",
                Emote: BTTV_EMOTES[emote]
            };
        }
    }

    if (level == 1) {
        return null;
    }

    //FFZ
    for (let emote of Object.getOwnPropertyNames(FFZ_EMOTES)) {
        if (emote.indexOf(s) == 0) {
            return {
                src: "FFZ",
                Emote: FFZ_EMOTES[emote]
            };
        }
    }

    return null;
}
function replaceWitTTV(src) {
    let s = "";

    for (let part of src.split(" ")) {

        let ans = checkForEmotes(part,0 );

        if (ans) {
            if (ans.src == "TTV") {
                s += '<img src="https://static-cdn.jtvnw.net/emoticons/v1/' + ans.Emote.id + '/1.0" title="' + part + '" alt="' + part + '"></div> ';
            } else {
                s += part + " ";
            }
        } else {
            s += part + " ";
        }
    }

    return s.substring(0, s.length-1);
}

//FFZ
async function loadFFZ(channels) {

    if (!Array.isArray(channels)) {
        channels = [channels];
    }

    for (let channel of channels) {
        await fetch("https://api.frankerfacez.com/v1/room/" + channel.substring(1))
            .then(data => data.json())
            .then(json => {
                if (!json.error) {
                    for (let set of Object.getOwnPropertyNames(json.sets)) {
                        for (let emote of json.sets[set].emoticons) {
                            FFZ_EMOTES[emote.name] = emote;
                        }
                    }
                }
            })
            .catch(err => console.log(err));
    }
    Promise.resolve();
}
function replaceWithFFZ(htmlMessage) {
    if (!FFZ_EMOTES) return htmlMessage;

    let s = "";

    for (let word of htmlMessage.split(" ")) {
        if (FFZ_EMOTES[word]) {
            s += ' <div class="MessageMessageDiv FFZ"><img src="' + FFZ_EMOTES[word].urls["1"] + '" title="' + word + '" alt="' + word + '"></div>';
        } else {
            s += " " + word;
        }
    }

    return s.substring(1);
}

//BTTV
async function loadBTTV(channels) {
    //https://api.betterttv.net/2/channels/dafran

    if (!Array.isArray(channels)) {
        channels = [channels];
    }

    for (let channel of channels) {
        await fetch("https://api.betterttv.net/2/channels/" + channel.substring(1))
            .then(data => data.json())
            .then(json => {
                if (json.status != 404) {
                    for (let emote of json.emotes) {
                        BTTV_EMOTES[emote.code] = emote;
                    }
                }
            })
            .catch(err => console.log(err));
    }


    Promise.resolve();
}
function replaceWithBTTV(htmlMessage) {
    //https://cdn.betterttv.net/emote/583089f4737a8e61abb0186b/1x

    if (!BTTV_EMOTES) return htmlMessage;

    let s = "";

    for (let word of htmlMessage.split(" ")) {
        if (BTTV_EMOTES[word]) {
            s += ' <div class="MessageMessageDiv BTTV"><img src="https://cdn.betterttv.net/emote/' + BTTV_EMOTES[word].id + '/1x" title="' + word + '" alt="' + word + '"></div>';
        } else {
            s += " " + word;
        }
    }

    return s.substring(1);
}

//SEND
function sendMessage() {
    
    if (!select("#selectedChannel") || select("#selectedChannel").html() == "" || !select("#messageIN") || select("#messageIN").value() == "" ) {
        return;
    }
    
    let channel = "#" + select("#selectedChannel").html().substring(2).toLowerCase();
    let message = select("#messageIN").value();
    
    thistime = true;

    CLIENT.say(channel, message);
    select("#messageIN").value("");
}
function switchChannel(x) {

    select("#selectedChannel").html(select("#selectedChannel").html().substring(2));
    
    select("#selectedChannel").id("");
    x.id = "selectedChannel";
    x.innerHTML = "&bull; " + x.innerHTML;
}
function messageInKey(event) {
    if (event.code == "Enter") {
        event.preventDefault();
        sendMessage();
    } else if (event.code == "Tab"){
        event.preventDefault();
        autoComplete(event.srcElement);
    }
}

//HIGHLIGHED
function hasHighlighted(s) {

    if (getCookie("ChatHiglights")) {
        for (let word of getCookie("ChatHiglights").split(" ")) {
            if (s.indexOf(word) >= 0) {
                return true;
            }
        }
    }

    return false;
}
function setHighlighted() {
    let temp = prompt("Please enter a SPACE-SEPARATED list of words to be highlighted! WITH THIS YOU ACCEPT THE USSAGE OF LOCALLY STORED COOKIES!", PrintArraySpaced(getCookie("ChatHiglights")));
    if (temp) {
        setCookie("ChatHiglights", temp)
    }
}

//Chat Generals
function clearChat() {
    select("#master").html("");
}
function autoComplete(x) {

    let part = x.value.split(" ")[x.value.split(" ").length - 1];
    let emote = checkForEmotes(part, 5);
    
    if (emote && emote.Emote && emote.Emote.code) {
        x.value = replaceLast(x.value, emote.Emote.code);
    }
}
function autoScrollEnable(on) {
    if(on == true || on == false)
        autoScrollStatus = on;

    if (on && LAST) {
        LAST.scrollIntoView();
    }
}

//UTIL
function checkIfSame(a, b) {
    if (a.length != b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}
function getChannelIDX(channel) {
    if (!select("#dropdown-content")) {
        return 1;
    }

    let options = select("#dropdown-content").child();
    
    for (let i = 0; i < options.length && i < 5; i++) {
        if (options[i].innerHTML && "#" + options[i].innerHTML.split(' ')[options[i].innerHTML.split(' ').length-1].toLowerCase() == channel) {
            return i+1;
        }
    }

    return 1;
}
function replaceLast(src, replace) {

    let s = "";

    for (let i = 0; i < src.split(" ").length - 1; i++) {
        console.log(s);
        s += (i == 0 && src.split(" ").length > 1 ? "" : " ") + src.split(" ")[i]; 
    }

    return s + replace;
}