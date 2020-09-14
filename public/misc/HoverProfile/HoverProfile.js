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
function TTV_PROFILE_isLoggedIn() {
    let dta = TTV_PROFILE_getCookieData();
    if (dta && dta.Details) {
        return true;
    } else {
        return false;
    }
}
function TTV_PROFILE_saveCookieData(details, oauth) {
    if (COOKIE_ACCEPT && (details || oauth)) {
        setCookie("TTV_PROFILE", JSON.stringify({
            Details: {
                picture: details["picture"],
                preferred_username: details["preferred_username"],
                sub: details["sub"]
            },
            OAUTH: oauth
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
function PROFILE_IMAGES(id) {
    let colors = ["blue", "green", "orange", "purple", "red", "yellow"];

    if (isNaN(id)) {
        return ROOT + "images/no_image_found.png";
    } else if (typeof (id) == "string") {
        try {
            id = parseInt(id);
            return ROOT + "images/Profiles/" + colors[id > colors.length - 1 ? id % (colors.length - 1) : id] + ".png";
        } catch{
            return ROOT + "images/no_image_found.png";
        }
    }
}
