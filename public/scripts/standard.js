let ROOT = "";
let COOKIE_ACCEPT = false;
let ONCOOKIEACCEPT = null;

//Website Stuff
async function Standard_Page_Init(settings = {}){
    return new Promise(async (resolve, reject) => {
        //Cookies
        if (settings.COOKIE_ENABLE_AUTOCHECK != false) {
            if (hasCookie("CookieAccept") && getCookie("CookieAccept") == "true") {
                COOKIE_ACCEPT = true;

                //Darkmode
                if (hasCookie("darkmode") && getCookie("darkmode") == "true") {
                    toggleLightMode(true);
                }
            } else {
                displayCookieNotification(document.getElementById('contentHeader'));
            }
        }

        //URL ROOT TO FrikyBot.de
        calculateROOT();

        //Default Navigation
        try {
            if (settings.NAVIGATION_ENABLE_DEFAULT != false) {
                await NAVIVATION_init();
            }
        } catch (err) {
            console.log(err);
        }

        //Default Navigation BotStatus
        try {
            if (settings.NAVIGATION_ENABLE_DEFAULT != false && settings.NAVIGATION_ENABLE_STATUS != false)
                await BOT_STATUS_DETAILS_MINI();
        } catch (err) {
            console.log(err);
        }

        //Default Hover Profile
        if (settings.PROFILE_ENABLE != false && LOGIN_isLoggedIn()) {

            try {
                await HOVERPROFILE_init();

                //Update Navi
                if (document.getElementById("MAINNAV_Settings_Login")) {
                    document.getElementById("MAINNAV_Settings_Login").innerHTML = "Logout";
                }
            } catch (err) {
                if (err.message !== "jwt expired")
                    console.log(err);
            }
        }

        resolve();
    });
}
function calculateROOT() {
    //CASE 2: /test or /test.html

   let paths = window.location.pathname.split("/").length-1;
    for (let i = paths; i > 1; i--) {
        ROOT += "../";
    }

}

//NAVIGATION
async function NAVIVATION_init() {
    if (COOKIE_ACCEPT) {
        let dta = NAVIVATION_getCookiesData();
        if (dta) {
            NAVIGATIONV2_SCROLL_HL_CHECK(true);
            return Promise.resolve();
        }
    }

    //FETCH NAVI
    let opt = {};
    if (LOGIN_getCookies())
        opt = { headers: { "authorization": "Bearer " + LOGIN_getCookies().id_token } };

    return fetch("/api/pages/navigation", opt)
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(json.data, "MAINNAV");
                NAVIGATIONV2_SCROLL_HL_CHECK(true);
                
                //SAVE IN COOKIES
                NAVIVATION_saveCookiesData(json.data);
                return Promise.resolve();
            }
        });
}

function NAVIVATION_getCookiesData() {
    try {
        return JSON.parse(getCookie("NAVIVATION"), true);
    } catch (err) {
        return null
    }
}
function NAVIVATION_saveCookiesData(data) {
    setCookie("NAVIVATION", JSON.stringify(data), true);
}

//COOKIES
function displayCookieNotification(x) {
    x.innerHTML = '<div id="COOKIE_NOTIFICATION"><span>This Page uses Cookies! More Info <a href="' + ROOT + 'Cookies">here</a>!</span><button onclick="CookieBtn(true)">ACCEPT</button></div>';
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

function hasCookie(name, session) {
    return getCookie(name, session) != null;
}
function setCookie(name, value, session) {
    if (COOKIE_ACCEPT) {
        if (session) {
            sessionStorage.setItem(name, value);
        } else {
            localStorage.setItem(name, value);
        }
    }

}
function setCookieNoOverwrite(name, value, session) {
    if (COOKIE_ACCEPT && !hasCookie(name, session))
        setCookie(name, value, session);
}
function getCookie(name, session) {
    if (session) {
        return sessionStorage.getItem(name);
    } else {
        return localStorage.getItem(name);
    }
}
function removeCookie(name, session) {
    if (session)
        sessionStorage.removeItem(name);
    else
        localStorage.removeItem(name);
}
function clearAllCookies() {
    localStorage.clear();
    sessionStorage.clear();
}

//Fetch
async function STANDARD_FETCH_RESPONSE_CHECKER(response) {
    if (response.status === 200) {
        //Return JSON Payload

        let json;

        try {
            json = await response.json();
            if (json.err !== undefined) return Promise.reject(new Error(json.err));
        } catch (err) {

        }
        
        return Promise.resolve(json);
    } else if (response.status === 401) {
        //Unauthorized Error
        let error = null;

        try {
            error = await response.text();
        } catch (err) {

        }

        return Promise.reject(new Error("Unauthorized" + (error && error !== 'Unauthorized' ? ": " + error : '')));
    } else {
        //Other Fetch Error
        let error = null;

        try {
            error = await response.text();
        } catch (err) {

        }

        return Promise.reject(new Error("Error: " + response.status + " - " + error));
    }
}
function getAuthHeader() {
    if (LOGIN_getCookies && LOGIN_getCookies())
        return { headers: { "Authorization": "Bearer " + LOGIN_getCookies().id_token } };

    return { headers: {} };
}

//URL
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

function GetURLHash() {
    return window.location.hash;
}
function GetURLHashArray() {
    if (GetURLHash() === "") return []; 

    let arr = GetURLHash().split('&');

    arr[0] = arr[0].substring(1);

    for (let i = 0; i < arr.length; i++) {
        arr[i] = { name: arr[i].split('=')[0], value: arr[i].split('=')[1].split(',') };
    }

    return arr;
}
function HasURLHash(name = '') {
    return GetURLHashArray().find(elt => elt.name === name) !== undefined;
}
function GetURLHashContent(name = '') {
    return GetURLHashArray().find(elt => elt.name === name) || null;
}

//HTML
function copyToClipboard(str) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}
function ScollToHash() {
    if (document.location.hash.indexOf("#") >= 0 && document.getElementById(document.location.hash.substring(1)))
        document.getElementById(document.location.hash.substring(1)).scrollIntoView();
}
function toggleLightMode(dark) {
    if (!document.getElementById('LightModeButton')) return;

    if (dark === true && !document.getElementsByTagName('body')[0].classList.contains('darkmode')) {
        document.getElementsByTagName('body')[0].classList.toggle('darkmode');
        document.getElementById('LightModeButton').innerHTML = document.getElementsByTagName('body')[0].classList.contains('darkmode') ? 'LightMode' : 'DarkMode'
    } else if (dark === false && document.getElementsByTagName('body')[0].classList.contains('darkmode')) {
        document.getElementsByTagName('body')[0].classList.toggle('darkmode');
        document.getElementById('LightModeButton').innerHTML = document.getElementsByTagName('body')[0].classList.contains('darkmode') ? 'LightMode' : 'DarkMode'
    } else {
        document.getElementsByTagName('body')[0].classList.toggle('darkmode');
        document.getElementById('LightModeButton').innerHTML = document.getElementsByTagName('body')[0].classList.contains('darkmode') ? 'LightMode' : 'DarkMode'
    }

    if (COOKIE_ACCEPT === true) {
        setCookie("darkmode", document.getElementsByTagName('body')[0].classList.contains('darkmode'));
    }
}
function HTMLArray2RealArray(arr = []) {
    let output = [];

    for (let elt of arr) {
        output.push(elt);
    }

    return output;
}

//Data
function findFormattedStringVariableTree(formattedString = "") {
    let start = formattedString.indexOf('{');
    let end = formattedString.lastIndexOf('}');

    if (start < 0 || end < 0 || start > end || (start == 0 && end == formattedString.length - 1)) return formattedString;

    let output = [];

    if (end + 1 === formattedString.length) {
        output.push(formattedString.substring(0, start));                                           //Prev Text
        output.push(findFormattedStringVariableTree(formattedString.substring(start)));             //Variable Tree
    } else {
        output.push(formattedString.substring(0, start));                                           //Prev Text
        output.push(findFormattedStringVariableTree(formattedString.substring(start, end + 1)));    //Variable Tree
        output.push(formattedString.substring(end + 1));                                            //Post Text
    }

    return output;
}
function FillFormattedString(string, vars = {}) {
    let outstring = "";

    for (let word of string.split(" ")) {
        let varname = word.substring(1, word.length-1);
        if (word.charAt(0) === "{" && word.charAt(word.length - 1) === "}" && vars[varname] !== undefined)
            outstring += " " + vars[varname];
        else
            outstring += " " + word;
    }

    return outstring.substring(1);
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
function hasArrayElement(arr, elm) {
    for (let el of arr) {
        if (elm == el) {
            return true;
        }
    }

    return false;
}
function removeNonAlphabet(str) {
    let s = "";

    for (let char of str) {
        if (('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z')) {
            s += char;
        }
    }

    return s;
}
function getFileTypeByURL(URL) {
    if (URL.indexOf('.') < 0)
        return null;

    let s = URL.split('.');
    return s[s.length - 1];
}

//CSS
function isColor(strColor) {
    var s = new Option().style;
    s.color = strColor;
    return s.color == strColor || s.color.indexOf("rgb") != -1;
} 
function isSize(size) {
    if (size.indexOf("px") == -1 && size.indexOf("em") == -1) {
        return false;
    }

    try {
        if (size.indexOf("px") != -1)
            parseInt(size.substring(0, size.indexOf("px")).trim());
        else if (size.indexOf("em") != -1)
            parseInt(size.substring(0, size.indexOf("em")).trim());
        return true;
    } catch{
        return false;
    }
}
function toggleClass(elt, className, parentSelect = 0) {
    for (let i = 0; i < parentSelect; i++) {
        elt = elt.parentElement;
    }

    elt.classList.toggle(className);
}

//MISC
function PROFILE_IMAGES(id, transparent = false) {
    let colors = ["blue", "green", "orange", "purple", "red", "yellow"];
    return ROOT + "images/Profiles/" + (colors[id > colors.length - 1 ? id % (colors.length - 1) : id] || colors[0]) + (transparent ? '_transparent' : '') + ".png";
}