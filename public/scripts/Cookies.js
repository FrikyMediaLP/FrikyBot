let LOCAL_DATA = [];
let SESSION_DATA = [];
let COOKIE_DATA = [];

let cookie_settings = [];
let last_visit = Date.now();

let HIGHLIGHT = "";

function init() {
    OUTPUT_create();

    last_visit = !isNaN(getCookie('LAST_COOKIE_VISIT')) && getCookie('LAST_COOKIE_VISIT')? parseInt(getCookie('LAST_COOKIE_VISIT')) : Date.now();

    fetch("/api/Cookies")
        .then(data => data.json())
        .then(async json => {
            if (json.err) return Promise.reject(new Error(json.err));
            
            LOCAL_DATA = json.data.LocalStorage;
            SESSION_DATA = json.data.SessionStorage;
            COOKIE_DATA = json.data.Cookies;

            checkHash(false);
            cookie_settings = (getCookie('ACCEPTED_COOKIES') || "").split(';').filter(elt => elt !== "");
            Cookie_Table_display('all');
            stopWaiting(true);
        })
        .catch(err => {
            stopWaiting(false);
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function checkHash(update_table = true) {
    if (HasURLHash('highlighted')) {
        HIGHLIGHT = GetURLHashContent('highlighted').value[0];
    }

    if (update_table) ookie_Table_display('all');
}

function Cookie_Table_display(type) {
    const opts = {
        headers: ["Cookie Name", "Set By?", "When Set?", "When Removed?", "Used for?", "ALLOWED?"],
        header_translation: {
            'Cookie Name': 'name',
            'Set By?': 'by',
            'When Set?': 'set',
            'When Removed?': 'removed',
            'Used for?': 'reason'
        },
        content_translation: {
            'name': (x, elt) => {
                let s = '<div' + (HIGHLIGHT === x ? ' highlighted' : '') + '>';
                s += x;

                s += '<div class="INFO">';

                if (elt.origin) {
                    s += '<span class="origin ' + (elt.origin !== 'frikybot' ? 'package' : 'frikybot') + '">' + elt.origin + '</span>';
                }

                if (elt.added_at && elt.added_at < last_visit + 30 * 24 * 60 * 60 * 1000) {
                    s += '<span class="NEW">NEW</span>';
                }

                s += '</div>';
                return s + '</div>';
            },
            'by': (x, elt) => {
                return '<div' + (HIGHLIGHT === elt.name ? ' highlighted' : '') + '>' + x + '</div>';
            },
            'set': (x, elt) => {
                return '<div' + (HIGHLIGHT === elt.name ? ' highlighted' : '') + '>' + x + '</div>';
            },
            'removed': (x, elt) => {
                return '<div' + (HIGHLIGHT === elt.name ? ' highlighted' : '') + '>' + x + '</div>';
            },
            'reason': (x, elt) => {
                return '<div' + (HIGHLIGHT === elt.name ? ' highlighted' : '') + '>' + x + '</div>';
            },
            'ALLOWED?': (x, elt) => {
                let set = cookie_settings.find(elt2 => elt2 === elt.name) !== undefined;
                let s = '<div' + (HIGHLIGHT === elt.name ? ' highlighted' : '') + '>';
                s += '<input id="COOKIE_' + elt.name + '" type="checkbox" ' + (set ? 'checked' : '') + ' onclick="toggle_Cookie_Setting(this.checked, \'' + elt.name + '\');" />';
                return s + '</div>';
            }
        }
    };

    if (type === 'all' || type === 'local') {
        //LocalStorage
        if (LOCAL_DATA.length > 0) {
            document.getElementById('Table_LocalStorage').innerHTML = MISC_createTable(LOCAL_DATA, cloneJSON(opts));
        } else {
            document.getElementById('Table_LocalStorage').innerHTML = '<center>NO LOCAL STORAGE COOKIES USED</center>';
        }
    }

    if (type === 'all' || type === 'session') {
        //SessionStorage
        if (SESSION_DATA.length > 0) {
            let cloned_opts = cloneJSON(opts);
            cloned_opts.headers.splice(3, 1);
            document.getElementById('Table_SessionStorage').innerHTML = MISC_createTable(SESSION_DATA, cloned_opts);
        } else {
            document.getElementById('Table_SessionStorage').innerHTML = '<center>NO SESSION STORAGE COOKIES USED</center>';
        }
    }

    if (type === 'all' || type === 'cookie') {
        //Cookies
        if (COOKIE_DATA.length > 0) {
            document.getElementById('Table_Cookies').innerHTML = MISC_createTable(COOKIE_DATA, cloneJSON(opts));
        } else {
            document.getElementById('Table_Cookies').innerHTML = '<center>NO COOKIES USED</center>';
        }
    }
}

function toggle_Cookie_Setting(selected, name) {
    let arr = cookie_settings.slice(0);
    let idx = -1;
    arr = arr.filter(elt => elt !== "");
    arr.find((elt, index) => {
        if (elt === name) {
            idx = index;
            return true;
        }
    });

    if (idx < 0 && selected) arr.push(name);
    else if (!selected) arr.splice(idx, 1);
    
    cookie_settings = arr;

    let has = true;
    let curr = (getCookie('ACCEPTED_COOKIES') || '').split(';').filter(elt => elt !== "");

    if (curr.length !== cookie_settings.length) has = false;

    for (let elt of curr) {
        if (arr.find(elt2 => elt === elt2) === undefined) {
            has = false;
            break;
        }
    }

    if (has) document.getElementById('SAVE_BUTTON').setAttribute('disabled', 'true');
    else document.getElementById('SAVE_BUTTON').removeAttribute('disabled');
}
function toggle_Cookie_Setting_All(set) {
    let all_cookies = (LOCAL_DATA.reduce((acc, elt) => acc += elt.name + ";", "") + SESSION_DATA.reduce((acc, elt) => acc += elt.name + ";", "") + COOKIE_DATA.reduce((acc, elt) => acc += elt.name + ";", "")).split(";").filter(elt => elt !== "");
    
    //Save Preferences
    if (set) cookie_settings = all_cookies;
    else cookie_settings = [];

    Cookie_Table_display('all');
    
    let has = true;
    let prev = getCookie("CookieAccept", "true");

    if (prev === null && cookie_settings.length > 0) has = false;

    for (let elt of prev || []) {
        if (cookie_settings.find(elt2 => elt === elt2) === undefined) {
            has = false; break;
        }
    }

    if (has) document.getElementById('SAVE_BUTTON').setAttribute('disabled', 'true');
    else document.getElementById('SAVE_BUTTON').removeAttribute('disabled');
}
function save_Cookie_Settings() {
    if (!COOKIE_ACCEPT) {
        COOKIE_ACCEPT = true;
        setCookie("CookieAccept", "true");
        if (ONCOOKIEACCEPT) ONCOOKIEACCEPT();
    }

    setCookie('ACCEPTED_COOKIES', cookie_settings.join(';'));
    document.getElementById('SAVE_BUTTON').setAttribute('disabled', 'true');
    document.getElementById('COOKIE_CookieAccept').checked = true;
    OUTPUT_showInfo('Cookie Settings Updated!');

    for (let cookie in getAllCookies()) {
        if (!cookie_settings.find(elt => elt === cookie)) removeCookie(cookie);
    }

    for (let cookie in getAllCookies(true)) {
        if (!cookie_settings.find(elt => elt === cookie)) removeCookie(cookie, true);
    }
}

async function deleteAllCookies() {
    const q = "YOU SURE YOU WANT THIS?";
    const sub = "Removeing all Cookie Data will revoke any Login Tokens and Preferences you changed.";
    let answer = 'NO';
    
    try {
        answer = await MISC_USERCONFIRM(q, sub);
    } catch (err) {

    }
    if (answer !== 'YES') return Promise.resolve();
    
    clearAllCookies();
    OUTPUT_showInfo('Cookie Data removed!');
    window.location.href = window.location.href;
}

function stopWaiting(all = false) {
    if (all) {
        while (document.getElementsByClassName('WAITING_PARENT').length > 0) {
            document.getElementsByClassName('WAITING_PARENT')[0].remove();
        }
    } else {
        while (document.getElementsByClassName('LOADING_RING').length > 0) {
            document.getElementsByClassName('LOADING_RING')[0].remove();
        }
    }
}