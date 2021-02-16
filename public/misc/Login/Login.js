//LOGIN
async function LOGIN_login(jwt) {
    //Fetch User
    let user;
    try {
        user = await LOGIN_fetchUser(jwt);
    } catch (err) {
        return Promise.reject(err);
    }

    if (!user) return Promise.reject(new Error('User not found.'));

    //Create Hoverprofile
    HOVERPROFILE_create({
        username: user.preferred_username,
        uid: user.sub,
        img: user.picture,
        user_level: user.user_level,
        iat: user.iat,
        token: jwt
    });

    //Show Info
    OUTPUT_showInfo(user.user_level + ' privileges activated!');

    //Place in Cookies
    LOGIN_saveCookies(user, jwt);

    //Update Navi
    if (LOGIN_isLoggedIn() && document.getElementById("MAINNAV_Settings_Login")) {
        document.getElementById("MAINNAV_Settings_Login").innerHTML = "Logout";
    }
}
async function LOGIN_logout() {
    //Remove Hover Profile
    HOVERPROFILE_remove();

    //Remove Data in Cookies
    LOGIN_removeCookies();
}

async function LOGIN_fetchUser(jwt) {
    return fetch('/api/login/user', { headers: { 'authorization': 'Bearer ' + jwt } })
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(async json => {
            if (!json.user) return Promise.reject(new Error('User not found.'));
            return Promise.resolve(json.user);
        })
        .catch(err => {
            if (err.message === 'User not found.') LOGIN_removeCookies();
            return Promise.reject(err);
        });
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

function LOGIN_isLoggedIn() {
    return LOGIN_getCookies() !== null;
}

//Hover Profile
async function HOVERPROFILE_init() {
    if (!LOGIN_isLoggedIn()) return Promise.resolve();
    
    try {
        let token = LOGIN_getCookies().id_token;
        let user = await LOGIN_fetchUser(token);

        HOVERPROFILE_create({
            username: user.preferred_username,
            uid: user.sub,
            img: user.picture,
            user_level: user.user_level,
            iat: user.iat,
            token: token
        });
    } catch (err) {
        console.log(err);
        return Promise.resolve();
    }
}
function HOVERPROFILE_create(user) {
    let s = '';
    if (!user) user = {};

    const username = user.username ? user.username : 'UNKNOWN';
    const uid = user.id;
    const user_level = user.user_level || 'VIEWER';
    const img = user.img ? user.img : PROFILE_IMAGES(uid || username.length, true);

    let title = (uid ? '(' + uid + ') ' : '') + username;

    s += '<div class="HOVERPROFILE" id="MASTER_HOVERPROFILE" title="' + title + '">';

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
    s += '<div class="HOVERPROFILE_DROPDOWN_TOKEN"><input value="' + user.token + '" type="password" readonly/><a onclick="HOVERPROFILE_showToken(this);">show</a></div>';
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
    let oncl = content.getAttribute('onclick').split('HOVERPROFILE_colapse');
    let neCl = "";

    if (oncl.length === 1) {
        neCl = oncl[0];
    }
    
    switch (oncl.length) {
        case 1: neCl = oncl[0]; break;
        case 2: neCl = oncl[0] + oncl[0].substring(oncl[0].indexOf(';') + 1); break;
    }
    content.setAttribute('onclick', neCl);
}
function HOVERPROFILE_expand(elt) {
    elt.parentElement.parentElement.classList.toggle('expand');

    let id = elt.parentElement.parentElement.id;

    let content = document.getElementById('content');
    content.setAttribute('onclick', (content.getAttribute('onclick') || "") + ' HOVERPROFILE_colapse("' + id + '");');
}
function HOVERPROFILE_showToken(elt) {
    elt.innerHTML = elt.innerHTML === 'show' ? 'hide' : 'show';

    //Change Input Type
    let input;
    for (let child of elt.parentElement.childNodes) {
        if (child instanceof Element && child.tagName === 'INPUT') input = child;
    }

    if (input) input.setAttribute('type', elt.innerHTML === 'show' ? 'password' : 'text');
}
function HOVERPROFILE_logout() {
    //Remove Cookie
    LOGIN_removeCookies();

    //Reload
    window.location.href = window.location.href;
}

//TTV Loginer
