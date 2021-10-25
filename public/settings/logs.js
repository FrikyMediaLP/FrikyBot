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
function createTable(array, level = 0) {
    if (array.length === 0) return '<center>NO ENTRIES FOUND<center>';
    array = array.slice(0, MAX_ROWS);
    
    let Cols = [];

    //Create All Table Cols
    for (let elt of array) {
        for (let key in elt) {
            if (key === '_id') continue;
            if (Cols.find(elt2 => elt2 === key) === undefined) Cols.push(key);
        }
    }

    let colsCSS = '';
    for (let key of Cols) colsCSS += ' auto';

    let s = '<div class="CONTENT_TABLE" data-level="' + level + '" style="grid-template-columns:' + colsCSS + ';">';
    //Header
    for (let i = 0; i < Cols.length; i++) s += '<div class="CONTENT_TABLE_HEADER" data-tablec="' + i + '">' + Cols[i] + '</div>';
    
    //Sort
    if (Cols.find(elt => elt === 'time' )) {
        array.sort((a, b) => b['time'] - a['time']);
    }

    //Create Table
    for (let elt of array) {
        for (let j = 0; j < Cols.length; j++) {
            let key = Cols[j];
            let dataset = 'data-tablec="' + j + '"';

            if (elt[key] instanceof Object) {
                s += '<div ' + dataset + '>' + createTable([elt[key]], level + 1) + '</div>';
            }
            else if (key === 'time' || key === 'iat') {
                try {
                    let date = new Date(elt[key] * (elt[key] <= 9999999999 ? 1000 : 1));
                    s += '<div ' + dataset + '>' + date.toLocaleDateString('de-DE') + ' - ' + date.toLocaleTimeString('de-DE') + '</div>';
                } catch (err) {
                    s += '<div ' + dataset + '>' + elt[key] + '</div>';
                }
            }
            else s += '<div ' + dataset + '>' + (elt[key] || '-') + '</div>';
        }
    }

    return s + '</div>';
}

async function Table_UI_change(elt, e, pagination) {
    if (e.target.classList.contains('MISC_SELECT_CURSOR')) return;
    
    //Find Table Element
    let table = elt.parentElement;
    while (table.tagName !== 'CUSTOMTABLE' && table.tagName !== 'BODY') {
        table = table.parentElement;
    }
    if (table.tagName !== 'CUSTOMTABLE') return;

    //Disable UI until done
    let ui = null;
    for (let child of table.childNodes) if (child.tagName === 'TABLEINTERFACE') ui = child;
    //MISC_createTable_disableUI(ui);

    let pages = GetPaginationValues(pagination);

    //Create Pagination
    if (elt.tagName === 'BUTTON') {
        if (elt.innerHTML === 'first') pages[1] = 0;
        else if (elt.innerHTML === 'prev') pages[1]--;
        else if (elt.innerHTML === 'next') pages[1]++;
        else if (elt.innerHTML === 'last') pages[1] = pages[2].pagecount;
    } else if (elt.tagName === 'INPUT') {
        pages[1] = parseInt(elt.value);
    } else if (elt.classList.contains('MISC_SELECT')) {
        pages[0] = parseInt(MISC_SELECT_GetValue(elt));
        pages[1] = 0;
    }

    if (pages[0] < 0) pages[0] = 0;
    if (pages[2].pagecount !== undefined && pages[1] > pages[2].pagecount) pages[1] = pages[2].pagecount;

    pagination = GetPaginationString(pages[0], pages[1], pages[2]);

    try {
        //Update Table
        await Table_update(table, pagination);
    } catch (err) {
        console.log(err);
    }

    //Re-Enable UI for new Requests
    ui = null;
    for (let child of table.childNodes) if (child.tagName === 'TABLEINTERFACE') ui = child;
    MISC_createTable_disableUI(ui, true);
}
async function Table_update(table, pagination) {
    try {
        //Fetch new Data
        let result = await fetchLog('modules', table.dataset.module, table.dataset.log, pagination);

        //Update Content
        let options = cloneJSON(TABLE_OPTIONS);
        options.pagination = result.pagination;
        options.custom_data = {
            module: table.dataset.module,
            log: table.dataset.log,
        };
        MISC_createTable_update(table, result.data, options);
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}