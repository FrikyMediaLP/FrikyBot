const CONFIGHANDLER = require('./../Util/ConfigHandler.js');

const fs = require('fs');
const path = require('path');
const FrikyDB = require('./../Util/FrikyDB.js');

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const HTTP = require('http');
const Websocket = require('ws');

const API_TREE_DEPTH = 12;
const WS_REGISTER_TEMPLATE = "{origin}{topic}{misc}";

const MODULE_DETAILS = {
    name: 'WebApp',
    description: 'Controlling Website access and Interfaces to Packages/Modules and APIs.',
    picture: '/images/icons/wifi-solid.svg',
    version: '0.4.0.0',
    server: '0.4.0.0'
};

class WebApp extends require('./../Util/ModuleBase.js') {
    constructor(configJSON, logger, WebAppInteractor) {
        super(MODULE_DETAILS, configJSON, logger);

        this.Config.AddSettingTemplates([
            { name: 'Hostname', type: 'string', default: 'localhost', group: 0 },
            { name: 'Port', type: 'number', range: '0:99999', default: 8080, group: 0 },
            { name: 'upload_limit', type: 'string', default: '3mb', group: 0 },
            { name: 'selected_Authenticator', type: 'string' },
            { name: 'enable_api', type: 'boolean', default: true },
            { name: 'Authenticator', type: 'config', requiered: true, group: 1 },
            { name: 'Log_Dir', type: 'string', default: 'Logs/' + MODULE_DETAILS.name + '/' },
            { name: 'use_legacy_server', type: 'boolean', default: false },
            { name: 'tcp_pinging_interval', type: 'number', default: 5 }
        ]);
        this.Config.options = {
            groups: [{ name: 'WebApp' }, { name: 'Authenticator' }]
        };
        this.Config.Load();
        this.Config.FillConfig();
        
        //Express App
        this.app;
        this.BODY_PARSER = {
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        };
        this.Installed_Authenticators = [];
        this.Authenticator;
        if (WebAppInteractor) this.WebAppInteractor = WebAppInteractor;

        //TCP Server
        this.server;
        this.TCP_WEBSOCKETS = [];
        this.TCP_PINGING_INTERVAL = null;

        //logging
        this.AUTH_LOG;
        this.Settings_LOG;

        //Controllables
        this.addControllables([
            { name: 'restart', title: 'Restart WebServer', callback: async (user) => this.Controllable_Restart() },
            { name: 'stop', title: 'Stop WebServer', callback: async (user) => this.Controllable_Stop() },
            { name: 'ping', title: 'Force Ping', callback: async (user) => this.WS_ping() },
            { name: '_temp_clearErrorLog', title: 'Clear Error Log', callback: () => 'cleared' }
        ]);

        //Displayables
        this.addDisplayables([
            { name: 'API Status', value: () => this.Config.GetConfig()['enable_api'] !== false ? 'ONLINE' : 'OFFLINE' },
            { name: 'Authenticator', value: () => this.Authenticator ? this.Authenticator.GetName() : 'NONE' },
            { name: 'Authenticator Status', value: () => this.Authenticator && this.Authenticator.isReady() ? 'ONLINE' : 'OFFLINE' },
            { name: 'Total Main Route Calls', value: () => this.WebAppInteractor.STAT_MAIN_CALLS },
            { name: 'Main Route Calls per 10 Min', value: () => this.WebAppInteractor.STAT_MAIN_CALLS_PER_10 },
            { name: 'Total File Route Calls', value: () => this.WebAppInteractor.STAT_FILE_CALLS },
            { name: 'File Route Calls per 10 Min', value: () => this.WebAppInteractor.STAT_FILE_CALLS_PER_10 },
            { name: 'Total API Route Calls', value: () => this.WebAppInteractor.STAT_API_CALLS },
            { name: 'API Route Calls per 10 Min', value: () => this.WebAppInteractor.STAT_API_CALLS_PER_10 },
            { name: 'Total Authentications', value: () => this.WebAppInteractor.STAT_API_CALLS },
            { name: 'Authentications per 10 Min', value: () => this.WebAppInteractor.STAT_API_CALLS_PER_10 },
            { name: 'TCP Client', value: () => this.TCP_WEBSOCKETS.length }
        ]);
    }

    async Init() {
        let cfg = this.Config.GetConfig();

        //Express App Setup
        this.app = express();
        this.BODY_PARSER.limit = cfg['upload_limit'] || '3mb';
        this.app.use(bodyParser.json(this.BODY_PARSER));

        //WebSocketServer Stuff
        this.server;
        this.WSServer;

        if (!cfg['use_legacy_server']) {
            this.server = HTTP.createServer(this.app);
            this.WSServer = new Websocket.Server({ server: this.server });
            this.WSServer.on('connection', (ws, request) => {
                let client = { socket: ws, ping: 0, pong: 0, topic: null };
                this.TCP_WEBSOCKETS.push(client);

                let topic = null;

                ws.send("register:" + WS_REGISTER_TEMPLATE);
                ws.on('message', message => {

                    if (message.toString() === 'pong') {
                        client.pong = Date.now();
                        return;
                    }

                    let type = message.toString().split(":")[0];
                    let data = message.toString().split(":").slice(1).join(":");

                    if (type === 'register') {
                        try {
                            let json = JSON.parse(data);
                            topic = json.topic;
                            client.topic = topic;
                        } catch (err) {

                        }
                    }

                    this.WebAppInteractor.SendTCPMessage(topic, ws, message)
                });
            });

            this.Logger.info("Using WebSocket Server.");
        } else {
            this.Logger.info("Using Legacy Server.");
        }
        
        //File Structure Check
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

        //Init Logging Database
        this.AUTH_LOG = new FrikyDB.Collection({ path: path.resolve(cfg.Log_Dir + 'Auth_Log.db') });
        this.Settings_LOG = new FrikyDB.Collection({ path: path.resolve(cfg.Log_Dir + 'Settings_Logs.db') });

        this.addLog('Authentications', this.AUTH_LOG);
        this.addLog('Settings Changes', this.Settings_LOG);
        
        //WebAppInteractor
        if (!this.WebAppInteractor) this.setupWAI();

        return Promise.resolve();
    }
    setupWAI() {
        //Routers
        this.MAIN_ROUTER = express.Router();
        this.FILE_ROUTER = express.Router();
        this.API_ROUTER = express.Router();
        
        //WebInteractor
        this.WebAppInteractor = new WebAppInteractor(this.MAIN_ROUTER, this.FILE_ROUTER, this.API_ROUTER, this.Authenticator, this.Logger, this.AUTH_LOG);

        //Apply Routing
        this.app.use(this.WebAppInteractor.MAIN_ROUTER);
        this.app.use((req, res, next) => this.BetterFileFinder('public', ['.html', '.htm', 'index.html'], req, res, next));
        this.app.use(this.WebAppInteractor.FILE_ROUTER);
        this.app.use("/api", (req, res, next) => { if (this.Config.GetConfig()['enable_api'] === false) return res.sendStatus(503); else next(); }, this.WebAppInteractor.API_ROUTER);

        //Add Basic API
        this.WebAppInteractor.addMainRoute(async (req, res, next) => {
            //Rediect .../test/ to .../test
            if (req.originalUrl !== "/" && req.originalUrl.charAt(req.originalUrl.length - 1) == "/") {
                res.redirect(req.originalUrl.substring(0, req.originalUrl.length - 1));
                return Promise.resolve();
            }
            
            //Add User Information
            try {
                let user = await this.WebAppInteractor.AuthenticateUser(req.headers);
                res.locals.user = user;
            } catch (err) {

            }
            
            //Check other Routers
            try {
                next();
            } catch (err) {
                Logger.server.error(err.message);
            }
        });
        this.WebAppInteractor.addAPIEndpoint('/identify', 'GET', (req, res) => {
            return res.json({ identity: this.GetName() });
        });
        this.WebAppInteractor.addAPIEndpoint('/login/user', 'GET', (req, res) => {
            return res.json({ user: res.locals.user });
        });
        
        //WebApp Settings API
        this.WebAppInteractor.addAuthAPIEndpoint('/settings/webapp/hostname', { user_level: 'admin' }, 'POST', async (req, res) => {
            if (!req.body.hostname) {
                res.json({ err: 'Hostname nof valid' });
                return Promise.resolve();
            }

            let errors = this.Config.UpdateSetting('Hostname', req.body.hostname);

            if (errors !== true) {
                res.json({ err: 'Changing Hostname failed: ' + errors[0] });
                return Promise.resolve();
            }

            this.WebAppInteractor.SetHostname(req.body.hostname);
            
            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/webapp/hostname',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
            }

            res.sendStatus(200);
            return Promise.resolve();
        });
        this.WebAppInteractor.addAuthAPIEndpoint('/settings/webapp/port', { user_level: 'admin' }, 'POST', async (req, res) => {
            try {
                if (!req.body.port || isNaN(req.body.port) || req.body.port < 0 || req.body.port > 9999) {
                    res.json({ err: 'Port is not a valid number' });
                    return Promise.resolve();
                }

                let errors = this.Config.UpdateSetting('Port', req.body.port);

                if (errors !== true) {
                    res.json({ err: 'Changing Port failed: ' + errors[0] });
                    return Promise.resolve();
                }

                this.WebAppInteractor.SetPort(req.body.port);

                res.json({ msg: '200', port: req.body.port });
                await this.Restart();
            } catch (err) {
                res.json({ err: 'restart failed' });
            }
            
            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/webapp/port',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
            }
            
            return Promise.resolve();
        });
        this.WebAppInteractor.addAuthAPIEndpoint('/settings/webapp/upload_limit', { user_level: 'admin' }, 'PUT', async (req, res) => {

            if (!req.body.upload_limit) {
                res.json({ err: 'Limit nof valid' });
                return Promise.resolve();
            }
            let errors = this.Config.UpdateSetting('upload_limit', req.body.upload_limit);

            if (errors !== true) {
                res.json({ err: 'Changing Limit: ' + errors[0] });
                return Promise.resolve();
            }

            this.WebAppInteractor._upload_limit = req.body.upload_limit;
            this.BODY_PARSER.limit = req.body.upload_limit;
            this.Logger.warn("Updated Upload Limit to " + req.body.upload_limit.toUpperCase() + "! This requieres a manuell restart!!!");
            res.json({ msg: '200', upload_limit: req.body.upload_limit });
            
            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/webapp/upload_limit',
                    method: 'PUT',
                    body: req.body,
                    time: Date.now()
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
            }

            return Promise.resolve();
        });
        this.WebAppInteractor.addAuthAPIEndpoint('/settings/webapp/authenticator', { user_level: 'admin' }, 'PUT', (req, res) => {
            let find = this.Installed_Authenticators.find(elt => elt.GetName() === req.body.authenticator);
            if (!find) return res.json({ err: 'authenticator not found' });
            if (!find.isEnabled() || !find.isReady()) return res.json({ err: 'Authenticators not enabled or not ready' });

            let result = this.switchAuthenticator(req.body.authenticator);
            if (result !== true) return res.json({ err: 'switching Authenticators failed' });

            this.Config.UpdateSetting('selected_Authenticator', this.Authenticator.GetName());

            //Logging
            if (this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/webapp/authenticator',
                    method: 'POST',
                    body: req.body,
                    time: Date.now()
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
            }

            return res.json({ code: 200, msg: 'Authenticator switched to' + this.Authenticator.GetName() });
        });
        this.WebAppInteractor.addAuthAPIEndpoint('/settings/webapp/api', { user_level: 'admin' }, 'GET', (req, res) => {
            let errors = this.Config.UpdateSetting('enable_api', this.Config.GetConfig()['enable_api'] === false);
            
            //Logging
            if (errors === true && this.Settings_LOG) {
                this.Settings_LOG.insert({
                    endpoint: '/api/settings/webapp/api',
                    method: 'GET',
                    body: req.body,
                    time: Date.now()
                }).catch(err => this.Logger.warn("Settings Logging: " + err.message));
            }

            if (errors !== true) return res.json({ err: 'API Enable Toggle failed.' });
            else return res.json({ new_displayables: this.GetDisplayables() });
        });
        
        //NO ENDPOINT FOUND
        this.app.all('/api/*', (req, res, next) => res.json({ err: "404 - API Endpoint not found" }));
        //NO FILE FOUND
        this.app.use((req, res, next) => res.status(404).sendFile(path.resolve('public/NotFound.html')));

        //UTIL
        let cfg = this.Config.GetConfig();
        this.WebAppInteractor.SetHostname(cfg.Hostname);
        this.WebAppInteractor.SetPort(cfg.Port);
        this.WebAppInteractor._upload_limit = cfg['upload_limit'];
    }
    async StartServer() {
        let cfg = this.Config.GetConfig();

        if (cfg['use_legacy_server']) return this.StartServerLEGACY();

        this.Logger.warn('Server starting ...');

        return new Promise((resolve, reject) => {
            this.server.listen(cfg.Port, () => {
                this.startTCPPinging();

                let address = this.server.address();
                this.Logger.info("FrikyBot Website online at " + (address.address === '::' ? 'localhost' : address.address) + ":" + address.port + " ...");
                return resolve();
            });
        });
    }
    async StartServerLEGACY() {
        let cfg = this.Config.GetConfig();
        this.Logger.warn('Server starting ...');

        return new Promise((resolve, reject) => {
            this.server = this.app.listen(cfg.Port, () => {
                let address = this.server.address();
                this.Logger.info("FrikyBot Website online at " + (address.address === '::' ? 'localhost' : address.address) + ":" + address.port + " ...");
                resolve();
            });
        });
    }
    async StopServer() {
        if (!this.server) return Promise.resolve();

        this.Logger.warn('Server shutting down...');
        this.stopTCPPinging();

        return new Promise((resolve, reject) => {
            this.server.close(() => {
                this.Logger.warn('Server was shutdown!');
                return resolve();
            });
        });
    }
    async Restart() {
        //Keep Alive
        let KEEP_ALIVE_INTERVAL = setInterval((x) => x, 1000 * 60);

        //Stop
        try {
            await this.StopServer();
        } catch (err) {
            return Promise.reject(err);
        }

        //Start
        try {
            await this.StartServer();
        } catch (err) {
            return Promise.reject(err);
        } finally {
            clearInterval(KEEP_ALIVE_INTERVAL);
        }

        return Promise.resolve();
    }

    startTCPPinging() {
        let cfg = this.Config.GetConfig();

        if (!this.TCP_PINGING_INTERVAL) {
            this.TCP_PINGING_INTERVAL = setInterval(() => {
                this.WS_ping();
            }, cfg['tcp_pinging_interval'] * 60 * 1000);
        }
    }
    stopTCPPinging() {
        if (this.TCP_PINGING_INTERVAL) {
            clearInterval(this.TCP_PINGING_INTERVAL);
        }
    }
    
    addAuthenticator(authenticator) {
        this.Installed_Authenticators.push(authenticator);
    }

    switchAuthenticator(name) {
        let find = this.Installed_Authenticators.find(elt => elt.GetName() === name);
        if (!find || !find.isEnabled() || !find.isReady()) return false;

        this.setAuthenticator(find);
        return true;
    }
    autoSetAuthenticator() {
        let auth = this.Installed_Authenticators.find(elt => elt.GetName() === this.Config.GetConfig()['selected_Authenticator']);
        
        if (auth && auth.isEnabled() && auth.isReady()) this.setAuthenticator(auth);
        else {
            for (let avail_auth of this.Installed_Authenticators) {
                if (avail_auth.isEnabled() && avail_auth.isReady()) {
                    this.setAuthenticator(avail_auth);
                    break;
                }
            }
        }

        if (!this.Authenticator) this.Logger.error("NO Authenticator could be started...");
    }
    setAuthenticator(authenticator) {
        if (this.Authenticator) {
            this.Authenticator.setActive(false);
        }

        this.Authenticator = authenticator;
        this.WebAppInteractor.Authenticator = authenticator;
        authenticator.setActive(true);
        this.Config.UpdateSetting('selected_Authenticator', authenticator.GetName());

        this.Logger.warn("New Authenticator in use: " + authenticator.GetName());
    }
    unsetAuthenticator() {
        if (!this.Authenticator) return;

        this.Authenticator.setActive(false);
        this.Config.UpdateSetting('selected_Authenticator', "");

        this.Logger.warn("No Authenticator in use!");
    }

    //Controllables
    async Controllable_Restart() {
        if (!this.isEnabled()) return Promise.reject(new Error('WebApp is disabled'));

        try {
            this.Restart();
        } catch (err) {
            this.Logger.error("Restarting Server failed: " + err.message);
        }

        return Promise.resolve("Restarting Server");
    }
    async Controllable_Stop() {
        if (!this.isEnabled()) return Promise.reject(new Error('WebApp is disabled'));

        try {
            this.StopServer();
        } catch (err) {
            this.Logger.error("Stopping Server failed: " + err.message);
        }

        return Promise.resolve("Stopping Server");
    }

    //TCP
    WS_ping() {
        try {
            let cfg = this.Config.GetConfig();

            for (let i = 0; i < this.TCP_WEBSOCKETS.length; i++) {
                let client = this.TCP_WEBSOCKETS[i];

                if (client.ping > client.pong + cfg['tcp_pinging_interval'] * 1.5 * 60 * 1000) {
                    client.socket.send("terminated:ping_timeout");
                    this.WebAppInteractor.SendTCPMessage(client.topic, client.socket, "terminated:ping_timeout");
                    client.socket.terminate();
                    this.TCP_WEBSOCKETS.splice(i, 1);
                }

                client.ping = Date.now();
                client.socket.send("ping");
            }
        } catch (err) {
            console.log(err);
        }
    }

    //Routing Structure
    API_ANALYSE(layer, type = "handle", iter = 100, allow_cleanup = false) {
        let obj = [];

        if (layer[type].stack) {
            for (let sub_layer of layer[type].stack) {
                if (iter < 0) break;

                let splitted = sub_layer.regexp.toString().split('\\/');
                let cutted_regex;

                if (splitted.length > 2 && splitted[1].charAt(0) !== "?") {
                    cutted_regex = "/" + splitted[1];
                }

                let method = "";

                if (type === 'route') {
                    for (let meth in layer.route.methods) {
                        method = meth;
                    }
                }

                let name = (sub_layer.name !== "<anonymous>" && sub_layer.name !== "bound dispatch" ? sub_layer.name + "" : (sub_layer.name == "bound dispatch" ? sub_layer.route.path : (cutted_regex ? cutted_regex + "" : '')));

                if (name === 'router' && sub_layer.path) {
                    name = sub_layer.path;
                }

                let new_layer = {};

                if (method) {
                    new_layer = {
                        name: method,
                        stack: 'METHOD'
                    };
                } else {
                    new_layer = {
                        name: name,
                        stack: API_ANALYSE(sub_layer, sub_layer.route ? 'route' : 'handle', iter - 1)
                    };
                }

                if (name === 'router' && new_layer.stack.length > 0) {
                    for (let new_sub_layer of new_layer.stack) {
                        obj.push(new_sub_layer);
                    }
                } else {
                    obj.push(new_layer);
                }
            }

            //Cleanup
            let found = 0;
            while (allow_cleanup && found >= 0) {
                found = -1;

                for (let i = 0; i < obj.length; i++) {
                    if (obj[i].name === "" || obj[i].stack.length == 0) {
                        obj.splice(i, 1);
                        found = i;
                        break;
                    }

                    if (obj[i].stack === "END" || obj[i].stack === "METHOD") {
                        break;
                    }

                    for (let j = 0; j < obj[i].stack.length; j++) {
                        if (obj[i].stack.find((elt, idx) => {
                            if (elt.name === obj[i].stack[j].name && elt.stack === obj[i].stack[j].stack && idx !== j) {

                                found = idx;
                                return true;
                            }

                            return false;
                        })) break;

                    }

                    if (found < 0 && obj[i].stack.find((elt, idx) => {
                        if (elt.name === "") {

                            found = idx;
                            return true;
                        }

                        return false;
                    }));

                    if (found >= 0)
                        obj[i].stack.splice(found, 1);
                }
            }
        } else {
            obj = 'END';
        }

        return obj;
    }

    API_TREE_STACK(stack, step = 0) {
        let data = [];
        let anonym = 0;
        
        if (stack && step < API_TREE_DEPTH) {
            for (let layer of stack) {
                if (layer.name === 'router') {
                    data.push(this.API_TREE_R(layer, step + 1));
                } else if (layer.name === '<anonymous>') {
                    anonym++;
                } else if (layer.name === 'bound dispatch') {
                    data.push(this.API_TREE_D(layer, step + 1));
                } else {
                    data.push({ name: layer.name, type: 'function' });
                }
            }
        }

        if (anonym > 0) data.push({ type: 'anonymous function', anonym_count: anonym });

        return data;
    }
    API_TREE_R(router, step = 0) {
        let stack = router.stack || (router.handle && router.handle.stack);
        
        let regex = router.regexp && router.regexp.toString().substring(3, router.regexp.toString().length - 13);
        if (regex) regex = this.replaceAll(regex, '\\', '');

        return { mount: router.path || regex || '', layers: this.API_TREE_STACK(stack, step), type: 'router' };
    }
    API_TREE_D(dispatch, step = 0) {
        let stack = dispatch.route.stack;
        
        return { mount: dispatch.route.path, layers: this.API_TREE_STACK(stack, step), methods: dispatch.route.methods, type: 'bound dispatch' };
    }

    API_TREE_SIMPLYFIY(api_analysis = {}) {
        let json = JSON.parse(JSON.stringify(api_analysis));
        return { mount: json.mount || "", tree: this.API_TREE_GENERATE(this.API_TREE_SIMPLYFIY_LAYERS(json.layers)), type: json.type };
    }
    API_TREE_SIMPLYFIY_LAYERS(root_layers, mount = "") {
        if (!root_layers || root_layers.length === 0) return [];

        let layers = [];
    
        for (let layer of root_layers) {
            if (layer.layers) {
                for (let subLay of this.API_TREE_SIMPLYFIY_LAYERS(layer.layers, layer.mount)) {
                    subLay.mount = mount + (subLay.mount || "");
                    subLay.methods = layer.methods;
                    layers.push(subLay);
                }
            } else {
                layer.mount = mount + (layer.mount || "");
                layers.push(layer);
            }
        }
        
        return layers;
    }
    API_TREE_GENERATE(endpoint_group = []) {
        if (endpoint_group.length === 0) return undefined;
        if (endpoint_group.length === 1 && endpoint_group[0].mount === "") return endpoint_group[0];
        
        //Group Endpoints with same mount
        let grouped = {};
        for (let endpoint of endpoint_group) {
            let splitted = endpoint.mount.split('/');
            let group_name = splitted.length > 1 ? splitted[1] : splitted[0];

            endpoint.mount = splitted.reduce((acc, cur, idx) => {
                if (idx <= 1) return acc += "";
                return acc + "/" + cur;
            }, "");

            if (grouped[group_name] !== undefined) {
                grouped[group_name].push(endpoint);
            } else {
                grouped[group_name] = [endpoint];
            }
        }

        //Go one level deeper
        let tree = [];
        for (let group in grouped) {
            if (group === "") tree.push({ name: "/" + group, tree: grouped[group] });
            else tree.push({ name: "/" + group, tree: this.API_TREE_GENERATE(grouped[group])});
        }
        
        //Sort Tree
        tree.sort((a, b) => a.name.length - b.name.length);
        let tree_Obj = {};
        for (let subtree of tree) {
            tree_Obj[subtree.name] = subtree.tree;
        }

        return tree_Obj;
    }
    
    //UTIL
    GetAuthenticatorDetails() {
        let data = [];

        for (let auth of this.Installed_Authenticators) {
            data.push({
                name: auth.GetName(),
                rdy: auth.isReady(),
                act: auth.isActive(),
                enabled: auth.isEnabled()
            });
        }

        return data;
    }
    GetInteractor() {
        return this.WebAppInteractor;
    }
    GetHostname() {
        let cfg = this.Config.GetConfig();
        return cfg.Hostname;
    }
    GetPort() {
        let cfg = this.Config.GetConfig();
        return cfg.Port;
    }
    GetHostnameAndPort() {
        let cfg = this.Config.GetConfig();
        return cfg.Hostname + ':' + cfg.Port;
    }

    GetFormattedStringContent(formatted_string, template) {
        let obj = {};
        let arr = [];

        let start = null;
        let skip = 0;

        //Template Order
        for (let i = 0; i < template.length; i++) {
            let char = template.charAt(i);
            if (start === null && char === "{") start = i;
            else if (start !== null && char === "{") skip++;
            else if (start !== null && char === "}" && skip > 0) skip--;
            else if (start !== null && char === "}") {
                arr.push(template.substring(start + 1, i));
                start = null;
            }
        }

        arr = arr.reverse();

        start = null;
        skip = 0;
        //Get Content
        for (let i = 0; i < formatted_string.length; i++) {
            if (arr.lengt === 0) break; 

            let char = formatted_string.charAt(i);
            if (start === null && char === "{") start = i;
            else if (start !== null && char === "{") skip++;
            else if (start !== null && char === "}" && skip > 0) skip--;
            else if (start !== null && char === "}") {
                obj[arr.pop()] = formatted_string.substring(start + 1, i);
                start = null;
            }
        }

        return obj;
    }

    BetterFileFinder(folder, extensions, req, res, next, steps) {
        if (!folder || !extensions) return next();
        
        if (!steps) {
            steps = req['_parsedUrl'].pathname.split('/');
            steps.shift();
        }
        
        //URL Step
        let step = steps.shift();
        if (step === undefined) step = '';

        //Path Files/Dirs
        let dirs = fs.readdirSync(path.resolve(folder));

        //Find File/Dir
        let match = dirs.find(dir => dir.toLowerCase() === step.toLowerCase());

        if (match) {
            //Its a File or Dir here

            if (fs.statSync(path.resolve(folder + '/' + match)).isFile()) {
                return res.sendFile(path.resolve(folder + '/' + match));
            } else {
                return this.BetterFileFinder(folder + '/' + match, extensions, req, res, next, steps);
            }
        } else {
            //It MIGHT be a file - check auto Extension
            for (let ext of extensions) {
                let Ematch = dirs.find(dir => dir.toLowerCase() === step.toLowerCase() + ext);

                if (Ematch) {
                    //Its a File
                    return res.sendFile(path.resolve(folder + '/' + Ematch));
                }
            }
        }
        return next();
    }
}

class WebAppInteractor {
    constructor(MAIN_ROUTER, FILE_ROUTER, API_ROUTER, Authenticator, Logger, Auth_Log) {
        this.MAIN_ROUTER = MAIN_ROUTER;
        this.FILE_ROUTER = FILE_ROUTER;
        this.API_ROUTER = API_ROUTER;

        this.Authenticator = Authenticator;
        this.Hostname = null;
        this.Port = null;

        this.Logger = Logger;
        this.Auth_Log = Auth_Log;

        this.TCP_Login_callbacks = [];

        //STATS
        this.STAT_MAIN_CALLS = 0;
        this.STAT_FILE_CALLS = 0;
        this.STAT_API_CALLS = 0;

        this.STAT_MAIN_CALLS_PER_10 = 0;
        this.STAT_FILE_CALLS_PER_10 = 0;
        this.STAT_API_CALLS_PER_10 = 0;
        
        this.STAT_AUTHENTICATIONS = 0;
        this.STAT_AUTHENTICATIONS_PER_10 = 0;

        this.STAT_FAILED_AUTHENTICATIONS = 0;
        this.STAT_FAILED_AUTHENTICATIONS_PER_10 = 0;

        this.STAT_MINUTE_TIMER = setInterval(() => {
            this.STAT_MAIN_CALLS_PER_10 = 0;
            this.STAT_FILE_CALLS_PER_10 = 0
            this.STAT_API_CALLS_PER_10 = 0;

            this.STAT_AUTHENTICATIONS_PER_10 = 0;
            this.STAT_FAILED_AUTHENTICATIONS_PER_10 = 0;
        }, 600000);

        //Stat Route
        this.addMainRoute((req, res, next) => { this.STAT_MAIN_CALLS++; this.STAT_MAIN_CALLS_PER_10++; next(); });
        this.addFileRoute('/', (req, res, next) => { this.STAT_FILE_CALLS++; this.STAT_FILE_CALLS_PER_10++; next(); });
        this.addAPIRoute('/', (req, res, next) => { this.STAT_API_CALLS++; this.STAT_API_CALLS_PER_10++; next(); });

        this._upload_limit = '3mb';
    }

    //Routes
    addMainRoute(...middlewares) {
        this.MAIN_ROUTER.use(...middlewares);
    }
    addFileRoute(route, ...middlewares) {
        this.FILE_ROUTER.use(route, ...middlewares);
    }
    addAPIRoute(route, ...middlewares) {
        this.API_ROUTER.use(route, ...middlewares);
    }
    addAuthAPIRoute(route, auth_method, ...middlewares) {
        if (auth_method === null)
            auth_method = {};

        if (!(auth_method instanceof Object))
            return false;

        return this.API_ROUTER.use(route, (req, res, next) => this.AuthorizeRequest(auth_method, req, res, next), ...middlewares);
    }

    //Endpoints
    addAPIEndpoint(route, method = 'GET', ...middlewares) {
        if (typeof (method) !== 'string')
            return false;

        method = method.toLowerCase();

        if (this.API_ROUTER[method]) {
            try {
                this.API_ROUTER[method](route, ...middlewares);
                return true;
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        return false;
    }
    addAuthAPIEndpoint(route, auth_method, method = 'GET', ...middlewares) {
        if (auth_method === null)
            auth_method = {};

        if (typeof (method) !== 'string' || !(auth_method instanceof Object))
            return false;

        method = method.toLowerCase();

        if (this.API_ROUTER[method]) {
            try {
                this.API_ROUTER[method](route, (req, res, next) => this.AuthorizeRequest(auth_method, req, res, next), ...middlewares);
                return true;
            } catch (err) {
                this.Logger.error(err.message);
            }
        }

        return false;
    }

    //Authentication
    async AuthorizeRequest(method = {}, req, res, next) {
        if (!this.Authenticator) {
            res.json({ err: 'Authenticator not available.' });
            return Promise.resolve();
        }
        if (!this.Authenticator.isReady()) {
            res.json({ err: this.Authenticator.GetName() + " is currently disabled." });
            return Promise.resolve();
        }
        if (!this.Authenticator.isEnabled()) {
            res.json({ err: this.Authenticator.GetName() + " is currently disabled." });
            return Promise.resolve();
        }
        if (!this.Authenticator.isActive()) {
            res.json({ err: this.Authenticator.GetName() + " is currently inactive." });
            return Promise.resolve();
        }

        //Used as middleware
        //User Locals Info to Authorize User
        try {
            await this.AuthorizeUser(res.locals.user, method);
            next();
        } catch (err) {
            //Auth Failed / Unauthorized
            res.status(401).send("Unauthorized");
        }
        
        return Promise.resolve();
    }
    async AuthenticateUser(headers = {}) {
        //Authenticates a User by an JWT
        if (!this.Authenticator) return Promise.reject(new Error("Authenticator not available."));
        if (!this.Authenticator.isReady()) return Promise.reject(new Error(this.Authenticator.GetName() + " is not ready."));
        if (!this.Authenticator.isEnabled()) return Promise.reject(new Error(this.Authenticator.GetName() + " is currently disabled."));
        if (!this.Authenticator.isActive()) return Promise.reject(new Error(this.Authenticator.GetName() + " is currently inactive."));

        try {
            let user = await this.Authenticator.AuthenticateUser(headers);
            return Promise.resolve(user);
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async AuthorizeUser(user, method = {}) {
        //Used for next()-Middlewares to get User Info from req.locals
        if (!this.Authenticator) return Promise.reject(new Error("Authenticator not available."));
        if (!this.Authenticator.isReady()) return Promise.reject(new Error(this.Authenticator.GetName() + " is not ready."));
        if (!this.Authenticator.isEnabled()) return Promise.reject(new Error(this.Authenticator.GetName() + " is currently disabled."));
        if (!this.Authenticator.isActive()) return Promise.reject(new Error(this.Authenticator.GetName() + " is currently inactive."));

        try {
            await this.Authenticator.AuthorizeUser(user, method);
            this.STAT_AUTHENTICATIONS++;
            this.STAT_AUTHENTICATIONS_PER_10++;
            
            if (this.Auth_Log) {
                this.Auth_Log.insert({
                    user: user,
                    method: method,
                    status: 'success',
                    auth: this.Authenticator.GetName(),
                    time: Date.now()
                }).catch(err => this.Logger.warn("Auth Logging: " + err.message));
            }

            return Promise.resolve(user);
        } catch (err) {
            //authorization failed
            this.STAT_FAILED_AUTHENTICATIONS++;
            this.STAT_FAILED_AUTHENTICATIONS_PER_10++;
            
            if (this.Auth_Log) {
                this.Auth_Log.insert({
                    user: user,
                    method: method,
                    status: 'failed',
                    reason: err.message,
                    auth: this.Authenticator.GetName(),
                    time: Date.now()
                }).catch(err => this.Logger.warn("Auth Logging: " + err.message));
            }

            return Promise.reject(err);
        }
    }
    
    //TCP
    AddTCPCallback(topic, callback) {
        if (!callback || !topic) return false;
        this.TCP_Login_callbacks.push({ topic, callback });
        return true;
    }
    SendTCPMessage(topic, ws, message) {
        //Extract WS Data
        try {
            let type = message.toString().split(":")[0];
            let data = message.toString().split(":").slice(1).join(":");

            if (type !== 'ping' && type !== 'pong' && type !== 'terminated') data = JSON.parse(data);
            
            //Send to Packages
            for (let info of this.TCP_Login_callbacks.filter(elt => elt.topic === topic)) {
                try {
                    info.callback(ws, type, data);
                } catch (err) {

                }
            }
        } catch (err) {
            console.log(err);
            ws.send("Error");
        }
    }

    //UTIL
    SetHostname(hostname) {
        this.Hostname = hostname;
    }
    SetPort(port) {
        this.Port = port;
    }

    GetHostname() {
        return this.Hostname;
    }
    GetPort() {
        return this.Port;
    }
    GetHostnameAndPort() {
        return this.Hostname === 'localhost' ? (this.Hostname + ':' + this.Port) : this.Hostname;
    }
    GetUploadLimit() {
        return this._upload_limit;
    }
}

class Authenticator {
    constructor(name, logger, preloadedCfg) {
        this.Config = new CONFIGHANDLER.Config('Authenticator', [], );
        this.name = name;
        this.active = false;

        //LOGGER
        if (logger && logger.identify && logger.identify() === "FrikyBotLogger") {
            logger.addSources({
                Authenticator: {
                    display: () => " Authenticator ".inverse.cyan
                }
            });
            this.setLogger(logger.Authenticator);
        } else {
            this.setLogger(logger);
        }
        
        //Config
        this.Config = new CONFIGHANDLER.Config('Authenticator', [
            { name: 'enabled', type: 'boolean', default: true, requiered: true }
        ], { preloaded: preloadedCfg });
        
        this.Config.FillConfig();

        //Ready
        this.READY_REQUIREMENTS = [];
        this.addReadyRequirement(() => {
            return this.Config.ErrorCheck() === true;
        });
    }

    async Init(webInt) {
        return Promise.resolve();
    }

    //Auth
    async AuthorizeRequest(headers = {}, method = {}, user) {
        return Promise.resolve(user);
    }
    async AuthenticateUser(headers = {}) {
        return Promise.resolve(null);
    }
    async AuthorizeUser(user = {}, method = {}) {
        return Promise.resolve(user);
    }

    //Util
    GetName() {
        return this.name;
    }
    GetConfig(json = true) {
        if (json) return this.Config.GetConfig();
        return this.Config;
    }

    GetIdentifier() {
        return 'unkwn_auth';
    }

    setEnable(state) {
        this.Config.UpdateSetting('enabled', state === true);
    }
    isEnabled() {
        let cfg = this.Config.GetConfig();
        return cfg.enabled !== false;
    }

    setActive(state) {
        this.active = state === true;
    }
    isActive() {
        return this.active === true;
    }

    //Ready/Status
    addReadyRequirement(func) {
        if (func instanceof Function) this.READY_REQUIREMENTS.push(func);
    }
    removeReadyRequirement(index) {
        this.READY_REQUIREMENTS.splice(index, 1);
    }
    isReady() {
        for (let func of this.READY_REQUIREMENTS) {
            if (func instanceof Function && func() === false) return false;
        }

        return true;
    }

    setLogger(loggerObject) {
        if (loggerObject && loggerObject.info && loggerObject.warn && loggerObject.error) {
            this.Logger = loggerObject;
        } else {
            this.Logger = {
                info: console.log,
                warn: console.log,
                error: console.log
            };
        }
    }
}

/*
 *  ----------------------------------------------------------
 *            FrikyBot Authenticator Implementation
 *  ----------------------------------------------------------
 */

class FrikyBot_Auth extends Authenticator {
    constructor(logger, parentConfigObj) {
        super("FrikyBot Auth.", logger, parentConfigObj.GetConfig()['Authenticator']);

        //Config
        this.Config.AddSettingTemplates([
            { name: 'secret', type: 'string', private: true, requiered: true, default_func: () => this.regenerateSecret(false) },
            { name: 'Userlevels', type: 'array', type_array: 'string', default: ['viewer', 'moderator', 'staff', 'admin'] },
            { name: 'show_auth_message', type: 'boolean', default: false },
            { name: 'show_prev_token', type: 'boolean', default: true },
            { name: 'prev_token', type: 'string', private: true, private: true, default_func: () => this.generateToken('ConsoleAdmin', 'admin') }
        ]);

        parentConfigObj.AddChildConfig(this.Config);
        this.Config.Load();
        this.Config.FillConfig();
    }

    async Init(webInt) {
        //Add API
        this.setAPI(webInt);
        return Promise.resolve();
    }
    setAPI(webInt) {
        if (!webInt) return;

        //Regenerate Token
        webInt.addAuthAPIEndpoint('/settings/webapp/fbauth/regen', { user_level: 'staff' }, 'GET', async (req, res) => {
            let new_secret = this.regenerateSecret();
            let new_token = this.generateToken(res.locals.user.preferred_username, res.locals.user.user_level);
            return res.json({ new_secret, new_token });
        });

        //Enable/Disable
        webInt.addAuthAPIEndpoint('/settings/webapp/fbauth/state', { user_level: 'staff' }, 'POST', async (req, res) => {
            this.setEnable(req.body.state === true);

            return res.json({ state: this.isEnabled() });
        });
    }
    setActive(state) {
        this.active = state === true;
        if (state && this.Config.GetConfig()['show_prev_token'] !== false) {
            this.checkToken(this.Config.GetConfig()['prev_token']).
                then(user => {
                    this.Logger.warn("Use the following Authorization Code to Login and Setup your Bot: " + this.Config.GetConfig()['prev_token']);
                })
                .catch(err => {
                    this.Config.UpdateSetting('prev_token', this.generateToken('ConsoleAdmin', 'admin'));
                    this.Logger.warn("Use the following Authorization Code to Login and Setup your Bot: " + this.Config.GetConfig()['prev_token']);
                });
        }
    }

    //Auth
    async AuthorizeRequest(headers = {}, method = {}, user) {

        //Fetch User Data
        if (!user) {
            const header = headers['authorization'];
            const token = header && header.split(" ")[1];

            //Check JWT
            try {
                user = await this.checkToken(token);
            } catch (err) {
                //JWT Validation failed
                return Promise.reject(err);
            }
        }

        //Check User and Method
        return this.AuthenticateUser(user, method);
    }
    async AuthenticateUser(headers = {}) {
        const header = headers['authorization'];
        const token = header && header.split(" ")[1];
        
        //Check JWT
        return this.checkToken(token);
    }
    async AuthorizeUser(user = {}, method = {}) {
        let cfg = this.Config.GetConfig();
        
        //Check Method
        for (let meth in method) {
            let target = method[meth];
            if (method[meth] instanceof Function) {
                target = method[meth](user, method);
            }
            
            try {
                if (meth === 'user_level') {
                    if (!this.CompareUserlevels(user.user_level || this.GetUserlevels()[0], target, method.user_level_cutoff === true)) {
                        return Promise.reject(new Error("Userlevel doesnt match"));
                    }
                } else {
                    return Promise.reject(new Error('Unknown Authorization Method!'));
                }
            } catch (err) {
                return Promise.reject(err);
            }
        }

        if (cfg.show_auth_message === true)
            this.Logger.warn("Authenticated FrikyBot User: " + user.user_level);

        return Promise.resolve(user);
    }

    //Interface
    async checkToken(token) {
        if (!token) return Promise.reject(new Error('Token not found'));
        let cfg = this.Config.GetConfig();

        return new Promise((resolve, reject) => {
            jwt.verify(token, cfg['secret'], (err, user) => {
                if (err) return reject(new Error(err));
                return resolve(user);
            });
        });
    }
    generateToken(username, user_level = 'regular') {
        let cfg = this.Config.GetConfig();
        const payload = {
            preferred_username: username,
            user_level: user_level,
            iss: 'FrikyBot'
        };

        return jwt.sign(payload, cfg['secret']);
    }
    regenerateSecret(updateConfig = true) {
        let scrt = crypto.randomBytes(64).toString('hex');
        if (updateConfig) this.Config.UpdateSetting('secret', scrt);
        return scrt;
    }

    //Userlevel
    GetUserlevels() {
        let cfg = this.Config.GetConfig();
        return cfg.Userlevels || [];
    }
    GetUserLevelIndex(user_level) {
        let userlevel_index = -1;

        this.GetUserlevels().find((element, index) => {
            if (element === user_level) {
                userlevel_index = index;
                return true;
            }

            return false;
        });

        return userlevel_index;
    }
    CompareUserlevels(current, target, cutoff = false) {
        let target_index = this.GetUserLevelIndex(target);
        let current_index = this.GetUserLevelIndex(current);
        let rel_index = 0;

        if (target_index === -1) return false;

        rel_index = current_index - target_index;

        if (rel_index < 0) return false;
        if (cutoff === true && rel_index === 0 && current_index !== this.GetUserlevels().length - 1) return false;

        return true;
    }

    //Util
    GetIdentifier() {
        return 'fb_auth';
    }
}

module.exports.DETAILS = MODULE_DETAILS;
module.exports.WebApp = WebApp;
module.exports.WebAppInteractor = WebAppInteractor;
module.exports.Authenticator = Authenticator;
module.exports.FrikyBot_Auth = FrikyBot_Auth;