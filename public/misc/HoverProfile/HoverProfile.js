//Profile
function TTV_PROFILE_initProfile() {
    let dta = TTV_PROFILE_getCookieData();

    if (!dta || !dta.Details) {
        return;
    }

    let name = dta.Details["preferred_username"];
    let logo = dta.Details["picture"];
    let id = dta.Details["sub"];

    if (name && id) {
        document.getElementById("contentHeader").innerHTML += '<div id="Profile" title="(' + id + ') ' + name + '"><a href="http://twitch.tv/' + name + '" target="_blank"><p>' + name + '</p><img src="' + (logo ? logo : PROFILE_IMAGES(id)) + '" /></a></div>';
    }
}
function TTV_PROFILE_remove() {
    document.getElementById("Profile").remove();
}
function TTV_PROFILE_isLoggedIn() {
    let dta = TTV_PROFILE_getCookieData();
    if (dta && dta.Details) {
        return true;
    } else {
        return false;
    }
}
function TTV_PROFILE_saveCookieData(details, id_token) {
    if (COOKIE_ACCEPT && (details || id_token)) {
        setCookie("TTV_PROFILE", JSON.stringify({
            Details: details,
            id_token: id_token
        }));
    }
}
function TTV_PROFILE_getCookieData() {
    if (COOKIE_ACCEPT) {
        try {
            return JSON.parse(getCookie("TTV_PROFILE"), true);
        } catch{
            return null
        }
    } else {
        return null;
    }
}
function TTV_PROFILE_removeCookieData() {
    removeCookie("TTV_PROFILE");
}

//Login
async function TTV_LOGIN_FETCH_USERINFO(id_token) {
    return fetch("/api/TwitchAPI/auth", {
        method: "POST",
        headers: {
            "Content-Type": "application/json", "Authorization": "Bearer " + id_token
        }
    })
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                if (typeof json.err === "string") {
                    return Promise.reject(new Error(json.err));
                } else {
                    return Promise.reject(json.err);
                }
            } else {
                return Promise.resolve(json);
            }
        });
}