const express = require('express');
const fs = require('fs');
const path = require('path');
const CONFIGHANDLER = require('./../../Util/ConfigHandler.js');
const crypto = require('crypto');

const PACKAGE_DETAILS = {
    name: "Alerts",
    description: "Sound and Visual Alerts of Subscriptions, Cheers and more.",
    picture: "/images/icons/bell-solid.svg"
};
const SUPPORTED_ALERTS = ['join', 'follow', 'sub', 'resub', 'giftsub', 'giftbomb', 'upgrade', 'bits', 'host', 'raid'];
const SUPPORTED_EVENTS = [];

const DEFAULT_ALERT_SETTINGS = [
    { name: 'enabled', type: 'boolean', default: true, requiered: true },
    { name: 'font', type: 'string', default: 'Arial' },
    { name: 'size', type: 'number', default: 18 },
    { name: 'bold', type: 'boolean', default: true },
    { name: 'color', type: 'string', default: '#000000' },
    { name: 'layout', type: 'number', default: 6 },
    { name: 'effect', type: 'string', default: 'Fade' },
    { name: 'image', type: 'string', default: '' },
    { name: 'sound', type: 'string', default: '' },
    { name: 'file_volume', type: 'number', default: 50 },
    { name: 'on_time', type: 'number', default: 5 },
    { name: 'delay', type: 'number', default: 0 },
    { name: 'css', type: 'string', default: '' },
    { name: 'js', type: 'string', default: '' }
];
const DEFAULT_ALERT_MESSAGES = {
    'join': '{username} just joined the stream!',
    'follow': '{username} just followed! Say hi everyone HeyGuys',
    'sub': '{username} just subscribed!',
    'resub': '{username} just resubscribed for {months} Months!',
    'giftsub': '{username} just gifted a {tier} Sub to {target}',
    'giftbomb': '{username} just gifted {amount} {tier} Subs',
    'upgrade': '{username} just upgraded their subscription to {tier}!',
    'bits': '{username} just donated {amount} Bits.',
    'host': '{username} just hosted with {amount} Viewers.',
    'raid': '{username} just raided with {amount} Viewers.'
};
const ALERT_VARIABLES = {
    'join': [
        { name: 'username', desc: 'The name of the user joining the IRC.', type: 'string' }
    ],
    'follow': [
        { name: 'username', desc: 'The name of the user following the Channel.', type: 'string' }
    ],
    'sub': [
        { name: 'username', desc: 'The name of the user subscribing to the channel.', type: 'string' },
        { name: 'tier', desc: 'Returns "Tier 1", "Tier 2", "Tier 3" or "Twitch Prime".', type: 'string' }
    ],
    'resub': [
        { name: 'username', desc: 'The name of the user resubscribing to the channel.', type: 'string' },
        { name: 'tier', desc: 'Returns "Tier 1", "Tier 2", "Tier 3" or "Twitch Prime".', type: 'string' },
        { name: 'months', desc: 'The amount of months a user has been subscribed for.', type: 'number' }
    ],
    'giftsub': [
        { name: 'username', desc: 'The name of the user gifting subs.', type: 'string' },
        { name: 'tier', desc: 'Returns "Tier 1", "Tier 2", "Tier 3" or "Twitch Prime".', type: 'string' },
        { name: 'target', desc: 'The name of the user receiving a sub.', type: 'string' },
        { name: 'total', desc: 'The total number of subgifts the user has.', type: 'number' }
    ],
    'giftbomb': [
        { name: 'username', desc: 'The name of the user gifting subs.', type: 'string' },
        { name: 'tier', desc: 'Returns "Tier 1", "Tier 2", "Tier 3" or "Twitch Prime".', type: 'string' },
        { name: 'amount', desc: 'The amount of subs gifted.', type: 'number' },
        { name: 'total', desc: 'The total number of subgifts the user has.', type: 'number' }
    ],
    'upgrade': [
        { name: 'username', desc: 'The name of the user gifting subs.', type: 'string' },
        { name: 'tier', desc: 'Returns "Tier 1", "Tier 2" or "Tier 3".', type: 'string' }
    ],
    'giftupgrade': [
        { name: 'username', desc: 'The name of the user gifting subs.', type: 'string' },
        { name: 'target', desc: 'The name of the user receiving a subupgrade.', type: 'string' },
        { name: 'tier', desc: 'Returns "Tier 1", "Tier 2" or "Tier 3".', type: 'string' }
    ],
    'bits': [
        { name: 'username', desc: 'The name of the user donating bits.', type: 'string' },
        { name: 'amount', desc: 'The amount of bits donated.', type: 'number' }
    ],
    'host': [
        { name: 'username', desc: 'The name of the user hosting.', type: 'string' },
        { name: 'amount', desc: 'The amount of viewers who joined the host.', type: 'number' }
    ],
    'raid': [
        { name: 'username', desc: 'The name of the user raiding.', type: 'string' },
        { name: 'amount', desc: 'The amount of viewers  who joined the raid.', type: 'number' }
    ]
};

const SUPPORTED_IMG_FILES = ['png', 'jpg', 'jpeg', 'gif', 'mp4'];
const SUPPORTED_VIDEO_FILES = ['mp4'];
const SUPPORTED_SOUND_FILES = ['ogg', 'mp3', 'wav'];
const SUPPORTED_FILES = SUPPORTED_IMG_FILES.concat(SUPPORTED_SOUND_FILES);

class Alerts extends require('./../../Util/PackageBase.js').PackageBase {
    constructor(webappinteractor, twitchirc, twitchapi, logger) {
        super(PACKAGE_DETAILS, webappinteractor, twitchirc, twitchapi, logger);

        this.Config.AddSettingTemplates([
            { name: 'TTS_PITCH', type: 'number', default: 1, min: 0, max: 2 },
            { name: 'TTS_VOICE', type: 'string' },
            { name: 'Overlay_Token', type: 'string', requiered: true, default_func: () => this.regenerateOverlayToken(false) },
            { name: 'Custom_File_Dir', type: 'string', default: this.getMainPackageRoot() + this.getName() + "/custom_files/" }
        ]);
        this.Config.Load();
        this.Config.FillConfig();
    }

    async Init(startparameters) {
        if (!this.isEnabled()) return Promise.resolve();
        
        //Alert Configs
        let Alerts_Config_List = new CONFIGHANDLER.Config('Alerts', [], { preloaded: this.Config.GetConfig()['Alerts'] });
        for (let alert of SUPPORTED_ALERTS) {
            let child_cfg = new CONFIGHANDLER.Config(alert, JSON.parse(JSON.stringify(DEFAULT_ALERT_SETTINGS)), { preloaded: Alerts_Config_List.GetConfig()[alert] });
            
            child_cfg.AddSettingTemplates({ name: 'message', type: 'string', default: DEFAULT_ALERT_MESSAGES[alert] || '' });

            if (alert === 'sub') {
                child_cfg.AddSettingTemplates({ name: 'prime_message', type: 'string', default: DEFAULT_ALERT_MESSAGES['sub_prime'] });
            } else if (alert === 'resub') {
                child_cfg.AddSettingTemplates({ name: 'prime_message', type: 'string', default: DEFAULT_ALERT_MESSAGES['resub_prime'] });
                child_cfg.AddSettingTemplates({ name: 'show_user_message', type: 'boolean', default: true });
                child_cfg.AddSettingTemplates({ name: 'tts', type: 'boolean', default: false });
                child_cfg.AddSettingTemplates({ name: 'tts_volume', type: 'number', default: 50 });
            } else if (alert === 'giftsub') {
                child_cfg.AddSettingTemplates({ name: 'gift_message', type: 'string', default: DEFAULT_ALERT_MESSAGES['giftsub'] });
            } else if (alert === 'giftbomb') {
                child_cfg.AddSettingTemplates({ name: 'gift_bomb_message', type: 'string', default: DEFAULT_ALERT_MESSAGES['giftbomb'] });
            } else if (alert === 'bits') {
                child_cfg.AddSettingTemplates({ name: 'tts', type: 'boolean', default: false });
                child_cfg.AddSettingTemplates({ name: 'tts_volume', type: 'number', default: 50 });
            }
            
            Alerts_Config_List.AddChildConfig(child_cfg);
        }
        this.Config.AddChildConfig(Alerts_Config_List);
        
        this.Config.Load();
        this.Config.FillConfig();
        
        //Twitch Chat and EventSub Callbacks
        this.setEventCallbacks();

        //API
        let APIRouter = express.Router();
        APIRouter.get('/settings', (req, res, next) => {
            res.json({
                cfg: this.GetConfig(),
                messages: DEFAULT_ALERT_MESSAGES,
                files: this.GetCustomFiles(),
                hostname: this.WebAppInteractor.GetHostnameAndPort(),
                SUPPORTED_ALERTS,
                DEFAULT_ALERT_SETTINGS,
                ALERT_VARIABLES
            });
        });
        APIRouter.put('/settings/alert', (req, res, next) => {
            const cfg = req.body['cfg'];
            const alerts = req.body['alerts'] || [req.body['alerts']];

            let Alerts_Config_List = this.Config.GetChildConfig('Alerts');

            for (let alert of alerts) {
                if (!alert) continue;
                let config_obj = Alerts_Config_List.GetChildConfig(alert.toLowerCase());
                if (!config_obj) continue;

                for (let settingName in cfg) {
                    let error = config_obj.UpdateSetting(settingName, cfg[settingName]);
                    if (error !== true) return res.json({ cfg: this.Config.GetConfig()['Alerts'], halted: error });
                }
            }

            //Sendt TCP Settings Updates
            this.SendWebSocketMessage('settings', this.GetConfig());

            res.json({ cfg: this.GetConfig()['Alerts'] });
        });
        APIRouter.put('/settings/tts', (req, res, next) => {
            const setting = req.body['setting'];
            const value = req.body['value'];

            if (setting === 'pitch') {
                let error = this.Config.UpdateSetting('TTS_PITCH', value);
                if (error !== true) return res.json({ err: error });
                else res.json({ [setting]: this.GetConfig()['TTS_PITCH'] });
            } else if (setting === 'voice') {
                let error = this.Config.UpdateSetting('TTS_VOICE', value);
                if (error !== true) return res.json({ err: error });
                else res.json({ [setting]: this.GetConfig()['TTS_VOICE'] });
            } else {
                res.json({ err: "404 - Setting not found" });
                return;
            }
            
            //Sendt TCP Settings Updates
            this.SendWebSocketMessage('settings', this.GetConfig());
        });

        APIRouter.get('/files', (req, res, next) => {
            res.json({ files: this.GetCustomFiles() });
        });
        APIRouter.post('/files', (req, res, next) => {
            let file_name = req.body['file_name'];
            let file_data = req.body['file_data'];
            let extension = file_name.split('.').pop().toLowerCase();

            if (!SUPPORTED_FILES.find(elt => elt === extension)) return res.json({ err: 'Filetype not supported!' });
            
            let cfg = this.Config.GetConfig();
            let file_path = path.resolve(cfg['Custom_File_Dir'] + file_name);
            
            try {
                if (fs.existsSync(file_path)) return res.json({ err: 'File already exists!' });

                //if (SUPPORTED_VIDEO_FILES.find(elt => elt === extension)) fs.writeFileSync(file_path, file_data.replace(/^data:video\/\w+;base64,/, ''), { encoding: 'base64' });
                if (SUPPORTED_IMG_FILES.find(elt => elt === extension)) fs.writeFileSync(file_path, file_data.replace(/^data:image\/\w+;base64,/, ''), { encoding: 'base64' });
                else if (SUPPORTED_SOUND_FILES.find(elt => elt === extension)) fs.writeFileSync(file_path, file_data.replace(/^data:audio\/\w+;base64,/, ''), { encoding: 'base64' });
            } catch (err) {
                return res.sendStatus(500);
            }

            res.sendStatus(200);
        });
        APIRouter.delete('/files', (req, res, next) => {
            let cfg = this.Config.GetConfig();
            let file = path.resolve(cfg['Custom_File_Dir'] + req.body['file']);

            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    res.sendStatus(200);
                } else {
                    res.sendStatus(404);
                }
            } catch (err) {
                console.log(err);
                res.sendStatus(500);
            }
        });

        APIRouter.get('/trigger/:alert', (req, res, next) => {
            if (!SUPPORTED_ALERTS.find(elt => elt === req.params['alert'])) return res.sendStatus(400);
            
            //Trigger Alert
            this.SendWebSocketMessage(req.params['alert'], { });

            res.sendStatus(200);
        });

        this.setAuthenticatedAPIRouter(APIRouter, { user_level: 'moderator' });

        //STATIC FILE ROUTE
        let StaticRouter = express.Router();
        StaticRouter.use("/", (req, res, next) => {
            let url = decodeURI(req.url.split('?')[0].toLowerCase());
            let cfg = this.Config.GetConfig();
            
            if (url.startsWith('/custom/')) {
                let page = path.resolve(cfg['Custom_File_Dir'] + url.substring(8));

                try {
                    if (fs.existsSync(page)) res.sendFile(page)
                    else res.sendStatus(404);
                } catch (err) {
                    res.sendStatus(404);
                }
            } else if (url.startsWith('/overlay/' + cfg.Overlay_Token)) {
                res.sendFile(path.resolve(this.getMainPackageRoot() + 'Alerts/html/Overlay.html'));
            } else {
                let page = this.HTMLFileExists(req.url);
                //Check if File/Dir is Present
                if (page != "") res.sendFile(page);
                else res.redirect("/Alerts");
            }
        });
        super.setFileRouter(StaticRouter);

        //TCP
        this.TCP_Clients = [];
        this.LAST_MESSAGE_ACK = [];
        this.WebAppInteractor.AddTCPCallback('Alerts', (ws, type, data) => this.TCPCallback(ws, type, data));
        
        //Displayables
        this.addDisplayables([
            { name: 'TCP Clients', value: () => this.TCP_Clients.length },
            { name: 'Missing ACKs', value: () => this.LAST_MESSAGE_ACK.length }
        ]);

        return this.reload();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));
        
        this.Logger.info("Alerts (Re)Loaded!");
        return Promise.resolve();
    }

    TCPCallback(ws, type, data) {
        //Add to TCP List
        if (type === 'register') {
            this.TCP_Clients.push({ origin: data.origin, topic: data.topic, misc: data.misc, ws });
            ws.send("settings:" + JSON.stringify(this.GetConfig()));
            return;
        }
        
        //ACK Message
        let ack_idx = -1;
        this.LAST_MESSAGE_ACK.find((elt, idx) => {
            if (elt.ws === ws) {
                ack_idx = idx;
                return true;
            }
            return false;
        });

        if (ack_idx > -1) {
            this.LAST_MESSAGE_ACK.splice(ack_idx, 1);
        }

    }
    SendWebSocketMessage(topic, data) {
        //Check last Message returns
        for (let i = 0; i < this.LAST_MESSAGE_ACK.length; i++) {
            let ack = this.LAST_MESSAGE_ACK[i];
            if (ack.ack === false) {
                ack.tries++;
                if (ack.tries > 2) {
                    this.Logger.warn("WebSocket to " + ack.origin + " TERMINATED! Reason: Timeout");
                    ack.ws.terminate();
                    this.LAST_MESSAGE_ACK.splice(i, 1);

                    let client_idx = -1;
                    this.TCP_Clients.find((elt, idx) => {
                        if (elt.ws === ack.ws) {
                            client_idx = idx;
                            return true;
                        }
                        return false;
                    });
                    this.TCP_Clients.splice(client_idx, 1);
                }
            }
        }

        //Send Message to All Connected Clients
        for (let elt of this.TCP_Clients) {
            //Skip topics not requested
            if (topic !== 'settings') {
                if (elt.origin !== '/Alerts/Overlay') continue;                                                                     //Only Send Alerts/Evnts to Overlays
                if (elt.misc === 'alerts' && !SUPPORTED_ALERTS.find(elt2 => elt2 === topic)) continue;                              //Only Send Alerts if Alerts Requested
                if (elt.misc === 'events' && !SUPPORTED_EVENTS.find(elt2 => elt2 === topic)) continue;                              //Only Send Events if Events Requested
                if (elt.misc !== 'alerts' && elt.misc !== 'events' && !elt.misc.split(',').find(elt2 => elt2 === topic)) continue;  //Only Send Requested Alerts/Events
            }
            
            //Add ACK Checker when not already
            if (!this.LAST_MESSAGE_ACK.find(elt2 => elt2.ws === elt.ws))
                this.LAST_MESSAGE_ACK.push({ ws: elt.ws, origin: elt.origin, message: topic + ":" + JSON.stringify(data), ack: false, tries: 0 });

            //Send Data
            elt.ws.send(topic + ":" + JSON.stringify(data));
        }
    }

    setEventCallbacks() {
        //Twitch Chat Listener
        this.TwitchIRC.on('join', (channel, username, self) => this.Join(channel, username, self));

        this.TwitchIRC.on('Anongiftpaidupgrade', (channel, username, userstate) => this.AnonGiftUpgrade(channel, username, userstate));
        this.TwitchIRC.on('Giftpaidupgrade', (channel, username, sender, userstate) => this.Cheer(channel, username, sender, userstate));
        this.TwitchIRC.on('subscription', (channel, username, method, message, userstate) => this.Sub(channel, username, method, message, userstate));
        this.TwitchIRC.on('resub', (channel, username, months, message, userstate, methods) => this.ReSub(channel, username, months, message, userstate, methods));
        this.TwitchIRC.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => this.SubGift(channel, username, streakMonths, recipient, methods, userstate));
        this.TwitchIRC.on('submysterygift', (channel, username, numbOfSubs, methods, userstate) => this.MysterySubGift(channel, username, numbOfSubs, methods, userstate));
        this.TwitchIRC.on('cheer', (channel, userstate, message) => this.Cheer(channel, userstate, message));

        this.TwitchIRC.on('hosted', (channel, username, viewers, autohost) => this.Host(channel, username, viewers, autohost));
        this.TwitchIRC.on('raided', (channel, username, viewers) => this.Raid(channel, username, viewers));

        //WebHooks
        this.TwitchAPI.AddEventSubCallback('channel.follow', this.getName(), (body) => this.FollowEvent(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.subscribe', this.getName(), (body) => this.SubEvent(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.subscription.gift', this.getName(), (body) => this.GiftSubEvent(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.subscription.message', this.getName(), (body) => this.ReSubEvent(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.cheer', this.getName(), (body) => this.CheerEvent(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.raid', this.getName(), (body) => this.RaidEvent(body.event));

        this.TwitchAPI.AddEventSubCallback('channel.poll.begin', this.getName(), (body) => this.PollBegin(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.poll.update', this.getName(), (body) => this.PollUpdate(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.poll.end', this.getName(), (body) => this.PollEnd(body.event));

        this.TwitchAPI.AddEventSubCallback('channel.prediction.begin', this.getName(), (body) => this.PredictionBegin(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.prediction.update', this.getName(), (body) => this.PredictionUpdate(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.prediction.lock', this.getName(), (body) => this.PredictionLock(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.prediction.end', this.getName(), (body) => this.PredictionEnd(body.event));

        this.TwitchAPI.AddEventSubCallback('channel.hype_train.begin', this.getName(), (body) => this.HypeTrainBegin(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.hype_train.update', this.getName(), (body) => this.HypeTrainUpdate(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.hype_train.end', this.getName(), (body) => this.HypeTrainEnd(body.event));

        //BETA
        this.TwitchAPI.AddEventSubCallback('channel.goals.begin', this.getName(), (body) => this.GoalsBegin(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.goals.update', this.getName(), (body) => this.GoalsUpdate(body.event));
        this.TwitchAPI.AddEventSubCallback('channel.goals.end', this.getName(), (body) => this.GoalsEnd(body.event));
    }

    GetCustomFiles() {
        let files = [];
        let cfg = this.Config.GetConfig();

        try {
            files = this.getFilesFromDir(path.resolve(cfg['Custom_File_Dir']));
        } catch (err) {

        }

        return files;
    }
    CheckIRCStatus() {
        return this.TwitchIRC.GetReadyState() === "OPEN";
    }
    
    //ChatEvent
    Join(channel, username, self) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['join'].enabled !== true) return;

        this.SendWebSocketMessage("join", { username });
    }

    Sub(channel, username, method, message, userstate) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['sub'].enabled !== true) return;
        this.SendWebSocketMessage("sub", { username, message, tier: '???' });
    }
    ReSub(channel, username, months, message, userstate, methods) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['resub'].enabled !== true) return;
        this.SendWebSocketMessage("resub", { username, months, message, tier: '???' });
    }
    SubGift(channel, username, streakMonths, recipient, methods, userstate) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['giftsub'].enabled !== true) return;
        this.SendWebSocketMessage("giftsub", { username, target: recipient, tier: '???', total: ~~userstate["msg-param-sender-count"] });
    }
    MysterySubGift(channel, username, numbOfSubs, methods, userstate) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['giftbomb'].enabled !== true) return;
        this.SendWebSocketMessage("giftbomb", { username, tier: '???', amount: numbOfSubs, total: ~~userstate["msg-param-sender-count"] });
    }
    AnonGiftUpgrade(channel, username, userstate) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['upgrade'].enabled !== true) return;
        this.SendWebSocketMessage("upgrade", { username, tier: '???' });
    }
    GiftUpgrade(channel, username, sender, userstate) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['upgrade'].enabled !== true) return;
        this.SendWebSocketMessage("upgrade", { username: sender, target: username, tier: '???' });
    }
    Cheer(channel, username, message) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['cheer'].enabled !== true) return;
        this.SendWebSocketMessage("cheer", { username, amount: userstate.bits, message });
    }

    Host(channel, username, viewers, autohost) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['host'].enabled !== true) return;
        this.SendWebSocketMessage("host", { username, amount: viewers });
    }
    Raid(channel, username, viewers) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['host'].enabled !== true) return;
        this.SendWebSocketMessage("raid", { username, amount: viewers });
    }
    
    //EventSub
    FollowEvent(event) {
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['follow'].enabled !== true) return;
        this.SendWebSocketMessage("follow", { username: event.user_login });
    }
    SubEvent(event) {
        //Check IRC Status - when active dont send - when inactive send
        if (this.CheckIRCStatus()) return;
        
        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['sub'].enabled !== true) return;
        this.SendWebSocketMessage("sub", { username: event.user_name, tier: event.tier });
    }
    ReSubEvent(event) {
        //Check IRC Status - when active dont send - when inactive send
        if (this.CheckIRCStatus()) return;

        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['resub'].enabled !== true) return;
        this.SendWebSocketMessage("resub", { username: event.user_name, tier: event.tier, message: event.message, streak_months: event.streak_months, months: event.duration_months });
    }
    GiftSubEvent(event) {
        //Check IRC Status - when active dont send - when inactive send
        if (this.CheckIRCStatus()) return;

        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['giftbomb'].enabled !== true) return;
        this.SendWebSocketMessage("giftbomb", {
            username: event.user_name,
            tier: event.tier,
            total: event.cumulative_total,
            amount: event.total
        });
    }
    CheerEvent(event) {
        //Check IRC Status - when active dont send - when inactive send
        if (this.CheckIRCStatus()) return;

        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['cheer'].enabled !== true) return;

        this.SendWebSocketMessage("cheer", {
            username: event.user_name,
            bits: event.bits,
            message: event.message
        });
    }
    RaidEvent(event) {
        //Check IRC Status - when active dont send - when inactive send
        if (this.CheckIRCStatus()) return;

        //Check Settings
        let alerts = this.GetConfig()['Alerts'];
        if (alerts['raid'].enabled !== true) return;

        this.SendWebSocketMessage("raid", {
            username: event.broadcaster_name,
            viewers: event.viewers
        });
    }

    PollBegin(event) {
        this.SendWebSocketMessage("poll.begin", event);
    }
    PollUpdate(event) {
        this.SendWebSocketMessage("poll.update", event);
    }
    PollEnd(event) {
        this.SendWebSocketMessage("poll.end", event);
    }

    PredictionBegin(event) {
        this.SendWebSocketMessage("prediction.begin", event);
    }
    PredictionUpdate(event) {
        this.SendWebSocketMessage("prediction.update", event);
    }
    PredictionLock(event) {
        this.SendWebSocketMessage("prediction.lock", event);
    }
    PredictionEnd(event) {
        this.SendWebSocketMessage("prediction.end", event);
    }

    HypeTrainBegin(event) {
        this.SendWebSocketMessage("hypetrain.begin", event);
    }
    HypeTrainUpdate(event) {
        this.SendWebSocketMessage("hypetrain.update", event);
    }
    HypeTrainEnd(event) {
        this.SendWebSocketMessage("hypetrain.end", event);
    }

    GoalsBegin(event) {
        this.SendWebSocketMessage("goals.begin", event);
    }
    GoalsUpdate(event) {
        this.SendWebSocketMessage("goals.update", event);
    }
    GoalsEnd(event) {
        this.SendWebSocketMessage("goals.end", event);
    }

    //UTIL
    regenerateOverlayToken(updateConfig = true) {
        let token = crypto.randomBytes(16).toString('hex');
        if (updateConfig) this.Config.UpdateSetting('Overlay_Token', token);
        return token;
    }
    DateToNumber(date_string = "") {
        try {
            return (new Date(date_string)).getTime();
        } catch (err) {
            return null;
        }
    }
}

module.exports.Alerts = Alerts;