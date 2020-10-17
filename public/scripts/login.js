async function init() {
    OUTPUT_create();

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
            userdata = await CHECK_HASH();
        } catch (err) {
            OUTPUT_showError(err.message === "jwt expired" ? "Authentication Token Expired!" : err.message);
            console.log(err);
        }
    }

    if (userdata.sub) {
        //Get All TTV Login Windows
        for (let logins of document.getElementsByClassName("TTV_LOGIN")) {
            //Get TTV_LOGIN_DATA / TTV_LOGIN_BUTTON
            for (let child of logins.childNodes) {
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
                                                        let until = new Date(new Date(userdata.exp * 1000) - new Date())
                                                        childerererer.innerHTML = (userdata.iat != undefined ? until.getHours() + "H " + until.getMinutes() + "M " + until.getSeconds() + "S" : "UNKNOWN");

                                                        if (until <= 0) {
                                                            clearInterval(interval);
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
                    child.classList.add("TTV_LOGIN_DATA_EXPAND");
                } else if (child instanceof Element && child.classList.contains("TTV_LOGIN_BUTTON")) {
                    //Get A
                    for (let childer of child.childNodes) {
                        if (childer instanceof Element && childer.tagName === "A") {
                            childer.removeAttribute("href");
                            childer.setAttribute("onclick", "LogOut();");

                            //Get CENTER
                            for (let childerer of childer.childNodes) {
                                if (childerer instanceof Element && childerer.tagName === "CENTER") {
                                    //Get SPAN / IMG
                                    for (let childererer of childerer.childNodes) {
                                        if (childererer instanceof Element && childererer.tagName === "SPAN") {
                                            childererer.innerHTML = "LOG OUT";
                                        }
                                    }
                                }
                            }

                            break;
                        }
                    }
                }
            }
        }

        if (!TTV_PROFILE_isLoggedIn()) {
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
    } else {
        //Add Redirect Link
        try {
            await TTV_LOGIN_SETLINK();
        } catch (err) {
            OUTPUT_showError(err.message);
            console.log(err);
        }
    }
}

//LOGIN
function LogOut() {
    TTV_PROFILE_removeCookieData();
    window.location.href = "";
}

async function CHECK_HASH() {
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
async function TTV_LOGIN_SETLINK() {
    return fetch("/api/TwitchAPI/WebUserTTVLoginPage")
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(json.err);
            } else {
                //Get All TTV Login Windows
                for (let logins of document.getElementsByClassName("TTV_LOGIN")) {
                    //Get TTV_LOGIN_BUTTON
                    for (let child of logins.childNodes) {
                        if (child instanceof Element && child.classList.contains("TTV_LOGIN_BUTTON")) {
                            //Get A
                            for (let childer of child.childNodes) {
                                if (childer instanceof Element && childer.tagName === "A") {
                                    childer.href = json.data;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
                return Promise.resolve();
            }
        });
}