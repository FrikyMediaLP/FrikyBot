const CONSTANTS = require('./../../Util/CONSTANTS.js');
const TWITCHIRC = require('./../../Modules/TwitchIRC.js');
const BTTV = require('./../../3rdParty/BTTV.js');
const FFZ = require('./../../3rdParty/FFZ.js');

const express = require('express');
const fs = require('fs');
const path = require('path');
const Datastore = require('nedb');

const PACKAGE_DETAILS = {
    name: "Stats",
    description: "Twitch Chat Stats displayed in a neat an easy way.",
    picture: "/images/icons/chart-bar.svg"
};

class Stats extends require('./../../Util/PackageBase.js').PackageBase {
    constructor(webappinteractor, twitchirc, twitchapi, logger) {
        super(PACKAGE_DETAILS, webappinteractor, twitchirc, twitchapi, logger);
        
        this.Config.AddSettingTemplates([
            { name: 'Data_Dir', type: 'string', default: CONSTANTS.FILESTRUCTURE.PACKAGES_INSTALL_ROOT + 'Stats/data/' },
            { name: 'debug', type: 'boolean', default: false },
            { name: 'collected', type: 'array', default: [] },
            { name: 'only_collect', type: 'boolean', default: false }
        ]);
        this.Config.Load();
        this.Config.FillConfig();
    }

    async Init(startparameters) {
        if (!this.isEnabled()) return Promise.resolve();

        let cfg = this.Config.GetConfig();

        //General Datasets
        this.Datasets = [];

        //Twitch Chat Listener
        if (this.TwitchIRC) this.TwitchIRC.on('chat', async (channel, userstate, message, self) => this.MessageEventHandler(channel, userstate, message, self));
        this.TwitchIRC.on('anongiftpaidupgrade', (...args) => this.CollectChatEvents("Anongiftpaidupgrade", ['channel', 'username', 'userstate'], args));
        this.TwitchIRC.on('giftpaidupgrade', (...args) => this.CollectChatEvents("Giftpaidupgrade", ['channel', 'username', 'sender', 'userstate'], args));
        this.TwitchIRC.on('subscription', (...args) => this.CollectChatEvents("subscription", ['channel', 'username', 'method', 'message', 'userstate'], args));
        this.TwitchIRC.on('resub', (...args) => this.CollectChatEvents("resub", ['channel', 'username', 'months', 'message', 'userstate', 'methods'], args));
        this.TwitchIRC.on('subgift', (...args) => this.CollectChatEvents("subgift", ['channel', 'username', 'streakMonths', 'recipient', 'methods', 'userstate'], args));
        this.TwitchIRC.on('submysterygift', (...args) => this.CollectChatEvents("submysterygift", ['channel', 'username', 'numbOfSubs', 'methods', 'userstate'], args));
        this.TwitchIRC.on('cheer', (...args) => this.CollectChatEvents("cheer", ['channel', 'userstate', 'message'], args));
        this.TwitchIRC.on('hosted', (...args) => this.CollectChatEvents("hosted", ['channel', 'username', 'viewers', 'autohost'], args));
        this.TwitchIRC.on('raided', (...args) => this.CollectChatEvents("raided", ['channel', 'username', 'viewers'], args));
        
        //Updating Static Information
        this.CURRENT_STREAM_DATA = null;
        this.CACHED_FFZ_ROOM = null;
        this.CACHED_BTTV_EMOTES = null;
        this.CACHED_TOP_USER_IMAGES = {};

        //Custom - Datasets
        this.AddDataset('raw_events').catch(err => this.Logger.error(err.message));
        this.AddDataset('users').catch(err => this.Logger.error(err.message));
        this.AddDataset('emotes').catch(err => this.Logger.error(err.message));
        this.AddDataset('streams').catch(err => this.Logger.error(err.message));
        this.AddDataset('channel_subscriptions').catch(err => this.Logger.error(err.message));
        this.AddDataset('channel_events').catch(err => this.Logger.error(err.message));
        this.AddDataset('moderator_actions').catch(err => this.Logger.error(err.message));
        
        //WebHooks
        this.TwitchAPI.AddEventSubCallback('all', this.getName(), (body) => this.EVENTSUB_CALLBACK(body).catch(err => this.Logger.error(err.message)));

        //API
        let APIRouter = express.Router();

        //Misc
        APIRouter.get('/navigation', async (req, res, next) => {
            let users = [];
            let streams = [];

            try {
                users = await this.GetDatapoints('users', {}, this.GetPaginationString(5, 0, { customsort: 'message_count' }));
                users = users.data;
                for (let user of users) delete user['_id'];
            } catch (err) {

            }

            try {
                streams = await this.GetDatapoints('streams', {}, this.GetPaginationString(1, 0, { customsort: 'started_at' }));
                streams = streams.data;
                for (let stream of streams) delete stream['_id'];
            } catch (err) {

            }

            res.json({ users, streams });
        });
        APIRouter.get('/pages/overview', async (req, res, next) => {
            let users = [];
            let emotes = [];
            let streams = [];

            try {
                users = await this.GetDatapoints('users', {}, this.GetPaginationString(3, 0, { customsort: 'message_count' }));
                users = users.data;
                for (let user of users) delete user['_id'];
            } catch (err) {

            }

            //Find Users Image and Cache them
            let user_ids = [];
            for (let user of users) if (user.user_id && !this.CACHED_TOP_USER_IMAGES[user.user_id]) user_ids.push(user.user_id);

            if (user_ids.length > 0) {
                try {
                    let ttv_users = await this.TwitchAPI.GetUsers({ id: user_ids });
                    for (let user of ttv_users.data) {
                        this.CACHED_TOP_USER_IMAGES[user.id] = user.profile_image_url;
                    }
                } catch (err) {

                }
            }

            //Add Cached Images
            for (let user of users) {
                user.img = this.CACHED_TOP_USER_IMAGES[user.user_id];
            }
            
            try {
                emotes = await this.GetDatapoints('emotes', {}, this.GetPaginationString(3, 0, { customsort: 'count' }));
                emotes = emotes.data;
                for (let emote of emotes) delete emote['_id'];
            } catch (err) {

            }

            try {
                streams = await this.GetDatapoints('streams', {}, this.GetPaginationString(1, 0, { customsort: 'started_at' }));
                streams = streams.data;
                for (let stream of streams) delete stream['_id'];
            } catch (err) {

            }

            res.json({ users, emotes, streams });
        });

        //Emotes
        APIRouter.get('/emotes', async (req, res, next) => {
            let pagination = req.query['pagination'] || this.GetPaginationString(10, 0, { customsort: 'count' });
            let query = null;

            try {
                query = await this.GetDatapoints('emotes', {}, pagination);
                for (let query_elt of query) delete query_elt['_id'];
            } catch (err) {

            }

            res.json(query);
        });
        APIRouter.get('/emotes/id/:emote_id', async (req, res, next) => {
            let arr = null;

            try {
                arr = await this.GetDatapoints('emotes', { emote_id: req.params['emote_id'] });
                for (let elt of arr) delete elt['_id'];
            } catch (err) {

            }

            res.json({ data: arr });
        });
        APIRouter.get('/emotes/name/:emote_name', async (req, res, next) => {
            let arr = null;

            try {
                arr = await this.GetDatapoints('emotes', { emote_name: req.params['emote_name'] });
                for (let elt of arr) delete elt['_id'];
            } catch (err) {

            }

            res.json({ data: arr });
        });

        //Users
        APIRouter.get('/users', async (req, res, next) => {
            let pagination = req.query['pagination'] || this.GetPaginationString(10, 0, { customsort: 'message_count' });
            let query = null;

            try {
                query = await this.GetDatapoints('users', {}, pagination);
                for (let query_elt of query) delete query_elt['_id'];
            } catch (err) {

            }
            
            res.json(query);
        });
        APIRouter.get('/users/id/:user_id', async (req, res, next) => {
            let arr = null;

            try {
                arr = await this.GetDatapoints('users', { user_id: req.params['user_id'] });
                for (let elt of arr) delete elt['_id'];
            } catch (err) {

            }

            res.json({ data: arr });
        });
        APIRouter.get('/users/login/:user_login', async (req, res, next) => {
            let arr = null;

            try {
                arr = await this.GetDatapoints('users', { user_login: req.params['user_login'] });
                for (let elt of arr) delete elt['_id'];
            } catch (err) {

            }

            res.json({ data: arr });
        });

        //Streams
        APIRouter.get('/streams', async (req, res, next) => {
            let pagination = req.query['pagination'] || this.GetPaginationString(10, 0, { customsort: 'started_at' });
            let query = null;

            try {
                query = await this.GetDatapoints('streams', {}, pagination);
                for (let query_elt of query) delete query_elt['_id'];
            } catch (err) {

            }
            
            res.json(query);
        });
        APIRouter.get('/streams/:stream_id', async (req, res, next) => {
            let arr = null;

            try {
                arr = await this.GetDatapoints('streams', { stream_id: req.params['stream_id'] });
                for (let elt of arr) delete elt['_id'];
            } catch (err) {

            }

            res.json({ data: arr });
        });

        this.setAPIRouter(APIRouter);
        
        //STATIC FILE ROUTE
        let StaticRouter = express.Router();
        StaticRouter.use("/", (req, res, next) => {
            let url = req.url.split('?')[0].toLowerCase();

            if (url.startsWith('/streams/')) {
                res.sendFile(path.resolve(this.getMainPackageRoot() + this.getName() + '/html/stream.html'));
            } else {
                let page = this.HTMLFileExists(req.url);
                //Check if File/Dir is Present
                if (page != "") res.sendFile(page);
                else res.redirect("/Stats");
            }
        });
        super.setFileRouter(StaticRouter);

        //HTML Navigation
        this.setWebNavigation({
            name: "Stats",
            href: this.getHTMLROOT(),
            icon: PACKAGE_DETAILS.picture
        });
        
        //TCP
        this.TCP_Clients = [];
        this.LAST_MESSAGE_ACK = [];
        this.WebAppInteractor.AddTCPCallback('Stats', (ws, type, data) => this.TCPCallback(ws, type, data));

        //DataDir exists
        try {
            if (!fs.existsSync(path.resolve(cfg['Data_Dir']))) {
                fs.mkdirSync(path.resolve(cfg['Data_Dir']));
            }
        } catch (err) {
            this.Logger.error(err.message);
        }

        return this.reload();
    }
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));

        try {
            await this.updateStreamInformation();
        } catch (err) {

        }

        try {
            await this.updateThirdPartyEmotes();
        } catch (err) {

        }

        this.Logger.info("Stats (Re)Loaded!");
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

        for (let elt of this.TCP_Clients) {
            //Skip topics not requested
            if (topic !== 'settings' && elt.misc !== 'all' && elt.misc !== topic) continue;

            //Add ACK Checker when not already
            if (!this.LAST_MESSAGE_ACK.find(elt2 => elt2.ws === elt.ws))
                this.LAST_MESSAGE_ACK.push({ ws: elt.ws, origin: elt.origin, message: topic + ":" + JSON.stringify(data), ack: false, tries: 0 });

            //Send Data
            elt.ws.send(topic + ":" + JSON.stringify(data));
        }
    }

    async EVENTSUB_CALLBACK(body) {
        let type = body.subscription.type;

        //TEMP EVENT COLLECTION FOR LATER TRAINING / CHECKING
        let event_stats = JSON.parse(JSON.stringify(body.event || body.events));
        event_stats.type = "eventsub";
        event_stats.topic = type;

        try {
            await this.AddDatapoint('raw_events', event_stats);
        } catch (err) {
            console.log(err);
        }

        //TCP
        let cfg = this.Config.GetConfig();

        //TEMP TILL ERRRORS RESOLVED
        if (cfg['only_collect'] === true) return Promise.resolve();

        //GENERAL EVENT HANDLING
        try {
            if (type === 'channel.update') await this.Channel_Update(body.event);
            else if (type === 'stream.offline') await this.Channel_Offline(body.event);
        } catch (err) {

        }

        //Update Streamdata
        try {
            await this.updateStreamInformation();
        } catch (err) {
            return Promise.reject(err);
        }

        try {
            if (type === 'channel.follow') await this.Follow(body.event);
            else if (type === 'channel.subscribe') await this.Sub(body.event);
            else if (type === 'channel.subscription.gift') await this.GiftSub(body.event);
            else if (type === 'channel.subscription.message') await this.ReSub(body.event);
            else if (type === 'channel.cheer') await this.Cheer(body.event);
            else if (type === 'channel.raid') await this.Raid(body.event);
            else if (type === 'channel.ban') await this.Moderator_Ban(body.event);
            else if (type === 'channel.unban') await this.Moderator_Unban(body.event);
            else if (type === 'channel.moderator.add') await this.Moderator_Add(body.event);
            else if (type === 'channel.moderator.remove') await this.Moderator_Remove(body.event);
            else if (type === 'channel.channel_points_custom_reward_redemption.add') await this.ChannelPoint_Add(body.event);
            else if (type === 'channel.channel_points_custom_reward_redemption.update') await this.ChannelPoint_Update(body.event);
            else if (type === 'channel.poll.end') await this.Poll_End(body.event);
            else if (type === 'channel.prediction.end') await this.Prediction_End(body.event);
            else if (type === 'channel.hype_train.end') await this.HypeTrain_End(body.event);
            else if (type === 'stream.online') await this.Channel_Online(body.event);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async updateStreamInformation() {
        let streams;
        let channel = this.TwitchIRC.getChannel(true);
        
        //Get Streams
        try {
            streams = await this.TwitchAPI.GetStreams({ user_login: channel });
        } catch (err) {
            return Promise.reject(err);
        }

        if (!streams || !streams.data || streams.data.length > 0 && channel === streams.data[0].user_login) {
            this.CURRENT_STREAM_DATA = streams.data[0];
        } else {
            this.CURRENT_STREAM_DATA = null;
        }

        return Promise.resolve(this.CURRENT_STREAM_DATA);
    }
    async updateThirdPartyEmotes() {
        //FFZ
        try {
            this.CACHED_FFZ_ROOM = await FFZ.GetRoomByName(this.TwitchIRC.getChannel(true), true);
        } catch (err) {

        }

        //Get Room ID
        let room_id = null;
        try {
            room_id = (await this.TwitchAPI.GetUsers({ login: this.TwitchIRC.getChannel(true) }))[0].id;
        } catch (err) {

        }
        if (room_id === null) return Promise.resolve();

        //BTTV
        try {
            this.CACHED_BTTV_EMOTES = await BTTV.GetChannelEmotes(room_id, true);
        } catch (err) {

        }

        return Promise.resolve();
    }
    
    //////////////////////////////////////////////////////////////////////
    //                      DATASET INTERFACES
    //////////////////////////////////////////////////////////////////////

    GetDatasets() {
        return this.Datasets;
    }
    async AddDataset(name) {
        let dataset = this.Datasets.find(elt => elt.name === name);
        if (dataset) return Promise.reject(new Error('Dataset already found.'));

        this.Datasets.push({ name, datastore: new Datastore({ filename: this.GetDatabasePath(name), autoload: true }) });
        return Promise.resolve();
    }
    async RemoveDataset(name) {
        let idx = -1;
        this.Datasets.find((elt, index) => {
            if (elt.name === name) {
                idx = index;
                return true;
            }
            return false;
        });
        if (idx < 0) return Promise.reject(new Error('Dataset not found.'));

        try {
            fs.rmSync(this.GetDatabasePath(name));
        } catch (err) {
            return Promise.reject(err);
        }

        this.Datasets.slice(idx, 1);
        return Promise.resolve();
    }
    
    async GetDatapoints(set, query, pagination) {
        if (!query) return Promise.reject(new Error("Query not supplied"));
        let dataset = this.Datasets.find(elt => elt.name === set);
        if (!dataset) return Promise.reject(new Error('Dataset not found.'));
        
        return this.AccessNeDB(dataset.datastore, query, pagination);
    }
    async AddDatapoint(set, data = {}) {
        let dataset = this.Datasets.find(elt => elt.name === set);
        if (!dataset) return Promise.reject(new Error('Dataset not found.'));

        return new Promise((resolve, reject) => {
            dataset.datastore.insert(data, (err, newDoc) => {
                if (err) reject(new Error(err));
                else resolve(newDoc);
            });
        });
    }
    async UpdateDatapoint(set, query, opts = {}, data = {}) {
        let dataset = this.Datasets.find(elt => elt.name === set);
        if (!dataset) return Promise.reject(new Error('Dataset not found.'));

        //Save new Data
        return new Promise((resolve, reject) => {
            dataset.datastore.update(query, data, opts, (err, numReplaced) => {
                if (err) reject(new Error(err));
                else resolve(numReplaced);
            });
        });
    }
    async RemoveDatapoint(set, query, opts = {}) {
        let dataset = this.Datasets.find(elt => elt.name === set);
        if (!dataset) return Promise.reject(new Error('Dataset not found.'));

        //Save new Data
        return new Promise((resolve, reject) => {
            dataset.datastore.remove(query, opts, (err, numRemoved) => {
                if (err) reject(new Error(err));
                else resolve(numRemoved);
            });
        });
    }
    
    //////////////////////////////////////////////////////////////////////
    //                      Chat / EventSub Triggers
    //////////////////////////////////////////////////////////////////////

    async MessageEventHandler(channel, userstate, message, self) {
        let cfg = this.Config.GetConfig();
        if (!this.CURRENT_STREAM_DATA && cfg['debug'] === false) return Promise.resolve();

        let messageObj = new TWITCHIRC.Message(channel, userstate, message);
        
        if (self) {
            //MAYBE IN THE FUTURE BOT STATS ARE TRACKED TOO
            //await messageObj.ExtractTTVEmotes(this.TwitchAPI);
            return Promise.resolve();
        }
        
        /////////////////////////
        //    ANALYSE MESSAGE
        /////////////////////////

        let json = messageObj.toJSON();
        let message_stats = {
            'message_id': json['id'],
            'badge-info': json['badge-info'],
            'badges': json['badges'],
            'color': json['color'],
            'user_id': json['user-id'],
            'user_login': json['username'],
            'user_name': json['display-name'],
            'emotes_ttv': json['emotes'],
            'emotes_bttv': null,
            'emotes_ffz': null,
            'room-id': json['room-id'],
            'message': json['Message']
        };
        
        try {
            message_stats['emotes_bttv'] = await messageObj.getBTTVEmotes(this.CACHED_BTTV_EMOTES);
        } catch (err) {

        }

        try {
            message_stats['emotes_ffz'] = await messageObj.getFFZEmotes(this.CACHED_FFZ_ROOM);
        } catch (err) {

        }

        //Overpower FFZ Emotes over BTTV Emotes
        if (message_stats['emotes_ffz']) {
            for (let emote_code in message_stats['emotes_bttv']) {
                if (message_stats['emotes_ffz'][emote_code]) delete message_stats['emotes_bttv'][emote_code];
            }
        }

        //Update Message Stats
        try {
            await this.UpdateMessageStats(message_stats);
        } catch (err) {
            console.log(err);
        }

        return Promise.resolve();
    }
    async UpdateMessageStats(message_stats) {
        
        /////////////////////////
        //     UPDATE EMOTES
        /////////////////////////
        
        try {
            await this.UpdateEmoteDatapoint(message_stats);
        } catch (err) {

        }

        /////////////////////////
        //     UPDATE STREAM
        /////////////////////////
        if (this.CURRENT_STREAM_DATA) {
            //Analyse Stream Stats
            let stream_stats = this.GetBlankStream();
            stream_stats.stream_id = this.GetCurrentStreamID();
            stream_stats.messages = [message_stats];
            stream_stats.chatters = [{
                user_id: message_stats.user_id,
                user_login: message_stats.user_login,
                user_name: message_stats.user_name,
                count: 1
            }];

            let emote_list = this.AnalyseEmotes(message_stats);
            for (let emote of emote_list) delete emote['streams'];          //Dont need Streams in Streams
            stream_stats.emotes = emote_list;

            //Update or Create new Stream Datapoint
            try {
                await this.UpdateStreamDatapoint(stream_stats);
            } catch (err) {

            }
        }

        /////////////////////////
        //     UPDATE USER
        /////////////////////////
        
        let user_stats = this.GetBlankUser();
        user_stats.user_id = message_stats['user_id'];
        user_stats.user_login = message_stats['user_login'];
        user_stats.user_name = message_stats['user_name'];
        user_stats.badges = message_stats['badges'];
        user_stats.badge_info = message_stats['badge-info'];

        user_stats.message_count++;
        user_stats.messages = [{
            stream_id: this.GetCurrentStreamID(),
            count: 1,
            time: this.GetCurrentStreamTime()
        }];

        let emote_list = this.AnalyseEmotes(message_stats);
        for (let emote of emote_list) {
            user_stats.emote_count += emote.count;

            //Dont need Users in Users
            delete emote['users'];
        }
        
        user_stats.emotes = emote_list;

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateUserDatapoint(user_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }

    async CollectChatEvents(topic, keys = [], ...args) {
        let event_stats = {
            type: 'chat',
            topic: topic
        };

        for (let i = 0; i < args[0].length; i++) {
            event_stats[keys[i] || "idx-" + i] = args[0][i];
        }

        try {
            await this.AddDatapoint('raw_events', event_stats);
        } catch (err) {
            console.log(err);
        }
        
        //TCP
        let cfg = this.Config.GetConfig();
        if (!cfg.collected.find(elt => elt === topic)) {
            cfg.collected.push(topic);
            this.Config.UpdateConfig(cfg);
            this.SendWebSocketMessage(topic, event_stats);
        }
    }

    //Streams
    async Channel_Update(event) {
        let last_stream_data = this.CURRENT_STREAM_DATA;

        //Update Streamdata
        try {
            await this.updateStreamInformation();
        } catch (err) {
            return Promise.reject(err);
        }

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: event['category_id'] || null, name: event['category_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }
        
        //Analyse Current Game Stats
        let game_stats_cur = this.GetBlankGameStats();
        game_stats_cur.game_id = event['category_id'];
        game_stats_cur.game_name = event['category_name'];

        let game_stats_sub = this.GetBlankGame();
        game_stats_sub.stream_id = this.GetCurrentStreamID();
        game_stats_sub.start_time = Date.now();

        game_stats_cur.game_name = [game_stats_sub];
        
        let found_game_cur = null;

        try {
            found_game_cur = (await this.GetDatapoints('games', { game_id: game_stats_cur.game_id }))[0];
        } catch (err) {

        }

        //Update or Create new Stream Datapoint
        try {
            if (found_game_cur) {
                for (let stream of game_stats_cur.data) {
                    found_game_cur.data.push(stream);
                }

                await this.UpdateDatapoint('games', { game_id: game_stats_cur.game_id }, {}, found_game_cur);
            } else {
                await this.AddDatapoint('games', game_stats_cur);
            }
        } catch (err) {

        }

        //Update Prev Game when present
        if (!last_stream_data) return Promise.resolve();
        let found_game_prev = null;

        try {
            found_game_prev = (await this.GetDatapoints('games', { game_id: last_stream_data.game_id }))[0];
        } catch (err) {

        }

        if (!found_game_prev) return Promise.resolve();

        //Update or Create new Stream Datapoint
        try {
            let game_stream_stats = found_game_prev.data.find(elt => elt.stream_id === this.GetCurrentStreamID() && elt.end_time === null);
            if (!game_stream_stats) found_game_prev = this.GetBlankGame();
            
            game_stream_stats.stream_id = this.GetCurrentStreamID();
            game_stream_stats.end_time = Date.now();
            
            await this.UpdateDatapoint('games', { game_id: last_stream_data.game_id }, {}, found_game_prev);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Channel_Online(event) {
        //Analyse Stream Stats
        let stream_stats = this.AnalyseStreamStats(this.CURRENT_STREAM_DATA);

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        //Analyse Current Game Stats
        let game_stats = this.GetBlankGameStats();
        game_stats.game_id = this.CURRENT_STREAM_DATA['game_id'];
        game_stats.game_name = this.CURRENT_STREAM_DATA['game_name'];

        let game_stats_sub = this.GetBlankGame();
        game_stats_sub.stream_id = this.GetCurrentStreamID();
        game_stats_sub.start_time = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);

        game_stats.game_name = [game_stats_sub];
        
        let found_game = null;

        try {
            found_game = (await this.GetDatapoints('games', { game_id: game_stats.game_id }))[0];
        } catch (err) {

        }

        //Update or Create new Game Datapoint
        try {
            if (found_game) {
                for (let stream of game_stats.data) {
                    found_game.data.push(stream);
                }

                await this.UpdateDatapoint('games', { game_id: game_stats.game_id }, {}, found_game);
            } else {
                await this.AddDatapoint('games', game_stats);
            }
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Channel_Offline(event) {
        if (!this.CURRENT_STREAM_DATA) return Promise.resolve();

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.ended_at = Date.now();

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        //Analyse Current Game Stats
        let game_stats = this.GetBlankGameStats();
        game_stats.game_id = this.CURRENT_STREAM_DATA['game_id'];
        game_stats.game_name = this.CURRENT_STREAM_DATA['game_name'];

        let game_stats_sub = this.GetBlankGame();
        game_stats_sub.stream_id = this.GetCurrentStreamID();
        game_stats_sub.start_time = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);

        game_stats.game_name = [game_stats_sub];

        //End Game
        let found_game = null;

        try {
            found_game = (await this.GetDatapoints('games', { game_id: game_stats.game_id }))[0];
        } catch (err) {

        }

        //Update or Create new Game Datapoint
        try {
            let game_stream_stats = found_game.data.find(elt => elt.stream_id === this.GetCurrentStreamID() && elt.end_time === null);
            if (!game_stream_stats) found_game_prev = this.GetBlankGame();

            game_stream_stats.stream_id = this.GetCurrentStreamID();
            game_stream_stats.end_time = Date.now();
            
            await this.UpdateDatapoint('games', { game_id: found_game.game_id }, {}, found_game);
        } catch (err) {

        }
        
        this.CURRENT_STREAM_DATA = null;
    }
    
    //Moderator Actions
    async Moderator_Add(event) {
        //Update Moderator Actions Database
        let moderation_stats = {
            type: 'mod',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Moderation Datapoint
        try {
            await this.AddDatapoint('moderator_actions', moderation_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.moderations = [moderation_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Moderator_Remove(event) {
        //Update Moderator Actions Database
        let moderation_stats = {
            type: 'unmod',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Moderation Datapoint
        try {
            await this.AddDatapoint('moderator_actions', moderation_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.moderations = [moderation_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Moderator_Ban(event) {
        //Update Moderator Actions Database
        let moderation_stats = {
            type: event['is_permanent'] ? 'ban' : 'timeout',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            moderator_user_id: event['user_id'],
            moderator_user_login: event['user_login'],
            moderator_user_name: event['user_name'],
            reason: event['reason'],
            ends_at: event['ends_at'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Moderation Datapoint
        try {
            await this.AddDatapoint('moderator_actions', moderation_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.moderations = [moderation_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Moderator_Unban(event) {
        //Update Moderator Actions Database
        let moderation_stats = {
            type: 'unban',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            moderator_user_id: event['user_id'],
            moderator_user_login: event['user_login'],
            moderator_user_name: event['user_name'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Moderation Datapoint
        try {
            await this.AddDatapoint('moderator_actions', moderation_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.moderations = [moderation_stats];
        
        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }

    //Subs/Follows/Cheers/Raids/Hosts
    async Follow(event) {
        //Update Sub Actions Database
        let sub_stats = {
            type: 'follow',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            stream_id: this.GetCurrentStreamID(),
            time: this.DateToNumber(event['followed_at'])
        };

        //Create new Sub Actions Datapoint
        try {
            await this.AddDatapoint('channel_subscriptions', sub_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.subscriptions = [sub_stats];
        
        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Sub(event) {
        //Update Sub Actions Database
        let sub_stats = {
            type: 'sub',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            tier: event['tier'],
            is_gift: event['is_gift'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Sub Actions Datapoint
        try {
            await this.AddDatapoint('channel_subscriptions', sub_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.subscriptions = [sub_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async ReSub(event) {
        //Update Sub Actions Database
        let sub_stats = {
            type: 'resub',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            tier: event['tier'],
            message: event['message'],
            cumulative_months: event['cumulative_months'],
            streak_months: event['streak_months'],
            duration_months: event['duration_months'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Sub Actions Datapoint
        try {
            await this.AddDatapoint('channel_subscriptions', sub_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.subscriptions = [sub_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async GiftSub(event) {
        //Update Sub Actions Database
        let sub_stats = {
            type: 'giftsub',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            total: event['total'],
            tier: event['tier'],
            cumulative_months: event['cumulative_months'],
            is_anonymous: event['is_anonymous'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Sub Actions Datapoint
        try {
            await this.AddDatapoint('channel_subscriptions', sub_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.subscriptions = [sub_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Cheer(event) {
        //Update Sub Actions Database
        let sub_stats = {
            type: 'cheer',
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            bits: event['bits'],
            message: event['message'],
            is_anonymous: event['is_anonymous'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Sub Actions Datapoint
        try {
            await this.AddDatapoint('channel_subscriptions', sub_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.subscriptions = [sub_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Raid(event) {
        //Update Sub Actions Database
        let sub_stats = {
            type: 'raid',
            from_broadcaster_user_id: event['from_broadcaster_user_id'],
            from_broadcaster_user_login: event['from_broadcaster_user_login'],
            from_broadcaster_user_name: event['from_broadcaster_user_name'],
            viewers: event['viewers'],
            stream_id: this.GetCurrentStreamID(),
            time: Date.now()
        };

        //Create new Sub Actions Datapoint
        try {
            await this.AddDatapoint('channel_subscriptions', sub_stats);
        } catch (err) {

        }

        delete sub_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.subscriptions = [sub_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }

    //Channel Events
    async HypeTrain_End(event) {
        //Update Channel Event Database
        let event_stats = {
            type: 'hypetrain',
            id: event['id'],
            level: event['level'],
            total: event['total'],
            top_contributions: event['top_contributions'],
            started_at: event['started_at'],
            ended_at: event['ended_at'],
            cooldown_ends_at: event['cooldown_ends_at'],
            stream_id: this.GetCurrentStreamID()
        };

        //Create new Channel Event Datapoint
        try {
            await this.AddDatapoint('channel_events', event_stats);
        } catch (err) {

        }

        delete event_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.events = [event_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Prediction_End(event) {
        if (event['status'] === 'cancled') return Promise.resolve();

        //Update Channel Event Database
        let event_stats = {
            type: 'prediction',
            id: event['id'],
            title: event['title'],
            winning_outcome_id: event['winning_outcome_id'],
            outcomes: event['outcomes'],
            started_at: event['started_at'],
            ended_at: event['ended_at'],
            stream_id: this.GetCurrentStreamID()
        };

        //Create new Channel Event Datapoint
        try {
            await this.AddDatapoint('channel_events', event_stats);
        } catch (err) {

        }

        delete event_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.events = [event_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async Poll_End(event) {
        //Update Channel Event Database
        let event_stats = {
            type: 'poll',
            id: event['id'],
            title: event['title'],
            choices: event['choices'],
            bits_voting: event['bits_voting'],
            channel_points_voting: event['channel_points_voting'],
            started_at: event['started_at'],
            ended_at: event['ended_at'],
            stream_id: this.GetCurrentStreamID()
        };

        //Create new Channel Event Datapoint
        try {
            await this.AddDatapoint('channel_events', event_stats);
        } catch (err) {

        }

        delete event_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.events = [event_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async ChannelPoint_Add(event) {
        //Update Channel Event Database
        let event_stats = {
            type: 'channel_point_redeemed',
            id: event['id'],
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            user_input: event['user_input'],
            status: event['status'],
            reward: event['reward'],
            redeemed_at: this.DateToNumber(event['redeemed_at']),
            stream_id: this.GetCurrentStreamID()
        };

        //Create new Channel Event Datapoint
        try {
            await this.AddDatapoint('channel_events', event_stats);
        } catch (err) {

        }

        delete event_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);
        stream_stats.events = [event_stats];

        //Update or Create new Stream Datapoint
        try {
            await this.UpdateStreamDatapoint(stream_stats);
        } catch (err) {

        }

        return Promise.resolve();
    }
    async ChannelPoint_Update(event) {
        //Update Channel Event Database
        let event_stats = {
            type: 'channel_point_redeemed',
            id: event['id'],
            user_id: event['user_id'],
            user_login: event['user_login'],
            user_name: event['user_name'],
            user_input: event['user_input'],
            status: event['status'],
            reward: event['reward'],
            redeemed_at: this.DateToNumber(event['redeemed_at']),
            stream_id: this.GetCurrentStreamID()
        };

        //Find Current Stream Datapoint
        let found_event = null;

        try {
            found_event = (await this.GetDatapoints('channel_events', { type: event_stats['type'], id: event['id'] }))[0];
        } catch (err) {

        }

        //Create new Channel Event Datapoint
        try {
            if (found_event) {
                found_event.status = event['status'];
                await this.UpdateDatapoint('channel_events', { type: event_stats['type'], id: event['id'] }, {}, found_event);
            }
            else await this.AddDatapoint('channel_events', event_stats);
        } catch (err) {

        }

        delete event_stats.stream_id;

        //Analyse Stream Stats
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = this.CURRENT_STREAM_DATA['id'];
        stream_stats.games = [{ id: this.CURRENT_STREAM_DATA['game_id'] || null, name: this.CURRENT_STREAM_DATA['game_name'] || null, time: Date.now() }];
        stream_stats.raw_viewers = [{ value: this.CURRENT_STREAM_DATA['viewer_count'], time: Date.now() }];
        stream_stats.started_at = this.DateToNumber(this.CURRENT_STREAM_DATA['started_at']);

        //Update or Create new Stream Datapoint
        //Find Current Stream Datapoint
        let found_stream = null;

        try {
            found_stream = (await this.GetDatapoints('streams', { stream_id: stream_stats['stream_id'] }))[0];
        } catch (err) {

        }

        //Update or Create new Stream Datapoint
        try {
            if (found_stream) {

                let found_event_stat = found_stream.events.find(elt => elt.type === event_stats['type'] && elt.id === event_stats['id']);
                if (found_event_stat) found_event_stat.status = event['status'];
                else stream_stats.events = [event_stats];

                this.UpdateStreamStats(found_stream, stream_stats);
                
                await this.UpdateDatapoint('streams', { stream_id: stream_stats['stream_id'] }, {}, found_stream);
            } else {
                stream_stats.events = [event_stats];
                await this.AddDatapoint('streams', stream_stats);
            }
        } catch (err) {

        }

        return Promise.resolve();
    }
    
    //////////////////////////////////////////////////////////////////////
    //                      Analyse/Update Stats
    //////////////////////////////////////////////////////////////////////

    AnalyseStreamStats(stream_data) {
        let stream_stats = this.GetBlankStream();
        stream_stats.stream_id = stream_data['id'];
        stream_stats.titles = [{ name: stream_data['title'], time: this.DateToNumber(stream_data['started_at']) }];
        stream_stats.games = [{ id: stream_data['game_id'] || null, name: stream_data['game_name'] || null, time: this.DateToNumber(stream_data['started_at']) }];
        stream_stats.raw_viewers = [{ value: stream_data['viewer_count'], time: this.DateToNumber(stream_data['started_at']) }];
        stream_stats.started_at = this.DateToNumber(stream_data['started_at']);
        return stream_stats;
    }
    async UpdateStreamDatapoint(stream_stats) {
        //Find Current Stream Datapoint
        let found_stream = null;

        try {
            found_stream = (await this.GetDatapoints('streams', { stream_id: stream_stats['stream_id'] }))[0];
        } catch (err) {

        }

        //Update or Create new Stream Datapoint
        try {
            if (found_stream) {
                this.UpdateStreamStats(found_stream, stream_stats);

                await this.UpdateDatapoint('streams', { stream_id: stream_stats['stream_id'] }, {}, found_stream);
            } else {
                await this.AddDatapoint('streams', stream_stats);
            }
        } catch (err) {

        }
    }
    UpdateStreamStats(found_stream, stream_stats) {
        found_stream.titles.concat(stream_stats.titles);
        found_stream.games.concat(stream_stats.games);
        found_stream.total_viewers.concat(stream_stats.total_viewers);
        found_stream.raw_viewers.concat(stream_stats.raw_viewers);
        found_stream.moderations.concat(stream_stats.moderations);
        found_stream.subscriptions.concat(stream_stats.subscriptions);
        found_stream.events.concat(stream_stats.events);
        found_stream.messages.concat(stream_stats.messages);

        //Update Emotes
        for (let emote of stream_stats.emotes) {
            let found_emote = found_stream.emotes.find(elt => elt.emote_id === emote.emote_id);

            if (found_emote) {
                found_emote.count += emote.count;

                //Update Stream
                for (let stream of emote.streams) {
                    let found_stream = found_emote.streams.find(elt => elt.stream_id === stream.stream_id);

                    if (found_stream) found_stream.count += stream.count;
                    else found_emote.streams.push(stream);
                }
            } else found_stream.emotes.push(emote);
        }
        
        if (stream_stats.ended_at) found_stream.ended_at = stream_stats.ended_at;
    }

    AnalyseEmotes(message_stats) {
        let emote_stats_list = [];
        const message = message_stats.message || "";
        const emote_groupes = {
            'ttv': message_stats['emotes_ttv'] || {},
            'ffz': message_stats['emotes_ffz'] || {},
            'bttv': message_stats['emotes_bttv'] || {}
        };

        //Analyse Emote Stats of all Groups
        for (let group in emote_groupes) {
            for (let emote_code in emote_groupes[group]) {
                let splitted = emote_groupes[group][emote_code][0].split("-");
                let name = message.substring(parseInt(splitted[0]), parseInt(splitted[1]) + 1) || null;
                let count = emote_groupes[group][emote_code].length;

                let stream_simple_stats = {
                    stream_id: this.GetCurrentStreamID(),
                    count: count,
                    started_at: this.GetCurrentStreamTime()
                };

                let user_simple_stats = {
                    user_id: message_stats['user_id'],
                    user_login: message_stats['user_login'],
                    user_name: message_stats['user_name'],
                    count: count
                };

                let emote_stats = {
                    type: group,
                    emote_id: emote_code,
                    emote_name: name,
                    count: count,
                    users: [user_simple_stats],
                    streams: [stream_simple_stats]
                };

                emote_stats_list.push(emote_stats);
            }
        }
        
        //Remove BTTV Emotes already in FFZ Emotes
        for (let i = 0; i < emote_stats_list.length; i++) {
            if (!emote_stats_list[i]) break;
            if (emote_stats_list[i].type !== 'bttv') continue;
            if (emote_stats_list.find(elt => elt.type === 'ffz' && elt.emote_name === emote_stats_list[i].emote_name)) {
                emote_stats_list.splice(i, 1);
            }
        }

        return emote_stats_list;
    }
    async UpdateEmoteDatapoint(message_stats) {
        let emote_stats_list = this.AnalyseEmotes(message_stats);

        //Update Emote Datapoints
        for (let emote_stat of emote_stats_list) {
            //Find Current Emote Datapoint
            let found_emote = null;

            try {
                found_emote = (await this.GetDatapoints('emotes', { type: emote_stat['type'], emote_id: emote_stat['emote_id'] }))[0];
            } catch (err) {

            }

            //Update or Create new Emote Datapoint
            try {
                if (found_emote) {
                    this.UpdateEmoteStats(found_emote, emote_stat);
                    await this.UpdateDatapoint('emotes', { type: emote_stat['type'], emote_id: emote_stat['emote_id'] }, {}, found_emote);
                } else {
                    await this.AddDatapoint('emotes', emote_stat);
                }
            } catch (err) {

            }
        }

        return Promise.resolve();
    }
    UpdateEmoteStats(found_emote, emote_stats) {
        found_emote.count += emote_stats.count;

        //Update Users
        for (let user of emote_stats.users) {
            let found_user = found_emote.users.find(elt => elt.user_id === user.user_id);

            if (found_user) found_user.count += user.count;
            else found_emote.users.push(user);
        }

        //Update Stream
        for (let stream of emote_stats.streams) {
            let found_stream = found_emote.streams.find(elt => elt.stream_id === stream.stream_id);

            if (found_stream) found_stream.count += stream.count;
            else found_emote.users.push(stream);
        }
    }

    async UpdateUserDatapoint(user_stats) {
        //Find Current User Datapoint
        let found_user = null;

        try {
            found_user = (await this.GetDatapoints('users', { user_id: user_stats['user_id'] }))[0];
        } catch (err) {

        }

        //Update or Create new User Datapoint
        try {
            if (found_user) {
                this.UpdateUserStats(found_user, user_stats);
                await this.UpdateDatapoint('users', { user_id: user_stats['user_id'] }, {}, found_user);
            } else {
                await this.AddDatapoint('users', user_stats);
            }
        } catch (err) {

        }

        return Promise.resolve();
    }
    UpdateUserStats(found_user, user_stats) {
        found_user.message_count += user_stats.message_count;

        //Transfer Messages
        for (let stream of user_stats.messages) {
            let found_stream = found_user.messages.find(elt => elt.stream_id === stream.stream_id);

            if (found_stream) found_stream.count += stream.count;
            else found_user.messages.push(stream);
        }

        found_user.emote_count += user_stats.emote_count;
        //Transfer Emotes
        for (let emote of user_stats.emotes) {
            let found_emote = found_user.emotes.find(elt => elt.emote_id === emote.emote_id);

            if (found_emote) {
                found_emote.count += emote.count;

                //Update Stream
                for (let stream of emote.streams) {
                    let found_stream = found_emote.streams.find(elt => elt.stream_id === stream.stream_id);

                    if (found_stream) found_stream.count += stream.count;
                    else found_emote.streams.push(stream);
                }
            }
            else found_user.emotes.push(emote);
        }

        //Update Badges
        found_user.badges = user_stats.badges;
        found_user.badge_info = user_stats.badge_info;
    }

    //////////////////////////////////////////////////////////////////////
    //                          Blank Stats
    //////////////////////////////////////////////////////////////////////

    GetBlankStream() {
        return {
            stream_id: null,
            type: "live",
            titles: [],
            games: [],
            subscriptions: [],
            events: [],
            chatters: [],
            moderations: [],
            messages: [],
            emotes: [],
            total_viewers: [],
            raw_viewers: [],
            started_at: null,
            ended_at: null
        };
    }
    GetBlankSimpleStream() {
        return {
            stream_id: null,
            count: 0,
            time: null
        };
    }
    
    GetBlankGameStats() {
        return {
            game_id: null,
            game_name: null,
            data: []
        };
    }
    GetBlankGame() {
        return {
            stream_id: null,
            game_id: null,
            game_name: null,
            start_time: null,
            end_time: null
        };
    }
    
    GetBlankUser() {
        return {
            user_id: null,
            user_login: null,
            user_name: null,
            badges: [],
            badge_info: [],
            message_count: 0,
            messages: [],
            emote_count: 0,
            emotes: []
        };
    }
    
    //UTIL
    GetDatabasePath(name) {
        let cfg = this.Config.GetConfig();
        return path.resolve(cfg['Data_Dir'] + name + '.db');
    }
    GetCurrentStreamID() {
        if (this.CURRENT_STREAM_DATA) return this.CURRENT_STREAM_DATA.id;
        return null;
    }
    GetCurrentStreamTime() {
        if (this.CURRENT_STREAM_DATA) return this.DateToNumber(this.CURRENT_STREAM_DATA.started_at);
        return null;
    }
    CompareTimes(a, b, rel = 10) {
        return Math.abs(a / 1000 - b / 1000) > rel * 1000;
    }
    DateToNumber(date_string = "") {
        try {
            return (new Date(date_string)).getTime();
        } catch (err) {
            return null;
        }
    }
}

module.exports.Stats = Stats;