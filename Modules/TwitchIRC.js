const CONSTANTS = require('./../Util/CONSTANTS.js');
const BTTV = require('./../3rdParty/BTTV.js');
const FFZ = require('./../3rdParty/FFZ.js');

const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
const Datastore = require('nedb');

const MODULE_DETAILS = {
    name: 'TwitchIRC',
    description: 'Interface to the Twitch Chat.',
    picture: '/images/icons/twitch_colored_alt.png'
};

class TwitchIRC extends require('./../Util/ModuleBase.js'){
    constructor(configJSON, logger) {
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                TwitchIRC: {
                    display: () => (" TwitchIRC ").inverse.brightMagenta
                }
            });
        }

        super(MODULE_DETAILS, configJSON, logger.TwitchIRC);
        
        this.Config.AddSettingTemplates([
            { name: 'login', type: 'string', group: 0 },
            { name: 'oauth', type: 'string', private: true, group: 0 },
            { name: 'channel', type: 'string', minlength: 1, group: 1, requiered: true },
            { name: 'support_BTTV', type: 'boolean', default: true, group: 2 },
            { name: 'support_FFZ', type: 'boolean', default: true, group: 2 },
            { name: 'console_print_join_message', type: 'boolean', default: true },
            { name: 'console_print_message', type: 'boolean', default: true },
            { name: 'console_print_connection', type: 'boolean', default: true },
            { name: 'Log_Dir', type: 'string', default: 'Logs/' + MODULE_DETAILS.name + '/' }
        ]);
        this.Config.options = {
            groups: [{ name: 'User Login' }, { name: 'Channel' }, { name: 'Emotes and Misc' }]
        };
        this.Config.Load();
        this.Config.FillConfig();

        //Ready
        this.addReadyRequirement(() => {
            if (!this.Config.GetConfig()['channel']) return false;
            return true;
        });
        
        //Connection client
        this.client = undefined;
        this.eventHandlers = [];

        //Logs
        this.CONNECTION_LOG;
        this.Settings_LOG;

        //STATS
        this.STAT_MSGS_RECEIVED = 0;
        this.STAT_MSGS_RECEIVED_PER_10 = 0;
        
        this.STAT_CONNECTION_TO = 0;
        this.STAT_CONNECTION_TO_PER_10 = 0;

        this.STAT_LAST_CONNECTION_TO = 0;
        
        this.STAT_MINUTE_TIMER = setInterval(() => {
            this.STAT_MSGS_RECEIVED_PER_10 = 0;
            this.STAT_CONNECTION_TO_PER_10 = 0;
        }, 600000);

        //Displayables
        const date_options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.addDisplayables([
            { name: 'Chat Connection', value: () => this.readyState() || 'CLOSED' },
            { name: 'Total Chat Messages Received', value: () => this.STAT_MSGS_RECEIVED },
            { name: 'Chat Messages Received Per 10 Min', value: () => this.STAT_MSGS_RECEIVED_PER_10 },
            { name: 'Total Connection Timeouts', value: () => this.STAT_CONNECTION_TO },
            { name: 'Connection Timeouts Per 10 Min', value: () => this.STAT_CONNECTION_TO_PER_10 },
            { name: 'Last Timeout at', value: () => this.STAT_LAST_CONNECTION_TO == 0 ? 'NEVER' : (new Date(this.STAT_LAST_CONNECTION_TO)).toLocaleDateString('de-DE', date_options) }
        ]);
    }

    async Init(WebInter) {
        //Setup API
        //Settings
        WebInter.addAuthAPIEndpoint('/settings/twitchirc/user', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            //Change Setting and Reconnect
            try {
                await this.ChangeUser(req.body.login, req.body.oauth);
            } catch (err) {
                return res.json({ err: 'User change failed' });
            }

            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/twitchirc/user',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                });
            }

            return res.json({ msg: 'User successfully changed' });
        });
        WebInter.addAuthAPIEndpoint('/settings/twitchirc/channel', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            //Change Setting and Reconnect
            try {
                await this.ChangeChannel(req.body.channel);
            } catch (err) {
                console.log(err);
                return res.json({ err: 'Channel change failed' });
            }

            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/twitchirc/channel',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                });
            }

            return res.json({ msg: 'Channel successfully changed' });
        });
        WebInter.addAuthAPIEndpoint('/settings/twitchirc/misc', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            let data = {};

            for (let setting in req.body) {
                if (this.Config.GetConfig()[setting] === undefined) return res.json({ err: 'Setting not found' });
                let error = this.Config.UpdateSetting(setting, req.body[setting]);

                data[setting] = error === true ? req.body[setting] : error;
            }

            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/twitchirc/misc',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                });
            }

            return res.json({ data });
        });

        //Util
        WebInter.addAuthAPIEndpoint('/twitchirc/test', { user_level: 'staff' }, 'GET', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            try {
                await this.say("MrDestructoid This is a Test Message MrDestructoid");
                return res.json({ msg: "200" });
            } catch (err) {
                return res.json({ err: err.message });
            }
        });
        WebInter.addAuthAPIEndpoint('/twitchirc/disconnect', { user_level: 'staff' }, 'GET', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            try {
                await this.Disconnect();
                return res.json({ msg: "200" });
            } catch (err) {
                return res.json({ err: err.message });
            }
        });
        WebInter.addAuthAPIEndpoint('/twitchirc/connect', { user_level: 'staff' }, 'GET', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            try {
                if (this.readyState() === 'OPEN') await this.Disconnect();
                await this.Connect();
                return res.json({ msg: "200" });
            } catch (err) {
                return res.json({ err: err.message });
            }
        });

        //Check Config
        if (this.Config.check().length > 0) {
            this.setEnabled(false);
            this.Logger.error('Twitch IRC disabled: Config Errors!');
        }

        //File Structure Check
        let cfg = this.Config.GetConfig();
        const DIRS = [cfg.Log_Dir];
        for (let dir of DIRS) {
            if (!fs.existsSync(path.resolve(dir))) {
                try {
                    fs.mkdirSync(path.resolve(dir));
                } catch (err) {
                    return Promise.reject(err);
                }
            }
        }

        if (this.isEnabled() !== true) return Promise.reject(new Error('Twitch IRC is disabled!'));
        if (this.isReady() !== true) return Promise.reject(new Error('Twitch IRC Config not ready!'));

        //Event Handlers
        this.on('connected', (addr, port) => {
            if (this.CONNECTION_LOG) {
                this.CONNECTION_LOG.insert({
                    event: 'connected',
                    user: this.getUsername(),
                    channel: this.getChannel(),
                    time: Date.now()
                });
            }

            if (this.Config.GetConfig()['console_print_connection'] !== true) return;
            this.Logger.info(`*Connected to ${addr}:${port}`);
        });
        this.on('disconnected', (reason) => {
            if (reason !== 'Connection closed.') {
                this.STAT_CONNECTION_TO++;
                this.STAT_CONNECTION_TO_PER_10++;
                this.STAT_LAST_CONNECTION_TO = Date.now();
            }

            if (this.CONNECTION_LOG) {
                this.CONNECTION_LOG.insert({
                    event: 'disconnected',
                    user: this.getUsername(),
                    channel: this.getChannel(),
                    reason: reason || 'Unknown',
                    time: Date.now()
                });
            }

            if (this.Config.GetConfig()['console_print_connection'] !== true) return;
            this.Logger.error("Bot got disconnected! Reason: " + (reason ? reason : " UNKNOWN"));
        });
        this.on('chat', (channel, userstate, message, self) => {
            this.STAT_MSGS_RECEIVED++;
            this.STAT_MSGS_RECEIVED_PER_10++;

            if (this.Config.GetConfig()['console_print_message'] !== true) return;
            let msg = new Message(channel, userstate, message);
            this.Logger.info(msg.toString());
        });
        this.on('join', (channel, username, self) => {
            if (this.Config.GetConfig()['console_print_join_message'] !== true) return;
            this.Logger.info(username + " joined!");
        });
        
        //Init Logging Database
        this.CONNECTION_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'Connection_Log.db'), autoload: true });
        this.Settings_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'Settings_Logs.db'), autoload: true });

        this.addLog('Connection Logs', this.CONNECTION_LOG);
        this.addLog('Settings Changes', this.Settings_LOG);

        //Setup TMI.js Client and Connect
        return this.Connect();
    }

    SetupClient() {
        let cfg = this.Config.GetConfig();

        if (!cfg.channel) {
            return false;
        }

        let options = {
            connection: {
                reconnect: true,
                secure: true
            },
            channels: [ cfg.channel ]
        };

        //Sending Allowed
        if (cfg.login && cfg.oauth) {
            options['identity'] = {
                username: cfg.login,
                password: cfg.oauth
            };
        }

        if (this.Logger) {
            options.logger = this.Logger.TwitchIRC;
        }
        
        this.client = new tmi.client(options);
        this.UpdateHandlers();

        return true;
    }

    async Connect() {
        if (!this.client) this.SetupClient();

        //Client defined?
        if (this.client) {
            return this.client.connect();
        }
    }
    async Disconnect() {
        if (!this.client) return Promise.resolve();
        return this.client.disconnect();
    }
    async Part() {
        if (!this.client) return Promise.resolve();

        return this.client.part(this.getChannel())
            .then(resp => { this.client = null; return Promise.resolve(resp); });
    }
    async Join() {
        if (!this.client || !this.Config.GetConfig()['channel']) return Promise.resolve("this");

        return this.client.join(this.Config.GetConfig()['channel']);
    }

    on(name, callback) {
        this.eventHandlers.push({ name, callback });

        if (this.client) {
            this.client.on(name, callback);
            return true;
        }

        return false;
    }
    UpdateHandlers() {
        if (!this.client) return false;

        for (let eH of this.eventHandlers) {
            this.client.on(eH.name, eH.callback);
        }

        return true;
    }

    //Interface
    async ChangeUser(login, oauth) {
        let error = this.Config.UpdateSetting('login', login);
        if (error !== true) return Promise.reject(new Error(error));

        error = this.Config.UpdateSetting('oauth', oauth);
        if (error !== true) return Promise.reject(new Error(error));

        try {
            await this.Disconnect();
            this.SetupClient();
        } catch (err) {
            return Promise.reject(err);
        }

        return this.Connect();
    }
    async ChangeChannel(channel) {
        let error = this.Config.UpdateSetting('channel', channel);
        if (error !== true) return Promise.reject(new Error(error));
        
        try {
            if (this.client) await this.Part();
        } catch (err) {
            return Promise.reject(err);
        }

        return this.Connect();
    }

    //COMMANDS
    async say(message = "", channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error("Client not Setup correctly!"));

        return new Promise((resolve, reject) => {
            this.client.say(channel, message.toString())
                .then(data => resolve())
                .catch(err => reject(new Error(err)));
        });
    }
    saySync(message = "", channel = this.getChannel()) {
        this.say(message, channel)
            .then((data) => {
                // data returns [channel]
            }).catch((err) => this.Logger.error(err.message));
    }

    async deleteMessage(id, channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error("Client not Setup correctly!"));

        return new Promise((resolve, reject) => {
            this.client.deletemessage(channel, id)
                .then(data => resolve())
                .catch(err => reject(new Error(err)));
        });
    }
    deleteMessageSync(id, channel = this.getChannel()) {
        this.deleteMessage(channel, id)
            .then((data) => {
                // data returns [channel]
            }).catch((err) => {
                //
            });
    }

    async timeout(username, length, reason, channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error("Client not Setup correctly!"));

        return new Promise((resolve, reject) => {
            this.client.timeout(channel, username, length, reason)
                .then(data => resolve())
                .catch(err => reject(new Error(err)));
        });
    }
    timeoutSync(username, length, reason, channel = this.getChannel()) {
        this.timeout(username, length, reason, channel)
            .then((data) => {
                // data returns [channel, username, seconds, reason]
            }).catch((err) => {
                //
            });
    }

    async ban(username, reason, channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error("Client not Setup correctly!"));

        return new Promise((resolve, reject) => {
            this.client.ban(channel, username, reason)
                .then(data => resolve())
                .catch(err => reject(new Error(err)));
        });
    }
    banSync(username, reason, channel = this.getChannel()) {
        this.ban(username, reason, channel)
            .then((data) => {
                // data returns [channel, username, reason]
            }).catch((err) => {
                //
            });
    }
    
    //CLIENT CONNECTION
    getUsername() {
        if (this.client)
            return this.client.getUsername();

        return null;
    }
    getChannels() {
        if (this.client)
            return this.client.getChannels();

        return null;
    }
    getChannel(cut_hashtag = false) {
        let channel = "";
        if (this.client && this.client.getChannels().length > 0)
            channel = this.client.getChannels()[0];

        if (channel) return cut_hashtag ? channel.substring(1) : channel;

        return null;
    }
    getOptions() {
        if (this.client)
            return this.client.getOptions();

        return null;
    }
    readyState() {
        if (this.client)
            return this.client.readyState();

        return null;
    }
}

class Message {
    constructor(channel, userstate, message) {
        this.message = message;
        this.channel = channel;
        this.userstate = userstate;
        this.is_Follower = false;

        //set Userlevel
        this.userLevel = "regular";
        
        for (let constant in CONSTANTS.UserLevel) {

            if (this.userLevel != "regular")
                break;

            for (let badge in userstate.badges) {
                if (badge == constant) {
                    this.userLevel = constant;
                    break;
                }
            }
        }
    }

    //transform to
    toString() {
        return this.getDisplayName() + " [" + this.getUserLevelAsText() + "] : " + this.message;
    }
    toJSON() {

        let temp = JSON.parse(JSON.stringify(this.userstate));
        temp.Message = this.message;

        //Attributes to remove
        let exclude = ["message-type", "badges-raw", "badge-info-raw", "emotes-raw", "user-type", "subscriber", "turbo", "flags"];
        for (let key of exclude) {
            if (temp[key] || temp[key] == null || temp[key] == false) {
                delete temp[key];
            }
        }
        
        return temp;
    }

    //SET
    async checkFollow(API) {
        if(!API)
            return Promise.reject(new Error("No API found!"));
        
        let response = await API.GetUsersFollows({ from_id: this.userstate["user-id"], to_id: this.userstate["room-id"] });
        
        if (response && response.total && response.total == 1) {
            if (this.userLevel < CONSTANTS.UserLevel.Partner) {
                this.userLevel = CONSTANTS.UserLevel.Follower;
            }
            this.is_Follower = true;
            return Promise.resolve(true);
        }

        this.is_Follower = false;
        return Promise.resolve(false);
    }

    //GET
    getDisplayName() {
        return (this.userstate['display-name'] && this.userstate['display-name'] != "" ? this.userstate['display-name'] : this.userstate.username);
    }
    getUsername() {
        return this.userstate.username;
    }

    getUser() {
        return this.userstate;
    }
    getUserID() {
        return this.userstate["user-id"];
    }
    getChannel(remove_hashtag = false) {
        if (remove_hashtag) return this.channel.substring(1);
        else return this.channel;
    }
    getRoomID() {
        return this.userstate["room-id"];
    }
    getMessage() {
        return this.message;
    }
    getID() {
        return this.userstate.id;
    }
    getTime() {
        let t = new Date(parseInt(this.userstate["tmi-sent-ts"]));

        let s = t.getHours() + ":";

        if (t.getHours() < 10) {
            s = "0" + s;
        }

        if (t.getMinutes() < 10) {
            s += "0";
        }

        s += t.getMinutes();

        return s;
    }

    getEmotesSync() {
        return this.userstate.emotes ? this.userstate.emotes : {};
    }
    async getEmotes(includeBTTV = false, includeFFZ = false, includeTTV = true) {
        let Emotes = {};
        if (includeTTV && this.userstate.emotes) Emotes = JSON.parse(JSON.stringify(this.userstate.emotes));

        if (includeBTTV) {
            try {
                let BTTV = await this.getBTTVEmotes();
                for (let emote in BTTV) {
                    Emotes[emote] = BTTV[emote];
                }
            } catch (err) {

            }
        }

        if (includeFFZ) {
            try {
                let FFZ = await this.getFFZEmotes();
                for (let emote in FFZ) {
                    Emotes[emote] = FFZ[emote];
                }
            } catch (err) {

            }
        }

        return Promise.resolve(Emotes);
    }
    async getMessageWithoutEmotes(keepBTTV = true, keepFFZ = true, keepTTV = false) {
        //Only Emotes -> no Messages
        if (this.isEmoteOnly())
            return Promise.resolve("");
        
        //Check Mesage for TTV, BTTV and FFZ Emotes
        let sorted_emotes = [];

        try {
            let Emotes = await this.getEmotes(!keepBTTV, !keepFFZ, !keepTTV);
            for (let emote_id in Emotes) {
                let emotePlaces = Emotes[emote_id];

                for (let emote of emotePlaces) {
                    let start = parseInt(emote.substring(0, emote.indexOf("-")));
                    let end = parseInt(emote.substring(emote.indexOf("-") + 1));

                    sorted_emotes.push({
                        start: start,
                        end: end
                    });
                }
            }
        } catch (err) {
            console.log(err);
        }

        if (sorted_emotes.length == 0) {
            return Promise.resolve(this.getMessage());
        }

        sorted_emotes.sort((a, b) => {
            if (a.start < b.start)
                return -1;
            return 1;
        });

        //Cut Text
        let message = this.getMessage();
        
        //Before
        let output = message.substring(0, sorted_emotes[0].start);
        //Middle
        for (let i = 0; i < sorted_emotes.length - 1; i++) {
            output += message.substring(sorted_emotes[i].end + 1, sorted_emotes[i + 1].start);
        }
        //After
        output += message.substring(sorted_emotes[sorted_emotes.length - 1].end + 1);
        
        return Promise.resolve(output);
    }
    isEmoteOnly() {
        return this.userstate["emote-only"] == true;
    }
    async getFFZEmotes(ffz_room) {
        let emotes = {};

        //Fetch Room Data
        if (!ffz_room) {
            try {
                ffz_room = await FFZ.GetRoomByName(this.getChannel().substring(1), true);
            } catch (err) {

            }
        }

        if (!ffz_room) return Promise.reject(new Error("FFZ Fetch Error"));

        //Analyse Data
        let start = 0;

        for (let word of this.getMessage().split(" ")) {
            let found = false;
            for (let set in ffz_room.sets) {
                for (let emote of ffz_room.sets[set].emoticons) {
                    if (word == emote.name) {
                        if (emotes[emote.id] == undefined) {
                            emotes[emote.id] = [start + "-" + (start + word.length - 1)];
                        } else {
                            emotes[emote.id].push(start + "-" + (start + word.length - 1));
                        }
                        found = true;
                        break;
                    }

                    if (found) {
                        break;
                    }
                }
            }

            start += word.length + 1;
        }

        return Promise.resolve(emotes);
    }
    async getBTTVEmotes(bttv_emotes) {
        let emotes = {};

        //Fetch Emote Data
        if (!bttv_emotes) {
            try {
                bttv_emotes = await BTTV.GetChannelEmotes(this.getRoomID(), true);
            } catch (err) {

            }
        }

        if (!bttv_emotes) return Promise.reject(new Error("BTTV Fetch Error"));

        let start = 0;

        for (let word of this.getMessage().split(" ")) {
            for (let emote of bttv_emotes) {
                if (word == emote.code) {
                    if (emotes[emote.id] == undefined) {
                        emotes[emote.id] = [start + "-" + (start + word.length - 1)];
                    } else {
                        emotes[emote.id].push(start + "-" + (start + word.length - 1));
                    }
                    break;
                }
            }

            start += word.length + 1;
        }

        return Promise.resolve(emotes);
    }
    async ExtractTTVEmotes(API) {
        //Get Global Emotes
        let globals = [];

        try {
            globals = (await API.GetGlobalEmotes()).data;
        } catch (err) {

        }

        //Get FollowEmotes
        let follows = [];

        try {
            if (this.is_Follower) {
                let channel_emotes = (await API.GetChannelEmotes({ broadcaster_id: this.getRoomID() })).data;
                follows = channel_emotes.filter(elt => elt.emote_type === 'follower');

                //Temporary until Twitch implements Subscription Checks
                subs = channel_emotes.filter(elt => elt.emote_type === 'subscriptions' && elt.tier <= this.getSubTier() * 1000);
            }
        } catch (err) {

        }

        //Get SubEmotes - Currently not Supported by Twitch :(
        let subs = [];

        let emotes = {};

        for (let i = 0; i < this.message.length; i++) {
            let next_space = this.message.indexOf(' ', i);
            if (next_space < 0) next_space = this.message.length;
            let word = this.message.substring(i, next_space);
            
            //Check Emotes of all Types to match a word
            let emote = globals.find(elt => elt.name === word) || follows.find(elt => elt.name === word) || subs.find(elt => elt.name === word);

            if (emote) {
                if (!emotes[emote.id]) emotes[emote.id] = [];

                emotes[emote.id].push(i + '-' + (next_space - 1));
            }

            i = next_space;
        }

        if (Object.getOwnPropertyNames(emotes).length > 0) this.userstate['emotes'] = emotes;
        return emotes;
    }

    getMessageDetails() {
        return {
            emotes: this.userstate.emotes,
            id: this.userstate.id,
            tmi_sent_ts: this.userstate["tmi-sent-ts"],
            message: this.message
        };
    }

    getUserLevel() {
        return CONSTANTS.UserLevel[this.userLevel];
    }
    getUserLevelAsText() {
        return this.userLevel.charAt(0).toUpperCase() + this.userLevel.substring(1);
    }

    //Checker
    hasBadge(badgeName) {
        if (!this.userstate.badges) return false;
        return this.userstate.badges[badgeName] ? true : false;
    }
    matchUserlevel(userLevel, strictLevel = 0) {
        if (typeof (userLevel) == "string") {
            if (userLevel.indexOf(":") >= 0) {
                let badge = userLevel.substring(0, userLevel.indexOf(":"));
                let version = userLevel.substring(userLevel.indexOf(":") + 1);

                //#ModsMasterrace
                if (strictLevel == 0 && this.getUserLevel() >= CONSTANTS.UserLevel.other) {
                    return true;
                } else if (isNaN(this.userstate.badges[badge])) {
                    if (this.userstate.badges[badge] == version) {
                        return true;
                    }
                } else {
                    //Badge matters - but not the version
                    if (strictLevel == 1) {
                        if (parseInt(this.userstate.badges[badge]) <= version) {
                            return true;
                        } 
                    //Badge and Version matter - but higher Version count too
                    } else if (strictLevel == 2) {
                        if (parseInt(this.userstate.badges[badge]) >= version) {
                            return true;
                        }
                    //Badge and Version matter - EXACT version match
                    } else {
                        if (parseInt(this.userstate.badges[badge]) == version) {
                            return true;
                        }
                    }
                }
            } else if (this.getUserLevel() >= CONSTANTS.UserLevel[userLevel.toLowerCase()]) {
                return true;
            }

            return false;
        } else if (typeof (userLevel) == "number") {
            if (this.getUserLevel() >= userLevel) {
                return true;
            }
        }
        return false;
    }
    isFollower() {
        return this.is_Follower;
    }
    getSubTier() {
        if (this.hasBadge('subscriber')) return parseInt(this.userstate.badges['subscriber'] / 1000);
        return 0;
    }
}

module.exports.TwitchIRC = TwitchIRC;
module.exports.Message = Message;