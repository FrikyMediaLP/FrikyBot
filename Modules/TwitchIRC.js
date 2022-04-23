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

        this.USER_EMOTE_SETS = [];

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

        //Setup API
        //Settings
        WebInter.addAuthAPIEndpoint('/settings/twitchirc/user', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            //Change Setting and Reconnect
            try {
                await this.ChangeUser(req.body.login, req.body.oauth);
            } catch (err) {
                console.log(err);
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

            return res.sendStatus(200);
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
        
        //Init Logging Database
        this.CONNECTION_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'Connection_Log.db'), autoload: true });
        this.Settings_LOG = new Datastore({ filename: path.resolve(cfg.Log_Dir + 'Settings_Logs.db'), autoload: true });

        this.addLog('Connection Logs', this.CONNECTION_LOG);
        this.addLog('Settings Changes', this.Settings_LOG);
        
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

        if (this.isEnabled() !== true) return Promise.reject(new Error('Twitch IRC is disabled!'));
        if (this.isReady() !== true) return Promise.reject(new Error('Twitch IRC Config not ready!'));

        //Setup TMI.js Client and Connect
        return this.Connect();
    }
    enable() {
        this.setEnabled(true);
        this.Connect().catch(err => this.Logger.error(err.message));
    }
    disable() {
        this.setEnabled(false);
        this.Disconnect().catch(err => this.Logger.error(err.message));
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

        this.client.on('emotesets', (sets, obj) => {
            if (sets !== this.USER_EMOTE_SETS.join(',')) {
                this.Logger.info("Bot Emote Sets Updated! Enjoy your Emotes!");
                this.USER_EMOTE_SETS = (sets || '').split(',');
            }
        });

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
            this.client = null;
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

    async timeout(username, length, reason = "", channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error("Client not Setup correctly!"));

        return new Promise((resolve, reject) => {
            this.client.timeout(channel, username, length, reason)
                .then(data => resolve())
                .catch(err => reject(new Error(err)));
        });
    }
    timeoutSync(username, length, reason = "", channel = this.getChannel()) {
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

    async unban(username, channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error("Client not Setup correctly!"));

        return new Promise((resolve, reject) => {
            this.client.unban(channel, username)
                .then(data => resolve())
                .catch(err => reject(new Error(err)));
        });
    }
    banSync(username, channel = this.getChannel()) {
        this.unban(username, channel)
            .then((data) => {
                // data returns [channel]
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
        if (this.client) return this.client.getChannels();
        let cfg = this.Config.GetConfig();
        return cfg.channel ? ['#' + cfg.channel] : null;
    }
    getChannel(cut_hashtag = false) {
        let channel = this.getChannels();

        if (channel.length > 0) return cut_hashtag ? channel[0].substring(1) : channel[0];
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

    //Emotes
    GetAvailableEmotes() {
        return this.USER_EMOTE_SETS || [];
    }
}

class Message {
    constructor(channel, userstate, message) {
        this.message = message;
        this.channel = channel;
        this.userstate = userstate;
        this.is_Follower = false;
        this.cheermotes = null;

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
    async getTTVEmotes(ttv_emotes = []) {
        //Extract Emotes from Message
        let emotes = {};

        for (let i = 0; i < this.message.length; i++) {
            let next_space = this.message.indexOf(' ', i);
            if (next_space < 0) next_space = this.message.length;
            let word = this.message.substring(i, next_space);

            //Check Emotes of all Types to match a word
            let emote = ttv_emotes.find(elt => elt.name === word);

            if (emote) {
                if (!emotes[emote.id]) emotes[emote.id] = [];

                emotes[emote.id].push(i + '-' + (next_space - 1));
            }

            i = next_space;
        }


        if (Object.getOwnPropertyNames(emotes).length > 0) this.userstate['emotes'] = emotes;
        return emotes;
    }

    async ExtractTTVEmotes(API, includeCheers = true) {
        let globals = [];
        let follows = [];
        let cheers = [];
        let subs = [];

        //Get Global Emotes
        try {
            globals = (await API.GetGlobalEmotes()).data;
        } catch (err) {

        }

        //Get FollowEmotes
        try {
            if (this.is_Follower) {
                let channel_emotes = (await API.GetChannelEmotes({ broadcaster_id: this.getRoomID() })).data;
                follows = channel_emotes.filter(elt => elt.emote_type === 'follower');
            }
            
            //Get Channel Sub Emotes - Temporary until Twitch implements Subscription Checks
            if (this.isSubscriber()) {
                subs = channel_emotes.filter(elt => elt.emote_type === 'subscriptions' && elt.tier <= this.getSubTier() * 1000);
            }

            if (includeCheers) cheers = channel_emotes.filter(elt => elt.emote_type === 'bitstier');
        } catch (err) {

        }

        //Get All SubEmotes - Currently not Supported by Twitch :( dont know who you are subbed to


        //Extract Emotes from Message
        return this.getTTVEmotes([].concat(globals).concat(subs).concat(follows).concat(cheers));
    }
    async ExtractCheermotes(API) {
        //Get Global-Cheer Emotes
        let cheermotes = [];
        try {
            cheermotes = (await API.GetCheermotes({ broadcaster_id: this.getRoomID() })).data;
        } catch (err) {
            return Promise.reject(err);
        }

        //Extract Emotes from Message
        let emotes = {};

        for (let i = 0; i < this.message.length; i++) {
            let next_space = this.message.indexOf(' ', i);
            if (next_space < 0) next_space = this.message.length;
            let word = this.message.substring(i, next_space);

            //Check Emotes of all Types to match a word
            let emote = cheermotes.find(elt => word.startsWith(elt.prefix) && !isNaN(word.substring(elt.prefix.length, next_space)));

            if (emote) {
                let bits = parseInt(word.substring(emote.prefix.length, next_space));
                let tier = emote.tiers.sort((a, b) => a.min_bits - b.min_bits).find(elt => elt.min_bits >= bits);
                if (!tier) tier = emote.tiers[0];

                //Remove 1.5 (issues with some databases)
                for (let theme in tier.images) {
                    for (let format in tier.images[theme]) {
                        delete tier.images[theme][format]['1.5'];
                    }
                }

                //Push to List
                if (!emotes[word]) emotes[word] = {
                    images: tier.images,
                    places: []
                };
                emotes[word].places.push(i + '-' + (next_space - 1));
            }

            i = next_space;
        }
        
        if (Object.getOwnPropertyNames(emotes).length > 0) this.cheermotes = emotes;
        return emotes;
    }
    async ExtractTTVEmotesFromSets(API, emote_sets = []) {
        let emotes = [];

        //Get Emotes from Sets
        try {
            emotes = (await API.GetEmoteSets({ emote_set_id: [emote_sets] })).data;
        } catch (err) {

        }

        return this.getTTVEmotes(emotes);
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
    isVIP() {
        if (this.userstate.badges && this.userstate.badges['vip']) {
            return true;
        } else {
            return false;
        }
    }
    isSubscriber(min_month = 0) {
        if (this.userstate.badges && this.userstate.badges['subscriber'] && this.userstate['badge-info']['subscriber'] > min_month) {
            return true;
        } else {
            return false;
        }
    }
    getSubTier() {
        if (this.hasBadge('subscriber')) return parseInt(this.userstate.badges['subscriber'] / 1000);
        return 0;
    }
}

module.exports.TwitchIRC = TwitchIRC;
module.exports.Message = Message;