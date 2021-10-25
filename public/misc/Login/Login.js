let TTV_LOGIN_DEFAULT_LOG = {};
const USERLEVELS = ['viewer', 'moderator', 'staff', 'admin'];

//LOGIN
async function LOGIN_login(jwt) {
    //Fetch User
    let user;
    let offline = false;

    try {
        user = await LOGIN_fetchUser(jwt);
    } catch (err) {
        let cookie = LOGIN_getCookies();
        if (cookie && cookie.id_token === jwt) {
            user = cookie.user;
            offline = true;
        }
        else return Promise.reject(err);
    }

    if (!user) return Promise.reject(new Error('User not found.'));

    //Create Hoverprofile
    HOVERPROFILE_create({
        username: user.preferred_username,
        uid: user.sub,
        img: user.picture,
        user_level: user.user_level,
        iat: user.iat,
        id_token: jwt,
        offline
    });

    //Show Info
    OUTPUT_showInfo(user.user_level + ' privileges activated!');

    //Place in Cookies
    LOGIN_saveCookies(user, jwt);

    //Update Navi
    if (LOGIN_isLoggedIn() && document.getElementById("MAINNAV_Settings_Login")) {
        document.getElementById("MAINNAV_Settings_Login").innerHTML = "Logout";
    }

    return Promise.resolve(user);
}
async function LOGIN_logout() {
    //Remove Hover Profile
    HOVERPROFILE_remove();
    
    //Remove Data in Cookies
    LOGIN_removeCookies();
}

async function LOGIN_fetchUser(jwt, oauth) {
    let opt = {};

    if (oauth) {
        opt['headers'] = { 'authorization': 'OAuth ' + oauth }
        opt['headers'] = { 'authentication': 'Bearer ' + jwt }
    } else {
        opt['headers'] = { 'authorization': 'Bearer ' + jwt }
    }

    return fetch('/api/login/user', opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(async json => {
            if (!json.user) return Promise.reject(new Error('Unauthorized.'));
            return Promise.resolve(json.user);
        });
}

function LOGIN_isLoggedIn() {
    return LOGIN_getCookies() !== null;
}

function LOGIN_saveCookies(user, jwt) {
    setCookie('LOGGED_IN_USER', JSON.stringify({ user: user, id_token: jwt }));
}
function LOGIN_removeCookies() {
    removeCookie('LOGGED_IN_USER');
}
function LOGIN_getCookies() {
    return JSON.parse(getCookie('LOGGED_IN_USER'));
}

function LOGIN_getUserlevel(text = true) {
    let cookie = LOGIN_getCookies();
    if (!cookie) return null;

    if (text) return cookie['user'].user_level;
    else return USERLEVEL_INDEX(cookie['user'].user_level);
}
function LOGIN_getUsername() {
    let cookie = LOGIN_getCookies();
    if (!cookie) return null;

    return cookie['user'].preferred_username;
}

function LOGIN_GetOriginPageURL() {
    return window.location.href;
}
function LOGIN_getOriginPageCookie() {
    return getCookie('LOGIN_ORG_PAGE', true);
}
function LOGIN_setOriginPageCookie() {
    setCookie('LOGIN_ORG_PAGE', LOGIN_GetOriginPageURL(), true);
}
function LOGIN_clearOriginPageCookie() {
    removeCookie('LOGIN_ORG_PAGE', true);
}

//Hover Profile
async function HOVERPROFILE_init() {
    if (!LOGIN_isLoggedIn()) return Promise.resolve();
    let offline = false;
    let cookie = LOGIN_getCookies();

    //Fetch User
    let user;
    try {
        user = await LOGIN_fetchUser(cookie.id_token, cookie.oauth);
    } catch (err) {
        if (PAGE_IS_PROTECTED) OUTPUT_showError(err.message);
        user = cookie.user;
        offline = true;
    }

    //Create Hoverprofile
    HOVERPROFILE_create({
        username: user.preferred_username,
        uid: user.sub,
        img: user.picture,
        user_level: user.user_level,
        iat: user.iat,
        id_token: cookie.id_token,
        offline: offline
    });
}
function HOVERPROFILE_create(user) {
    if (document.getElementById('MASTER_HOVERPROFILE')) document.getElementById('MASTER_HOVERPROFILE').remove();

    let s = '';
    if (!user) user = {};

    const username = user.username ? user.username : 'UNKNOWN';
    const uid = user.id;
    const user_level = user.user_level || 'VIEWER';
    const img = user.img ? user.img : PROFILE_IMAGES(uid || username.length, true);

    let title = (uid ? '(' + uid + ') ' : '') + username;

    s += '<div class="HOVERPROFILE ' + (user.offline === true ? 'OFFLINE' : '') + '" id="MASTER_HOVERPROFILE" title="' + title + '">';

    s += '<div class="HOVERPROFILE_GRID">';

    s += '<span class="HOVERPROFILE_MOVER">' + username + '</span>';
    s += '<div class="HOVERPROFILE_IMG" onclick="HOVERPROFILE_expand(this);"><img src="' + img + '" /></div>';

    s += '<div class="HOVERPROFILE_DROPDOWN">';

    s += '<p>User Info</p>';
    s += '<span>Username: ' + username + '</span>';
    if (uid) s += '<span>UID: ' + uid + '</span>';
    s += '<span>Userlevel: ' + user_level + '</span>';
    if (user.iat) s += '<span>IAT: ' + (new Date(user.iat * 1000)).toLocaleString('de-DE') + '</span>';
    
    s += '<p>Settings</p>';

    s += '<a onclick="HOVERPROFILE_update(this);">' + (user.offline === true ? 'Relogin' : 'Update Info') + '</a>';
    s += '<div class="HOVERPROFILE_DROPDOWN_TOKEN"><input value="' + user.id_token + '" type="password" readonly/><a onclick="HOVERPROFILE_showToken(this);">show ID</a></div>';
    if (user.oauth) s += '<div class="HOVERPROFILE_DROPDOWN_TOKEN"><input value="' + user.oauth + '" type="password" readonly/><a onclick="HOVERPROFILE_showToken(this);">show OAUTH</a></div>';
    s += '<a href="/Cookies">Cookies Settings</a>';
    s += '<a onclick="HOVERPROFILE_logout();">Logout</a>';

    s += '</div>';
    s += '</div>';

    document.getElementById('contentHeader').innerHTML += s;
}
function HOVERPROFILE_remove() {
    if (document.getElementById('MASTER_HOVERPROFILE'))
        document.getElementById('MASTER_HOVERPROFILE').remove();
}
function HOVERPROFILE_colapse(id) {
    let elt = document.getElementById(id);
    if (!elt) return;

    //Collapse Animation
    elt.classList.remove('expand');

    //Hide Token
    for (let childre of elt.childNodes) {
        if (childre instanceof Element && childre.classList.contains('HOVERPROFILE_GRID')) {
            for (let child of childre.childNodes) {
                if (child instanceof Element && child.classList.contains('HOVERPROFILE_DROPDOWN')) {
                    for (let childer of child.childNodes) {
                        if (childer instanceof Element && childer.classList.contains('HOVERPROFILE_DROPDOWN_TOKEN')) {
                            for (let tokenElt of childer.childNodes) {
                                if (tokenElt instanceof Element && tokenElt.tagName === 'INPUT') {
                                    tokenElt.setAttribute('type', 'password');
                                } else if (tokenElt instanceof Element && tokenElt.tagName === 'A') {
                                    tokenElt.innerHTML = 'show';
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            break;
        }
    }

    let content = document.getElementById('content');

    //Cut Content Onlick
    let s = "";

    for (let cls of (content.getAttribute('onclick') || "").split(" ")) {
        if (cls.indexOf('HOVERPROFILE_colapse') < 0) s += " " + cls;
    }
    content.setAttribute('onclick', s);
}
function HOVERPROFILE_expand(elt) {
    elt.parentElement.parentElement.classList.toggle('expand');
    let id = elt.parentElement.parentElement.id;

    let content = document.getElementById('content');

    if (elt.parentElement.parentElement.classList.contains('expand') && (content.getAttribute('onclick') || "").indexOf('HOVERPROFILE_colapse') < 0) {
        content.setAttribute('onclick', (content.getAttribute('onclick') || "") + ' HOVERPROFILE_colapse("' + id + '");');
    } else {
        let s = "";

        for (let cls of (content.getAttribute('onclick') || "").split(" ")) {
            if (cls.indexOf('HOVERPROFILE_colapse') < 0) s += " " + cls;
        }
        content.setAttribute('onclick', s);
    }
}

function HOVERPROFILE_update(elt) {
    while (!elt.classList.contains('HOVERPROFILE') || !elt.parentElement) elt = elt.parentElement;

    if (elt.classList.contains('HOVERPROFILE')) elt.remove();

    HOVERPROFILE_init();
}
function HOVERPROFILE_showToken(elt) {
    elt.innerHTML = elt.innerHTML.replace(elt.innerHTML.startsWith('show') ? 'show' : 'hide', elt.innerHTML.startsWith('show') ? 'hide' : 'show');
    
    //Change Input Type
    let input;
    for (let child of elt.parentElement.childNodes) {
        if (child instanceof Element && child.tagName === 'INPUT') input = child;
    }

    if (input) input.setAttribute('type', elt.innerHTML.startsWith('show') ? 'password' : 'text');
}
function HOVERPROFILE_logout() {
    //Remove Cookie
    LOGIN_removeCookies();

    HOVERPROFILE_remove();
}
function HOVERPROFILE_removeCookieAccept() {
    clearAllCookies();
    window.location.href = window.location.href;
}

//TTV Login
async function TTV_LOGIN_FETCH_USERINFO(id_token) {
    let opt = getAuthHeader();
    opt.headers['Content-Type'] = 'application/json';
    opt.method = 'POST';
    opt.body = JSON.stringify({ id_token });

    return fetch("/api/TwitchAPI/login", opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => json);
}
function TTV_LOGIN_SETDATA(elt, userdata, enable_logout = false, logout_func) {
    if (!elt) return;

    let data_elt;
    let log_elt;

    for (let child of elt.children) {
        if (child instanceof Element && child.classList.contains('TTV_LOGIN_DATA')) data_elt = child;
        else if (child instanceof Element && child.classList.contains('TTV_LOGIN_BUTTON')) log_elt = child;
    }
    let default_log = log_elt.innerHTML;
    TTV_LOGIN_DEFAULT_LOG[elt.id] = default_log;

    //Data
    let s = '<center class="TTV_LOGIN_DATA_USERNAME">Logged in as: <b>' + userdata.preferred_username + '</b></center>';
    s += '<div class="TTV_LOGIN_DATA_SPLITTER"><div class="TTV_LOGIN_DATA_LEFT">';
    let infos = [];

    if (userdata.sub) infos.push({ name: 'ID', value: userdata.sub });
    if (userdata.description) infos.push({ name: 'DESCRIPTION', value: userdata.description });
    if (userdata.iat) infos.push({ name: 'ISSUED AT', value: new Date(userdata.iat * 1000).toLocaleString('de-DE') });
    if (isNaN(userdata.exp)) {
        infos.push({ name: 'EXPIRES IN' + (userdata.refresh === true ? '*' : ''), value: userdata.exp });
    } else if (userdata.exp) {
        let exp_elt_id = Math.random() * (userdata.sub || 10000);

        let interval = setInterval(() => {
            let str = GetCountdownTime(userdata.exp * 1000);

            if (str === null) {
                TTV_LOGIN_COLLAPSE(data_elt);
                log_elt.innerHTML = default_log;
                if (userdata.refresh !== true) OUTPUT_showError("Access Token Expired. Please log in again!");
                clearInterval(interval);
            }

            //Print
            if (document.getElementById('TTV_LOGIN_EXP_' + exp_elt_id)) document.getElementById('TTV_LOGIN_EXP_' + exp_elt_id).innerHTML = str || '00H 00M 00S';
        }, 1000);

        infos.push({ name: 'EXPIRES IN' + (userdata.refresh === true ? '*' : ''), value: '<span id="TTV_LOGIN_EXP_' + exp_elt_id + '">' + GetCountdownTime(userdata.exp * 1000) + '</span>' });
    }

    for (let info of infos) {
        s += '<center>';
        s += '<p class="TTV_LOGIN_DATA_TOP">' + info.value + '</p>';
        s += '<p class="TTV_LOGIN_DATA_BOTTOM">' + info.name + '</p>';
        s += '</center>';
    }

    if (userdata.refresh === true) s += '<span class="TTV_LOGIN_HINT">*refreshes when expired</span>';

    data_elt.innerHTML = s + '</div><div class="TTV_LOGIN_DATA_RIGHT"><img src="' + (userdata.picture || '../images/no_image_found_alpha.png') + '" /></div></div>';

    //Login/out
    if (enable_logout) {
        s = '<center onclick="';

        if (logout_func) s += logout_func + '(); ';
        s += ' HOVERPROFILE_logout(); TTV_COL_LOG(\'' + elt.id + '\');"';

        s += '><span>LOG OUT</span><img src="../images/icons/twitch.svg" data-type="svg" />';
        s += '</center>';
        log_elt.innerHTML = s;
    }
    
    //EXPAND
    TTV_LOGIN_EXPAND(data_elt);
}

function TTV_LOGIN_EXPAND(data_elt) {
    data_elt.style.animation = "TTV_LOGIN_EXPAND 1s forwards";

    let inter = setInterval(() => {
        data_elt.classList.add('TTV_LOGIN_DATA_EXPANDED');
        data_elt.classList.remove('TTV_LOGIN_DATA_COLLAPSED');
        data_elt.style.animation = "";

        clearInterval(inter);
    }, 1000);
}
function TTV_LOGIN_COLLAPSE(data_elt) {
    data_elt.style.animation = "TTV_LOGIN_COLLAPSE 1s forwards";

    let inter = setInterval(() => {
        data_elt.classList.remove('TTV_LOGIN_DATA_EXPANDED');
        data_elt.classList.add('TTV_LOGIN_DATA_COLLAPSED');
        data_elt.style.animation = "";

        clearInterval(inter);
    }, 1000);
}
function TTV_COL_LOG(id) {
    let elt = document.getElementById(id);
    let log_elt;
    let data_elt;

    for (let child of elt.children) {
        if (child instanceof Element && child.classList.contains('TTV_LOGIN_DATA')) data_elt = child;
        else if (child instanceof Element && child.classList.contains('TTV_LOGIN_BUTTON')) log_elt = child;
    }

    if (!log_elt) return;
    TTV_LOGIN_COLLAPSE(data_elt);
    log_elt.innerHTML = TTV_LOGIN_DEFAULT_LOG[id];
}

async function TTV_LOGIN_CLICKED(elt, type, scopes = [], forced = true) {
    if (!elt || !(elt instanceof Element)) return;
    if (!type) return;
    
    let opt = getAuthHeader();
    opt.headers['Content-Type'] = 'application/json';
    opt.method = 'POST';
    opt.body = JSON.stringify({ scopes: scopes });
    
    return fetch("/api/TwitchAPI/login/" + type, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            LOGIN_setOriginPageCookie();
            window.location.href = json.data;
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//Userlevels
function USERLEVEL_INDEX(name){
    let idx = -1;
    USERLEVELS.find((elt, index) => {
        if (elt === name) {
            idx = index;
            return true;
        }
    });
    return idx;
}