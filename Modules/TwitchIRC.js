const NET = require('net');
const fs = require('fs');
const path = require('path');

const FrikyDB = require('./../Util/FrikyDB.js');

const CONSTANTS = require('./../Util/CONSTANTS.js');
const BTTV = require('./../3rdParty/BTTV.js');
const FFZ = require('./../3rdParty/FFZ.js');

const IRC_PORT = 6667;
const IRC_HOST = 'irc.chat.twitch.tv';
const IRC_CAPABILITIES = ['membership', 'tags', 'commands'];

//DEPRECATED - MIGRATING TO API
const IRC_COMMANDS = {
    '/announce': {
        scope: 'channel:moderate',
        parameters: ['message'],
        event: 'usernotice',
        failed_event: 'notice',
        failed: ['usage_announce']
    },
    '/ban': {
        scope: 'channel:moderate',
        parameters: ['user_login', 'reason'],
        event: 'notice',
        success: ['ban_success'],
        failed: ['already_banned', 'bad_ban_admin', 'bad_ban_anon', 'bad_ban_broadcaster', 'bad_ban_mod', 'bad_ban_self', 'bad_ban_staff', 'bad_mod_banned', 'usage_ban']
    },
    '/unban': {
        scope: 'channel:moderate',
        parameters: ['user_login'],
        event: 'notice',
        success: ['unban_success'],
        failed: ['bad_unban_no_ban', 'usage_unban']
    },
    '/clear': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['usage_clear']
    },
    '/color': {
        scope: 'chat:edit',
        parameters: ['color'],
        event: 'notice',
        success: ['color_changed'],
        failed: ['turbo_only_color', 'usage_color']
    },
    '/commercial': {
        scope: 'channel_commercial',
        parameters: ['seconds'],
        event: 'notice',
        success: ['commercial_success'],
        failed: ['bad_commercial_error', 'usage_commercial']
    },
    '/delete': {
        scope: 'channel:moderate',
        parameters: ['target-msg-id'],
        event: 'notice',
        success: ['delete_message_success', 'delete_staff_message_success'],
        failed: ['bad_delete_message_broadcaster', 'bad_delete_message_mod', 'usage_delete']
    },
    '/disconnect': {
        scope: 'chat:edit',
        event: 'notice',
        failed: ['usage_disconnect'],
        deprecated: false
    },
    '/emoteonly': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['msg_emoteonly'],
        failed: ['usage_emote_only_on']
    },
    '/emoteonlyoff': {
        scope: 'channel:moderate',
        event: 'notice',
        failed: ['usage_emote_only_off']
    },
    '/followers': {
        scope: 'channel:moderate',
        parameters: ['length'],
        event: 'notice',
        success: [ 'followers_on', 'followers_on_zero'],
        failed: ['usage_followers_on', 'already_followers_on']
    },
    '/followersoff': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['followers_off'],
        failed: ['usage_followers_off', 'already_followers_off']
    },
    '/help': {
        scope: 'chat:edit',
        parameters: ['command'],
        event: 'notice',
        failed: ['usage_help', 'no_help']
    },
    '/host': {
        scope: 'channel_editor',
        parameters: ['channel'],
        event: 'notice',
        success: ['host_on'],
        failed: ['usage_host', 'bad_host_self', 'bad_host_rejected', 'bad_host_rate_exceeded', 'bad_host_hosting', 'bad_host_error']
    },
    '/unhost': {
        scope: 'channel_editor',
        event: 'notice',
        success: ['host_off'],
        failed: ['usage_unhost', 'not_hosting', 'bad_unhost_error']
    },
    '/marker': {
        scope: 'channel_editor',
        parameters: ['description'],
        event: 'notice',
        failed: ['usage_marker']
    },
    '/me': {
        scope: 'chat:edit',
        parameters: ['message'],
        event: 'notice',
        failed: ['usage_me'],
        deprecated: false
    },
    '/mod': {
        scope: 'channel:moderate',
        parameters: ['user_login'],
        event: 'notice',
        success: ['mod_success'],
        failed: ['bad_mod_mod', 'bad_mod_banned', 'usage_mods']
    },
    '/unmod': {
        scope: 'channel:moderate',
        parameters: ['user_login'],
        event: 'notice',
        success: ['unmod_success'],
        failed: ['bad_unmod_mod', 'usage_unmod']
    },
    '/mods': {
        scope: 'chat:edit',
        event: 'notice',
        success: ['room_mods'],
        failed: ['no_mods', 'usage_mods']
    },
    '/uniquechat': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['r9k_on'],
        failed: ['usage_r9k_on', 'already_r9k_on']
    },
    '/uniquechatoff': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['r9k_off'],
        failed: ['usage_r9k_off', 'already_r9k_off']
    },
    '/raid': {
        scope: 'channel_editor',
        parameters: ['channel'],
        event: 'notice',
        failed: ['usage_raid', 'raid_error_unexpected', 'raid_error_already_raiding', 'raid_error_forbidden', 'raid_error_self', 'raid_error_too_many_viewers']
    },
    '/unraid': {
        scope: 'channel_editor',
        event: 'notice',
        success: ['unraid_success'],
        failed: ['usage_unraid', 'unraid_error_no_active_raid', 'unraid_error_unexpected']
    },
    '/slow': {
        scope: 'channel:moderate',
        parameters: ['length'],
        event: 'notice',
        success: ['slow_on'],
        failed: ['usage_slow_on', 'bad_slow_duration', 'already_slow_on']
    },
    '/slowoff': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['slow_off'],
        failed: ['usage_slow_off', 'already_slow_off']
    },
    '/subscribers': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['subs_on'],
        failed: ['usage_subs_on', 'already_subs_on']
    },
    '/subscribersoff': {
        scope: 'channel:moderate',
        event: 'notice',
        success: ['subs_off'],
        failed: ['usage_subs_off', 'already_subs_off']
    },
    '/timeout': {
        scope: 'channel:moderate',
        parameters: ['user_login', 'seconds'],
        event: 'notice',
        success: ['timeout_success'],
        failed: ['bad_timeout_admin', 'bad_timeout_anon', 'bad_timeout_broadcaster', 'bad_timeout_duration', 'bad_timeout_mod', 'bad_timeout_self', 'bad_timeout_staff', 'usage_timeout']
    },
    '/untimeout': {
        scope: 'channel:moderate',
        parameters: ['user_login'],
        event: 'notice',
        success: ['untimeout_success'],
        failed: ['timeout_no_timeout', 'untimeout_banned', 'usage_untimeout']
    },
    '/vip': {
        scope: 'channel:moderate',
        parameters: ['user_login'],
        event: 'notice',
        success: ['vip_success'],
        failed: ['bad_vip_grantee_banned', 'bad_vip_grantee_already_vip', 'bad_vip_achievement_incomplete', 'bad_vip_max_vips_reached', 'usage_vip']
    },
    '/unvip': {
        scope: 'channel:moderate',
        parameters: ['user_login'],
        event: 'notice',
        success: ['unvip_success'],
        failed: ['bad_unvip_grantee_not_vip', 'usage_unvip']
    },
    '/vips': {
        scope: 'chat:edit',
        event: 'notice',
        success: ['vips_success'],
        failed: ['no_vips', 'usage_vips']
    }
};
//DEPRECATED - MIGRATING TO API

const MODULE_DETAILS = {
    name: 'TwitchIRC',
    description: 'Interface to the Twitch Chat.',
    picture: '/images/icons/twitch_colored_alt.png',
    version: '0.4.0.0',
    server: '0.4.0.0'
};

class TwitchIRC extends require('./../Util/ModuleBase.js') {
    constructor(configJSON, logger, TwitchAPI) {
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                TwitchIRC: {
                    display: () => (" TwitchIRC ").inverse.brightMagenta
                }
            });
        }

        super(MODULE_DETAILS, configJSON, logger.TwitchIRC);

        this.TwitchAPI = TwitchAPI;

        this.Config.AddSettingTemplates([
            { name: 'login', type: 'string', group: 0 },
            { name: 'oauth', type: 'string', private: true, group: 0 },
            { name: 'channel', type: 'string', minlength: 1, group: 1, requiered: true },
            { name: 'console_print_join_message', type: 'boolean', default: true },
            { name: 'console_print_message', type: 'boolean', default: true },
            { name: 'console_print_connection', type: 'boolean', default: true },
            { name: 'console_print_irc', type: 'boolean', default: false },
            { name: 'Log_Dir', type: 'string', default: 'Logs/' + MODULE_DETAILS.name + '/' }
        ]);
        this.Config.options = {
            groups: [{ name: 'User Login' }, { name: 'Channel' }, { name: 'Emotes and Misc' }]
        };
        this.Config.Load();
        this.Config.FillConfig();
        this.Config.setOnChange((cur, old) => this.OnConfigChange(cur, old));

        //Ready
        this.addReadyRequirement(() => {
            if (!this.Config.GetConfig()['channel']) return false;
            return true;
        });

        //Connection client
        this.client = undefined;
        this.callbacks = {};

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

        //Controllables
        this.addControllables([
            { name: 'test', title: 'Send Test Message', callback: async (user) => this.Controllable_test() },
            { name: 'reconnect', title: 'Force Reconnect', callback: async (user) => this.Controllable_Reconnect() },
            { name: 'disconnect', title: 'Disconnect', callback: async (user) => this.Controllable_Disconnect() }
        ]);

        //Displayables
        const date_options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.addDisplayables([
            { name: 'Chat Connection', value: () => this.getReadyState() || 'CLOSED' },
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

            let login = req.body['login'];
            let oauth = req.body['oauth'];

            //Change Setting and Reconnect
            try {
                await this.ChangeUser(login === "" ? undefined : login, oauth === "" ? undefined : oauth);
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
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
            }

            return res.sendStatus(200);
        });
        WebInter.addAuthAPIEndpoint('/settings/twitchirc/channel', { user_level: 'staff' }, 'POST', async (req, res) => {
            if (!this.isEnabled()) return res.status(503).json({ err: 'Twitch IRC is disabled' });

            //Change Setting and Reconnect
            try {
                await this.ChangeChannel(req.body['channel'] === '' ? undefined : req.body['channel']);
            } catch (err) {
                return res.json({ err: 'Channel change failed' });
            }

            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/twitchirc/channel',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
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
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
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

        //Init Logging Database
        this.CONNECTION_LOG = new FrikyDB.Collection({ path: path.resolve(cfg.Log_Dir + 'Connection_Log.db') });
        this.Settings_LOG = new FrikyDB.Collection({ path: path.resolve(cfg.Log_Dir + 'Settings_Logs.db') });

        this.addLog('Connection Logs', this.CONNECTION_LOG);
        this.addLog('Settings Changes', this.Settings_LOG);
        
        //Event Handlers
        this.on('connected', (host, port) => {
            if (this.CONNECTION_LOG) {
                this.CONNECTION_LOG.insert({
                    event: 'connected',
                    user: this.getLoginName(),
                    channels: this.getChannels(),
                    time: Date.now()
                }).catch(err => this.Logger.warn("Connection Logging: " + err.message));
            }

            if (this.Config.GetConfig()['console_print_connection'] !== true) return;
            this.Logger.info(`*Connected to ${host}:${port}. Awaiting Twitch Login...`);
        });
        this.on('logon', (username) => {
            if (this.CONNECTION_LOG) {
                this.CONNECTION_LOG.insert({
                    event: 'login',
                    user: this.getLoginName(),
                    channels: this.getChannels(),
                    time: Date.now()
                }).catch(err => this.Logger.warn("Connection Logging: " + err.message));
            }

            if (this.Config.GetConfig()['console_print_connection'] !== true) return;
            this.Logger.info(`*Logged in as ${username}. Awaiting Channel Join...`);
        });
        this.on('reconnecting', (reason, timeout) => {
            this.Logger.warn('Connection Error: ' + reason + '. Reconnecting in ' + timeout + ' second(s)!');
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
                    user: this.getLoginName(),
                    channels: this.getChannels(),
                    reason: reason || 'Unknown',
                    time: Date.now()
                }).catch(err => this.Logger.warn("Connection Logging: " + err.message));
            }

            if (this.Config.GetConfig()['console_print_connection'] !== true) return;
            this.Logger.error("Bot got disconnected! Reason: " + (reason ? reason : " UNKNOWN"));
        });
        this.on('privmsg', (channel, user_login, message, tags, self) => {
            this.STAT_MSGS_RECEIVED++;
            this.STAT_MSGS_RECEIVED_PER_10++;

            let msg = new Message(channel, user_login, message, tags);

            if (this.Config.GetConfig()['console_print_connection'] === true) this.Logger.info(msg.toString());

            this._sendEvent('message', msg, self);

            if (message === '!reply') msg.replySync(this, "Hey :) This is a reply LUL you asked for it Kappa");
        });
        this.on('join', (channel, user_login, self) => {
            if (this.Config.GetConfig()['console_print_join_message'] === true) this.Logger.info('[#' + channel + '] ' + user_login + " joined!");
        });
        
        this.generateCommands();

        if (this.isEnabled() !== true) return Promise.reject(new Error('Twitch IRC is disabled!'));
        if (this.isReady() !== true) return Promise.reject(new Error('Twitch IRC Config not ready!'));

        //Setup TMI.js Client and Connect
        return this.Connect();
    }
    enable() {
        this.setEnabled(true);
        if(this.isReady()) this.Connect().catch(err => this.Logger.error(err.message));
    }
    disable() {
        this.setEnabled(false);
        this.Disconnect().catch(err => this.Logger.error(err.message));
    }

    async SetupClient() {
        let cfg = this.GetConfig();
        if (this.client) this.client.Disonnect();
        this.client = new Client(cfg['login'], cfg['oauth'], cfg['channel'], { show_traffic: cfg['console_print_irc'] });

        if (this.callbacks['*'] == undefined) this.client.on('*', (event, ...args) => { this._sendEvent(event, ...args) });

        return this.client.Connect();
    }
    async ChangeUser(login, pw) {
        try {
            await this.Disconnect();
            let err = this.Config.UpdateSetting('login', login);
            if (err !== true) return Promise.reject(new Error(err));
            err = this.Config.UpdateSetting('oauth', pw);
            if (err !== true) return Promise.reject(new Error(err));
            return this.SetupClient();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async ChangeChannel(channel) {
        try {
            let err = this.Config.UpdateSetting('channel', channel);
            if (err !== true) return Promise.reject(new Error(err));

            if (this.client) {
                await this.client.PartAll();
                this.client.SetChannels(channel);
                if (channel === "" || channel === null || channel === undefined || channel === "null" || channel === 'undefinded') return Promise.resolve();
                else return this.client._joinChannel(channel);
            }
            else return this.Connect();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async Connect() {
        if (!this.client) return this.SetupClient();
        return this.client.Connect();
    }
    async Disconnect() {
        if (!this.client) return Promise.resolve();
        return this.client.Disonnect();
    }

    OnConfigChange(name, cur, old) {
        if (name !== 'channel' || !this.TwitchAPI) return;

        this.TwitchAPI.updateEventSubs()
            .catch(err => this.Logger.error(err.message));
    }

    async Controllable_test() {
        if (!this.isEnabled()) return Promise.reject(new Error('Twitch IRC is disabled'));

        try {
            await this.say("MrDestructoid This is a Test Message MrDestructoid");
            return Promise.resolve("Message sent!");
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async Controllable_Reconnect() {
        if (!this.isEnabled()) return Promise.reject(new Error('Twitch IRC is disabled'));

        try {
            if (this.getReadyState() === 'OPEN') await this.Disconnect();
            await this.Connect();
            return Promise.resolve("Connected!");
        } catch (err) {
            return res.json({ err: err.message });
        }
    }
    async Controllable_Disconnect() {
        if (!this.isEnabled()) return Promise.reject(new Error('Twitch IRC is disabled'));

        try {
            await this.Disconnect();
            return Promise.resolve("Disconnected!");
        } catch (err) {
            return Promise.reject(new Error('Twitch IRC is disabled'));
        }
    }

    //Commands
    generateCommands() {
        for (let cmd in IRC_COMMANDS) {
            this[cmd.substring(1)] = async (...args) => {
                if (IRC_COMMANDS[cmd].deprecated !== false) this.Logger.warn("IRC Commands are DEPRECATED and will be removed on Feb. 18th 2023 by Twitch!");
                if (!this.client) return Promise.reject(new Error('not_connected'));

                let params = args.splice(0, (IRC_COMMANDS[cmd].parameters || []).length);
                let channel = args.pop();

                if (channel === params[params.length - 1]) channel = undefined;
                if (channel === undefined) channel = this.getChannel();

                let message = cmd;
                for (let i = 0; i < (IRC_COMMANDS[cmd].parameters || []).length && i < params.length; i++) message += ' ' + params[i];
                return this.client._privmsg(channel, message, IRC_COMMANDS[cmd].event, IRC_COMMANDS[cmd].success, IRC_COMMANDS[cmd].failed_event || IRC_COMMANDS[cmd].event, IRC_COMMANDS[cmd].failed);
            }

            this[cmd.substring(1) + 'Sync'] = (...args) => {
                if (IRC_COMMANDS[cmd].deprecated !== false) this.Logger.warn("IRC Commands are DEPRECATED and will be removed on Feb. 18th 2023 by Twitch!");

                this[cmd.substring(1)](...args).catch(this.Logger.warn);
            }
        }
    }

    async say(message, channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error('not_connected'));
        return this.client._privmsg(channel, message);
    }
    saySync(message, channel = this.getChannel()) {
        this.say(message, channel).catch(this.Logger.warn);
    }

    async reply(id, message, channel = this.getChannel()) {
        if (!this.client) return Promise.reject(new Error('not_connected'));
        return this.client._reply(id, channel, message);
    }
    replySync(id, message, channel = this.getChannel()) {
        this.reply(id, message, channel).catch(this.Logger.warn);
    }

    //GET
    getChannel() {
        if (this.client) return this.client.getChannel();
        return null;
    }
    getChannels() {
        if (this.client) this.client.getChannels();
        return null;
    }

    getLoginName() {
        if (this.client) {
            let login = this.client.getLoginName();
            return login && login.startsWith('justinfan') ? null : login;
        }
        return null;
    }
    getUsername() {
        return this.getLoginName();
    }
    getUserID() {
        if (this.client) return this.client.getUserID();
        return null;
    }

    getReadyState() {
        if (!this.client) return null;
        return this.client.getReadyState();
    }
    getRoomstates() {
        if (!this.client) return null;
        return this.client.getRoomstates();
    }
    getRoomID() {
        if (!this.client) return null;

        let roomstates = this.getRoomstates();
        if (!roomstates) return null;

        if (!roomstates[this.getChannel()]) return null;

        return roomstates[this.getChannel()]['room-id'] || null;
    }
    GetAvailableEmotes(channel = this.getChannel()) {
        if (!this.client) return [];
        if (!this.client.getUserstates()[channel]) return [];
        return this.client.getUserstates()[channel]['emote-sets'];
    }

    //UTIL
    on(event, callback) {
        if (this.callbacks[event] === undefined) this.callbacks[event] = {};

        let id = null;

        do {
            id = Math.floor(Math.random() * 80000 + 1000);
        } while (this.callbacks[event][id] !== undefined);

        this.callbacks[event][id] = callback;
        return id;
    }
    removeCallback(event, id) {
        if (this.callbacks[event][id] === undefined) return false;
        delete this.callbacks[event][id];
        return true;
    }
    _sendEvent(event, ...args) {
        for (let id in this.callbacks[event] || {}) {
            this.callbacks[event][id](...args);
        }
    }
    setTwitchAPI(api) {
        this.TwitchAPI = api;
    }
}

class Client {
    constructor(user_login, pw, channels = [], options = {}) {
        this.user_login = null;
        this.oauth = null;
        this.channels = null;
        this.options = {
            connecting_timeout: 10 * 1000,
            show_unknown_cmd: false,
            show_traffic: false
        };

        this.host = IRC_HOST;
        this.port = IRC_PORT;

        this.socket = null;
        this.callbacks = {};

        this.userstates = {};
        this.roomstates = {};

        this.SetOptions(options);
        this.SetUser(user_login, pw);
        this.SetChannels(channels);
    }

    SetUser(user_login, pw) {
        this.user_login = (user_login && user_login.toLowerCase()) || undefined;
        this.oauth = (pw && pw.substring(0, 6) !== 'oauth:' ? 'oauth:' + pw : pw);

        if (this.options.allow_anonymous !== false && !this.user_login && !this.oauth) {
            this.user_login = 'justinfan' + Math.floor(Math.random() * 80000 + 1000);
            this.oauth = 'SCHMOOPIIE';
        }
    }
    SetChannels(channels) {
        if (typeof channels === 'object') this.channels = [channels];
        else this.channels = [channels];
    }
    SetOptions(options = {}) {
        for (let opt in options) this.options[opt] = options[opt];
    }

    async Connect(reconnect_timeout = 1, destroy = true) {
        let init_socket = false;

        if (this.socket && destroy) {
            this.socket.destroy('reconnect');
            this.socket = null;
        }
        if (!this.socket) {
            this.socket = new NET.Socket();

            //Event Handlers
            this.socket.on('data', (data) => this.DATA_HANDLER(data));
            this.socket.on('close', (reason) => this._sendEvent('disonnected', reason));
            this.socket.on('connect', (...args) => this._sendEvent('connected', IRC_HOST, IRC_PORT));
            this.socket.on('error', (err) => this._sendEvent('error', err));

            init_socket = true;
        }
        
        try {
            if (init_socket) await this._connectSocket();
            await this._sendUserInfo();
            await this._acquiereCapabilities();
            await this._joinChannels();
            return Promise.resolve();
        } catch (err) {
            if (err.message === 'Error: read ECONNRESET' || err.message === 'Connecting Timeout') {
                this._sendEvent('reconnecting', 'Connecting Timeout', Math.pow(2, reconnect_timeout));
                
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.Connect(reconnect_timeout + 1, true).then(resolve).catch(reject);
                    }, Math.pow(2, reconnect_timeout) * 1000);
                });
            }
            else return Promise.reject(err);
        }
    }
    async Disonnect() {
        if (this.socket) {
            this._sendEvent('disonnecting', 'manuell');

            let close_id = null;
            let err_id = null;

            close_id = this.on('close', (err) => {
                this.removeCallback('close', close_id);
                this.removeCallback('error', err_id);
                resolve();
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('close', close_id);
                this.removeCallback('error', err_id);
                reject(err);
            });

            this.socket.destroy('disconnect');
            this.socket = null;
        }
    }
    async PartAll() {
        try {
            for (let chnl of this.channels) await this._partChannel(chnl);
        } catch (err) {
            return Promise.reject(err);
        }

        return Promise.resolve();
    }
    async Part(channel) {
        return this._partChannel(channel);
    }

    //Interface
    on(event, callback) {
        if (this.callbacks[event] === undefined) this.callbacks[event] = {};

        let id = null;

        do {
            id = Math.floor(Math.random() * 80000 + 1000);
        } while (this.callbacks[event][id] !== undefined);

        this.callbacks[event][id] = callback;
        return id;
    }
    removeCallback(event, id) {
        if (this.callbacks[event][id] === undefined) return false;
        delete this.callbacks[event][id];
        return true;
    }
    _sendEvent(event, ...args) {
        for(let id in this.callbacks[event] || {}) {
            try {
                this.callbacks[event][id](...args);
            } catch (err) {

            }
        }

        for (let id in this.callbacks['*'] || {}) {
            try {
                this.callbacks['*'][id](event, ...args);
            } catch (err) {
                console.log(err);
            }
        }
    }

    //EventHandlers
    DATA_HANDLER(data) {
        //Cut Data Input
        let data_array = data.toString().split('\r\n').filter(elt => elt !== "");
        
        //data - array
        this._sendEvent('data', data_array);
        
        //Handle Data
        for (let line of data_array) {
            if(this.options.show_traffic === true) console.log("> " + line);

            //Extract Command Info
            let { tags, referer, command, channel, message } = this._parseMessage(line);
            
            //Execute Commands
            try {
                if (command === 'PING') {
                    this._write('PONG :tmi.twitch.tv');
                    //time of ping
                    this._sendEvent('ping', Date.now());
                }
                else if (command === 'JOIN') {
                    let user_login = referer.substring(0, referer.indexOf('!'));
                    //channe - user_login
                    this._sendEvent('join', channel, user_login, user_login === this.user_login);
                }
                else if (command === 'PART') {
                    let user_login = referer.substring(0, referer.indexOf('!'));
                    //channe - user_login
                    this._sendEvent('part', channel, user_login, user_login === this.user_login);
                }
                else if (command === 'CLEARCHAT') {
                    //channel - tags - user_login
                    if (tags && tags['ban-duration']) this._sendEvent('timeout', channel, tags, message);
                    //channel - tags - user_login
                    else if (message !== null) this._sendEvent('ban', channel, tags, message);
                    //channel - tags
                    else this._sendEvent('clearchat', channel, tags);
                }
                else if (command === 'CLEARMSG') {
                    //channel - message - tags
                    this._sendEvent('clearmsg', channel, message, tags);
                    this._sendEvent('messagedeleted', channel, message, tags);
                }
                else if (command === 'GLOBALUSERSTATE') {
                    this.userstates['_global'] = tags;
                    //tags
                    this._sendEvent('globaluserstate', tags);
                }
                else if (message !== null && command === 'HOSTTARGET') {
                    let target = message.split(' ')[0];
                    let viewers = message.split(' ')[1];
                    
                    //channel - target - viewers
                    this._sendEvent('hosttarget', channel, target, viewers);
                    if (target === "-") this._sendEvent('unhost', channel, viewers);
                    else this._sendEvent('host', channel, target, viewers);
                }
                else if (command === 'NOTICE') {
                    //channel - message - tags
                    this._sendEvent('notice', channel, message, tags);
                    if (tags) this._sendEvent(tags['msg-id'], channel, message, tags);
                }
                else if (command === 'RECONNECT') {
                    //tags (null only - but who knows)
                    this._sendEvent('reconnect', tags);
                    setTimeout(() => {
                        this.Connect().catch(console.log);
                    }, 5 * 1000);
                }
                else if (command === 'ROOMSTATE') {
                    if (!this.roomstates[channel]) this.roomstates[channel] = {};
                    for (let tag in tags) this.roomstates[channel][tag] = tags[tag];

                    //channel - tags
                    this._sendEvent('roomstate', channel, tags);

                    if (Object.getOwnPropertyNames(tags).length > 2) continue;

                    //channel - enabled - tags
                    if (tags['emote-only']) this._sendEvent('emoteonly', channel, tags['emote-only'] === "1", tags);
                    if (tags['subs-only']) this._sendEvent('subsonly', channel, tags['subs-only'] === "1", tags);
                    if (tags['r9k']) this._sendEvent('r9k', channel, tags['r9k'] === "1", tags);
                    if (tags['rituals']) this._sendEvent('rituals', channel, tags['rituals'] === "1", tags);
                    //channel - enabled - length - tags
                    if (tags['followers-only']) this._sendEvent('followersonly', channel, tags['followers-only'] !== "-1", tags['followers-only'], tags);
                    if (tags['slow']) this._sendEvent('slowmode', channel, tags['slow'] === "1", tags['slow'], tags);
                }
                else if (command === 'USERNOTICE') {
                    //channel - message - tags
                    this._sendEvent('usernotice', channel, message, tags);
                    if (tags) this._sendEvent(tags['msg-id'], channel, message, tags);
                }
                else if (command === 'USERSTATE') {
                    this.userstates[channel] = tags;
                    //channel - tags
                    this._sendEvent('userstate', channel, tags);
                    this._sendEvent('emotesets', channel, tags['emote-sets']);
                }
                else if (message !== null && command === 'PRIVMSG') {
                    let user_login = referer.substring(0, referer.indexOf('!'));
                    let action = false;

                    //check action
                    if (message.substring(0, 1) === '\u0001') {
                        message = message.substring(8, message.length - 1);
                        action = true;
                        tags.action = "1";
                    }

                    //channel - user_login - message - tags
                    this._sendEvent('privmsg', channel, user_login, message, tags, user_login === this.user_login);

                    if (action) this._sendEvent('action', channel, user_login, message, tags, user_login === this.user_login);
                    else if (tags && tags.bits) this._sendEvent('cheer', channel, user_login, message, tags, user_login === this.user_login);
                    else this._sendEvent('chat', channel, user_login, message, tags, user_login === this.user_login);
                }
                else if (command === 'WHISPER') {
                    let to = referer.substring(0, referer.indexOf('!'));
                    let from = message.split(':')[0].split(' ')[0];
                    message = message.split(':')[1].substring(1);

                    tags = this._parseTags(tags, message);

                    //channel - from - to - tags
                    this._sendEvent('whisper', from, to, message, tags);
                }
                else if (command === 'CAP') {
                    this._sendEvent('cap', message.indexOf('ACK') >= 0, message.split(':twitch.tv/')[1]);
                }
                else if (isNaN(command)) {
                    if (!this.options.show_unknown_cmd) continue;
                    console.log("Unkown Command: " + command);
                    console.log(line.split(' '));
                }
            } catch (err) {
                console.log(err);
                this._sendEvent('error', err.message);
            }
        }
    }
    _parseMessage(line) {
        let tags = null;
        let referer = null;
        let channel = null;
        let command = null;
        let message = null;

        let parts = line.split(' ');

        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];

            if (part.charAt(0) === '@') {
                tags = {};

                for (let pair of part.substring(1).split(";")) {
                    let set = pair.split('=');
                    tags[set[0]] = set[1] === '' ? null : set[1];
                }
            }
            else if (part.charAt(0) === ':' && !referer) referer = part.substring(1);
            else if (part.charAt(0) === '#') channel = part.substring(1);
            else if (referer && command) {
                message = parts.slice(i).join(" ");
                if (channel) message = message.substring(1);
                break;
            }
            else command = part;
        }

        if (tags && command !== 'WHISPER') tags = this._parseTags(tags, message);

        if (!referer) referer = "";
        
        return { tags, referer, command, channel, message };
    }

    //UTIL
    getLoginName() {
        return this.user_login;
    }
    getDisplayName() {
        return this.getGlobalUserstate() ? this.getGlobalUserstate()['display-name'] : this.user_login;
    }
    getReadyState() {
        if (!this.socket) return null;
        return this.socket.readyState.toUpperCase();
    }
    getChannel() {
        if (!this.socket) return null;
        if (this.channels.length === 0) return null;
        return this.channels[0];
    }
    getChannels() {
        if (this.channels.length > 0) return this.channels;
        return null;
    }
    getUserstates() {
        return this.userstates;
    }
    getGlobalUserstate() {
        return this.userstates ? this.userstates['_global'] : null;
    }
    getUserID() {
        return this.getGlobalUserstate() ? this.getGlobalUserstate()['user-id'] : null;
    }
    getRoomstates() {
        return this.roomstates;
    }

    _write(str) {
        if (this.options.show_traffic === true) console.log('< ' + str);
        this.socket.write(str + '\r\n');
    }
    
    async _privmsg(_channel, _message, expected_event = 'userstate', good_notices = [], failed_event = '', bad_notices = []) {
        if (this.oauth === 'SCHMOOPIEE') return Promise.reject(new Error("Cant send messages in anonymous mode."));

        let data_id = null;
        let err_id = null;

        while (_message.charAt(_message.length - 1) === " ") {
            _message = _message.substring(0, _message.length - 1);
        }

        return new Promise((resolve, reject) => {
            data_id = this.on('data', (data_array) => {
                for (let line of data_array) {
                    let { tags, referer, command, channel, message } = this._parseMessage(line);
                    
                    //failed
                    if (command === failed_event.toUpperCase()) {
                        if (bad_notices.length === 0 || bad_notices.find(elt => elt === tags['msg-id']) || tags['msg-id'] === 'no_permission' || tags['msg-id'] === 'unrecognized_cmd') {
                            this.removeCallback('data', data_id);
                            this.removeCallback('error', err_id);
                            reject(new Error(tags['msg-id']));
                        }
                    }

                    //success
                    if (command === expected_event.toUpperCase()) {
                        if (good_notices.length === 0 || good_notices.find(elt => elt === tags['msg-id'])) {
                            this.removeCallback('data', data_id);
                            this.removeCallback('error', err_id);
                            if (command === 'USERSTATE' && _message.charAt(0) !== '/') this._sendEvent('privmsg', _channel, this.user_login, _message, tags, true);
                            resolve(tags);
                        }
                    }
                }
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('data', data_id);
                this.removeCallback('error', err_id);
                reject(new Error(err));
            });

            this._write(this._getReferer(this.user_login) + ' PRIVMSG #' + _channel + ' :' + _message);
        });
    }
    async _reply(id, channel, message) {
        let data_id = null;
        let err_id = null;

        while (message.charAt(message.length - 1) === " ") {
            message = message.substring(0, message.length - 2);
        }

        return new Promise(() => {
            data_id = this.on('userstate', (channel, tags) => {
                this.removeCallback('userstate', data_id);
                this.removeCallback('error', err_id);
                this._sendEvent('privmsg', channel, this.user_login, message, tags, true);
                resolve();
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('userstate', data_id);
                this.removeCallback('error', err_id);
                reject(new Error(err));
            });

            //Twitch has this documented wrong, you dont need :user_login!user_login@user_login here for some reason...
            this._write('@reply-parent-msg-id=' + id + ' PRIVMSG #' + channel + ' :' + message);
        });
    }

    async _connectSocket() {
        return new Promise((resolve, reject) => {
            this._sendEvent('connecting', this.host, this.port);

            let connected = false;
            let err_id = null;

            setTimeout(() => {
                if (connected) return;
                this.removeCallback('error', err_id);
                reject(new Error('Connecting Timeout'));
            }, this.options.connecting_timeout || 60 * 1000);
            err_id = this.on('error', (err) => {
                if (connected) return;
                this.removeCallback('error', err_id);
                if (err === 'reconnect') resolve();
                else reject(new Error(err));
            });

            this.socket.connect({ host: this.host, port: this.port }, (...args) => {
                connected = true;
                resolve(args);
            });
        });
    }
    async _sendUserInfo() {
        let data_id = null;
        let err_id = null;

        const code_order = ['001', '002', '003', '004', '375', '372', '376'];

        return new Promise((resolve, reject) => {
            data_id = this.on('data', (data = []) => {
                let indx = 0;
                for (let line of data) {
                    let parts = line.split(' ');

                    if (parts[0] !== ':tmi.twitch.tv') continue;
                    if (parts[1] === 'NOTICE') {
                        this.removeCallback('data', data_id);
                        this.removeCallback('error', err_id);
                        reject(new Error(parts.slice(3).join(" ").substring(1)));
                    }
                    if (parts[1] !== code_order[indx]) continue;
                    indx++;

                    if (indx === code_order.length - 1) {
                        this.removeCallback('data', data_id);
                        this.removeCallback('error', err_id);

                        this._sendEvent('logon', this.user_login);
                        connected = true;
                        resolve();
                    }
                }
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('data', data_id);
                this.removeCallback('error', err_id);
                reject(new Error(err));
            });
            let connected = false;

            setTimeout(() => {
                if (connected) return;
                this.removeCallback('data', data_id);
                this.removeCallback('error', err_id);
                reject(new Error('Connecting Timeout'));
            }, this.options.connecting_timeout || 60 * 1000);

            this._write('PASS ' + this.oauth);
            this._write('NICK ' + this.user_login);
        });
    }

    async _joinChannels(channels = this.channels) {
        try {
            for (let chnl of channels) await this._joinChannel(chnl);
        } catch (err) {
            return Promise.reject(err);
        }

        return Promise.resolve();
    }
    async _joinChannel(channel) {
        let join_id = null;
        let err_id = null;
        let connected = false;

        return new Promise((resolve, reject) => {
            join_id = this.on('join', (channel_in, user_login, self) => {
                if (!self || channel_in !== channel) return;
                this.removeCallback('join', join_id);
                this.removeCallback('error', err_id);
                connected = true;
                resolve();
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('join', join_id);
                this.removeCallback('error', err_id);
                reject(err);
            });
            setTimeout(() => {
                if (connected) return;
                this.removeCallback('join', join_id);
                this.removeCallback('error', err_id);
                reject(new Error('Connecting Timeout'));
            }, (this.options.connecting_timeout || 60 * 1000)/6);

            this._write('JOIN #' + channel);
        });
    }
    async _partChannel(channel) {
        let part_id = null;
        let err_id = null;

        return new Promise((resolve, reject) => {
            part_id = this.on('part', (channel_in, user_login, self) => {
                if (!self || channel_in !== channel) return;
                this.removeCallback('part', part_id);
                this.removeCallback('error', err_id);
                this.channels = this.channels.filter(elt => elt !== channel);
                resolve();
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('part', part_id);
                this.removeCallback('error', err_id);
                reject(err);
            });

            this._write('PART #' + channel);
        });
    }

    async _acquiereCapabilities(capabilities = IRC_CAPABILITIES) {
        try {
            for (let capabl of capabilities) await this._acquiereCapability(capabl);
        } catch (err) {
            return Promise.reject(err);
        }

        return Promise.resolve();
    }
    async _acquiereCapability(capability) {
        let data_id = null;
        let err_id = null;
        let connected = false;

        return new Promise((resolve, reject) => {
            data_id = this.on('data', (data = []) => {
                for (let line of data) {
                    let parts = line.split(' ');
                    
                    if (parts[0] !== ':tmi.twitch.tv') continue;
                    if (parts[1] !== 'CAP') continue;
                    if (parts[2] !== '*') continue;
                    if (parts[3] !== 'ACK') continue;
                    if (parts[4] !== ':twitch.tv/' + capability) continue;

                    this.removeCallback('data', data_id);
                    this.removeCallback('error', err_id);
                    connected = true;
                    resolve();
                }
            });
            err_id = this.on('error', (err) => {
                this.removeCallback('data', data_id);
                this.removeCallback('error', err_id);
                reject(err);
            });
            setTimeout(() => {
                if (connected) return;
                this.removeCallback('data', data_id);
                this.removeCallback('error', err_id);
                reject(new Error('Connecting Timeout'));
            }, (this.options.connecting_timeout || 60 * 1000) / 6);

            this._write('CAP REQ :twitch.tv/' + capability);
        });
    }

    _getReferer(user_login) {
        return ':' + user_login + '!' + user_login + '@' + user_login + ".tmi.twitch.tv";
    }
    _parseTags(tags = {}, message) {
        let output = {};

        for (let tag in tags || {}) {
            if (tag === 'flags' || tag === 'turbo' || tag === 'subscriber') continue;

            if ((tag === 'badge-info' || tag === 'badges') && tags[tag]) {
                let bug = tags[tag].split(',');
                output[tag] = {};
                for (let badge of bug) output[tag][badge.split("/")[0]] = badge.split("/")[1];
                output[tag + '-raw'] = tags[tag];
            } else if (message && tag === 'emotes' && tags['emotes'] && tags['emotes'].charAt(0) !== '\u0001') {
                output['ttv_emotes'] = [];
                for (let emote of tags['emotes'].split('/')) {
                    if (emote === "") continue;

                    let id = emote.split(":")[0];

                    let uses = [];
                    for (let use of emote.split(":")[1].split(',')) {
                        try {
                            let start = parseInt(use.split('-')[0]);
                            let end = parseInt(use.split('-')[1]) + 1;
                            uses.push({ start, end });
                        } catch (err) {
                            console.log(err);
                        }
                    }

                    let name = message.substring(uses[0].start, uses[0].end);

                    output['ttv_emotes'].push({ id, name, uses });
                }
                output[tag + '-raw'] = tags[tag];
            } else if (tag === 'emote-sets' ){
                output[tag] = tags[tag].split(",");
            } else {
                output[tag] = tags[tag];
            }
        }

        return output;
    }
}

class Message {
    constructor(channel, user_login, message, tags) {
        this.channel = channel;
        this.user_login = user_login;
        this.message = message;
        this.tags = tags || {};
        if (this.tags['ttv_emotes'] === undefined) this.tags['ttv_emotes'] = null;
        
        this.user_level = "regular";
        this.isFollower = false;
        this.cheermotes = null;
        this.bttv_emotes = null;
        this.ffz_emotes = null;
        
        //set Userlevel
        for (let constant in CONSTANTS.UserLevel) {
            for (let badge in this.tags.badges || {}) {
                if (badge == constant && CONSTANTS.UserLevel[constant] > CONSTANTS.UserLevel[this.user_level]) {
                    this.user_level = constant;
                    break;
                }
            }
        }
    }

    toString() {
        return this.getDisplayName() + " [" + this.getUserLevelAsText() + "] : " + this.message;
    }
    toJSON(to_exclude = []) {
        let temp = JSON.parse(JSON.stringify(this.tags));
        temp.message = this.message;
        temp.channel = this.channel;
        temp.user_login = this.user_login;

        temp.time = temp['tmi-sent-ts'];
        temp.user_id = temp['user-id'];
        temp.cheermotes = JSON.parse(JSON.stringify(this.cheermotes));

        //Attributes to remove
        let exclude = ["user-id", "tmi-sent-ts", "message-type", "badges-raw", "badge-info-raw", "emotes-raw", "subscriber", "mod"].concat(to_exclude);
        for (let key of exclude) {
            if (temp[key] || temp[key] == null || temp[key] == false) {
                delete temp[key];
            }
        }

        //FFZ
        temp.ffz_emotes = this.ffz_emotes;

        //BTTV
        temp.bttv_emotes = this.bttv_emotes;

        return temp;
    }
    clone() {
        let msg = new Message(this.channel, this.user_login, this.message, this.tags = {});

        //all runtime changed properties
        msg.isFollower = this.isFollower;
        msg.user_level = this.user_level;

        return msg;
    }

    //Actions
    async reply(IRC, message) {
        if (!IRC) return Promise.reject(new Error('No IRC available'));
        return IRC.reply(this.getID(), message, this.getChannel());
    }
    replySync(IRC, message) {
        if (!IRC) return null;
        return IRC.replySync(this.getID(), message, this.getChannel());
    }

    //Set
    async checkFollow(API) {
        if (!API) return Promise.reject(new Error('No API available'));

        let response = await API.GetUsersFollows({ from_id: this.getUserID(), to_id: this.getRoomID() });

        if (response && response.total && response.total == 1) {
            if (this.user_level < CONSTANTS.UserLevel.Partner) {
                this.user_level = CONSTANTS.UserLevel.Follower;
            }
            this.isFollower = true;
            return Promise.resolve(true);
        }

        this.isFollower = false;
        return Promise.resolve(false);
    }

    //Get
    getLoginName() {
        return this.user_login;
    }
    getMessage() {
        return this.message;
    }
    getChannel() {
        return this.channel;
    }

    getTags() {
        return this.tags;
    }
    getDisplayName(force = false) {
        if (force) return this.tags['display-name'] || null;
        return this.tags['display-name'] || this.login_name;
    }
    getID() {
        return this.tags['id'];
    }
    getUserID() {
        return this.tags['user-id'];
    }
    getRoomID() {
        return this.tags['room-id'];
    }
    getTime() {
        return this.tags['tmi-sent-ts'];
    }
    
    //Emotes
    isEmoteOnly() {
        return this.tags['emote-only'] === '1';
    }
    getTTVEmotes() {
        return this.tags['emotes'] || null;
    }
    getCheermotes() {
        return this.cheermotes;
    }
    getFFZEmotes() {
        return this.ffz_emotes;
    }
    getBTTVEmotes() {
        return this.bttv_emotes;
    }
    getMessageWithoutEmotes(keep_ttv = false, keep_bttv = true, keep_ffz = true) {
        let emotes = [];
        if (!keep_ttv) emotes.concat(this.getTTVEmotes() || []);
        if (!keep_bttv) emotes.concat(this.getBTTVEmotes() || []);
        if (!keep_ffz) emotes.concat(this.getFFZEmotes() || []);

        let last = 0;
        let out = "";

        for (let emote of emotes) {
            for (let usage of emote.uses) {
                out += this.getMessage().substring(last, usage.start);
                last = emote.end + 1;
            }
        }

        return out;
    }

    extractEmotes(available_emotes = []) {
        //Extract Emotes from Message
        //format: [{ id, name, uses: [{ start, end }, ... ] }, ... ]
        let emotes = [];

        for (let i = 0; i < this.message.length; i++) {
            //get word
            let next_space = this.message.indexOf(' ', i);
            if (next_space < 0) next_space = this.message.length;
            let word = this.message.substring(i, next_space);

            //check is availavle emote
            let emote = available_emotes.find(elt => elt.name === word);
            
            //add emote
            if (emote) {
                let set = emotes.find(elt => elt.id === emote.id);
                if (!set) emotes.push({ id: emote.id, name: emote.name, uses: [{ start: i, end: next_space - 1 }] });
                else set.uses.push({ start: i, end: next_space - 1 });
            }
            //next word
            i = next_space;
        }
        
        return emotes;
    }
    async extractTTVEmotes(API, use_all = false) {
        if (!API) return Promise.reject(new Error('No API available'));

        let globals = [];
        let follows = [];
        let cheers = [];
        let subs = [];

        //Get Global Emotes
        try {
            globals = (await API.GetGlobalEmotes()).data;
        } catch (err) {

        }

        //Get FollowEmotes (maybe do a Get Users and Get ID Tour in the future)
        try {
            if (!this.is_Follower) {
                await this.checkFollow(API);
            }
        } catch (err) {

        }

        try {
            let channel_emotes = (await API.GetChannelEmotes({ broadcaster_id: this.getRoomID() })).data;

            if (use_all || this.is_Follower) {
                follows = channel_emotes.filter(elt => elt.emote_type === 'follower');
            }

            //Get Channel Sub Emotes - Temporary until Twitch implements Subscription Checks
            if (use_all || this.isSubscriber()) {
                subs = channel_emotes.filter(elt => elt.emote_type === 'subscriptions' && parseInt(elt.tier) <= (use_all ? 3000 : (this.getSubTier() * 1000)));
            }

            cheers = channel_emotes.filter(elt => elt.emote_type === 'bitstier');
        } catch (err) {

        }
        
        //Get All SubEmotes - Currently not Supported by Twitch :( dont know who you are subbed to

        //Extract Emotes from Message
        let emotes = this.extractEmotes([].concat(globals).concat(subs).concat(follows).concat(cheers));
        if(emotes.length > 0) this.tags['ttv_emotes'] = emotes;
        return emotes;
    }
    async ExtractCheermotes(API, cheermotes) {
        if (!API) return Promise.reject(new Error('No API available'));

        //Get Global-Cheer Emotes
        try {
            if (!cheermotes) cheermotes = (await API.GetCheermotes({ broadcaster_id: this.getRoomID() })).data;
        } catch (err) {
            return Promise.reject(err);
        }

        //Extract Emotes from Message
        let emotes = [];

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
                let set = emotes.find(elt => elt.prefix === emote.prefix && elt.tier == tier.id);
                if (!set) emotes.push({ prefix: emote.prefix, tier: tier.id, min: tier.min_bits, uses: [{ start: i, end: next_space - 1 }], images: tier.images });
                else set.uses.push({ start: i, end: next_space - 1 });
            }

            i = next_space;
        }

        console.log(emotes);

        this.cheermotes = emotes;
        return emotes;
    }
    async extractTTVEmotesFromSets(API, emote_sets = []) {
        if (!API) return Promise.reject(new Error('No API available'));

        let emotes = [];

        //Get Emotes from Sets
        try {
            emotes = (await API.GetEmoteSets({ emote_set_id: emote_sets })).data;
        } catch (err) {
            return Promise.reject(err);
        }

        return this.extractEmotes(emotes);
    }
    async extractFFZEmotes(ffz_room) {
        //Fetch Channel
        try {
            if (!ffz_room) ffz_room = await FFZ.GetRoomByName(this.getChannel(), true);
        } catch (err) {
            return Promise.reject(err);
        }

        if (!ffz_room || !ffz_room.sets) return Promise.reject(new Error('No such room'));

        //Reformat
        let list = [];
        for (let set in ffz_room.sets)
            for (let emote of ffz_room.sets[set].emoticons)
                list.push(emote);
        
        //Extract Emotes from Message
        let emotes = this.extractEmotes(list);
        this.ffz_emotes = emotes;
        return emotes;
    }
    async extractBTTVEmotes(bttv_emotes) {
        //Fetch Channel
        try {
            if (!bttv_emotes) bttv_emotes = await BTTV.GetChannelEmotes(this.getRoomID(), true);
        } catch (err) {
            return Promise.reject(err);
        }
        
        if (!bttv_emotes) return Promise.reject(new Error('BTTV Room not found!'));

        //Reformat
        let list = [];
        for (let emote of bttv_emotes)
            list.push({ id: emote.id, name: emote.code });
        
        //Extract Emotes from Message
        let emotes = this.extractEmotes(list);
        this.bttv_emotes = emotes;
        return emotes;
    }

    //other stuff
    hasBadge(badgeName) {
        if (!this.tags.badges) return false;
        return this.tags.badges[badgeName] ? true : false;
    }

    getUserLevel() {
        return CONSTANTS.UserLevel[this.user_level];
    }
    getUserLevelAsText() {
        return this.user_level.charAt(0).toUpperCase() + this.user_level.substring(1);
    }
    matchUserlevel(userLevel, strictLevel = 0) {
        if (typeof (userLevel) == "string") {
            if (userLevel.indexOf(":") >= 0) {
                let badge = userLevel.substring(0, userLevel.indexOf(":"));
                let version = userLevel.substring(userLevel.indexOf(":") + 1);

                //#ModsMasterrace
                if (strictLevel == 0 && this.getUserLevel() >= CONSTANTS.UserLevel.other) {
                    return true;
                } else if (isNaN(this.tags.badges[badge])) {
                    if (this.tags.badges[badge] == version) {
                        return true;
                    }
                } else {
                    //Badge matters - but not the version
                    if (strictLevel == 1) {
                        if (parseInt(this.tags.badges[badge]) <= version) {
                            return true;
                        }
                        //Badge and Version matter - but higher Version count too
                    } else if (strictLevel == 2) {
                        if (parseInt(this.tags.badges[badge]) >= version) {
                            return true;
                        }
                        //Badge and Version matter - EXACT version match
                    } else {
                        if (parseInt(this.tags.badges[badge]) == version) {
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
        return this.isFollower;
    }
    isVIP() {
        if (this.tags.badges && this.tags.badges['vip']) {
            return true;
        } else {
            return false;
        }
    }
    isSubscriber(min_month = 0) {
        if (this.tags.badges && this.tags.badges['subscriber'] && this.tags['badge-info']['subscriber'] > min_month) {
            return true;
        } else {
            return false;
        }
    }
    getSubTier() {
        if (this.hasBadge('subscriber')) return parseInt(this.tags.badges['subscriber'] / 1000);
        return 0;
    }
}

module.exports.DETAILS = MODULE_DETAILS;
module.exports.TwitchIRC = TwitchIRC;
module.exports.Client = Client;
module.exports.Message = Message;