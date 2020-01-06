let ROOT = "http://localhost:1337/"
let COOKIE_ACCEPT = false;
let ONCOOKIEACCEPT = null;

//Website Stuff
function Standard_Page_Init() {
    if (hasCookie("CookieAccept") && getCookie("CookieAccept") == "true") {
        COOKIE_ACCEPT = true;
    }

    getBotStatus();

    if (isLoggedIn()) {
        initProfile();
        document.getElementById("SignIn_Bot_Navi").childNodes[1].childNodes[3].innerHTML = "Log out";
    }
}

function getBotStatus() {
    let x = document.getElementById("statusHeader");

    fetch("/api/Status")
        .then(res => res.json())
        .then(json => {

            if (json.data && !json.err) {
                x.innerHTML = "Status: <span style='color: #00e03c;'>" + json.data.Status + "</span></br>";
                
                if (json.data.LogIn && json.data.LogIn.Status) {
                    x.innerHTML += "Log In: <span style='color: #00e03c;'>" + json.data.LogIn.Name + "</span>";
                } else {
                    x.innerHTML += "Log In: <span style='color: red;'>LogIn again!";
                }
            } else {
                x.innerHTML = "Status: <span style='color: red;'>ERROR! " + json.err + "</span>";
            }
        })
        .catch(err => {
            console.log(err);
            x.innerHTML = "Status: <span style='color: red;'>ERROR! " + err + "</span>";
        });
}
function initProfile() {

    let name = getCookie("Username");
    let logo = getCookie("UserLogo");
    let id = getCookie("UserID");

    if (name && logo && id) {
        document.getElementById("contentHeader").innerHTML += '<div id="Profile" title="(' + id + ') ' + name + '"><a href="http://twitch.tv/' + name + '" target="_blank"><p>' + name + '</p><img src="' + logo + '" /></a></div>';
    }
}
function isLoggedIn() {
    if (getCookie("OAuth") && getCookie("Username") && getCookie("UserLogo") && getCookie("UserID")) {
        return true;
    } else {
        return false;
    }
}

//COOKIES
function displayCookieNotification(x) {
    x.innerHTML = '<div id="COOKIE_NOTIFICATION"><span>This Page uses Cookies! More Info <span id="hover" title="Cookies are used to share Usernames and IDs to other parts of the site, so you only need to log in once and not for every page! You can always check current localStorage Cookies in your Broswers settings!">here</span>!</span><button onclick="CookieBtn(true)">ACCEPT</button></div>';
}
function CookieBtn(state) {
    COOKIE_ACCEPT = state;
    document.getElementById("COOKIE_NOTIFICATION").remove();

    if (state) {
        setCookie("CookieAccept", "true");

        if (ONCOOKIEACCEPT) {
            ONCOOKIEACCEPT();
        }

    } else {
        clearAllCookies();
    }
}

function hasCookie(name) {
    return localStorage.getItem(name) != null;
}
function setCookie(name, value) {
    if (COOKIE_ACCEPT)
        localStorage.setItem(name, value);
}
function setCookieNoOverwrite(name, value) {
    if (COOKIE_ACCEPT && !hasCookie(name))
        localStorage.setItem(name, value);
}
function getCookie(name) {
    return localStorage.getItem(name);
}
function removeCookie(name) {
    localStorage.removeItem(name);
}
function clearAllCookies() {
    localStorage.clear();
}

//UTIL
function GetURLParams() {
    return window.location.search.substring(1).split('&');
}
function GetURLParamContent(paramName) {

    for (let param of GetURLParams()) {
        if (param.substring(0, param.indexOf('=')) == paramName) {
            return param.substring(param.indexOf('=') + 1);
        }
    }

    return null;
}
function HasURLParam(ParamName) {
    let sURLVariables = GetURLParams();

    for (var i = 0; i < sURLVariables.length; i++) {
        let sParamName = sURLVariables[i].split('=');
        if (sParamName[0] == ParamName) {
            return sParamName[1];
        }
    }
}
function PrintArraySpaced(arr) {
    let s = "";

    if (arr) {
        for (let el of arr) {
            s += (s == "" ? el : (" " + el))
        }
    }

    return s;
}
function replaceAll(string, search, replace) {
    while (string.indexOf(search) >= 0) {
        string = string.replace(search, replace);
    }

    return string;
}
