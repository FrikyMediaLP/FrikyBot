const TTV_API_SCOPES = {
    "channel:moderate": {
        "desc": "Perform moderation actions in a channel. The user requesting the scope must be a moderator in the channel.",
        "enabled": true,
        "state": false
    },
    "chat:edit": {
        "desc": "Send live stream chat messages.",
        "enabled": true,
        "state": false
    },
    "chat:read": {
        "desc": "View live stream chat messages.",
        "enabled": true,
        "state": true
    },
    "whispers:read": {
        "desc": "	View your whisper messages.",
        "enabled": true,
        "state": false
    },
    "whispers:edit": {
        "desc": "	Send whisper messages.",
        "enabled": true,
        "state": false
    }
};

async function init() {
    OUTPUT_create();

    BOT_STATUS_DETAILS_MINI().catch(err => {
        OUTPUT_showError(err.message);
        console.log(err);
    });

    //Cookie Info
    if (!COOKIE_ACCEPT || !hasCookieAllowed('LOGGED_IN_USER')) {
        OUTPUT_showWarning('Cookies are needed to store your login information and be used on the rest of the Website! <a href="' + ROOT + 'Cookies#highlighted=LOGGED_IN_USER">Cookies Settings</a>');
    }

    //Page Info 
    let page_info = {};
    try {
        page_info = await FetchPageInfo();
    } catch (err) {
        OUTPUT_showError(err.message);
        console.log(err);
    }
    
    try {
        if (page_info.authenticator === 'TTV Auth.') await SHOW_TTV();
        else if (page_info.authenticator === 'FrikyBot Auth.') SHOW_AuthCode();
        else SHOW_NONE();
    } catch (err) {
        SHOW_NONE();
    }

    //Default Navigation - has to be after TTV Login Check
    NAVIVATION_init()
        .then(json => {
            //Update Navi
            if (LOGIN_isLoggedIn() && document.getElementById("MAINNAV_Settings_Login")) {
                document.getElementById("MAINNAV_Settings_Login").innerHTML = "Logout";
            }
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
        });
}
function FetchPageInfo() {
    return fetch('/api/pages/login').then(STANDARD_FETCH_RESPONSE_CHECKER);
}

//Authenticators
async function SHOW_TTV() {
    let userdata;
    let loggin_invalid = true;

    if (LOGIN_isLoggedIn()) {
        const cookie = LOGIN_getCookies();

        try {
            let response = await TTV_LOGIN_FETCH_USERINFO(cookie.id_token, cookie.oauth_token);
            userdata = response.user;
            userdata.scopes = cookie.scopes;
            if (cookie.oauth_token) userdata.refresh = true;

            loggin_invalid = false;
        } catch (err) {
            console.log(err);
            if (err.message === "jwt expired") {
                OUTPUT_showError("Authentication Token Expired!");
            }
        }
    }
    
    if (loggin_invalid && HasURLHash('id_token')) {
        let valid = true;
        
        if (HasURLHash('state') && GetURLHashContent('state').value[0] !== getCookie('LOGIN_NONCE', true)) {
            removeCookie('LOGIN_NONCE', true);
            OUTPUT_showError("Authentication Invalid!");
            valid = false;
        }

        if (valid) {
            try {
                const id_token = GetURLHashContent('id_token').value[0];
                let oauth_token = GetURLHashContent('access_token');
                oauth_token = ((oauth_token || {}).value || [])[0];
                let scopes = GetURLHashContent('scope');
                scopes = replaceAll(((scopes || {}).value || [])[0] || '', '%3A', ':').split('+');
                
                userdata = await LOGIN_login(id_token, oauth_token, scopes);

                if (oauth_token) userdata.refresh = true;
                userdata.scopes = scopes;

                //REMOVE FROM URL
                window.location.hash = "";
            } catch (err) {
                console.log(err);
                if (err.message === "jwt expired") OUTPUT_showError("Authentication Token Expired!");
            }
        }
    }

    TwitchAPI_UserLogin_createScopes((userdata || {}).scopes);
    
    //Set Data
    if (userdata) TTV_LOGIN_SETDATA(document.getElementById('TTV_MASTER_LOGIN'), userdata, true);
    document.getElementById('TWITCH_LOGIN_WRAP').style.display = 'block';
}
function TTV_LOGIN_CLICK(elt) {
    TTV_LOGIN_CLICKED(elt, 'user', TwitchAPI_UserLogin_getScopes());
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

function SHOW_AuthCode() {
    document.getElementById('AuthorizationCode').style.display = 'block';
    if (LOGIN_isLoggedIn()) document.getElementById('AuthorizationCode_LogOut').style.display = 'block';
}
function AuthorizationCode(elt) {
    let code = document.getElementById('AuthorizationCode_Input').value;

    if (!code) return;

    //Disable Button
    elt.setAttribute('disabled', '');
    
    LOGIN_login(code)
        .then(json => {
            NAVIVATION_init();

            //Update Navi
            if (LOGIN_isLoggedIn() && document.getElementById("MAINNAV_Settings_Login")) {
                document.getElementById("MAINNAV_Settings_Login").innerHTML = "Logout";
                document.getElementById('AuthorizationCode_LogOut').style.display = 'block';
            }

            elt.removeAttribute('disabled');
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
            elt.removeAttribute('disabled');
        });
}

function SHOW_NONE() {
    OUTPUT_showError('NO AUTHENTICATOR AVAILABLE. PLS RETURN LATER...');
}