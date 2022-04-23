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
            let response = await TTV_LOGIN_FETCH_USERINFO(cookie.id_token);
            userdata = response.user;
            loggin_invalid = false;
        } catch (err) {
            if (err.message === "jwt expired") {
                OUTPUT_showError("Authentication Token Expired!");
                return Promise.resolve();
            }
        }
    }
    
    if (loggin_invalid && HasURLHash('id_token')) {
        try {
            const token = GetURLHashContent('id_token').value[0];
            userdata = await LOGIN_login(token);

            //SAVE IN COOKIES
            LOGIN_saveCookies(userdata, token);
            //REMOVE FROM URL
            window.location.hash = "";
        } catch (err) {
            if (err.message === "jwt expired") OUTPUT_showError("Authentication Token Expired!");
        }
    }


    //Set Data
    if (userdata) TTV_LOGIN_SETDATA(document.getElementById('TTV_MASTER_LOGIN'), userdata, true);
    document.getElementById('TWITCH_LOGIN_WRAP').style.display = 'block';
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