const MAX_ROWS = 100;
let TEST_DATA = {};

const TABLE_OPTIONS = {
    skip_headers: ['_id'],
    sort: { time: true, iat: true },
    allow_table_stacking: true,
    ui_change_func: 'Table_UI_change',
    timestamps: { time: 'relative ', iat: 'relative ' }
};

async function Logs_init() {
	//Data
	try {
        let data = await FetchSettings();
        console.log(data);
        
        document.getElementById('LOGS').innerHTML += '<center>MODULES</center>';
        for (let modl of data.Modules) createChapter(modl);

        document.getElementById('LOGS').innerHTML += '<center>PACKAGES</center>';
        for (let packg of data.Packages) createChapter(packg);
    } catch (err) {
        OUTPUT_showError(err.message);
        return Promise.resolve();
	}

	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('LOGS').style.display = 'block';
}

async function FetchSettings() {
    return fetch("/api/pages/settings/logs", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}
function fetchLog(type, module, log, pagination) {
    return fetch("/api/" + type + "/logs/" + module + "/" + log + "?pagination=" + pagination, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER);
}

function createChapter(chapter) {
    let s = '';

    s += '<h1>' + chapter.name + '</h1>';
    
    for (let log in chapter.logs) {
        s += createCaption(log, createContentHTML(chapter.logs[log], chapter.name, log));
    }
    if (!chapter.logs || Object.getOwnPropertyNames(chapter.logs).length === 0) s += '<div>NO LOGS AVAILABLE<div>';

    document.getElementById('LOGS').innerHTML += s;
}
function createCaption(captionname, html) {
    let s = '';

    s += '<div class="CAPTION" onclick="show_captioncontent(this)">' + captionname + '</div>';
    s += '<div class="CAPTION_CONTENT">' + html + '</div>';

    return s;
}

function show_captioncontent(caption_elt) {
    let captions = document.getElementsByClassName('CAPTION');
    let captions_content = document.getElementsByClassName('CAPTION_CONTENT');

    let last_caption_elt = document.getElementsByClassName('SHOW_CAPTION_CONTENT')[0];

    let last_index = -1;
    let index = -1;

    for (let i = 0; i < captions.length; i++) {
        if (caption_elt == captions[i]) { index = i; break; }
    }
    for (let i = 0; i < captions_content.length; i++) {
        if (last_caption_elt == captions_content[i]) { last_index = i; break; }
    }

    if (last_index > -1) document.getElementsByClassName('CAPTION_CONTENT')[last_index].classList.remove('SHOW_CAPTION_CONTENT');
    if (index > -1 && index !== last_index) document.getElementsByClassName('CAPTION_CONTENT')[index].classList.add('SHOW_CAPTION_CONTENT');
}

function createContentHTML(content, module, log) {
    let options = cloneJSON(TABLE_OPTIONS);
    options.pagination = content.pagination;
    options.api_root = "/api/modules/logs/" + module + "/" + log;
    options.custom_data = {
        module: module,
        log: log,
    };
    
    if (content instanceof Array) {
        return MISC_createTable(content, options);
    } else if (content instanceof Object) {
        options.pagination = content.pagination;
        return MISC_createTable(content.data, options);
    } else {
        return content;
    }
}