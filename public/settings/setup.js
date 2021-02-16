const TTV_API_SCOPES = {
    "analytics:read:extensions": {
        desc: "View analytics data for your extensions.",
        enabled: true,
        state: false
    },
    "bits:read": {
        desc: "View Bits information for your channel.",
        enabled: true,
        state: false
    },
    "channel:edit:commercial": {
        desc: "Run commercials on a channel.",
        enabled: true,
        state: false
    },
    "channel:manage:broadcast": {
        desc: "Manage your channel’s broadcast configuration, including updating channel configuration and managing stream markers and stream tags.",
        enabled: true,
        state: false
    },
    "channel:manage:extension": {
        desc: "Manage your channel’s extension configuration, including activating extensions.",
        enabled: true,
        state: false
    },
    "channel:read:hype_train": {
        desc: "Gets the most recent hype train on a channel.",
        enabled: true,
        state: false
    },
    "channel:read:stream_key": {
        desc: "Read an authorized user’s stream key.",
        enabled: true,
        state: false
    },
    "channel:read:subscriptions": {
        desc: "Get a list of all subscribers to your channel and check if a user is subscribed to your channel",
        enabled: true,
        state: false
    },
    "clips:edit": {
        desc: "Manage a clip object.",
        enabled: true,
        state: false
    },
    "user:edit": {
        desc: "Manage a user object.",
        enabled: true,
        state: false
    },
    "user:edit:follows": {
        desc: "Edit your follows.",
        enabled: true,
        state: false
    },
    "user:read:broadcast": {
        desc: "View your broadcasting configuration, including extension configurations.",
        enabled: true,
        state: false
    },
    "user:read:email": {
        desc: "Read an authorized user’s email address.",
        enabled: true,
        state: false
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
        ], convert: parseInt, default: 0
    }, {
        name: 'boolean', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'boolean' || 'type missmatch' }
        ], convert: x => x === "true", default: false
    }, {
        name: 'string', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'string' || 'type missmatch' },
            { name: 'minlength', check: (x, optionSet) => x.length >= optionSet.minlength || 'too short' }
        ], convert: x => x.toString(), default: ''
    }, {
        name: 'object', options: [
            { name: 'type', check: (x, optionSet) => typeof (x) === 'object' || 'type missmatch' }
        ], convert: x => x === "true", default: {}
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
        ], default: []
    }
];

let CUR_CONFIG = {};

let WIZARD_CURSOR = [0, 0];
let WIZARD_NAV_DATA = [];

const WIZARD_PatchPanel = {
    WebApp: {
        Port: 'FrikyBot_WebApp_Port',
        authentication_enable: 'FrikyBot_WebApp_authentication_enable',
        authentication_secret: 'FrikyBot_WebApp_authentication_secret'
    },
    TwitchIRC: {
        login: '',
        oauth: '',
        channel: 'TwitchIRC_Channel_Channel',
        support_BTTV: 'TwitchIRC_Misc_and_Emotes_BTTV',
        support_FFZ: 'TwitchIRC_Misc_and_Emotes_FFZ'
    },
    TwitchAPI: {
        ClientID: 'TwitchAPI_Your_Application_ID',
        Secret: 'TwitchAPI_Your_Application_Secret',
        Scopes: 'TwitchAPI_Your_Application_URL'
    },
    DataCollection: {

    },
    Packages: {

    }
};

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
    //Data
    try {
        let data = await FetchSettings();
        console.log(data);
        
        WIZARD_create(data.tmpl, data.cfg);
        CUR_CONFIG = data.cfg;

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
    
    WIZARD_go2Hash();

    //DONE
    document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SETUP').style.display = 'block';

    SWITCHBUTTON_AUTOFILL();
}

//Setup General
function switchMode(elt) {
    
}








//Wiz2
function WIZARD_create(template, config = {}) {
    WIZARD_createNaviation(template);
    WIZARD_updateContent(config);
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
        if (modules[i].name === 'TwitchAPI') groups.splice(2, 0, { name: 'Reboot' });

        for (let j = 0; j < groups.length; j++) cols += (j !== 0 ? ' ' : '') + ((1 / groups.length) * 100) + '%';
        
        groupsHTML += '<div class="WIZ_NAV_GROUP" style="grid-template-columns: ' + cols + ';" ' + (i != WIZARD_CURSOR[0] ? ' hidden' : '') + '>';
        for (let j = 0; j < groups.length; j++) {
            groupsHTML += '<div ' + (i == WIZARD_CURSOR[0] && j == WIZARD_CURSOR[1] ? 'selected' : '') + ' ' + ((modules[i].options.opt || modules[i].options.wip) && j !== 0 ? ' disabled' : '') + '>' + groups[j].name + '</div>';
        }
        groupsHTML += '</div>';
    }

    document.getElementById('WIZ_NAV_MODULES').innerHTML = mainsHTML;
    document.getElementById('WIZ_NAV_GROUPS').innerHTML = groupsHTML;
}

function WIZARD_updateContent(cfg) {
    
}
function WIZARD_createSetting(setting, id_root = "", value) {
    id_root = replaceAll(id_root, ' ', '_');

    let s = '<h4>' + setting.name + '</h4>';

    let stgTemplate = SETTINGTYPES.find(elt => elt.name === setting.type);

    let defau = setting.default || stgTemplate.default;

    if (setting.type === 'number') {
        s += '<input type="number" id="' + id_root + setting.name + '" placeholder="' + (value || defau) + '" value="' + (value || defau) + '"';
        if (setting.min) s += 'min="' + setting.min + '" ';
        if (setting.max) s += 'max="' + setting.max + '" ';
        if (setting.range) s += 'min="' + setting.range.substring(0, setting.range.indexOf(':')) + '" max="' + setting.range.substring(setting.range.indexOf(':') + 1) + '" ';
        s += '></input>';
    } else if (setting.type === 'boolean') {
        s += '<switchbutton id="' + id_root + setting.name + '" value="' + (value || defau) + '"></switchbutton>';
    } else if (setting.type === 'array') {
        //Selection
        if (setting.selection) {
            s += '<div id="' + id_root + setting.name + '" class="ARRAY_SELECTION">';
            if (!value) value = [];

            for (let i = 0; i < setting.selection.length; i++) {
                s += '<span>' + (setting.selectionDescription ? setting.selectionDescription[i] : setting.selection[i]) + '</span>';
                s += '<switchbutton id="' + id_root + setting.name + "_" + setting.selection[i] + '" value="' + (value.find(elt => elt === setting.selection[i]) !== undefined ) + '"></switchbutton>';
            }
            s += '</div>';
        }
        //Add / Remove
        else {
            s += '<h4>WiP</h4>';
        }
    } else {
        s += '<input type="text" id="' + id_root + setting.name + '" placeholder="' + (value || defau) + '" value="' + (value || defau) + '"';
        s += '></input>';
    }

    return s;
}

//WIZARD DSIPLAY
function WIZARD_show(module, group, hold = false) {
    let moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;

    //Hide Current
    document.getElementsByClassName('WIZ_NAV_MODULE')[WIZARD_CURSOR[0]].removeAttribute('selected');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].setAttribute('hidden', '');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].childNodes[WIZARD_CURSOR[1]].removeAttribute('selected');
    document.getElementsByClassName('WIZ_GROUP_' + moduleName)[WIZARD_CURSOR[1]].setAttribute('hidden', '');
    
    //Template Check - and get new target location
    if (module > WIZARD_CURSOR[0] || (module == WIZARD_CURSOR[0] && group > WIZARD_CURSOR[1])) {
        let result = WIZARD_check(module, group, hold);

        module = result[0];
        group = result[1];
    }
    
    WIZARD_CURSOR[0] = module;
    WIZARD_CURSOR[1] = group;
    moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;

    //Show New
    document.getElementsByClassName('WIZ_NAV_MODULE')[WIZARD_CURSOR[0]].setAttribute('selected', '');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].removeAttribute('hidden');
    document.getElementsByClassName('WIZ_NAV_GROUP')[WIZARD_CURSOR[0]].childNodes[WIZARD_CURSOR[1]].setAttribute('selected', '');
    document.getElementsByClassName('WIZ_GROUP_' + moduleName)[WIZARD_CURSOR[1]].removeAttribute('hidden');

    console.log(document.getElementsByClassName('WIZ_GROUP_' + moduleName)[WIZARD_CURSOR[1]]);

    //Update UI
    WIZARD_updateUI();

    //Util
    WIZARD_onShow();
}
function WIZARD_updateUI() {
    let mainIdx = WIZARD_CURSOR[0];
    let groupIdx = WIZARD_CURSOR[1];

    //Buttons
    let buttons = [];
    let cols = '';

    if (mainIdx > 0 || groupIdx > 0) buttons.push('BACK');
    if (!(mainIdx == WIZARD_NAV_DATA.length - 1 && groupIdx === WIZARD_NAV_DATA[mainIdx].groups.length - 1)) buttons.push('NEXT');
    else buttons.push('SAVE');

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

    if (hMdl) hMdl = hMdl.value[0];
    if (hGrp) hGrp = hGrp.value[0];

    WIZARD_show(parseInt(hMdl) || 0, parseInt(hGrp) || 0);
}

//Template Check
function WIZARD_check(targetModule, targetGroup, hold) {
    let curModule = WIZARD_CURSOR[0];
    let curGroup = WIZARD_CURSOR[1];
    
    do {
        let moduleName = WIZARD_NAV_DATA[curModule].name;
        let settings = WIZARD_NAV_DATA[curModule].groups[curGroup].settings;
        let test_result = WIZARD_check_Group(settings, curModule);

        let status = true;

        for (let rslt of test_result) {
            if (rslt.result === true) {
                //Color Complete
                document.getElementById(WIZARD_PatchPanel[moduleName][rslt.name]).removeAttribute('requiered');
            } else {
                //Color Requiered
                status = false;
                document.getElementById(WIZARD_PatchPanel[moduleName][rslt.name]).setAttribute('requiered', '');
            }
        }

        if (status) document.getElementsByClassName('WIZ_NAV_GROUP')[curModule].childNodes[curGroup].setAttribute('complete', '');
        else document.getElementsByClassName('WIZ_NAV_GROUP')[curModule].childNodes[curGroup].removeAttribute('complete');

    } while (false && curModule < targetModule && curGroup < targetGroup);

    return [targetModule, targetGroup];
}
function WIZARD_check_Group(settings, module) {
    let errors = [];
    let moduleName = WIZARD_NAV_DATA[module].name;

    for (let stg of settings) {
        //Get current Value
        let elt = document.getElementById(WIZARD_PatchPanel[moduleName][stg.name]) || {};
        let value = elt.value;
        errors.push({ name: stg.name, result: WIZARD_check_Setting(stg.type, value, stg) });
    }

    return errors;
}
function WIZARD_check_Setting(name, value, options) {
    //Skip unknown Types
    if (!name) return true;

    let TYPE = SETTINGTYPES.find(elt => elt.name === name);

    let converted_type = TYPE.convert(value);
    
    //Check Variable Types
    for (let type in options) {
        //Skip general info
        if (type === 'name' || type === 'opt' || type === 'default') continue;

        //Find Type - skip unknowns
        let TYPEtype = TYPE.options.find(elt => elt.name === type);
        if (!TYPEtype) continue;

        //Check and return result on error
        let result = TYPEtype.check(converted_type, options);
        if (result !== true) return result;
    }

    return true;
}

function WIZARD_onShow() {

}
function WIZARD_onRestart() {
    let moduleName = WIZARD_NAV_DATA[WIZARD_CURSOR[0]].name;

    if (moduleName === 'WebApp' && WIZARD_CURSOR[1] === 1) {
        let opt = getAuthHeader();
        opt.method = 'POST';
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify({ port: parseInt(document.getElementById(WIZARD_PatchPanel.WebApp.Port).value) });

        fetch('/api/settings/webapp/port', opt)
            .then(STANDARD_FETCH_RESPONSE_CHECKER)
            .then(json => {
                if (json.msg === '200') {
                    let outS = 'Bot Restarting at Port: ' + json.port;
                    outS += '</br><b>Since Cookies arent shared between Ports, you have to <a href="http://localhost:' + json.port + '/login" target="_blank">log in</a> again! </b>';
                    outS += '</br>Go <a href="http://localhost:' + json.port + '/settings/setup#_m=0&_g=1">here</a> after login to resume Setup at this Step!';
                    OUTPUT_showInfo(outS);
                } else OUTPUT_showError('500 - Internal Error.');
            })
            .catch(err => {
                OUTPUT_showError(err.message);
            });
    }
}
function WIZARD_onSave() {

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

//WebApp
function port_change(value) {
    if (value == CUR_CONFIG.WebApp.Port) {
        document.getElementById('WIZ_UI_RESTART').setAttribute('hidden', '');
        document.getElementById('WIZ_UI_NEXT').removeAttribute('hidden');
        document.getElementById('FrikyBot_WebApp_Port_Hint').setAttribute('hidden', '');
        return;
    }

    document.getElementById('FrikyBot_WebApp_Port_Hint').removeAttribute('hidden');
    document.getElementById('WIZ_UI_NEXT').setAttribute('hidden', '');
    document.getElementById('WIZ_UI_RESTART').removeAttribute('hidden');
}
function FrikyBot_auth_show(btn) {
    let elt = document.getElementById('FrikyBot_WebApp_authentication_secret');
    if (elt) {
        elt.type = elt.type === 'password' ? 'text' : 'password';
        btn.innerHTML = elt.type === 'password' ? 'SHOW SECRET' : 'HIDE SECRET';
    }
}
function FrikyBot_auth_enable(elt) {
    console.log(elt.value);
}
function FrikyBot_auth_regen() {
    fetch('/api/settings/webapp/fbauth/regen', getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            console.log(json);
            if (json.new_secret !== undefined && json.new_token !== undefined) {
                document.getElementById('FrikyBot_WebApp_authentication_secret').value = json.new_secret;

                LOGIN_logout();
                return LOGIN_login(json.new_token);
            }
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

//TTV API
function TwitchAPI_UserLogin_createScopes() {
    let s = '';

    for (let scope in TTV_API_SCOPES) {
        if (TTV_API_SCOPES[scope].enabled !== true) continue;

        s += '<div>' + TTV_API_SCOPES[scope].desc + '</div>';
        s += '<SWITCHBUTTON class="TTV_API_SCOPE" value="' + (TTV_API_SCOPES[scope].state === true) + '" data-id="' + scope + '"></SWITCHBUTTON>';
    }
    
    s += '<span style="color: red;">For new Scopes to have Effect, you have to log in again!</span><div></div>';
    document.getElementById('TWITCHAPI_USERLOGIN_SCOPES').innerHTML = s;
}
function TwitchAPI_UserLogin_getScopes() {
    return HTMLArray2RealArray(document.getElementsByClassName('TTV_API_SCOPE')).reduce((acc, elt) => {
        if(elt.value === true) acc.push(elt.dataset.id)
    }, []);
}




























//TTV API
function SETUP_TTV_API(data) {
    if (!data) return;
    
    //App Token
    if (data.app && document.getElementById('TWITCHAPI_APP_DATA')) {
        TTV_API_APP_TOKEN = data.app;
        //CENTERS
        for (let cen of document.getElementById('TWITCHAPI_APP_DATA').childNodes) {
            if (cen instanceof Element && cen.tagName === "DIV") {
                //DIVS
                for (let div of cen.childNodes) {
                    if (div instanceof Element && div.id === "TWITCHAPI_APP_IAT") {
                        div.innerHTML = (data.app.iat != undefined ? new Date(TTV_API_APP_TOKEN.iat * 1000).toLocaleString('de-DE') : "UNKNOWN");
                    } else if (div instanceof Element && div.id === "TWITCHAPI_APP_EXP") {
                        let interval = setInterval(() => {
                            let until = new Date(TTV_API_APP_TOKEN.exp * 1000) - new Date();
                            until = Math.floor(until / 1000);

                            let d = Math.floor(until / (60 * 60 * 24));
                            until -= d * 60 * 60 * 24;

                            let h = Math.floor(until / (60 * 60));
                            until -= h * 60 * 60;

                            let m = Math.floor(until / 60);
                            until -= m * 60;

                            let s = until;

                            if (until < 0 || d < 0 || h < 0 || m < 0 || s < 0) {
                                div.innerHTML = (TTV_API_APP_TOKEN.iat != undefined ? "00D 00H 00M 00S" : "UNKNOWN");
                                clearInterval(interval);
                            } else {
                                if (h < 10) h = '0' + h;
                                if (m < 10) m = '0' + m;
                                if (s < 10) s = '0' + s;
                                div.innerHTML = (TTV_API_APP_TOKEN.iat != undefined ? d + "D " + h + "H " + m + "M " + s + "S" : "UNKNOWN");
                            }
                        }, 1000);
                    }
                }
            }
        }
    }

    //User Token
    if (data.user) {
        //Scopes
        let s = '';

        for (let scope in TTV_API_SCOPES) {
            if (TTV_API_SCOPES[scope].enabled !== true) continue;

            s += '<div>' + TTV_API_SCOPES[scope].desc + '</div>';

            s += '<div>';
            s += SWITCH_BUTTON_CREATE(data.user.scopes.find(elt => elt === scope) !== undefined, false, null, scope);
            s += '</div>';
        }

        s += '<span style="color: red;">For new Scopes to have Effect, you have to log in again!</span><div></div>';
        document.getElementById('TWITCHAPI_SCOPES').innerHTML = s;

        //Login Button
        if (data.user.sub) {
            TTV_API_USER_TOKEN = data.user;
            TTV_LOGIN_SETDATA(document.getElementById('TWITCHAPI_LOGIN').childNodes[1], TTV_API_USER_TOKEN);
        }
    }

    document.getElementById('SETUP_TWITCH_API').style.display = 'block';
}
function GetTwitchAPI_Scopes() {
    let scopes = [];

    for (let i = 1; i < document.getElementById('TWITCHAPI_SCOPES').childNodes.length; i += 2) {
        let div = document.getElementById('TWITCHAPI_SCOPES').childNodes[i];

        for (let element of div.childNodes) {
            if (element instanceof Element && element.classList.contains('SWITCH_BUTTON')) {
                if (element.id && SWITCH_BUTTON_GETVALUE_ELT(element))
                    scopes.push(element.id);
            }
        }
    }

    return scopes;
}
async function TTV_API_CHECKTOKEN(type) {
    let opt = getFetchHeader();

    try {
        let response = await fetch("/api/TwitchAPI/token?type=" + type, opt);
        let json = await checkResponse(response);
        
        if (json.err) {
            OUTPUT_showError(json.err);
        } else {
            let outS = '';

            for (let typeee of json.data) {
                if (typeee.type === 'app') {
                    TTV_API_APP_TOKEN = typeee.data;
                    outS += ' App Token: ' + typeee.state;
                } else if (typeee.type === 'user') {
                    TTV_API_USER_TOKEN = typeee.data;
                    outS += ' User Token: ' + typeee.state;

                    TTV_LOGIN_SETDATA(document.getElementById('TWITCHAPI_LOGIN').childNodes[1], TTV_API_USER_TOKEN);
                }
            }
            
            OUTPUT_showInfo(outS);
        }

    } catch (err) {
        OUTPUT_showError(err.message);
        console.log(err);
    }
}
async function TTV_API_DELETETOKEN(type) {
    let opt = getFetchHeader();
    opt.method = 'DELETE';
    
    try {
        let response = await fetch("/api/TwitchAPI/token?type=" + type, opt);
        let json = await checkResponse(response);
        
        if (json.err) {
            OUTPUT_showError(json.err);
        } else {
            for (let typeee of json.data) {
                if (typeee.state === 'deleted')
                    OUTPUT_showInfo('Token deleted!');
                else
                    OUTPUT_showError('Token failed to be deleted!');

                if (typeee.type === 'user') {
                    TTV_LOGIN_RESET(document.getElementById('TWITCHAPI_LOGIN').childNodes[1]);
                } else if (typeee.type === 'app') {
                    if (document.getElementById('TWITCHAPI_APP_DATA')) {
                        //CENTERS
                        for (let cen of document.getElementById('TWITCHAPI_APP_DATA').childNodes) {
                            if (cen instanceof Element && cen.tagName === "DIV") {
                                //DIVS
                                for (let div of cen.childNodes) {
                                    if (div instanceof Element && div.id === "TWITCHAPI_APP_IAT") {
                                        div.innerHTML = (data.app.iat != undefined ? new Date(TTV_API_APP_TOKEN.iat * 1000).toLocaleString('de-DE') : "UNKNOWN");
                                    } else if (div instanceof Element && div.id === "TWITCHAPI_APP_EXP") {
                                        let interval = setInterval(() => {
                                            let until = new Date(TTV_API_APP_TOKEN.exp * 1000) - new Date();
                                            until = Math.floor(until / 1000);

                                            let d = Math.floor(until / (60 * 60 * 24));
                                            until -= d * 60 * 60 * 24;

                                            let h = Math.floor(until / (60 * 60));
                                            until -= h * 60 * 60;

                                            let m = Math.floor(until / 60);
                                            until -= m * 60;

                                            let s = until;

                                            if (until < 0 || d < 0 || h < 0 || m < 0 || s < 0) {
                                                div.innerHTML = (TTV_API_APP_TOKEN.iat != undefined ? "00D 00H 00M 00S" : "UNKNOWN");
                                                clearInterval(interval);
                                            } else {
                                                if (h < 10) h = '0' + h;
                                                if (m < 10) m = '0' + m;
                                                if (s < 10) s = '0' + s;
                                                div.innerHTML = (TTV_API_APP_TOKEN.iat != undefined ? d + "D " + h + "H " + m + "M " + s + "S" : "UNKNOWN");
                                            }
                                        }, 1000);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        OUTPUT_showError(err.message);
        console.log(err);
    }
}

//TTV IRC
function SETUP_TTV_IRC(data) {
    if (!data) return;

    for (let input of document.getElementById('TWITCHIRC_CONNECTION').childNodes) {
        if (input instanceof Element && input.tagName === "INPUT") {
            if (data.channel)
                input.setAttribute('placeholder', data.channel.substring(1));
        } else if (input instanceof Element && input.classList.contains('LIVE')) {
            if (data.channel_state !== true)
                input.style.display = 'none';
        }
    }

    document.getElementById('SETUP_TWITCH_IRC').style.display = 'block';
}

//AUTHENTICATOR
function SETUP_AUTHENTICATOR(data) {
    if (!data || !document.getElementById('AUTHENTICATOR_USERS')) return;

    //Interface Buttons Handler
    MISC_BUTTON_SETTINGS.OnClick = (elt, id) => {
        let key = id.split('_');

        if (key[2] === 'TRASH') {
            SETUP_AUTHENTICATOR_REMOVE(key[1]);
        } else if (key[2] === 'EDIT') {
            let user = AUTHENTICATOR_DATA.find(elt => elt.user_id == key[1]);

            if (!user) return;

            document.getElementById('AUTHENTICATOR_' + key[1] + '_LEVEL').innerHTML = SETUP_AUTHENTICATOR_USER_LEVEL(user.user_level);
            document.getElementById('AUTHENTICATOR_' + key[1] + '_EDIT').parentElement.innerHTML = MISC_BUTTON_SAVE_CREATE('AUTHENTICATOR_' + key[1] + '_SAVE');
        } else if (key[2] === 'SAVE') {
            SETUP_AUTHENTICATOR_EDIT_SAVE(key[1]);
        }
    };
    
    //Display User
    AUTHENTICATOR_DATA = data.users;
    SETUP_AUTHENTICATOR_DISPLAY();

    document.getElementById('SETUP_AUTHENTICATOR').style.display = 'block';
}
function SETUP_AUTHENTICATOR_DISPLAY(data) {
    let s = '';

    for (let user of AUTHENTICATOR_DATA) {
        s += SETUP_AUTHENTICATOR_USER(user);
    }

    //Delete Old Elements
    let old = document.getElementById('AUTHENTICATOR_USERS');
    old = HTMLElementArrayToArray(old.childNodes);

    for (let div of old) {
        if (div instanceof Element && !div.classList.contains('AUTHENTICATOR_USERS_HEADER')) {
            div.remove();
        }
    }

    //Display new Rows
    if (s === '') {
        s = '<div class="AUTHENTICATOR_USERS_NOT_FOUND"></div><div class="AUTHENTICATOR_USERS_NOT_FOUND"></div><div class="AUTHENTICATOR_USERS_NOT_FOUND">NO USERS FOUND</div><div class="AUTHENTICATOR_USERS_NOT_FOUND"></div><div class="AUTHENTICATOR_USERS_NOT_FOUND"></div><div class="AUTHENTICATOR_USERS_NOT_FOUND"></div><div class="AUTHENTICATOR_USERS_NOT_FOUND"></div><div class="AUTHENTICATOR_USERS_NOT_FOUND"></div>';
    }

    document.getElementById('AUTHENTICATOR_USERS').innerHTML += s;
}

function SETUP_AUTHENTICATOR_ADD() {
    const UN_ELT = document.getElementById('AUTHENTICATOR_Interface_Username');
    const UL_ELT = document.getElementById('AUTHENTICATOR_Interface_Userlevel');

    let any = false;

    //UID Check
    if (UN_ELT.value === '') {
        UN_ELT.classList.add('fillpls');
        any = true;
    } else
        UN_ELT.classList.remove('fillpls');

    //UL Check
    if (UL_ELT.value === 'none') {
        UL_ELT.classList.add('fillpls');
        any = true;
    } else
        UL_ELT.classList.remove('fillpls');

    if (any) return;

    //Waiting
    CHECKMARK_TOGGLE(document.getElementById('SETUP_AUTHENTICATOR_ADD_WAIT'), 'WAITING');

    //Send Request
    let opt = getFetchHeader();
    opt.headers['Content-Type'] = 'application/json';
    opt.method = 'POST';
    opt.body = JSON.stringify({
        user_name: UN_ELT.value,
        user_level: UL_ELT.value
    });

    fetch("/api/Authenticator/user", opt)
        .then(checkResponse)
        .then(json => {
            //ERR CHECK
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else if (!json.new_user) {
                return Promise.reject(new Error("User couldn´t be added!"));
            }

            //Update Page
            AUTHENTICATOR_DATA.push(json.new_user);
            SETUP_AUTHENTICATOR_DISPLAY();

            UN_ELT.value = '';
            UL_ELT.value = 'none';

            OUTPUT_showInfo('User added!');
            CHECKMARK_TOGGLE(document.getElementById('SETUP_AUTHENTICATOR_ADD_WAIT'), 'SUCCESS');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            CHECKMARK_TOGGLE(document.getElementById('SETUP_AUTHENTICATOR_ADD_WAIT'), 'FAILED');
        });
}
function SETUP_AUTHENTICATOR_REMOVE(id) {
    //Waiting
    document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK').style.display = 'block';
    CHECKMARK_TOGGLE(document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK'), 'WAITING');

    //Send Request
    let opt = getFetchHeader();
    opt.headers['Content-Type'] = 'application/json';
    opt.method = 'DELETE';
    opt.body = JSON.stringify({ user_id: id });
    
    fetch("/api/Authenticator/user", opt)
        .then(checkResponse)
        .then(json => {
            //ERR CHECK
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else if (!json.deleted || json.deleted <= 0) {
                return Promise.reject(new Error("User couldn´t be added!"));
            }

            //Update Page
            AUTHENTICATOR_DATA = AUTHENTICATOR_DATA.filter(user => user.user_id !== id);
            SETUP_AUTHENTICATOR_DISPLAY();

            OUTPUT_showInfo('User removed!');

            CHECKMARK_TOGGLE(document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK'), 'SUCCESS');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            CHECKMARK_TOGGLE(document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK'), 'FAILED');
        });
}
function SETUP_AUTHENTICATOR_EDIT_SAVE(id) {
    let user_level = document.getElementById('AUTHENTICATOR_' + id + '_LEVEL').childNodes[0].value;

    //Waiting
    document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK').style.display = 'block';
    CHECKMARK_TOGGLE(document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK'), 'WAITING');

    //Send Request
    let opt = getFetchHeader();
    opt.headers['Content-Type'] = 'application/json';
    opt.method = 'PUT';
    opt.body = JSON.stringify({
        user_id: id,
        user_level: user_level
    });

    fetch("/api/Authenticator/user", opt)
        .then(checkResponse)
        .then(json => {
            //ERR CHECK
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else if (!json.upt_user || json.upt_user <= 0) {
                return Promise.reject(new Error("User couldn´t be updated!"));
            }

            //Update Page
            let idx;
            AUTHENTICATOR_DATA.find((user, index) => {
                idx = index;
                return user.user_id == id;
            });
            AUTHENTICATOR_DATA[idx].user_level = user_level;
            SETUP_AUTHENTICATOR_DISPLAY();

            OUTPUT_showInfo('User updated!');

            CHECKMARK_TOGGLE(document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK'), 'SUCCESS');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            CHECKMARK_TOGGLE(document.getElementById('AUTHENTICATOR_' + id + '_CHECKMARK'), 'FAILED');
        });
}

function SETUP_AUTHENTICATOR_USER(user) {
    let s = '';

    s += '<div>' + user.user_id + '</div>';
    s += '<div>' + user.user_name + '</div>';
    s += '<div id="AUTHENTICATOR_' + user.user_id + '_LEVEL">' + user.user_level + '</div>';
    s += '<div>' + user.added_by + '</div>';
    s += '<div>' + GetTime(user.added_at * 1000) + '</div>';
    s += '<div>' + CHECKMARK_CREATE(null, 'AUTHENTICATOR_' + user.user_id + '_CHECKMARK') + '</div>';
    s += MISC_BUTTON_TRASH_CREATE('AUTHENTICATOR_' + user.user_id + '_TRASH');
    s += '<div>' + MISC_BUTTON_EDIT_CREATE('AUTHENTICATOR_' + user.user_id + '_EDIT') + '</div>';

    return s;
}
function SETUP_AUTHENTICATOR_USER_LEVEL(level) {
    let s = '';

    s += '<select name="userlevel">';
    s += '<option value="admin" ' + (level === 'admin' ? 'selected' : '') + '>Admin</option>';
    s += '<option value="staff"' + (level === 'staff' ? 'selected' : '') + '>Staff</option>';
    s += '<option value="moderator"' + (level === 'moderator' ? 'selected' : '') + '>Moderator</option>';
    s += '<option value="subscriber"' + (level === 'subscriber' ? 'selected' : '') + '>Subscriber</option>';
    s += '<option value="viewer"' + (level === 'viewer' ? 'selected' : '') + '>Viewer</option>';
    s += '</select>';

    return s;
}
function SETUP_AUTHENTICATOR_USER_SORT(type = '', elt) {
    let dir = -1;

    //CSS
    if (!(elt instanceof Element)) return;
    if (AUTHENTICATOR_CUR_SORT_ELT !== type) {
        for (let hdr of document.getElementsByClassName('AUTHENTICATOR_USERS_HEADER')) {
            if (hdr instanceof Element && hdr.classList.contains(AUTHENTICATOR_CUR_SORT_ELT)) {
                hdr.classList.remove('UP');
                hdr.classList.remove('DOWN');
            }
        }
    }
    AUTHENTICATOR_CUR_SORT_ELT = type;

    if (elt.classList.contains('UP')) {
        elt.classList.remove('UP');
        elt.classList.add('DOWN');
        dir = -1;
    } else {
        elt.classList.remove('DOWN');
        elt.classList.add('UP');
        dir = 1;
    }
    
    //Sorting
    if (type === 'id') {
        AUTHENTICATOR_DATA.sort((a, b) => dir * (a.user_id - b.user_id));
    } else if (type === 'name') {
        AUTHENTICATOR_DATA.sort((a, b) => dir * (a.user_name < b.user_name ? -1 : 1));
    } else if (type === 'level') {
        AUTHENTICATOR_DATA.sort((a, b) => dir * (a.user_level < b.user_level ? -1 : 1));
    } else if (type === 'by') {
        AUTHENTICATOR_DATA.sort((a, b) => dir * (a.added_by < b.added_by ? -1 : 1));
    } else if (type === 'at') {
        AUTHENTICATOR_DATA.sort((a, b) => dir * (a.added_at - b.added_at));
    } else {
        return;
    }

    //Make New Rows
    let s = '';

    for (let user of AUTHENTICATOR_DATA) {
        s += SETUP_AUTHENTICATOR_USER(user);
    }

    if (s !== '') {
        //Delete Old Elements
        let old = document.getElementById('AUTHENTICATOR_USERS');
        old = HTMLElementArrayToArray(old.childNodes);

        for (let div of old) {
            if (div instanceof Element && !div.classList.contains('AUTHENTICATOR_USERS_HEADER')) {
                div.remove();
            }
        }

        //Display new Rows
        document.getElementById('AUTHENTICATOR_USERS').innerHTML += s;
    }
}

//DataCollection
//sooon

//WebApp
function SETUP_WEBAPP(data) {
    if (!data || !document.getElementById('SETUP_WEBAPP')) return;

    let s = '<ol>';

    for (let layer of data.Routing) {
        s += SETUP_WEBAPP_createLayer2(layer);
    }

    document.getElementById('SETUP_WEBAPP_ROUTING').innerHTML = s + '</ol>';
    document.getElementById('SETUP_WEBAPP').style.display = 'block';
}
function SETUP_WEBAPP_createLayer2(layer, api = false) {
    if (!layer.stack || layer.stack.length === 0) return '';

    let s = '';
    s += '<li>';

    let temp = "";

    for (let sub_layer of layer.stack) {
        temp += SETUP_WEBAPP_createLayer2(sub_layer, layer.name === 'API Router');
    }

    s += layer.name + '</li>';

    if (temp) {
        s += '<ol>';
        s += temp;
        s += '</ol>';
    }

    return s;
}
function SETUP_WEBAPP_Routing_toggle(elt, show) {
    if (elt && document.getElementById('SETUP_WEBAPP_ROUTING')) {
        if (show === false)
            document.getElementById('SETUP_WEBAPP_ROUTING').classList.remove('hidden');
        else if (show === true)
            document.getElementById('SETUP_WEBAPP_ROUTING').classList.add('hidden');
        else
            document.getElementById('SETUP_WEBAPP_ROUTING').classList.toggle('hidden');

        elt.innerHTML = document.getElementById('SETUP_WEBAPP_ROUTING').classList.contains('hidden') ? 'show' : 'hide';
    }
}