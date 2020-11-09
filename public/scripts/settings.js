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

let TTV_API_APP_TOKEN = {
    iat: NaN,
    exp: NaN
}; 
let TTV_API_USER_TOKEN = {
    iat: NaN,
    exp: NaN
};
let AUTHENTICATOR_DATA = [];
let AUTHENTICATOR_CUR_SORT_ELT;

async function init() {
    OUTPUT_create();

    //Error Report
    if (window.location.search.indexOf("?error=") >= 0) {
        let start = window.location.search.indexOf("?error=") + 7;
        let end = window.location.search.indexOf("&", start) < 0 ? window.location.search.length : window.location.search.indexOf("&", start);
        OUTPUT_showError(decodeURI(window.location.search.substring(start, end)));
    }


    let section = window.location.pathname.substring(9);
    let display_data;
    if (section === "") {
        section = 'control';
        display_data = CONTROL;
    } else if (section === "/setup") {
        section = 'setup';
        display_data = SETUP;
    } else if (section === "/packages") {
        section = 'packages';
        display_data = PACKAGES;
    } else if (section === "/logs") {
        section = 'logs';
        display_data = LOGS;
    } else {
        OUTPUT_showError("PAGE CONTENT NOT AVAILABLE!");
        document.getElementById('WAITING_FOR_DATA').remove();
        return Promise.resolve();
    }
    document.getElementById('HEADER').innerHTML = section.toUpperCase();


    //Navigation
    try {
        await init_Navigation();
    } catch (err) {
        OUTPUT_showError(err.message);
        document.getElementById('WAITING_FOR_DATA').remove();
        return Promise.resolve();
    }

    //Data
    try {
        let data = await FetchSettings(section);
        console.log(data);
        display_data(data);
    } catch (err) {
        OUTPUT_showError(err.message);
    }

    //DONE
    document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SECTION_' + section.toUpperCase()).style.display = 'block';
}

async function FetchSettings(section = '') {
    return fetch("/api/auth/settings/" + section, getFetchHeader())
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}
async function fetchNav() {
    return fetch("/api/auth/settings/navigation", getFetchHeader())
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}
async function init_Navigation() {
    let navData;
    try {
        navData = await fetchNav();
        document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(navData);
    } catch (err) {
        try {
            await NAVIVATION_init();
        } catch (err) {

        }
        return Promise.reject(err);
    }
    
    return Promise.resolve();
}

//CONTROL
function CONTROL(data = {}) {

}

//SETUP
function SETUP(data = {}) {
    SETUP_TTV_API(data.TwitchAPI);
    SETUP_TTV_IRC(data.TwitchIRC);
    SETUP_AUTHENTICATOR(data.Authenticator);
}

//CONFIG
//sooon

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
//sooon

//UTIL
function getFetchHeader() {
    return {
        headers: {
            "Authorization": "Bearer " + TTV_PROFILE_getCookieData().id_token
        }
    };
}
async function checkResponse(response){
    if (response.status === 200) {
        return response.json();
    } else if (response.status === 401) {
        return Promise.reject(new Error("Unauthorized"));
    } else {
        return Promise.reject(new Error("Error: " + request.status + " - " + request.statusText));
    }
}
function HTMLElementArrayToArray(html_arr) {
    let arr = [];

    for (let elt of html_arr) {
        arr.push(elt);
    }

    return arr;
}
function GetTime(time) {
    let date = new Date(time);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString('de-DE', { hour: 'numeric', minute: 'numeric' });
}