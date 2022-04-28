const TTV_API_SCOPES = {
    "analytics:read:extensions": {
        "desc": "View analytics data for the Twitch Extensions owned by the authenticated account.",
        "enabled": true,
        "state": false
    },
    "analytics:read:games": {
        "desc": "View analytics data for the games owned by the authenticated account.",
        "enabled": true,
        "state": false
    },
    "bits:read": {
        "desc": "View Bits information for a channel.",
        "enabled": true,
        "state": true
    },
    "channel:edit:commercial": {
        "desc": "Run commercials on a channel.",
        "enabled": true,
        "state": false
    },
    "channel:manage:broadcast": {
        "desc": "Manage a channel’s broadcast configuration, including updating channel configuration and managing stream markers and stream tags.",
        "enabled": true,
        "state": true
    },
    "channel:manage:extension": {
        "desc": "Manage a channel’s Extension configuration, including activating Extensions.",
        "enabled": true,
        "state": false
    },
    "channel:manage:polls": {
        "desc": "Manage a channel’s polls.",
        "enabled": true,
        "state": true
    },
    "channel:manage:predictions": {
        "desc": "Manage of channel’s Channel Points Predictions.",
        "enabled": true,
        "state": true
    },
    "channel:manage:redemptions": {
        "desc": "Manage Channel Points custom rewards and their redemptions on a channel.",
        "enabled": true,
        "state": true
    },
    "channel:manage:schedule": {
        "desc": "Manage a channel’s stream schedule.",
        "enabled": true,
        "state": false
    },
    "channel:manage:videos": {
        "desc": "Manage a channel’s videos, including deleting videos.",
        "enabled": true,
        "state": false
    },
    "channel:read:editors": {
        "desc": "View a list of users with the editor role for a channel.",
        "enabled": true,
        "state": false
    },
    "channel:read:goals": {
        "desc": "View Creator Goals for a channel.",
        "enabled": true,
        "state": true
    },
    "channel:read:hype_train": {
        "desc": "View Hype Train information for a channel.",
        "enabled": true,
        "state": true
    },
    "channel:read:polls": {
        "desc": "View a channel’s polls.",
        "enabled": true,
        "state": true
    },
    "channel:read:predictions": {
        "desc": "View a channel’s Channel Points Predictions.",
        "enabled": true,
        "state": true
    },
    "channel:read:redemptions": {
        "desc": "View Channel Points custom rewards and their redemptions on a channel.",
        "enabled": true,
        "state": true
    },
    "channel:read:stream_key": {
        "desc": "Read an authorized user’s stream key.",
        "enabled": true,
        "state": false
    },
    "channel:read:subscriptions": {
        "desc": "View a list of all subscribers to a channel and check if a user is subscribed to a channel.",
        "enabled": true,
        "state": true
    },
    "clips:edit": {
        "desc": "Manage Clips for a channel.",
        "enabled": true,
        "state": true
    },
    "moderation:read": {
        "desc": "View a channel’s moderation data including Moderators, Bans, Timeouts, and Automod settings.",
        "enabled": true,
        "state": true
    },
    "moderator:manage:banned_users": {
        "desc": "Ban and unban users.",
        "enabled": true,
        "state": true
    },
    "moderator:read:blocked_terms": {
        "desc": "View a broadcaster’s list of blocked terms.",
        "enabled": true,
        "state": true
    },
    "moderator:manage:blocked_terms": {
        "desc": "Manage a broadcaster’s list of blocked terms.",
        "enabled": true,
        "state": true
    },
    "moderator:manage:automod": {
        "desc": "Manage messages held for review by AutoMod in channels where you are a moderator.",
        "enabled": true,
        "state": true
    },
    "moderator:read:automod_settings": {
        "desc": "View a broadcaster’s AutoMod settings.",
        "enabled": true,
        "state": true
    },
    "moderator:manage:automod_settings": {
        "desc": "Manage a broadcaster’s AutoMod settings.",
        "enabled": true,
        "state": true
    },
    "moderator:read:chat_settings": {
        "desc": "View a broadcaster’s chat room settings.",
        "enabled": true,
        "state": true
    },
    "moderator:manage:chat_settings": {
        "desc": "Manage a broadcaster’s chat room settings.",
        "enabled": true,
        "state": true
    },
    "user:edit": {
        "desc": "Manage a user object.",
        "enabled": true,
        "state": true
    },
    "user:read:blocked_users": {
        "desc": "View the block list of a user.",
        "enabled": true,
        "state": false
    },
    "user:manage:blocked_users": {
        "desc": "Manage the block list of a user.",
        "enabled": true,
        "state": false
    },
    "user:read:broadcast": {
        "desc": "View a user’s broadcasting configuration, including Extension configurations.",
        "enabled": true,
        "state": true
    },
    "user:read:email": {
        "desc": "Read an authorized user’s email address.",
        "enabled": true,
        "state": false
    },
    "user:read:follows": {
        "desc": "View the list of channels a user follows.",
        "enabled": true,
        "state": true
    },
    "user:read:subscriptions": {
        "desc": "View if an authorized user is subscribed to specific channels.",
        "enabled": true,
        "state": true
    }
};
const SETTINGTYPES = [
    {
        name: 'number', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'number' && !isNaN(x) ? true : 'type missmatch' },
            { name: 'min', check: (x, optionSet) => x >= parseInt(optionSet.min) || 'number too small' },
            { name: 'max', check: (x, optionSet) => x <= parseInt(optionSet.min) || 'number too big' },
            { name: 'range', check: (x, optionSet) => (x >= parseInt(optionSet.range.substring(0, optionSet.range.indexOf(':'))) && x <= parseInt(optionSet.range.substring(optionSet.range.indexOf(':') + 1))) || 'number out of bounds' },
            { name: 'selection', check: (x, optionSet) => optionSet.selection.find(elt => elt === x) !== undefined || 'number not in the selection' }
        ], default: 0
    }, {
        name: 'boolean', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'boolean' || 'type missmatch' }
        ], default: false
    }, {
        name: 'string', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'string' || 'type missmatch' },
            { name: 'minlength', check: (x, optionSet) => x.length >= optionSet.minlength || 'too short' }
        ], default: ''
    }, {
        name: 'object', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'object' || 'type missmatch' }
        ], default: {}
    }, {
        name: 'array', options: [
            { name: 'type', check: (x, optionSet) => x instanceof Array || 'type missmatch' },
            {
                name: 'selection', check: (x, optionSet) => {
                    if (x.length == 0 && optionSet.selection.length > 0) return 'array is no subset of the selection';
                    for (let elt of x) if (optionSet.selection.find(el => el === elt) === undefined) return 'array is no subset of the selection';
                    return true;
                }
            },
            {
                name: 'typeArray', check: (x, optionSet) => {
                    for (let elt of x) {
                        if (optionSet.typeArray === 'array' && !(elt instanceof Array)) return 'array elements type missmatch';
                        else if (optionSet.typeArray !== 'array' && typeof elt !== optionSet.typeArray) return 'array elements type missmatch';
                    }

                    return true;
                }
            }
        ], default: [], compare: (a, b) => { for (let elt of a) if (b.find(el => el === elt) === undefined) return false; return true; }
    }, {
        name: 'config', options: [
            { name: 'type', check: (x, optionSet) => true }
        ], default: {}
    }
];

let WIZARD_CURSOR = [0, 0];
let WIZARD_NAV_DATA = [];
let WIZARD_AUTHS = [];

let CUR_CONFIG = {};

let TTV_API_READY = false;
let TTV_API_AUTH_USERS = [];
let TTV_API_AUTH_USERLEVELS = [];
let TTV_API_ACTIVE_SCOPES = [];

window.onhashchange = WIZARD_go2Hash;

//Setup General
async function FetchSettings() {
    return fetch("/api/pages/settings/setup", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}
async function Setup_init() {
    LOGIN_GetOriginPageURL = AddWizHash;
    SWITCHBUTTON_AUTOFILL();

    //Data
    try {
        let data = await FetchSettings();
        console.log(data);
        
        //Create
        WIZARD_create(data.tmpl, data.cfg, data.auths);
        CUR_CONFIG = data.cfg;

        if (data.ttv_irc) TwitchIRC_USER_SET_INFO(data.ttv_irc.user);
        if (data.ttv_api) {
            TwitchAPI_Application_setURL();
            TwitchAPI_USER_SET_INFO(data.ttv_api.user);
            TwitchAPI_UserLogin_createScopes(data.ttv_api.user.scopes);
            
            TTV_API_AUTH_USERS = data.ttv_api.authenticator_users || [];
            TTV_API_AUTH_USERLEVELS = data.ttv_api.authenticator_userlevels || [];
            TwitchAPI_Auth_DB_create();
            TwitchAPI_Auth_Interface();

            TTV_API_ACTIVE_SCOPES = data.ttv_api.user.scopes;
            TwitchAPI_API_create(data.ttv_api.endpoints);
            TwitchAPI_EventSub_create(data.ttv_api.eventsubs);

            if (data.ttv_api.ready) {
                TTV_API_READY = true;
                for (let elt of document.getElementsByClassName('TTV_LOGIN')) {
                    elt.removeAttribute('disabled');
                    elt.removeAttribute('title');
                }
            }
        }
        
        //Seperate Groups
        for (let module of data.tmpl) {
            let grps = [];

            for (let i = 0; i < module.options.groups.length; i++) {
                let grp = module.options.groups[i];
                grps.push({ name: grp.name, settings: module.settings.filter(elt => elt.group + 1 === i) });
            }

            WIZARD_NAV_DATA.push({ name: module.name, groups: grps });
        }
    } catch (err) {
        OUTPUT_showError(err.message);
        console.log(err);
        return Promise.resolve();
    }
    
    //DONE
    WIZARD_go2Hash();
    document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SETUP').style.display = 'block';

    //AFTER
    CONTENT_OnLoad().catch(err => {
        console.log(err);
        OUTPUT_showError(err.message);
    });
}

//Wiz2
function WIZARD_create(template, config = {}, auths = [{ name: 'No Authnticator available' }]) {
    WIZARD_createNaviation(template);

    //Update Element Value
    WIZARD_updateContent(config, template);

    //Authenticators
    WIZARD_AUTHS = auths;
    if (document.getElementById('SETTING_WebApp_selectedAuthenticator')) {
        let s = '';
        let active;
        for (let elt of auths) {
            s += '<option ' + (elt.enabled === false || elt.rdy === false ? 'disabled' : '') + ' title="' + (elt.enabled === false ? 'Autheticator Disabled!' : elt.rdy === false ? 'Autheticator not Ready!' : '') + '">' + elt.name + '</option>';
            if (elt.act === true) active = elt.name;
        }
        document.getElementById('SETTING_WebApp_selectedAuthenticator').innerHTML = s;
        if (active) document.getElementById('SETTING_WebApp_selectedAuthenticator').value = active;
        if (active) document.getElementById('SETTING_WebApp_selectedAuthenticator').oldValue = active;
    }
    
    //TTV API Link
    if (document.getElementById('TwitchAPI_Redirect_URL'))
        document.getElementById('TwitchAPI_Redirect_URL').value = 'http://localhost:' + config['WebApp']['Port'] + '/Twitch-Redirect';
}
function WIZARD_createNaviation(modules) {
    let mainsHTML = '';
    let groupsHTML = '';

    //Mains
    for (let i = 0; i < modules.length; i++) {
        mainsHTML += '<div class="WIZ_NAV_MODULE" ' + (i == 0 ? 'selected' : '') + '>' + modules[i].name + '</div>';
    }

    //Groups
    for (let i = 0; i < modules.length; i++) {
        let cols = '';
        if(!modules[i].options.groups) modules[i].options.groups = [];
        let groups = modules[i].options.groups;

        //Add Extra Groups
        groups.unshift({ name: 'Introduction' });

        //Calculate Column Sizes
        for (let j = 0; j < groups.length; j++) cols += (j !== 0 ? ' ' : '') + ((1 / groups.length) * 100) + '%';

        //Create HTML
        groupsHTML += '<div class="WIZ_NAV_GROUP" style="grid-template-columns: ' + cols + ';" ' + (i != WIZARD_CURSOR[0] ? ' hidden' : '') + '>';
        for (let j = 0; j < groups.length; j++) {
            groupsHTML += '<div ' + (i == WIZARD_CURSOR[0] && j == WIZARD_CURSOR[1] ? 'selected' : '') + ' ' + ((modules[i].options.opt || modules[i].options.wip) && j !== 0 ? ' disabled' : '') + '>' + groups[j].name + '</div>';
        }
        groupsHTML += '</div>';
    }

    //Calculate Column Sizes
    let mdlCols = '';
    for (let i = 0; i < modules.length; i++) mdlCols += (i !== 0 ? ' ' : '') + ((1 / modules.length) * 100) + '%';
    document.getElementById('WIZ_NAV_MODULES').style.gridTemplateColumns = mdlCols;

    //Add HTML
    document.getElementById('WIZ_NAV_MODULES').innerHTML = mainsHTML;
    document.getElementById('WIZ_NAV_GROUPS').innerHTML = groupsHTML;
}

function WIZARD_updateContent(cfg, template = [], parentName, path = []) {
    if (typeof cfg === 'object' && cfg.length === undefined) {
        for (key in cfg) {
            let eltPath = path;
            if (parentName) eltPath = path.concat([parentName]);
            WIZARD_updateContent(cfg[key], (template.find(elt => elt.name == key) || {}).settings || template, key, eltPath);
        }
        return;
    }

    WIZARD_updateSetting(parentName, cfg, path, template.find(elt => elt.name == parentName));
}
function WIZARD_updateSetting(name, value, path, template = {}) {
    let elementID = "SETTING_" + path.concat([name]).join('_');
    let elt = document.getElementById(elementID);

    if (elt) {
        if (template.type === 'boolean' && elt.tagName === 'SWITCHBUTTON') {
            SWITCHBUTTON_TOGGLE(elt, value);
        } else if (template.type === 'boolean' && elt.tagName === 'INPUT') {
            elt.checked = value === true;
        } else {
            elt.value = value;
        }
    }
}

//WIZARD DSIPLAY
function WIZARD_show(module, group, hold = false) {
    if (module < 0 || group < 0) return;

    if (!WIZARD_NAV_DATA[module]) module = 0;
    if (!WIZARD_NAV_DATA[module].groups[group]) group = 0;

    let moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;
    
    //Check Current
    (document.getElementsByClassName('WIZ_NAV_MODULE')[WIZARD_CURSOR[0]] || {}).removeAttribute('selected');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].setAttribute('hidden', '');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].childNodes[WIZARD_CURSOR[1]].removeAttribute('selected');
    document.getElementsByClassName('WIZ_GROUP_' + moduleName)[WIZARD_CURSOR[1]].setAttribute('hidden', '');
    
    WIZARD_CURSOR[0] = module;
    WIZARD_CURSOR[1] = group;
    AddWizHash();
    moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;

    //Show New
    document.getElementsByClassName('WIZ_NAV_MODULE')[WIZARD_CURSOR[0]].setAttribute('selected', '');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].removeAttribute('hidden');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].childNodes[WIZARD_CURSOR[1]].setAttribute('selected', '');
    document.getElementsByClassName('WIZ_GROUP_' + moduleName)[WIZARD_CURSOR[1]].removeAttribute('hidden');

    //Update UI
    WIZARD_updateUI();

}
function WIZARD_updateUI() {
    let mainIdx = WIZARD_CURSOR[0];
    let groupIdx = WIZARD_CURSOR[1];

    //Buttons
    let buttons = [];
    let cols = '';

    if (mainIdx > 0 || groupIdx > 0) buttons.push('BACK');
    if (!(mainIdx == WIZARD_NAV_DATA.length - 1 && groupIdx === WIZARD_NAV_DATA[mainIdx].groups.length - 1)) buttons.push('NEXT');

    //Hide all buttons
    for (let elt of document.getElementsByClassName('WIZ_UI_BTN')) elt.setAttribute('hidden', '');

    //Show enabled
    for (let btn of buttons) {
        cols += ' 90px';
        document.getElementById('WIZ_UI_' + btn).removeAttribute('hidden');
    }

    //Add Buttons with new Grid-Cols and Width
    document.getElementById('WIZ_UI_GRID').style.gridTemplateColumns = cols;
    document.getElementById('WIZ_UI_GRID').style.width = (buttons.length * 90 + (buttons.length - 1) * 10) + 'px';
}
function WIZARD_prev() {
    let nextModule = WIZARD_CURSOR[0];
    let nextGroup = WIZARD_CURSOR[1];

    if (nextGroup - 1 >= 0)
        nextGroup -= 1;
    else if (nextModule - 1 >= 0) {
        nextModule -= 1; nextGroup = WIZARD_NAV_DATA[nextModule].groups.length - 1;
    }

    WIZARD_show(nextModule, nextGroup);
}
function WIZARD_next() {
    let nextModule = WIZARD_CURSOR[0];
    let nextGroup = WIZARD_CURSOR[1];
    
    if (nextGroup + 1 < WIZARD_NAV_DATA[nextModule].groups.length)
        nextGroup += 1;
    else if (nextModule + 1 < WIZARD_NAV_DATA.length) {
        nextModule += 1; nextGroup = 0;
    }
    
    WIZARD_show(nextModule, nextGroup);
}
function WIZARD_go2Hash() {
    let hMdl = GetURLHashContent('_m');
    let hGrp = GetURLHashContent('_g');
    
    if (hMdl) hMdl = (hMdl.value || [])[0];
    if (hGrp) hGrp = (hGrp.value || [])[0];

    WIZARD_show(parseInt(hMdl) || 0, parseInt(hGrp) || 0);
}

function WIZARD_onRestart() {
    let moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;

    if (moduleName === 'WebApp' && WIZARD_CURSOR[1] === 1) {
        let opt = getAuthHeader();
        opt.method = 'POST';
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify({ port: CUR_CONFIG.WebApp.Port });

        fetch('/api/settings/webapp/port', opt)
            .then(STANDARD_FETCH_RESPONSE_CHECKER)
            .then(json => {
                if (json.msg === '200') {
                    //Output
                    let outS = 'Bot Restarting at Port: ' + json.port;
                    outS += '</br><b>Since Cookies arent shared between Ports, you have to <a href="http://localhost:' + json.port + '/login" target="_blank">log in</a> again! </b>';
                    outS += '</br>Go <a href="http://localhost:' + json.port + '/settings/setup#_m=0&_g=1">here</a> after login to resume Setup at this Step!';
                    OUTPUT_showInfo(outS);

                    //Change TTV API Link
                    if (document.getElementById('TwitchAPI_Redirect_URL')) {
                        document.getElementById('TwitchAPI_Redirect_URL').value = 'http://localhost:' + json.port + '/Twitch-Redirect';
                    }
                } else OUTPUT_showError('500 - Internal Error.');
            })
            .catch(err => {
                OUTPUT_showError(err.message);
            });
    }
}

//WIZARD UTIL
function WIZARD_NAV_MODULE(e) {
    let target = e.target;
    let targetIdx;
    let modules = document.getElementsByClassName('WIZ_NAV_MODULE');

    //Find Index
    for (let i = 0; i < modules.length; i++)
        if (modules[i] === target) { targetIdx = i; break; }

    //Show
    WIZARD_show(targetIdx, 0, true);
}
function WIZARD_NAV_GROUP(e) {
    let target = e.target;
    let targetIdx;
    let groups = document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].childNodes;
    
    //Find Index
    for (let i = 0; i < groups.length; i++)
        if (groups[i] === target) { targetIdx = i; break; }

    //Show
    WIZARD_show(WIZARD_CURSOR[0], targetIdx, true);
}

//CONTENT
async function CONTENT_OnLoad() {
    let moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;
    let groupName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].groups[WIZARD_CURSOR[1]].name;
    let search = GetURLSearchArray();
    let error = search.find(elt => elt.name === 'error');
    if (error) OUTPUT_showError(decodeURI(error.value[0]));

    if (moduleName === 'TwitchIRC' && groupName === 'User Login') {
        let hash = GetURLHashArray();
        let access_token = hash.find(elt => elt.name === 'access_token');
        let id_token = hash.find(elt => elt.name === 'id_token');

        if (id_token && access_token) {
            try {
                let data = await TTV_LOGIN_FETCH_USERINFO(id_token.value[0]);
                let username = data.user['preferred_username'];
                
                if (username) {
                    document.getElementById('SETTING_TwitchIRC_login').value = username;
                    document.getElementById('SETTING_TwitchIRC_oauth').value = 'oauth:' + access_token.value[0];
                    await TwitchIRC_User_Save();
                    window.location.hash = "";
                    LOGIN_GetOriginPageURL = AddWizHash();
                }
            } catch (err) {
                console.log(err);
                OUTPUT_showError(err.message);
            }
        }
    }

    return Promise.resolve();
}

//WebApp
function port_change(value) {
    if (value == CUR_CONFIG.WebApp.Port) {
        document.getElementById('WIZ_UI_RESTART').setAttribute('hidden', '');
        document.getElementById('WIZ_UI_NEXT').removeAttribute('hidden');
        document.getElementById('SETTING_WebApp_Port_Hint').setAttribute('hidden', '');
        return;
    }

    document.getElementById('SETTING_WebApp_Port_Hint').removeAttribute('hidden');
    document.getElementById('WIZ_UI_NEXT').setAttribute('hidden', '');
    document.getElementById('WIZ_UI_RESTART').removeAttribute('hidden');
}
function hostname_change(value) {
    if (value == CUR_CONFIG.WebApp.Hostname) {
        document.getElementById('SETTING_WebApp_Hostname_Hint').setAttribute('hidden', '');
        document.getElementById('WebApp_Hostname_Save').disabled = true;
        return;
    }

    document.getElementById('WebApp_Hostname_Save').disabled = false;
    document.getElementById('SETTING_WebApp_Hostname_Hint').removeAttribute('hidden');
}
function hostname_save() {
    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ hostname: document.getElementById('SETTING_WebApp_Hostname').value });

    fetch('/api/settings/webapp/hostname', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo("Hostname changed!");
            CUR_CONFIG['WebApp']['Hostname'] = document.getElementById('SETTING_WebApp_Hostname').value;
            hostname_change(CUR_CONFIG['WebApp']['Hostname']);
            TwitchAPI_Application_setURL(CUR_CONFIG['WebApp']['Hostname']);
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function upload_limit_change(value) {
    if (value == CUR_CONFIG.WebApp.upload_limit) {
        document.getElementById('WIZ_UI_RESTART').setAttribute('hidden', '');
        document.getElementById('WIZ_UI_NEXT').removeAttribute('hidden');
        document.getElementById('SETTING_WebApp_upload_limit_Hint').setAttribute('hidden', '');
        return;
    }

    document.getElementById('SETTING_WebApp_upload_limit_Hint').removeAttribute('hidden');
    document.getElementById('WIZ_UI_NEXT').setAttribute('hidden', '');
    document.getElementById('WIZ_UI_RESTART').removeAttribute('hidden');
}

async function FrikyBot_Auth_switch(elt) {
    const auth_name = elt.value;
    elt.value = elt.oldValue;

    //Check if switching is desired
    try {
        let answer = await MISC_USERCONFIRM('JUST A REMINDER', 'Changing the Authenticator requires your to relogin using the new Authentication Service. This means your current Token will be invalid! Relogin can be done at the Login-Page.', ['CANCEL', 'CHANGE']);
        if (answer !== 'CHANGE') return Promise.resolve();
    } catch (err) {
        return Promise.resolve();
    }

    //Access API
    let opt = getAuthHeader();
    opt.method = 'PUT';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ authenticator: auth_name });

    fetch('/api/settings/webapp/authenticator', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.code !== 200) return Promise.reject(new Error(json.msg || 'Authenticator Switch failed: Unknown Error.'));
            elt.value = auth_name;
            elt.oldValue = elt.value;
            OUTPUT_showInfo(json.msg || 'Authenticator Switch successfull!');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
async function FrikyBot_Auth_enable(elt) {
    //Check other Authenticator Statuses
    try {
        let answer = await AuthenticatorWarning("FrikyBot Auth.");
        if (!answer) return Promise.resolve();
    } catch (err) {
        return Promise.resolve();
    }
    
    //Access API
    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ state: elt.value === false });

    fetch('/api/settings/webapp/fbauth/state', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            SWITCHBUTTON_TOGGLE(elt, json.state);
            CUR_CONFIG['WebApp']['Authenticator']['enable'] = json.state === true;
            WIZARD_AUTHS.find(elt => elt.name === 'FrikyBot Auth.').enabled = json.state === true;
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function FrikyBot_Auth_show(btn) {
    let elt = document.getElementById('SETTING_WebApp_Authenticator_secret');
    if (elt) {
        elt.type = elt.type === 'password' ? 'text' : 'password';
        btn.innerHTML = (elt.type === 'password' ? 'SHOW' : 'HIDE') + ' SECRET';
    }
}
function FrikyBot_Auth_regen() {
    fetch('/api/settings/webapp/fbauth/regen', getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            console.log(json);
            if (json.new_secret !== undefined && json.new_token !== undefined) {
                document.getElementById('SETTING_WebApp_Authenticator_secret').value = json.new_secret;

                LOGIN_logout();
                return LOGIN_login(json.new_token);
            }
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

//TTV IRC
const TWITCHIRC_SCOPE_SUBSCRIPTION = 'user:read:subscriptions';
const TWITCHIRC_USER_SCOPES = ['channel:moderate', 'chat:read', 'chat:edit', 'whispers:read', 'whispers:edit'];
let TwitchIRC_FETCHING = false;
function TwitchIRC_User_Mode(elt) {
    if (elt.innerHTML === 'Use Custom Token') {
        elt.innerHTML = 'Use Twitch Login';
        document.getElementById('TwitchIRC_Custom_User').style.display = 'block';
        document.getElementById('TwitchIRC_User').style.display = 'none';
    } else {
        elt.innerHTML = 'Use Custom Token';
        document.getElementById('TwitchIRC_Custom_User').style.display = 'none';
        document.getElementById('TwitchIRC_User').style.display = 'grid';
    }
}
function TwitchIRC_User_Subscription_toggle(elt) {
    if (TWITCHIRC_USER_SCOPES.find(el => el === TWITCHIRC_SCOPE_SUBSCRIPTION)) TWITCHIRC_USER_SCOPES.pop();
    else TWITCHIRC_USER_SCOPES.push(TWITCHIRC_SCOPE_SUBSCRIPTION);

    elt.checked = TWITCHIRC_USER_SCOPES.find(elt => elt === TWITCHIRC_SCOPE_SUBSCRIPTION) !== undefined;
}

function TwitchIRC_User_change() {
    let login = document.getElementById('SETTING_TwitchIRC_login').value;
    let token = document.getElementById('SETTING_TwitchIRC_oauth').value;

    let change = (login !== CUR_CONFIG['TwitchIRC']['login'] || token !== CUR_CONFIG['TwitchIRC']['oauth']);
    document.getElementById('TwitchIRC_OAUTH_SAVE').style.display = (change ? 'inline-block' : 'none');
}
function TwitchIRC_OAuth_show(btn) {
    let elt = document.getElementById('SETTING_TwitchIRC_oauth');
    if (elt) {
        elt.type = elt.type === 'password' ? 'text' : 'password';
        btn.innerHTML = (elt.type === 'password' ? 'SHOW' : 'HIDE') + ' OAUTH TOKEN';
    }
}
function TwitchIRC_USER_TEST() {
    fetch('/api/twitchirc/test', getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo('A test message was send into the Chat!');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function TwitchIRC_USER_SET_INFO(user) {
    if (!document.getElementById('TwitchIRC_User') || !user) return;
    user = JSON.parse(JSON.stringify(user));
    user['exp'] = 'NEVER';

    TTV_LOGIN_SETDATA(document.getElementById('TwitchIRC_User'), user, true, 'TwitchIRC_USER_Logout');
}
async function TwitchIRC_User_Save() {
    let login = document.getElementById('SETTING_TwitchIRC_login').value;
    let oauth = document.getElementById('SETTING_TwitchIRC_oauth').value;
    
    let data = { login, oauth };

    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(data);
    
    return fetch('/api/settings/twitchirc/user', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo('User successfully changed. Reload to get Token Information!');
            CUR_CONFIG['TwitchIRC']['login'] = login;
            CUR_CONFIG['TwitchIRC']['oauth'] = oauth;
            TwitchIRC_User_change();
        });
}
function TwitchIRC_USER_Logout() {
    document.getElementById('SETTING_TwitchIRC_login').value = "";
    document.getElementById('SETTING_TwitchIRC_oauth').value = "";
    TwitchIRC_User_Save();

    document.getElementById('TwitchIRC_User').remove();
    OUTPUT_showWarn('Please Reload this page!');
}

function TwitchIRC_Channel_change() {
    if (document.getElementById('SETTING_TwitchIRC_channel').value === CUR_CONFIG['TwitchIRC']['channel']) {
        document.getElementById('TwitchIRC_CHANNEL_SAVE').style.display = 'none';
    } else {
        document.getElementById('TwitchIRC_CHANNEL_SAVE').style.display = 'inline-block';
    }
}
function TwitchIRC_Channel_Selected(e) {
    if (e.target.id === 'TwitchIRC_Channel_Selector') return;

    let elt = e.target;

    while (elt.id !== 'TwitchIRC_Channel_Selector' && elt.parentElement.id !== 'TwitchIRC_Channel_Selector' ) {
        elt = elt.parentElement;
    }

    if (!elt.dataset.channel) return;

    document.getElementById('TwitchIRC_Channel_Selector').style.display = 'none';
    document.getElementById('SETTING_TwitchIRC_channel').value = elt.dataset.channel;
    TwitchIRC_Channel_change();
}
function TwitchIRC_Channel_input(value) {
    TwitchIRC_Channel_change();
    
    //Buffer Layer
    if (TwitchIRC_FETCHING === true) return;
    if (TTV_API_READY === false) return;

    setTimeout(() => {
        if (value === document.getElementById('SETTING_TwitchIRC_channel').value)
            if (value.trim() == "")
                document.getElementById('TwitchIRC_Channel_Selector').style.display = 'none';
        else
            TwitchIRC_Channel_Fetch(value);
    }, 100);
}
function TwitchIRC_Channel_Fetch(value) {
    TwitchIRC_FETCHING = true;
    document.getElementById('TwitchIRC_Channel_Selector').style.display = 'grid';
    fetch('/api/twitchapi/findchannel?channel=' + value, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            let s = '';
            for (let channel of json.data) {
                s += '<div ' + (channel.is_live ? 'class="live"' : '') + ' data-channel="' + channel.login + '"><div><img src="' + channel.img + '"/> <span class="name">' + (channel.display_name || channel.login) + '</span>' + (channel.is_live ? '<span class="live">LIVE</span>' : '') + '</div></div>';
            }
            document.getElementById('TwitchIRC_Channel_Selector').innerHTML = s;

            TwitchIRC_FETCHING = false;
        })
        .catch(err => {
            if (err.message === 'Twitch API is disabled' || err.message === '404 - API Endpoint not found') {
                document.getElementById('TwitchIRC_Channel_Selector').innerHTML = '<div><div><img /><span>Autofill from Twitch API Data not availabe.</span></div></div>';
                return;
            }

            TwitchIRC_FETCHING = false;
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function TwitchIRC_Channel_Save() {
    let channel = document.getElementById('SETTING_TwitchIRC_channel').value;

    let data = { channel };

    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(data);

    fetch('/api/settings/twitchirc/channel', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo(json.msg);
            CUR_CONFIG['TwitchIRC']['channel'] = channel;
            TwitchIRC_Channel_change();
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

function TwitchIRC_MISC_Switch(elt) {
    let name = elt.id.substring(18);
    let data = { [name]: elt.value };

    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(data);

    fetch('/api/settings/twitchirc/misc', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            SWITCHBUTTON_TOGGLE(elt, json.data[name]);
            OUTPUT_showInfo("Setting Changed!");
        })
        .catch(err => {
            SWITCHBUTTON_TOGGLE(elt);
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

//TTV API
let TwitchAPI_FETCHING = false;
function TwitchAPI_Application_setURL(hostname, port) {
    if (!hostname) hostname = CUR_CONFIG['WebApp'].Hostname;
    if (!port) port = CUR_CONFIG['WebApp'].Port;

    document.getElementById("TwitchAPI_Redirect_URL").value = "http" + ( hostname === 'localhost' ? '' : 's') + "://" + hostname + ":" + port + "/twitch-redirect";
}
function TwitchAPI_Secret_change(btn) {
    if (btn.innerHTML === 'SHOW SECRET') {
        btn.innerHTML = 'HIDE SECRET';
        document.getElementById('SETTING_TwitchAPI_Secret').type = 'text';
    } else {
        btn.innerHTML = 'SHOW SECRET';
        document.getElementById('SETTING_TwitchAPI_Secret').type = 'password';
    }
}
function TwitchAPI_Application_change() {
    let clientid = document.getElementById('SETTING_TwitchAPI_ClientID').value;
    let clientsecret = document.getElementById('SETTING_TwitchAPI_Secret').value;

    if (clientid !== CUR_CONFIG['TwitchAPI']['ClientID'] || clientsecret !== CUR_CONFIG['TwitchAPI']['Secret']) {
        document.getElementById('TwitchAPI_Application_Save').style.display = 'inline-block';
    } else {
        document.getElementById('TwitchAPI_Application_Save').style.display = 'none';
    }
}
function TwitchAPI_Application_Save() {
    let ClientID = document.getElementById('SETTING_TwitchAPI_ClientID');
    let Secret = document.getElementById('SETTING_TwitchAPI_Secret');

    let data = { ClientID: ClientID.value, Secret: Secret.value };

    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(data);

    fetch('/api/settings/twitchapi/application', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo(json.msg + (json.usertoken === false ? '. A new Usertoken has to be requested!!' : 'A old Usertoken is still valid!'));

            CUR_CONFIG['TwitchAPI']['ClientID'] = json.ClientID;
            CUR_CONFIG['TwitchAPI']['Secret'] = json.Secret;

            TwitchAPI_Application_change();
            ClientID.classList.remove('missing');
            Secret.classList.remove('missing');

            TTV_API_READY = json.ready === true;
            for (let elt of document.getElementsByClassName('TTV_LOGIN')) {
                if (TTV_API_READY) {
                    elt.setAttribute('disabled', 'true');
                    elt.setAttribute('title', 'Only available when Twitch API is setup!');
                } else {
                    elt.removeAttribute('disabled');
                    elt.removeAttribute('title');
                }
            }
        })
        .catch(err => {
            ClientID.classList.add('missing');
            Secret.classList.add('missing');
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

function TwitchAPI_Login_Mode(status) {
    let btn = document.getElementById('TwitchAPI_Login_Mode');
    let scopes = document.getElementById('TWITCHAPI_USERLOGIN_SCOPES');
    let scope_header = document.getElementById('TwitchAPI_Login_Scope_Header');
    let login_custom = document.getElementById('TwitchAPI_CustomUserLogin');
    let login_user = document.getElementById('TwitchAPI_UserLogin');

    if (status === true || btn.innerHTML === 'CUSTOMIZE ACCESS') {
        btn.innerHTML = 'SHOW ACCESS STATUS';
        scopes.style.display = 'grid';
        login_custom.style.display = 'grid';
        login_user.style.display = 'none';
        scope_header.style.display = 'block';
    } else {
        btn.innerHTML = 'CUSTOMIZE ACCESS';
        scopes.style.display = 'none';
        login_custom.style.display = 'none';
        login_user.style.display = 'grid';
        scope_header.style.display = 'none';
    }
}
function TwitchAPI_USER_SET_INFO(user) {
    if (!document.getElementById('TwitchAPI_UserLogin') || !user || !user.sub) return TwitchAPI_Login_Mode();
    user = JSON.parse(JSON.stringify(user));
    user['refresh'] = true;
    TTV_LOGIN_SETDATA(document.getElementById('TwitchAPI_UserLogin'), user, true, 'TwitchAPI_USER_Logout');

    document.getElementById('TwitchAPI_Login_Mode').style.display = 'block';
}
function TwitchAPI_USER_Logout() {
    TTV_LOGIN_COLLAPSE(document.getElementById('TwitchAPI_UserLogin'));
    
    for (let child of document.getElementById('TwitchAPI_UserLogin').children) {
        if (child instanceof Element && child.classList.contains('TTV_LOGIN_BUTTON')) {
            child.innerHTML = '<center onclick="TTV_LOGIN_CLICKED(this, \'bot\', TwitchAPI_UserLogin_getScopes())"><span>LOG IN USING TWITCH</span><img src="../images/icons/twitch.svg" data-type="svg" /></center>';
        } else if (child instanceof Element && child.classList.contains('TTV_LOGIN_DATA')) {
            child.innerHTML = "";
        }
    }

    let opt = getAuthHeader();
    opt.method = 'DELETE';

    fetch('/api/TwitchAPI/token?type=user', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.data && json.data.user && json.data.user.state === 'deleted') OUTPUT_showInfo('User Token delted!');
            else OUTPUT_showError('User Token couldnt be deleted!');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function TwitchAPI_UserLogin_createScopes(scopes = []) {
    let s = '';

    for (let scope in TTV_API_SCOPES) {
        if (TTV_API_SCOPES[scope].enabled !== true) continue;

        s += '<div>' + TTV_API_SCOPES[scope].desc + '</div>';
        s += '<div>' + SWITCHBUTTON_CREATE(scopes.find(elt => elt === scope) !== undefined || TTV_API_SCOPES[scope].state === true, false, null, null, 'data-id="' + scope + '" class="TTV_API_SCOPE"') + '</div>';
    }
    
    s += '<span style="color: red;">For new Scopes to have Effect, you have to log in again!</span><div></div>';
    document.getElementById('TWITCHAPI_USERLOGIN_SCOPES').innerHTML = s;

    for (let elt of document.getElementsByClassName('TTV_API_SCOPE')) {
        if (elt instanceof Element && elt.tagName === 'SWITCHBUTTON') SWITCHBUTTON_AUTOFILL(elt);
    }
}
function TwitchAPI_UserLogin_getScopes() {
    let scopes = [];

    for (let elt of document.getElementsByClassName('TTV_API_SCOPE')) {
        if (elt.value === true) scopes.push(elt.dataset.id);
    }

    return scopes;
}

async function TwitchAPI_Auth_enable(elt) {
    //Check other Authenticator Statuses
    try {
        let answer = await AuthenticatorWarning("TTV Auth.");
        if (!answer) return Promise.resolve();
    } catch (err) {
        return Promise.resolve();
    }
    
    //Access API
    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ state: elt.value === false });

    fetch('/api/settings/TwitchAPI/ttvauth/state', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            SWITCHBUTTON_TOGGLE(elt, json.state);
            CUR_CONFIG['TwitchAPI']['Authenticator']['enabled'] = json.state === true;
            WIZARD_AUTHS.find(elt => elt.name === 'TTV Auth.').enabled = json.state === true;
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function TwitchAPI_Auth_Interface() {
    document.getElementById('TwitchAPI_Authenticator_Interface_Select').innerHTML = TwitchAPI_Auth_DB_creatUserlevelSelect();
}
function TwitchAPI_Auth_Interface_Mode(btn) {
    if (btn.innerHTML === 'SHOW USERS') {
        btn.innerHTML = 'ADD USER';
        document.getElementById('TwitchAPI_Authenticator_Interface').style.display = 'none';
        document.getElementById('TwitchAPI_Authenticator_Database').style.display = 'block';
    } else {
        btn.innerHTML = 'SHOW USERS';
        document.getElementById('TwitchAPI_Authenticator_Interface').style.display = 'block';
        document.getElementById('TwitchAPI_Authenticator_Database').style.display = 'none';
    }
}

function TwitchAPI_Auth_DB_create() {
    let s = '';
    TTV_API_AUTH_USERS.sort((a, b) => {
        let ul_id_a = -1;
        let ul_id_b = -1;

        TTV_API_AUTH_USERLEVELS.find((ul, idx) => {
            if (ul === a.user_level) ul_id_a = idx; 
            if (ul === b.user_level) ul_id_b = idx;
            return false;
        });
        return ul_id_b - ul_id_a;
    });

    for (let user of TTV_API_AUTH_USERS) s += TwitchAPI_Auth_DB_creatUser(user);
    document.getElementById('TwitchAPI_Authenticator_Users').innerHTML = s === '' ? '<center class="NOUSER">NO USERS FOUND</center>' : s;
}
function TwitchAPI_Auth_DB_creatUser(user = {}) {
    let s = '';

    //NAME / ID
    s += '<center title="TTV ID: ' + user.user_id + '">' + user.user_name + '</center>';

    //LEVEL
    s += '<center class="TwitchAPI_Authenticator_Users_LEVEL" data-level="' + user.user_level + '" data-userid="' + user.user_id + '"></center>';

    //DATE
    let date = new Date(user.added_at * 1000).toLocaleString('de-DE');
    s += '<center title="added by ' + user.added_by + '">' + date.substring(0, date.lastIndexOf(':')) + '</center>';

    //SETTINGS
    s += '<center class="TwitchAPI_Authenticator_Users_SETTINGS" data-userid="' + user.user_id + '">';
    s += '<div class="TwitchAPI_Authenticator_Users_BTN" data-type="edit" title="Edit/Cancel Edit" onclick="TwitchAPI_Auth_DB_edit(' + user.user_id + ')"><img /></div>';
    s += '<div class="TwitchAPI_Authenticator_Users_BTN" data-type="save" title="Save Edit" data-userid="' + user.user_id + '" onclick="TwitchAPI_Auth_DB_save(' + user.user_id + ')"><img /></div>';
    s += '<div class="TwitchAPI_Authenticator_Users_BTN" data-type="delete" title="Delete" onclick="TwitchAPI_Auth_DB_delete(' + user.user_id + ')"><img /></div>';
    s += '</center>';

    return s;
}
function TwitchAPI_Auth_DB_creatUserlevelSelect() {
    let s = '';

    for (let level of TTV_API_AUTH_USERLEVELS) {
        s = '<option value="' + level + '" ' + (s === '' ? 'selected' : '') + '>' + level + '</option>' + s;
    }

    return s;
}

function TwitchAPI_Auth_DB_Add() {
    let user_name = document.getElementById('TwitchAPI_Authenticator_Interface_Name');
    let user_level = document.getElementById('TwitchAPI_Authenticator_Interface_Select');

    if (!user_name.value) {
        user_name.classList.add('missing');
        return;
    };
    user_name.classList.remove('missing');

    //Access API
    let opt = getAuthHeader();
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ user_name: user_name.value, user_level: user_level.value });

    fetch('/api/settings/TwitchAPI/ttvauth/user', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (!json.new_user) return;
            TTV_API_AUTH_USERS.push(json.new_user);
            TwitchAPI_Auth_DB_create();

            document.getElementById('TwitchAPI_Authenticator_Database').style.display = 'block';
            document.getElementById('TwitchAPI_Authenticator_Interface_Toggle').innerHTML = 'ADD USER';
            document.getElementById('TwitchAPI_Authenticator_Interface').style.display = 'none';

            OUTPUT_showInfo("User added!");
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function TwitchAPI_Auth_DB_edit(user_id) {
    //FInd Save Button
    let btns = HTMLArray2RealArray(document.getElementsByClassName('TwitchAPI_Authenticator_Users_BTN'));
    let saveBTN;
    for (let btn of btns) {
        if (btn instanceof Element && btn.dataset.type === 'save' && btn.dataset.userid === user_id + '') {
            saveBTN = btn;
            break;
        }
    }

    if (saveBTN.style.display === 'none' || saveBTN.style.display === '') {
        //Find Userlevel Element
        let ulElements = HTMLArray2RealArray(document.getElementsByClassName('TwitchAPI_Authenticator_Users_LEVEL'));
        let ulElement;
        for (let elElt of ulElements) {
            if (elElt instanceof Element && elElt.dataset.userid === user_id + '') {
                ulElement = elElt;
                break;
            }
        }

        //Find User
        let user_index;
        let user = TTV_API_AUTH_USERS.find((elt, idx) => {
            if (elt.user_id === user_id + "") {
                user_index = idx;
                return true;
            }
            return false;
        });
        
        if (!saveBTN || !ulElement || user_index === undefined|| !user) return;
        saveBTN.style.display = 'inline-block';
        saveBTN.style.display = 'inline-block';

        ulElement.remove();

        let select = document.createElement('select');
        select.dataset.userid = user_id + "";
        select.classList.add('TwitchAPI_Authenticator_Users_LEVEL_SELECT');
        select.innerHTML = TwitchAPI_Auth_DB_creatUserlevelSelect();
        select.value = user.user_level;
        document.getElementById('TwitchAPI_Authenticator_Users').insertBefore(select, document.getElementById('TwitchAPI_Authenticator_Users').childNodes[(user_index * 4) + 1]);
    } else {
        TwitchAPI_Auth_DB_create();
    }
}
function TwitchAPI_Auth_DB_save(user_id) {
    let ulElements = HTMLArray2RealArray(document.getElementsByClassName('TwitchAPI_Authenticator_Users_LEVEL_SELECT'));
    let user_level;
    for (let elElt of ulElements) {
        if (elElt instanceof Element && elElt.dataset.userid === user_id + '') {
            user_level = elElt;
            break;
        }
    }

    //Access API
    let opt = getAuthHeader();
    opt.method = 'PUT';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ user_id, user_level: user_level.value });

    fetch('/api/settings/TwitchAPI/ttvauth/user', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (!json.upt_user) return Promise.reject(new Error('User couldnt be editted!'));

            let user = TTV_API_AUTH_USERS.find(elt => elt.user_id == user_id);

            if (user) user.user_level = user_level.value;

            TwitchAPI_Auth_DB_create();
            OUTPUT_showInfo("User updated!");
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
async function TwitchAPI_Auth_DB_delete(user_id) {
    //Check if Last remaining Admin
    let user = TTV_API_AUTH_USERS.find(elt => elt.user_id === user_id + "");
    let last_admin = TTV_API_AUTH_USERS.filter(elt => elt.user_level === 'admin');

    try {
        if (user.user_level === 'admin' && last_admin.length === 1) {
            let answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', 'Removing the LAST Admin User while TTV Authenticator is active is not recommended! You will lose ALL access to settings and the Bot CANT recover from this without YOU editting Files on the Server! </br> We advice you to select another Authenticator or add another Admin User FIRST!');
            if (answer !== 'YES') return Promise.resolve();
        }
    } catch (err) {
        return Promise.resolve();
    }
    
    //Access API
    let opt = getAuthHeader();
    opt.method = 'DELETE';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ user_id });

    fetch('/api/settings/TwitchAPI/ttvauth/user', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.deleted !== true) return Promise.reject(new Error('User couldnt be deleted!'));

            let idx;

            TTV_API_AUTH_USERS.find((elt, index) => {
                if (elt.user_id == user_id) {
                    idx = index;
                    return true;
                }
                return false;
            });
            
            if (idx >= 0) TTV_API_AUTH_USERS.splice(idx, 1);
            
            TwitchAPI_Auth_DB_create();
            OUTPUT_showInfo("User deleted!");
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

function TwitchAPI_Auth_DB_Channel_change(value) {
    //Buffer Layer
    if (TwitchAPI_FETCHING === true) return;
    if (TTV_API_READY === false) return;

    setTimeout(() => {
        if (value === document.getElementById('TwitchAPI_Authenticator_Interface_Name').value)
            if (value.trim() == "") {
                document.getElementById('TwitchAPI_Auth_DB_Channel_Selector').style.display = 'none';
                document.getElementById('TwitchAPI_Auth_DB_Channel_Selector').innerHTML = '';
            }
            else
                TwitchAPI_Auth_Channel_Fetch(value);
    }, 100);
}
function TwitchAPI_Auth_DB_Channel_Selected(e) {
    if (e.target.id === 'TwitchAPI_Auth_DB_Channel_Selector') return;

    let elt = e.target;

    while (elt.id !== 'TwitchAPI_Auth_DB_Channel_Selector' && elt.parentElement.id !== 'TwitchAPI_Auth_DB_Channel_Selector') {
        elt = elt.parentElement;
    }

    if (!elt.dataset.channel) return;

    document.getElementById('TwitchAPI_Auth_DB_Channel_Selector').style.display = 'none';
    document.getElementById('TwitchAPI_Authenticator_Interface_Name').value = elt.dataset.channel;
}

function TwitchAPI_Auth_Channel_Fetch(value) {
    TwitchIRC_FETCHING = true;
    document.getElementById('TwitchAPI_Auth_DB_Channel_Selector').style.display = 'grid';
    fetch('/api/twitchapi/findchannel?channel=' + value, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            let s = '';
            for (let channel of json.data) {
                s += '<div ' + (channel.is_live ? 'class="live"' : '') + ' data-channel="' + channel.login + '"><div><img src="' + channel.img + '"/> <span class="name">' + (channel.display_name || channel.login) + '</span>' + (channel.is_live ? '<span class="live">LIVE</span>' : '') + '</div></div>';
            }
            document.getElementById('TwitchAPI_Auth_DB_Channel_Selector').innerHTML = s;

            TwitchAPI_FETCHING = false;
        })
        .catch(err => {
            if (err.message === 'Twitch API is disabled' || err.message === '404 - API Endpoint not found') {
                document.getElementById('TwitchAPI_Auth_DB_Channel_Selector').innerHTML = '<div><div><img /><span>Autofill from Twitch API Data not availabe.</span></div></div>';
                return;
            }

            TwitchAPI_FETCHING = false;
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

function TwitchAPI_API_create(endpoints = {}) {
    let Off_cats = [];
    let UnOff_cats = [];

    //Create Categories
    for (let api in endpoints.Official) {
        let cat = Off_cats.find(elt => elt.name === endpoints.Official[api].resource);
        if (cat) {
            cat.endpoints.push({ name: api, enabled: endpoints.Official[api].enabled, req_scope: endpoints.Official[api].req_scope });
        } else {
            Off_cats.push({ name: endpoints.Official[api].resource, endpoints: [{ name: api, enabled: endpoints.Official[api].enabled, req_scope: endpoints.Official[api].req_scope }] });
        }
    }
    for (let api in endpoints.UnOfficial) {
        let cat = UnOff_cats.find(elt => elt.name === endpoints.UnOfficial[api].resource);
        if (cat) {
            cat.endpoints.push({ name: api, enabled: endpoints.UnOfficial[api].enabled });
        } else {
            UnOff_cats.push({ name: endpoints.UnOfficial[api].resource, endpoints: [{ name: api, enabled: endpoints.UnOfficial[api].enabled }] });
        }
    }

    //Sort Categories
    Off_cats.sort((a, b) => sortAlphabetical(a.name, b.name));
    UnOff_cats.sort((a, b) => {
        if (b.resource === 'Unofficial') return 1;
        else return sortAlphabetical(a.name, b.name);
    });

    //Set Official
    let s = '';
    for (let cat of Off_cats) {
        s += TwitchAPI_API_createCategorie(cat, false);
    }
    document.getElementById('TWITCHAPI_API_ENABLES').innerHTML = s;

    //Set Unofficial
    s = '';
    for (let cat of UnOff_cats) {
        s += TwitchAPI_API_createCategorie(cat, true);
    }
    document.getElementById('TWITCHAPI_API_ENABLES_UNOFF').innerHTML = s;

    for (let elt of document.getElementsByClassName('TTV_API_ENDPOINT_ENABLE')) {
        if (elt instanceof Element && elt.tagName === 'SWITCHBUTTON') SWITCHBUTTON_AUTOFILL(elt);
    }
    for (let elt of document.getElementsByClassName('TTV_API_ENDPOINT_ENABLE_UNOFF')) {
        if (elt instanceof Element && elt.tagName === 'SWITCHBUTTON') SWITCHBUTTON_AUTOFILL(elt);
    }

    //Scope Legend
    s = '';
    for (let scope in TTV_API_SCOPES) {
        s += '<p title="' + scope + '"><span class="TTVAPI_API_LEGEND_IDX ' + (!TwitchAPI_hasScope(scope) ? 'missing ' : '') + (TwitchAPI_isBetaScope(scope) ? 'beta ' : '') + '">' + TwitchAPI_EventSub_GetScopeIdx(scope) + '</span> ' + TTV_API_SCOPES[scope].desc + '</p>';
    }
    document.getElementById('TWITCHAPI_API_LEGEND').innerHTML = s;
}
function TwitchAPI_API_createCategorie(cat, unoff = false) {
    let s = '';
    s += '<p>' + cat.name + '</p>';
    s += '<div class="ENDPOINT_CAT">';

    for (let api of cat.endpoints) {
        let missing = !TwitchAPI_hasScope(api.req_scope);
        let beta = TwitchAPI_isBetaScope(api.req_scope);
        s += '<span>' + api.name + '<span title="Requieres ' + (missing ? 'missing ' : '') + 'Scopes: ' + (api.req_scope instanceof Array ? api.req_scope.join(' or ') : api.req_scope) + ' " class="TTVAPI_API_LEGEND_IDX ' + (missing ? 'missing ' : '') + (beta ? 'beta ' : '') + '">' + TwitchAPI_EventSub_GetScopeIdx(api.req_scope) + '</span></span>' + SWITCHBUTTON_CREATE(api.enabled === true, false, 'TwitchAPI_Endpoint_Control(this, ' + unoff + '); ', null, 'data-endpoint="' + api.name + '"  class="TTV_API_ENDPOINT_ENABLE' + (unoff ? '_UNOFF' : '') + '"');
    }

    s += '</div>';
    return s;
}
async function TwitchAPI_Endpoint_Control(elt, unoff = false) {
    //Check
    if (elt.value === false && (elt.dataset.endpoint === 'Get Streams' || elt.dataset.endpoint === 'Get Users')) {
        let answer = 'NO';
        let warning = 'Disabling the "Get Streams" or "Get Users" Endpoints is not reccomended as they are requiered for Token Checks and many other User Authentications! You can still disable them, if you want tho!';
        
        try {
            answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', warning);
        } catch (err) {

        }

        if (answer !== 'YES') {
            SWITCHBUTTON_TOGGLE(elt);
            return Promise.resolve();
        }
    } else if (elt.value === true && unoff === true) {
        let answer = 'NO';
        let warning = 'Using Unofficial / Undocumented APIs might be inconsitent or subject to change. Updates and Support might be slow or cut down the line. But they are pretty neat and you can you them if you want!';

        try {
            answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', warning);
        } catch (err) {

        }

        if (answer !== 'YES') {
            SWITCHBUTTON_TOGGLE(elt);
            return Promise.resolve();
        }
    }

    //Toggle
    let opt = getAuthHeader();

    opt['method'] = 'PUT';
    opt['headers']['Content-Type'] = 'application/json';

    fetch("/api/settings/TwitchAPI/Endpoints/" + elt.dataset.endpoint + '?mode=toggle&unoff=' + unoff, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            SWITCHBUTTON_TOGGLE(elt, json.state);
            OUTPUT_showInfo('Endpoint toggled!');
        })
        .catch(err => {
            SWITCHBUTTON_TOGGLE(elt, elt.value === false);
            console.log(err);
            OUTPUT_showError(err.message);
        });

    return Promise.resolve();
}
async function TwitchAPI_Endpoint_Control_All(mode, unoff = false) {
    //Check
    if (elt.value === false && unoff === false) {
        let answer = 'NO';
        let warning = 'Disabling the "Get Streams" or "Get Users" Endpoints is not reccomended as they are requiered for Token Checks and many other User Authentications! You can still disable them, if you want tho!';

        try {
            answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', warning);
        } catch (err) {

        }

        if (answer !== 'YES') {
            for (let elt of document.getElementsByClassName('TTV_API_ENDPOINT_ENABLE')) {
                SWITCHBUTTON_TOGGLE(elt, json.state);
            }
            return Promise.resolve();
        }
    } else if (elt.value === true && unoff === true) {
        let answer = 'NO';
        let warning = 'Using Unofficial / Undocumented APIs might be inconsitent or subject to change. Updates and Support might be slow or cut down the line. But they are pretty neat and you can you them if you want!';

        try {
            answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', warning);
        } catch (err) {

        }

        if (answer !== 'YES') {
            for (let elt of document.getElementsByClassName('TTV_API_ENDPOINT_ENABLE_UNOFF')) {
                SWITCHBUTTON_TOGGLE(elt, json.state);
            }
            return Promise.resolve();
        }
    }

    //Change Settings
    let opt = getAuthHeader();

    opt['method'] = 'PUT';
    opt['headers']['Content-Type'] = 'application/json';

    fetch('/api/settings/TwitchAPI/Endpoints/all?mode=' + mode + '&unoff=' + unoff, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            for (let elt of document.getElementsByClassName('TTV_API_ENDPOINT_ENABLE' + (unoff ? '_UNOFF' : ''))) {
                SWITCHBUTTON_TOGGLE(elt, json.state);
            }
            OUTPUT_showInfo('Endpoints toggled!');
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });

    return Promise.resolve();
}
function TwitchAPI_Endpoint_Log(elt) {
    let opt = getAuthHeader();

    opt['method'] = 'PUT';
    opt['headers']['Content-Type'] = 'application/json';
    opt['body'] = JSON.stringify({ mode: 'toggle', setting: 'log_api_calls' });

    fetch("/api/settings/TwitchAPI/misc", opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            elt.checked = json.state === true;
            OUTPUT_showInfo('Logging ' + (json.state === true ? 'enabled' : 'disabled') +'!');
        })
        .catch(err => {
            elt.checked = elt.checked === false;
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

function TwitchAPI_EventSub_create(topics = {}) {
    let cats = [];

    //Create Categories
    for (let topic in topics) {
        let data = { name: topics[topic].name, enabled: topics[topic].enabled, value: topic, scope: topics[topic].scope };

        if (topics[topic].version === "beta") {
            let cat = cats.find(elt => elt.name === "Beta");
            if (cat) cat.eventsubs.push(data);
            else cats.push({ name: "Beta", eventsubs: [data] });
            continue;
        }

        let cat = cats.find(elt => elt.name === topics[topic].resource);
        if (cat) cat.eventsubs.push(data);
        else cats.push({ name: topics[topic].resource, eventsubs: [data] });
    }

    //Sort Categories
    cats.sort((a, b) => b.name === "Beta" ? -1 : a.name === "Beta" ? 1 : sortAlphabetical(a.name, b.name));

    //Set
    let s = '';
    for (let cat of cats) {
        s += TwitchAPI_EventSub_createCategorie(cat);
    }
    document.getElementById('TWITCHAPI_EVENTSUB_ENABLES').innerHTML = s;

    //Legend
    s = '';
    for (let scope in TTV_API_SCOPES) {
        let found = cats.find(elt => elt.eventsubs.find(topic => topic.scope ? (topic.scope === scope || (topic.scope instanceof Array && topic.scope.find(scope_elt => scope_elt === scope))) : null));

        if (found) {
            s += '<p title="' + scope + '"><span class="EVENTSUB_LEGEND_IDX ' + (!TwitchAPI_hasScope(scope) ? 'missing ' : '') + (TwitchAPI_isBetaScope(scope) ? 'beta ' : '') + '">' + TwitchAPI_EventSub_GetScopeIdx(scope) + '</span> ' + TTV_API_SCOPES[scope].desc + '</p>';
        }
    }
    document.getElementById('TWITCHAPI_EVENTSUB_LEGEND').innerHTML = s;

    for (let elt of document.getElementsByClassName('TTV_API_EVENTSUB_ENABLE')) {
        if (elt instanceof Element && elt.tagName === 'SWITCHBUTTON') SWITCHBUTTON_AUTOFILL(elt);
    }
}
function TwitchAPI_EventSub_createCategorie(cat) {
    let s = '';
    s += '<p ' + (cat.name === "Beta" ? 'class="beta"' : "") + '>' + cat.name + '</p>';
    s += '<div class="EVENTSUB_CAT">';

    for (let topic of cat.eventsubs) {
        let missing = !TwitchAPI_hasScope(topic.scope);
        let beta = TwitchAPI_isBetaScope(topic.scope);
        s += '<span>' + topic.name + '<span title="Requieres ' + (missing ? 'missing ' : '') + 'Scopes: ' + (topic.scope instanceof Array ? topic.scope.join(' or ') : topic.scope) + ' " class="EVENTSUB_LEGEND_IDX ' + (missing ? 'missing ' : '') + (beta ? 'beta ' : '') +'">' + TwitchAPI_EventSub_GetScopeIdx(topic.scope) + '</span></span>' + SWITCHBUTTON_CREATE(topic.enabled === true, false, 'TwitchAPI_EventSub_Control(this); ', null, 'data-topic="' + topic.value + '" class="TTV_API_EVENTSUB_ENABLE"');
    }

    s += '</div>';
    return s;
}
function TwitchAPI_EventSub_GetScopeIdx(scopes) {
    let idxs = [];

    if (!scopes) return "";
    if (!(scopes instanceof Array)) scopes = [scopes];


    for(let scope of scopes) {
        Object.getOwnPropertyNames(TTV_API_SCOPES)
            .find((elt, index) => {
                if (elt === scope) {
                    idxs.push(index+1);
                    return true;
                }
                return false;
            });
    }
    
    return idxs.join(',');
}
function TwitchAPI_hasScope(scopes) {
    if (!scopes) return true;
    if (!(scopes instanceof Array)) scopes = [scopes];

    for (let scope of scopes) {
        let found = (TTV_API_ACTIVE_SCOPES || []).find(elt => elt === scope);
        if (found) return true;
    }

    return false;
}
function TwitchAPI_isBetaScope(scope) {
    return (TTV_API_SCOPES[scope] || {}).beta === true;
}

async function TwitchAPI_EventSub_Control(elt) {
    //Toggle
    let opt = getAuthHeader();

    opt['method'] = 'PUT';
    opt['headers']['Content-Type'] = 'application/json';

    fetch("/api/settings/TwitchAPI/EventSub/" + elt.dataset.topic + '?mode=toggle', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            SWITCHBUTTON_TOGGLE(elt, json.state);
            OUTPUT_showInfo('EventSub toggled!');
        })
        .catch(err => {
            SWITCHBUTTON_TOGGLE(elt, elt.value === false);
            console.log(err);
            OUTPUT_showError(err.message);
        });

    return Promise.resolve();
}
async function TwitchAPI_EventSub_Control_All(mode) {
    let opt = getAuthHeader();

    opt['method'] = 'PUT';
    opt['headers']['Content-Type'] = 'application/json';

    fetch('/api/settings/TwitchAPI/EventSub/all?mode=' + mode, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            for (let elt of document.getElementsByClassName('TTV_API_EVENTSUB_ENABLE')) {
                SWITCHBUTTON_TOGGLE(elt, json.state);
            }
            OUTPUT_showInfo('EventSubs toggled!');
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//Util
function AddWizHash() {
    SetURLHashParam('_m', WIZARD_CURSOR[0]);
    SetURLHashParam('_g', WIZARD_CURSOR[1]);
    return window.location.href;
}
function GetModuleIndex(module) {
    let index = -1;
    WIZARD_NAV_DATA.find((elt, idx) => {
        if (elt.name === module) {
            index = idx;
            return true;
        }
        return false;
    });

    return index;
}
function GetGroupIndex(module, group) {
    let moduleObj = WIZARD_NAV_DATA[GetModuleIndex(module)];
    if (!moduleObj) return -1;

    let index = -1;
    moduleObj.groups.find((elt, idx) => {
        if (elt.name === group) {
            index = idx;
            return true;
        }
        return false;
    });

    return index;
}
async function AuthenticatorWarning(change_auth = '') {
    let curAuth = WIZARD_AUTHS.find(elt => elt.name === change_auth);
    if (!curAuth) return Promise.reject(new Error('Authenticator not found!'));

    let otherEnabled = false;
    for (let auth of WIZARD_AUTHS) if (auth.enabled === true && auth.name !== change_auth) otherEnabled = true;
    
    //Check Settings and setup User confirm, if necassary
    if (CUR_CONFIG['WebApp']['selected_Authenticator'] === curAuth.name || (curAuth.enabled === true && !otherEnabled)) {
        let answer = 'NO';
        let warning = 'Disabling the only Authenticator available isnt recommended! You will lose ALL access to settings and the Bot CANT recover from this without YOU editting Files on the Server! </br> We advice you to turn on another Authenticator FIRST!';

        if (CUR_CONFIG['WebApp']['selected_Authenticator'] === curAuth.name) warning = 'Disabling the current Authenticator isnt recommended! You will lose ALL access to settings and the Bot CANT recover from this without YOU editting Files on the Server! </br> We advice you to switch to another Authenticator FIRST!';

        try {
            answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', warning);
        } catch (err) {

        }
        return Promise.resolve(answer === 'YES');
    } 

    return Promise.resolve(true);
}

function sortAlphabetical(a, b, dir = 1) {
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a.charCodeAt(i) - b.charCodeAt(i) === 0) continue;
        return dir * (a.charCodeAt(i) - b.charCodeAt(i));
    }

    return dir * (a.length - b.length);
}