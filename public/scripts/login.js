async function init() {
    OUTPUT_create();

    BOT_STATUS_DETAILS_MINI().catch(err => {
        OUTPUT_showError(err.message);
        console.log(err);
    });

    //Page Info 
    let page_info = {};
    try {
        page_info = await FetchPageInfo();
    } catch (err) {
        OUTPUT_showError(err.message);
        console.log(err);
    }

    try {
        if (page_info.authenticator === 'TwitchAPI') await SHOW_TTV();
        else if (page_info.authenticator === 'FrikyBot Auth.') SHOW_AuthCode();
        else SHOW_NONE();
    } catch (err) {
        console.log(err);
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

async function SHOW_TTV() {
    let userdata = {};

    if (TTV_PROFILE_isLoggedIn()) {
        const cookie = TTV_PROFILE_getCookieData();

        try {
            userdata = (await TTV_LOGIN_FETCH_USERINFO(cookie.id_token)).data;
        } catch (err) {
            OUTPUT_showError(err.message === "jwt expired" ? "Authentication Token Expired!" : err.message);
            console.log(err);
            TTV_PROFILE_removeCookieData();
            TTV_PROFILE_remove();
        }
    } else {
        try {
            userdata = await TTV_LOGIN_CHECK_HASH();
        } catch (err) {
            OUTPUT_showError(err.message === "jwt expired" ? "Authentication Token Expired!" : err.message);
            console.log(err);
        }
    }

    if (userdata.sub) {
        //SET DATA
        TTV_LOGIN_SETDATA(document.getElementsByClassName('TTV_LOGIN')[0], userdata, true);

        if (!TTV_PROFILE_isLoggedIn() && document.location.hash.indexOf("=") >= 0) {
            //SAVE IN COOKIES
            const token = document.location.hash.substring(document.location.hash.indexOf("=") + 1);
            TTV_PROFILE_saveCookieData(userdata, token);

            //HOVER PROFILE
            TTV_PROFILE_initProfile();

            //REMOVE FROM URL
            window.location.hash = "";

            //Update Navi
            if (document.getElementById("MAINNAV_Settings_Login")) {
                document.getElementById("MAINNAV_Settings_Login").innerHTML = "Logout";
            }
        }
    }

    document.getElementById('TWITCH_LOGIN_WRAP').style.display = 'block';
}

function SHOW_AuthCode() {
    document.getElementById('AuthorizationCode').style.display = 'block';
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