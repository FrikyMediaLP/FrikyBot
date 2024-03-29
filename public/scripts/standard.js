let ROOT = "";
let COOKIE_ACCEPT = false;
let ONCOOKIEACCEPT = null;
let PAGE_IS_PROTECTED = false;
let DISABLE_COOKIE_BLOCKED_NOTIFICATION = false;

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
            } else if (window.location.href.indexOf('/Cookies') < 0){
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
    //FETCH NAVI
    return fetch("/api/pages/navigation", getAuthHeader())
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(json.data, "MAINNAV");
                NAVIGATIONV2_SCROLL_HL_CHECK(true);
                return Promise.resolve();
            }
        });
}

//COOKIES
function displayCookieNotification(x) {
    const text = 'This Page uses Cookies! To <b>enable</b> them and check what they are used for, please visit the ';

    let s = '<div id="COOKIE_NOTIFICATION">';
    s += '<span title="' + text + ' Cookies Page!">' + text + ' <a href="/Cookies">Cookies Page</a>!</span>';
    s += '</div>';

    x.innerHTML = s;
    document.getElementById('contentHeader').classList.add('COOKIENOTE');
}

function getAllCookies(session) {
    if (session) {
        return sessionStorage;
    } else {
        return localStorage;
    }
}
function hasCookie(name, session) {
    return getCookie(name, session) != null;
}
function hasCookieAllowed(name) {
    return (getCookie('ACCEPTED_COOKIES') || '').split(';').find(elt => elt === name) !== undefined;
}
function setCookie(name, value, session) {
    if (name === 'CookieAccept' || (COOKIE_ACCEPT && (name === 'ACCEPTED_COOKIES' || (getCookie('ACCEPTED_COOKIES') || '').split(';').find(elt => elt === name)))) {
        if (session) sessionStorage.setItem(name, value);
        else localStorage.setItem(name, value);
    } else if (!DISABLE_COOKIE_BLOCKED_NOTIFICATION) {
        if (document.getElementsByTagName('output')) {
            let s = 'Cookie "' + name + '" was not saved, because you didnt allowed that Cookie!';
            OUTPUT_showError(s + ' <a href="/Cookies#highlighted=' + name + '" target="_blank">Change Cookie Settings!</a>');
            return s;
        }
    }
    
    return true;
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
            error = (await response.json()).err;
        } catch (err) {
            try {
                error = await response.text();
            } catch (err) {

            }
        }

        return Promise.reject(new Error("Error: " + response.status + " - " + (error || response.statusText)));
    }
}
function getAuthHeader() {
    if (LOGIN_getCookies && LOGIN_getCookies()) {
        let cookies = LOGIN_getCookies();
        let opts = {};

        if (cookies.oauth_token) {
            opts['headers'] = { 'authorization': 'OAuth ' + cookies.oauth_token  }
        } else {
            opts['headers'] = { 'authorization': 'Bearer ' + cookies.id_token  }
        }

        return opts;
    }

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
    return decodeURIComponent(window.location.hash);
}
function GetURLHashArray() {
    if (GetURLHash() === "") return [];

    let arr = GetURLHash().split('&');

    arr[0] = arr[0].substring(1);
    
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === "") continue;
        if (arr[i].split('=').length === 1) arr[i] = { name: arr[i] }
        else arr[i] = { name: arr[i].split('=')[0], value: arr[i].split('=')[1].split(',') };
    }

    return arr;
}
function HasURLHash(name = '') {
    return GetURLHashArray().find(elt => elt.name === name) !== undefined;
}
function GetURLHashContent(name = '') {
    return GetURLHashArray().find(elt => elt.name === name) || null;
}

function SetURLHashParam(name, value) {
    if (!name) return;

    let arr = GetURLHashArray();

    let elt = arr.find(arrElt => arrElt.name === name);

    if (elt) elt.value = value;
    else arr.push({ name, value });

    let s = '';
    for (let arrElt of arr) {
        s += '&' + arrElt.name;
        if (arrElt.value) s += '=' + arrElt.value;
    }
    window.location.hash = s.substring(1);
}
function RemoveURLHashParam(name) {
    if (!name) return;

    let arr = GetURLHashArray();
    let index;

    arr.find((arrElt, idx) => {
        if (arrElt.name === name) {
            index = idx;
            return true;
        }
        return false;
    });

    if (index) arr.splice(index, 1);

    let s = '';
    for (let arrElt of arr) {
        s += '&' + arrElt.name;
        if (arrElt.value) s += '=' + arrElt.value;
    }
    window.location.hash = s.substring(1);
}

function GetURLSearch() {
    return decodeURIComponent(window.location.search);
}
function GetURLSearchArray() {
    if (GetURLSearch() === "") return [];

    let arr = GetURLSearch().split('&');

    arr[0] = arr[0].substring(1);

    for (let i = 0; i < arr.length; i++) {
        arr[i] = { name: arr[i].split('=')[0], value: arr[i].split('=')[1].split(',') };
    }

    return arr;
}
function HasURLSearch(name = '') {
    return GetURLSearchArray().find(elt => elt.name === name) !== undefined;
}
function GetURLSearchContent(name = '') {
    return (GetURLSearchArray().find(elt => elt.name === name) || {}).value || null;
}

function GetPaginationValues(pagination = "") {
    if (!pagination) return null;
    let out = [10, 0, {}];

    try {
        if (pagination.indexOf('A') >= 0 && pagination.indexOf('B') >= 0 && pagination.indexOf('C') >= 0) {
            out[0] = parseInt(pagination.substring(1, pagination.indexOf('B')));
            out[1] = parseInt(pagination.substring(pagination.indexOf('B') + 1, pagination.indexOf('C')));
        }

        if (pagination.indexOf('T') >= 0) out[2].timesorted = true;
        if (pagination.indexOf('CSS') >= 0 && pagination.indexOf('CSE') >= 0) {
            out[2].customsort = pagination.substring(pagination.indexOf('CSS') + 2, pagination.indexOf('CSE'));
        }
        if (pagination.indexOf('PS') >= 0 && pagination.indexOf('PE') >= 0) out[2].pagecount = parseInt(pagination.substring(pagination.indexOf('PS') + 2, pagination.indexOf('PE')));
    } catch (err) {
        return null;
    }

    return out;
}
function GetPaginationString(first = 10, cursor = 0, options = {}) {
    let s = "A" + first + "B" + Math.max(0, Math.min(cursor, (options.pagecount === undefined ? (cursor + 1) : options.pagecount) - 1)) + "C";
    if (options.timesorted) s += "T";
    if (options.customsort) s += "CSS" + customsort + "CSE";
    if (options.pagecount !== undefined) s += "PS" + options.pagecount + "PE";
    return s;
}

//WEBSOCKET
function StartWebsocket(register_info, on_message = (event) => 'unused', on_terminated = (reason) => 'unused', on_system = (event) => 'unused') {
    let is_secure = window.location.protocol === 'https:';

    const socket = new WebSocket((is_secure ? 'wss' : 'ws') + '://' + window.location.hostname + (window.location.port ? ":" + window.location.port : ""));

    socket.addEventListener('message', function (event) {
        if (event.data.toString() === 'Error') return console.error("Websocket error!");

        let type = event.data.split(":")[0];

        //System Messages
        if (type === "register" || type === "ping" || type === "terminated") {
            if (type === "register") socket.send("register:" + JSON.stringify(register_info));
            if (type === "ping") socket.send("pong");
            if (type === "terminated") {
                let callback = on_terminated(event.data.split(":")[1]);
                if (callback === 'unused') console.error("Websocket Terminated! Reason: " + event.data.split(":")[1]);
                socket.close(1001, "terminated");
            }

            return on_system(event);
        }

        //Custom Messages
        return on_message(event);
    });

    socket.addEventListener('close', function (event) {
        console.error("Websocket closed!");
        if (event.code === 1006) {
            //Abnormal Close - Probably a Heartbeat Timeout
            console.log("This Close was abnormal! Its probably cause by a Ping-Timeout of your Proxy Service! Try to raise the send / read timeout length to match your WebApp Setting! (e.g. nginx`s default is -> proxy_read_timeout 60s; proxy_send_timeout 60s;). Alternativily lower the WebApp Ping interal to match your Proxy.");
        }
    });

    return socket;
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
function FindHTMLParent(elt, parent_match = (parent) => true) {
    while (elt && parent_match(elt) === false && elt.tagName !== 'BODY') {
        elt = elt.parentElement;
    }
    if (!elt) return null;
    return elt.tagName !== 'BODY' ? elt : null;
}
function FindSubElementFromPath(parent, path = []) {
    if (path.length === 0) return parent;

    const type = path[0].charAt(0);
    const check_class = (a) => a.classList.contains(path[0].substring(1));
    const check_id = (a) => a.id === path[0].substring(1);
    const check_tag = (a) => a.tagName === path[0].toUpperCase();
    const check_dataset = (a) => a.dataset[path[0].substring(path[0].indexOf('-') + 1, path[0].indexOf('"') - 1)] === path[0].substring(path[0].indexOf('"') + 1, path[0].lastIndexOf('"'));

    let checkChild = (a) => false;
    if (path[0] instanceof Function) checkChild = path[0];
    else if (type === '.') checkChild = check_class;
    else if (type === '#') checkChild = check_id;
    else if (path[0].startsWith('data-')) checkChild = check_dataset;
    else checkChild = check_tag;

    for (let child of parent.childNodes) {
        if (!(child instanceof Element)) continue;
        if (checkChild(child)) return FindSubElementFromPath(child, path.slice(1));
    }

    return null;
}
//GRID-STUFF
function disableContent(callback, use_disabler_click = false) {
    if (document.getElementById('contentDISABLER')) return;

    let div = document.createElement('DIV');
    div.id = 'contentDISABLER';
    if (callback) div.dataset.callback = callback;
    document.getElementById('content').appendChild(div);
    document.getElementById('content').classList.add('DISABLED');
    if (use_disabler_click) document.getElementById("content").addEventListener("click", CONTENT_DISABLE_REMOVE_BLUR);
}
function enableContent() {
    if (!document.getElementById('contentDISABLER')) return;
    if (document.getElementById('contentDISABLER').dataset.callback) window[document.getElementById('contentDISABLER').dataset.callback]();
    document.getElementById('contentDISABLER').remove();
    document.getElementById('content').classList.remove('DISABLED');
    document.getElementById("content").removeEventListener("click", CONTENT_DISABLE_REMOVE_BLUR);
}
function CONTENT_DISABLE_REMOVE_BLUR() {
    enableContent();
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
function FillFormattedString(string = "", vars = {}) {
    let outstring = "";

    let i = 0;
    while (string.indexOf('{', i) >= 0 && string.indexOf('}', string.indexOf('{', i)) >= 0 ) {
        let varname = string.substring(string.indexOf('{', i) + 1, string.indexOf('}', string.indexOf('{', i)));

        outstring += string.substring(i, string.indexOf('{', i));
        outstring += vars[varname];

        i = string.indexOf('}', string.indexOf('{', i)) + 1;
    }
    outstring += string.substring(i);

    return outstring;
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
    let index = 0;
    
    while (string.indexOf(search, index) >= 0) {
        index = string.indexOf(search, index);

        let pre = string.substring(0, index);
        let post = string.substring(search.length + index);
        
        string = pre + replace + post;
        index += replace.length;
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
function GetValueAtPath(obj, pathArr) {
    if (pathArr.length === 0) return obj;
    if (obj[pathArr[0]] !== undefined) return GetValueAtPath(obj[pathArr[0]], pathArr.slice(1));
}
function cloneJSON(json) {
    let new_json = {};

    for (let key in json) {
        if (json[key] instanceof Array) new_json[key] = cloneJSONArray(json[key]);
        else if (json[key] instanceof Function) new_json[key] = json[key];
        else if (json[key] instanceof Object) new_json[key] = cloneJSON(json[key]);
        else new_json[key] = json[key];
    }

    return new_json;
}
function cloneJSONArray(arr) {
    let new_arr = [];

    for (let elt of arr) {
        if (elt instanceof Array) new_arr.push(cloneJSONArray(elt));
        else if (elt instanceof Function) new_arr.push(elt);
        else if (elt instanceof Object) new_arr.push(cloneJSON(elt));
        else new_arr.push(elt);
    }

    return new_arr;
}

function sortAlphabetical(a, b) {
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a.charCodeAt(i) < b.charCodeAt(i)) return -1;
        if (a.charCodeAt(i) > b.charCodeAt(i)) return 1;
    }

    return a.length - b.length;
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
    return "/images/Profiles/" + (colors[id > colors.length - 1 ? id % (colors.length - 1) : id] || colors[0]) + (transparent ? '_transparent' : '') + ".png";
}
function COLOR_PALETTE(id) {
    let colors = ["blue", "green", "orange", "purple", "red", "yellow"];
    return colors[id > colors.length - 1 ? id % (colors.length - 1) : id] || colors[0];
}
function GetCountdownTime(exp) {
    let until = new Date(exp) - new Date();
    until = Math.floor(until / 1000);

    let h = Math.floor(until / (60 * 60));
    until -= h * 60 * 60;

    let m = Math.floor(until / 60);
    until -= m * 60;

    let s = until;

    if (until < 0 || h < 0 || m < 0 || s < 0) return null;

    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return h + "H " + m + "M " + s + "S";
}
function GetLocalISODate(date = new Date(), skips = []) {
    let html_date = '';

    if(!skips.find(elt => elt === 'year')) html_date += date.getFullYear() + '-';
    if (!skips.find(elt => elt === 'month')) html_date += (date.getMonth() < 9 ? '0' : '') + (date.getMonth()  + 1) + '-';
    if (!skips.find(elt => elt === 'day')) html_date += (date.getDate() < 10 ? '0' : '') + date.getDate() + 'T';
    if (!skips.find(elt => elt === 'hour')) html_date += (date.getHours() < 10 ? '0' : '') + date.getHours() + ':';
    if (!skips.find(elt => elt === 'minute')) html_date += (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ':';
    if (!skips.find(elt => elt === 'second')) html_date += (date.getSeconds() < 10 ? '0' : '') + date.getSeconds() + ':';

    return html_date.substring(0, html_date.length - 1);
}

//Math
function Math_map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
function GenerateRandomBytes(number = 10) {
    let s = "";
    for (let i = 0; i < number; i++) {

        let type = Math.random() * 3;

        if (type < 1) s += String.fromCharCode(Math.floor(Math.random() * 10) + 48);
        else if (type < 2) s += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        else if (type < 3) s += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
    return s;
}