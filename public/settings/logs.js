const MAX_ROWS = 100;

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

function createChapter(chapter) {
    let s = '';

    s += '<h1>' + chapter.name + '</h1>';
    
    for (let log in chapter.logs) {
        s += createCaption(log, createContentHTML(chapter.logs[log]));
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

function createContentHTML(content) {
    let options = {
        skip_headers: ['_id'],
        sort: { time: true, iat: true },
        allow_table_stacking: true,
        timestamps: { time: 'relative ', iat: 'relative ' }
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