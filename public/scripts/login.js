async function init() {
    OUTPUT_create();

    //Remember me
    //if (COOKIE_ACCEPT && getCookie('LOGIN_REMEMBER') === "true") {
    //    //<center>Remember Me <input type="checkbox" id="LOGIN_STAYLOGGED" onclick="Login_Remember(this)" /></center>
    //    document.getElementById("LOGIN_STAYLOGGED").checked = true;
    //}

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

    //Default Navigation
    try {
        await BOT_STATUS_DETAILS_MINI();
        await NAVIVATION_init();
    } catch (err) {
        console.log(err);
    }
}

function Login_Remember(checkbox) {
    if (COOKIE_ACCEPT) {
        setCookie('LOGIN_REMEMBER', '' + checkbox.checked  + '');
    }
}