//Profile
async function TTV_PROFILE_initProfile() {
    let dta = TTV_PROFILE_getCookieData();

    if (!dta) return Promise.resolve();

    let user;

    //Auth Check
    try {
        user = (await TTV_LOGIN_FETCH_USERINFO(dta.id_token)).data;
    } catch (err) {
        return Promise.reject(err);
    }
    
    if (user) {
        let name = user["preferred_username"];
        let logo = user["picture"];
        let id = user["sub"];

        if (name && id) {
            document.getElementById("contentHeader").innerHTML += '<div id="Profile" title="(' + id + ') ' + name + '"><a href="http://twitch.tv/' + name + '" target="_blank"><p>' + name + '</p><img src="' + (logo ? logo : PROFILE_IMAGES(id)) + '" /></a></div>';
        }
    } else {
        TTV_PROFILE_removeCookieData();
        TTV_PROFILE_remove();
    }

    return Promise.resolve();
}
function TTV_PROFILE_remove() {
    if (document.getElementById("Profile"))
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
function TTV_LOGIN_SETDATA(elt, userdata, enable_logout = false) {
    if (!elt || !(elt instanceof Element)) return;
    if (!userdata) return;
    
    //Get TTV_LOGIN_DATA / TTV_LOGIN_BUTTON
    for (let child of elt.childNodes) {
        if (child instanceof Element && child.classList.contains("TTV_LOGIN_DATA")) {
            //Get DATA Fields
            for (let childer of child.childNodes) {
                //Display-Name
                if (childer instanceof Element && childer.classList.contains("TTV_LOGIN_DATA_USERNAME")) {
                    childer.innerHTML = "Logged in as: <b>" + (userdata.preferred_username != undefined ? userdata.preferred_username : "UNKNOWN") + "</b>";
                }
                else if (childer instanceof Element && childer.classList.contains("TTV_LOGIN_DATA_SPLITTER")) {
                    for (let childerer of childer.childNodes) {
                        //Left
                        if (childerer instanceof Element && childerer.classList.contains("TTV_LOGIN_DATA_LEFT")) {
                            for (let childererer of childerer.childNodes) {
                                //ID
                                if (childererer instanceof Element && childererer.classList.contains("TTV_LOGIN_DATA_ID")) {
                                    for (let childerererer of childererer.childNodes) {
                                        if (childerererer instanceof Element && childerererer.classList.contains("TTV_LOGIN_DATA_TOP")) {
                                            childerererer.innerHTML = (userdata.sub != undefined ? userdata.sub : "UNKNOWN");
                                        }
                                    }
                                }
                                //ITA
                                else if (childererer instanceof Element && childererer.classList.contains("TTV_LOGIN_DATA_IAT")) {
                                    for (let childerererer of childererer.childNodes) {
                                        if (childerererer instanceof Element && childerererer.classList.contains("TTV_LOGIN_DATA_TOP")) {
                                            childerererer.innerHTML = (userdata.iat != undefined ? new Date(userdata.iat * 1000).toLocaleString('de-DE') : "UNKNOWN");
                                        }
                                    }
                                }
                                //EXP
                                else if (childererer instanceof Element && childererer.classList.contains("TTV_LOGIN_DATA_EXP")) {
                                    for (let childerererer of childererer.childNodes) {
                                        if (childerererer instanceof Element && childerererer.classList.contains("TTV_LOGIN_DATA_TOP")) {
                                            let interval = setInterval(() => {
                                                let until = new Date(userdata.exp * 1000) - new Date();
                                                until = Math.floor(until / 1000);

                                                let h = Math.floor(until / (60 * 60));
                                                until -= h * 60 * 60;

                                                let m = Math.floor(until / 60);
                                                until -= m * 60;

                                                let s = until;

                                                if (until < 0 || h < 0 || m < 0 || s < 0) {
                                                    childerererer.innerHTML = (userdata.iat != undefined ? "00H 00M 00S" : "UNKNOWN");
                                                    clearInterval(interval);
                                                    TTV_LOGIN_RESET(elt);
                                                } else {
                                                    if (h < 10) h = '0' + h;
                                                    if (m < 10) m = '0' + m;
                                                    if (s < 10) s = '0' + s;
                                                    childerererer.innerHTML = (userdata.iat != undefined ? h + "H " + m + "M " + s + "S" : "UNKNOWN");
                                                }
                                            }, 1000);
                                        }
                                    }
                                }
                            }
                        }
                        //Right
                        else if (childerer instanceof Element && childerer.classList.contains("TTV_LOGIN_DATA_RIGHT")) {
                            for (let childererer of childerer.childNodes) {
                                if (childererer instanceof Element && childererer.tagName === "IMG") {
                                    childererer.src = userdata.picture != undefined ? userdata.picture : PROFILE_IMAGES(userdata.sub);
                                }
                            }
                        }
                    }
                }
            }

            //EXPAND
            child.classList.remove("TTV_LOGIN_DATA_COLLAPSE");
            child.classList.add("TTV_LOGIN_DATA_EXPAND");
        }
        else if (enable_logout && child instanceof Element && child.classList.contains("TTV_LOGIN_BUTTON")) {
            //Get CENTER
            for (let childer of child.childNodes) {
                if (childer instanceof Element && childer.tagName === "CENTER") {
                    childer.setAttribute("onclick", "TTV_LOGIN_LogOut();");

                    //Get SPAN
                    for (let childerer of childer.childNodes) {
                        if (childerer instanceof Element && childerer.tagName === "SPAN") {
                            childerer.innerHTML = "LOG OUT";
                        }
                    }

                    break;
                }
            }
        }
    }
}
function TTV_LOGIN_RESET(elt) {
    if (!elt || !(elt instanceof Element)) return;
    
    //Get TTV_LOGIN_DATA / TTV_LOGIN_BUTTON
    for (let child of elt.childNodes) {
        if (child instanceof Element && child.classList.contains("TTV_LOGIN_DATA")) {
            //Collapse
            child.classList.remove("TTV_LOGIN_DATA_EXPAND");
            child.classList.add("TTV_LOGIN_DATA_COLLAPSE");
        }
    }
}
function TTV_LOGIN_LogOut() {
    TTV_PROFILE_removeCookieData();
    window.location.href = "";
}

async function TTV_LOGIN_CHECK_HASH() {
    if (document.location.hash.indexOf("#") < 0) return false;

    const token = document.location.hash.substring(document.location.hash.indexOf("=") + 1);

    try {
        let json = await TTV_LOGIN_FETCH_USERINFO(token);
        if (json.err) {
            if (typeof json.err === "string") {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.reject(json.err);
            }
        }

        return Promise.resolve(json.data);
    } catch (err) {
        return Promise.reject(err);
    }
}
async function TTV_LOGIN_CLICKED(elt, type, scopes = {}) {
    if (!elt || !(elt instanceof Element)) return;
    if (!type) return;

    let api = "";
    let opt = {};

    if (type === "Client") {
        api = "WebUserTTVLoginPage";
    } else if (type === "Server") {
        api = "BotUserTTVLogInPage";
        opt = {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + TTV_PROFILE_getCookieData().id_token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scopes: scopes })
        };
    } else {
        return;
    }
    
    return fetch("/api/TwitchAPI/" + api, opt)
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(json.err);
            } else {
                window.location.href = json.data;
            }
        });
}