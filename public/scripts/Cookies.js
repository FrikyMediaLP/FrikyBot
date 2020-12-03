const LOCAL_HEADER = ["Cookie Name", "Set By?", "When Set?", "When Removed?", "Used for?"];
const SESSION_HEADER = ["Cookie Name", "Set By?", "When Set?", "Used for?"];
const COOKIE_HEADER = ["Cookie Name", "Set By?", "When Set?", "When Removed?", "Used for?"];

const METHODS = ['name', 'by', 'set', 'removed', 'reason'];

let LOCAL_DATA = [];
let SESSION_DATA = [];
let COOKIE_DATA = [];

let last_local = null;
let last_session = null;
let last_cookie = null;

function init() {
    OUTPUT_create();

    fetch("/api/Cookies")
        .then(data => data.json())
        .then(async json => {
            if (json.err) return Promise.reject(new Error(json.err));
            
            LOCAL_DATA = json.data.LocalStorage;
            SESSION_DATA = json.data.SessionStorage;
            COOKIE_DATA = json.data.Cookies;

            Cookie_Table_display('all');
            stopWaiting(true);
            return Promise.resolve();
        })
        .catch(err => {
            stopWaiting(false);
            OUTPUT_showError(err.message);
            console.log(err);
        });
}

function Cookie_Table_display(type) {
    if (type === 'all' || type === 'local') {
        //LocalStorage
        if (LOCAL_DATA.length > 0) {
            document.getElementById('Table_LocalStorage').innerHTML = Cookie_Table(LOCAL_DATA, 'local');
            document.getElementById('Table_LocalStorage').removeAttribute('hidden');
        } else {
            document.getElementById('LocalStorage').innerHTML += '<center>NO LOCAL STORAGE COOKIES USED</center>';
        }
    }

    if (type === 'all' || type === 'session') {
        //SessionStorage
        if (SESSION_DATA.length > 0) {
            document.getElementById('Table_SessionStorage').innerHTML = Cookie_Table(SESSION_DATA, 'session');
            document.getElementById('Table_SessionStorage').removeAttribute('hidden');
        } else {
            document.getElementById('SessionStorage').innerHTML += '<center>NO SESSION STORAGE COOKIES USED</center>';
        }
    }

    if (type === 'all' || type === 'cookie') {
        //Cookies
        if (COOKIE_DATA.length > 0) {
            document.getElementById('Table_Cookies').innerHTML = Cookie_Table(COOKIE_DATA, 'cookie');
            document.getElementById('Table_Cookies').removeAttribute('hidden');
        } else {
            document.getElementById('Cookies').innerHTML += '<center>NO COOKIES USED</center>';
        }
    }
}

function Cookie_Table(content, type) {
    if (!content || !type) return '';

    let s = '';
    s += Cookie_Table_Header(type);
    s += Cookie_Table_Content(content);
    return s;
}
function Cookie_Table_Header(type) {
    let s = '';
    let headers = [];
    
    if (type === 'local') {
        headers = LOCAL_HEADER;
    } else if (type === 'session') {
        headers = SESSION_HEADER;
    } else if (type === 'cookie') {
        headers = COOKIE_HEADER;
    }

    for (let i = 0; i < headers.length; i++) {
        let method = METHODS[i < 3 || headers.length == 5 ? i : i + 1];
        let method_last = null;
        let dir = 0;

        if (type === 'local') {
            method_last = last_local;
        } else if (type === 'session') {
            method_last = last_session;
        } else if (type === 'cookie') {
            method_last = last_cookie;
        }

        if (method_last && method_last.split(":")[0] === method)
            dir = method_last.split(":")[1];

        s += '<div class="COOKIE_TABLE_HEADER" onclick="Cookie_Table_click(this, \'' + type + '\')" data-method="' + method + '" data-dir="' + dir + '">' + headers[i] + '<span></span></div>';
    }

    return s;
}
function Cookie_Table_Content(content) {
    let s = '';

    for (let con of content) {
        s += '<div>' + con.name + '</div>';
        s += '<div>' + con.by + '</div>';
        s += '<div>' + con.set + '</div>';
        if (con.removed) s += '<div>' + con.removed + '</div>';
        s += '<div>' + con.reason + '</div>';
    }

    return s;
}

function Cookie_Table_click(elt, type) {
    let data = [];

    let method = elt.dataset.method;
    let dir = elt.dataset.dir === '1' ? -1 : 1;
    let func = (a, b, dir) => 1;

    if (type === 'local') {
        data = LOCAL_DATA;
        last_local = method + ":" + dir;
    } else if (type === 'session') {
        data = SESSION_DATA;
        last_session = method + ":" + dir;
    } else if (type === 'cookie') {
        data = COOKIE_DATA;
        last_cookie = method + ":" + dir;
    }
    
    //Method
    if (method === 'name') {
        func = Cookie_Data_sort_Name;
    } else if (method === 'by') {
        func = Cookie_Data_sort_By;
    } else if (method === 'set') {
        func = Cookie_Data_sort_Set;
    } else if (method === 'removed') {
        func = Cookie_Data_sort_Removed;
    } else if (method === 'reason') {
        func = Cookie_Data_sort_Reason;
    }
    
    data.sort((a, b) => func(a, b, (-1) * dir));
    Cookie_Table_display(type);
}

function Cookie_Data_sort_Name(a, b, dir = 1) {
    return dir * a.name.localeCompare(b.name);
}
function Cookie_Data_sort_By(a, b, dir = 1) {
    return dir * a.by.localeCompare(b.by);
}
function Cookie_Data_sort_Set(a, b, dir = 1) {
    return dir * a.set.localeCompare(b.set);
}
function Cookie_Data_sort_Removed(a, b, dir = 1) {
    return dir * a.removed.localeCompare(b.removed);
}
function Cookie_Data_sort_Reason(a, b, dir = 1) {
    return dir * a.reason.localeCompare(b.reason);
}

function stopWaiting(all = false) {
    if (all) {
        while (document.getElementsByClassName('WAITING_PARENT').length > 0) {
            document.getElementsByClassName('WAITING_PARENT')[0].remove();
        }
    } else {
        while (document.getElementsByClassName('LOADING_RING').length > 0) {
            document.getElementsByClassName('LOADING_RING')[0].remove();
        }
    }
}