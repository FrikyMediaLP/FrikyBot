let ROOT = "";
let COOKIE_ACCEPT = false;
let ONCOOKIEACCEPT = null;

//Website Stuff
async function Standard_Page_Init(settings = {}){
    return new Promise(async (resolve, reject) => {
        if (hasCookie("CookieAccept") && getCookie("CookieAccept") == "true") {
            COOKIE_ACCEPT = true;
        }
        
        calculateROOT();

        try {
            if (settings.NAVIGATION_ENABLE_DEFAULT != false)
                await NAVIVATION_init();
        } catch (err) {
            console.log(err);
        }

        try {
            if (settings.NAVIGATION_ENABLE_STATUS != false)
                await BOT_STATUS_DETAILS_MINI();
        } catch (err) {
            console.log(err);
        }

        if (settings.PROFILE_ENABLE != false && TTV_PROFILE_isLoggedIn()) {
            TTV_PROFILE_initProfile();
            if (document.getElementById("Login_Bot_Navi"))
                document.getElementById("Login_Bot_Navi").childNodes[0].childNodes[1].innerHTML = "Log out";
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
            document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(json.data);
            NAVIGATIONV2_SCROLL_HL_CHECK(true);
            return Promise.resolve();
        }
    }

    //Create UNLOADED
    //let s = "";

    //for (let i = 0; i < 3; i++) {
    //    s += '<div class="mainNaviHeader"><div class="UNLOADED"></div></div>';

    //    for (let j = 0; j < 4-i; j++) {
    //        s += '<div class="caption"><a><div class="UNLOADED_S"></div><span class="UNLOADED"></span></a></div>';
    //    }
    //}

    //document.getElementById("mainNavi").innerHTML = s;

    //FETCH NAVI
    return fetch("/api/Navi")
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(json.data);
                NAVIGATIONV2_SCROLL_HL_CHECK(true);
                
                //SAVE IN COOKIES
                NAVIVATION_saveCookiesData(json.data);
            }
        })
        .catch(err => console.log(err));
}

function NAVIVATION_createCaption(name, contents) {

    if (!contents || contents.length == 0) {
        return "";
    }

    let s = '<div class="mainNaviHeader"><span>' + name + '</span></div>';

    for (let content of contents) {
        s += NAVIVATION_createContent(content);
    }
    return s;
}
function NAVIVATION_createContent(content) {
    let s = '<div class="caption" ' + (content.name == "Login" ? 'id="Login_Bot_Navi"' : "") + ' >';
    s += '<a href="./' + ROOT + content.href + '">';
    s += '<img src="' + ROOT + content.icon + '" />';
    s += '<span>' + content.name + '</span>';
    s += '</a>';
    s += '</div>';
    return s;
}

function NAVIVATION_getCookiesData() {
    if (COOKIE_ACCEPT) {
        try {
            return JSON.parse(getCookie("NAVIVATION"), true);
        } catch{
            return null
        }
    } else {
        return null;
    }
}
function NAVIVATION_saveCookiesData(data) {
    if (COOKIE_ACCEPT) {
        setCookie("NAVIVATION", JSON.stringify(data), true);
    }
}

//COOKIES
function displayCookieNotification(x) {
    x.innerHTML = '<div id="COOKIE_NOTIFICATION"><span>This Page uses Cookies! More Info <a href="' + ROOT + 'Data-and-Cookies">here</a>!</span><button onclick="CookieBtn(true)">ACCEPT</button></div>';
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
function hasArrayElement(arr, elm) {
    for (let el of arr) {
        if (elm == el) {
            return true;
        }
    }

    return false;
}
function copyToClipboard(str){
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