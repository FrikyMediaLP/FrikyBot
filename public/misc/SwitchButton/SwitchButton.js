/*
 *          SWITCH BUTTON
 * 
 * -------------------------------------
 *          NEEDED HTML CODE
 * -------------------------------------
 *
 *  - UNSET BUTTON
    <div class="SWITCH_BUTTON" onclick="SWITCH_BUTTON_TOGGLE(this)">
        <div class="SWITCH_BUTTON_CURSOR"></div>
    </div>

 *  - ON BUTTON
    <div class="SWITCH_BUTTON SWITCH_BUTTON_ON" onclick="SWITCH_BUTTON_TOGGLE(this)">
        <div class="SWITCH_BUTTON_CURSOR"></div>
    </div>
 *
 *  - OFF BUTTON
    <div class="SWITCH_BUTTON SWITCH_BUTTON_OFF" onclick="SWITCH_BUTTON_TOGGLE(this)">
        <div class="SWITCH_BUTTON_CURSOR"></div>
    </div>
 *
 * - Disabled ON BUTTON
    <div class="SWITCH_BUTTON SWITCH_BUTTON_ON SWITCH_BUTTON_DISABLED" onclick="SWITCH_BUTTON_TOGGLE(this)">
        <div class="SWITCH_BUTTON_CURSOR"></div>
    </div>
 *
 *
 *
 *
 * -------------------------------------
 *          SETTINGS
 * -------------------------------------
 *
 *  - OnChange: function name
 *  Is falled after every successfull State Change. Given is the resulted Button state as a Boolean, the button id and the button element
 */

let SWITCH_BUTTON_SETTINGS = {
    OnChange: (id, state, elt) => (id, state, elt)
};

function SWITCH_BUTTON_TOGGLE(x) {
    let state = "";
    let switching = false;
    let disabled = false;
    let id = -1;

    for (let i = 0; i < document.getElementsByClassName("SWITCH_BUTTON").length; i++) {
        if (document.getElementsByClassName("SWITCH_BUTTON")[i] == x) {
            id = i;
            break;
        }
    }

    let extrclass = "";
    for (let cl of x.classList) {
        if (cl == "SWITCH_BUTTON_ON") {
            state = "ON";
        } else if (cl == "SWITCH_BUTTON_OFF") {
            state = "OFF";
        } else if (cl == "SWITCH_BUTTON_TO_ON" || cl == "SWITCH_BUTTON_TO_OFF") {
            switching = true;
        } else if (cl == "SWITCH_BUTTON_DISABLED") {
            disabled = true;
        } else {
            extrclass += " " +  cl;
        }
    }
    
    if (!disabled) {
        if (state == "ON") {
            if (!switching) {
                x.setAttribute('value', 'off');
                x.className = "SWITCH_BUTTON SWITCH_BUTTON_ON SWITCH_BUTTON_TO_OFF" + extrclass;
                setTimeout(() => {
                    x.className = "SWITCH_BUTTON SWITCH_BUTTON_OFF" + extrclass;
                    SWITCH_BUTTON_SETTINGS.OnChange(id, false, x);
                }, 500);
            }
        } else {
            if (!switching) {
                x.setAttribute('value', 'on');
                x.className = "SWITCH_BUTTON SWITCH_BUTTON_OFF SWITCH_BUTTON_TO_ON" + extrclass;
                setTimeout(() => {
                    x.className = "SWITCH_BUTTON SWITCH_BUTTON_ON" + extrclass;
                    SWITCH_BUTTON_SETTINGS.OnChange(id, true, x);
                }, 500);
            }
        }
    }
}

function SWITCH_BUTTON_CREATE(state, disabled, onChange, id, cls, attributeStr = "") {
    if (state == true) {
        return '<div class="SWITCH_BUTTON SWITCH_BUTTON_ON ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + (cls || "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + (onChange ? onChange : "") + '" ' + attributeStr + '><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    } else if (state == false) {
        return '<div class="SWITCH_BUTTON SWITCH_BUTTON_OFF ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + (cls || "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + (onChange ? onChange : "") + '" ' + attributeStr + '><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    } else {
        return '<div class="SWITCH_BUTTON ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + (cls || "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + (onChange ? onChange : "") + '" ' + attributeStr + '><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    }
}

//ID Counting from 0
function SWITCH_BUTTON_GETVALUE(id) {
    let switches = document.getElementsByClassName("SWITCH_BUTTON");
    if (switches && switches.length - 1 < id && id >= 0) {
        return switches[id].className == "SWITCH_BUTTON SWITCH_BUTTON_ON";
    } else {
        return null;
    }
}

function SWITCH_BUTTON_GETVALUE_ELT(elt) {
    return (elt.classList.contains('SWITCH_BUTTON_ON') && !elt.classList.contains('SWITCH_BUTTON_TO_OFF')) || (elt.classList.contains('SWITCH_BUTTON_OFF') && elt.classList.contains('SWITCH_BUTTON_TO_ON'));
}


/* V2 */
/* 
    <switchbutton value="false"></switchbutton>
 */
function SWITCHBUTTON_AUTOFILL(elt) {
    let autofill_elt = elt => {
        if (elt.innerHTML === '')
            elt.innerHTML = '<SWITCHBUTTONCURSOR></SWITCHBUTTONCURSOR>';

        if (elt.getAttribute('onclick') === null || elt.getAttribute('onclick').indexOf('SWITCHBUTTON_TOGGLE') < 0)
            elt.setAttribute('onclick', 'SWITCHBUTTON_TOGGLE(this); ' + (elt.getAttribute('onclick') || ''));

        if (elt.getAttribute('preonclick') !== null)
            elt.setAttribute('onclick', elt.getAttribute('preonclick') + " " + (elt.getAttribute('onclick') || ''));
        
        if (elt.getAttribute('OverWriteonclick') !== null)
            elt.setAttribute('onclick', elt.getAttribute('OverWriteonclick'));
        
        if (elt.value === undefined) {
            elt.value = elt.getAttribute('value') === 'true';
            elt.setAttribute('value', elt.value);
        }
    };

    if (elt) {
        autofill_elt(elt);
        return;
    }

    for (let elt of document.getElementsByTagName('SWITCHBUTTON')) {
        autofill_elt(elt);
    }
}
function SWITCHBUTTON_TOGGLE(elt, state) {
    if (!elt) return;
    if (elt.getAttribute('disabled') !== null) return;
    if (elt.value === state) return;
    
    //Value
    if (state === undefined) elt.value = !elt.value;
    else if (state === true) elt.value = true;
    else if (state === false) elt.value = false;
    
    elt.setAttribute('value', elt.value + "");

    //Animation
    if (elt.value) {
        elt.style.animation = "SWITCH_BUTTON_ON 0.5s forwards";
        elt.childNodes[0].style.animation = "SWITCH_BUTTON_ON_CURSOR 0.5s forwards";
    } else {
        elt.style.animation = "SWITCH_BUTTON_OFF 0.5s forwards";
        elt.childNodes[0].style.animation = "SWITCH_BUTTON_OFF_CURSOR 0.5s forwards";
    }

    let inter = setInterval(() => {
        elt.style.animation = "";
        elt.childNodes[0].style.animation = "";

        clearInterval(inter);
    }, 1000);
}
function SWITCHBUTTON_CREATE(state, disabled, onclick, id, attributeStr = "") {
    let s = '<SWITCHBUTTON';

    if (id) s += ' id="' + id + '"';
    if (state) s += ' value="' + state + '"';
    if (disabled) s += ' disabled';
    s += ' onclick="SWITCHBUTTON_TOGGLE(this); ' + (onclick || '') + '"';
    s += ' ' + attributeStr;

    s += '></SWITCHBUTTON>';

    return s;
}

/* 
 *          MISC BUTTON
 * 
 * -------------------------------------
 *          NEEDED HTML CODE
 * -------------------------------------
 *
 *  - DELETE BUTTON
    <div class="MISC_TRASH_BUTTON" title="Delete">
        <img src="images/icons/trash-alt-solid.svg" />
    </div>

 *  - EDIT BUTTON
    <div class="MISC_EDIT_BUTTON" title="Edit">
        <img src="images/icons/pen-solid.svg" />
    </div>
 *
 *  - SAVE BUTTON
    <div class="MISC_SAVE_BUTTON" title="Save">
        <img src="images/icons/server-solid.svg" />
    </div>
 * 
 */

let MISC_BUTTON_SETTINGS = {
    OnClick: (elt, id) => (elt, id)
};

function MISC_BUTTON_TRASH_CREATE(id, title = 'TRASH') {
    let s = '<div class="MISC_TRASH_BUTTON" ' + (id ? 'id="' + id + '"' : '') + ' title="' + title + '" onclick="MISC_BUTTON_SETTINGS.OnClick(this, \'' + id + '\');">';
    s += '<img src="' + ROOT + 'images/icons/trash-alt-solid.svg" />';
    s += '</div>';
    return s;
}
function MISC_BUTTON_EDIT_CREATE(id, title = 'EDIT') {
    let s = '<div class="MISC_EDIT_BUTTON" ' + (id ? 'id="' + id + '"' : '') + ' title="' + title + '" onclick="MISC_BUTTON_SETTINGS.OnClick(this, \'' + id + '\');">';
    s += '<img src="' + ROOT + 'images/icons/pen-solid.svg" />';
    s += '</div>';
    return s;
}
function MISC_BUTTON_SAVE_CREATE(id, title = 'SAVE') {
    let s = '<div class="MISC_SAVE_BUTTON" ' + (id ? 'id="' + id + '"' : '') + ' title="' + title + '" onclick="MISC_BUTTON_SETTINGS.OnClick(this, \'' + id + '\');">';
    s += '<img src="' + ROOT + 'images/icons/server-solid.svg" />';
    s += '</div>';
    return s;
}

/*
 * -------------------------------------
 *        MICS LOADING ANIMATIONS
 * -------------------------------------
 * -------------------------------------
 *          Loading
 * -------------------------------------
 *
    <div class="LOADING_RING">
        <div class="LOADING_RING_SPINNER"></div>
    </div>
 *
 */

function MISC_LOADING_RING_CREATE(id, darkmode) {
    let s = '';

    s += '<div class="LOADING_RING ' + (darkmode ? '' : 'lightmode') + '" ' + (id ? 'id="' + id + '"' : '') + '>';
    s += '<div class="LOADING_RING_SPINNER"></div>';
    s += '</div>';

    return s;
}

/*
 * -------------------------------------
 *          Checkmark
 * -------------------------------------
 *
 *  - UNSET CHECKMARK
    <div class="CHECKMARK">
        <div class="CHECKMARK_SPINNER"></div>
        <div class="CHECKMARK_X"><div class="left"></div><div class="right"></div></div>
        <div class="CHECKMARK_CHECK"><div class="long"></div><div class="short"></div></div>
    </div>
 *
 *  - WAITING CHECKMARK
    <div class="CHECKMARK WAITING">
        <div class="CHECKMARK_SPINNER"></div>
        <div class="CHECKMARK_X"><div class="left"></div><div class="right"></div></div>
        <div class="CHECKMARK_CHECK"><div class="long"></div><div class="short"></div></div>
    </div>
 *
 *  - FAILED CHECKMARK
    <div class="CHECKMARK FAILED">
        <div class="CHECKMARK_SPINNER"></div>
        <div class="CHECKMARK_X"><div class="left"></div><div class="right"></div></div>
        <div class="CHECKMARK_CHECK"><div class="long"></div><div class="short"></div></div>
    </div>
 *
 *  - SUCCESS CHECKMARK
    <div class="CHECKMARK SUCCESS">
        <div class="CHECKMARK_SPINNER"></div>
        <div class="CHECKMARK_X"><div class="left"></div><div class="right"></div></div>
        <div class="CHECKMARK_CHECK"><div class="long"></div><div class="short"></div></div>
    </div>
 */

function CHECKMARK_TOGGLE(elt, type) {
    if (elt && elt instanceof Element) {
        elt.classList.remove('WAITING');
        elt.classList.remove('FAILED');
        elt.classList.remove('SUCCESS');

        elt.classList.add(type);
    }
}
function CHECKMARK_CREATE(type, id) {
    let s = '';

    s += '<div class="CHECKMARK' + (type ? ' ' + type : '') + '" ' + (id ? 'id="' + id + '"' : '' ) + '>';
    s += '<div class="CHECKMARK_SPINNER"></div>';
    s += '<div class="CHECKMARK_X"><div class="left"></div><div class="right"></div></div>';
    s += '<div class="CHECKMARK_CHECK"><div class="long"></div><div class="short"></div></div>';
    s += '</div>';

    return s;
}

/* 
 *          SELECT
 *
 * -------------------------------------
 *          Checkmark
 * -------------------------------------
 * 
 * <div class="MISC_SELECT" onclick="MISC_SELECT_SelectItem(this, event)">
    <div class="MISC_SELECT_CURSOR" value="default_value">default</div>
    <div class="MISC_SELECT_OPTIONS">
        <div value="value1">text1</div>
    </div>
   </div>
 */

function MISC_SELECT_create(options, default_index, id, onclick = "", extraclass = "", attributeStr = "", hide_default = false) {
    if (!options || !(options instanceof Array) || options.length === 0) return '';

    let s = '';
    s += '<div class="MISC_SELECT ' + extraclass + '" ' + (id != undefined !== null ? 'id="' + id + '"' : '') + ' onclick="MISC_SELECT_SelectItem(this, event); ' + onclick + '" ' + attributeStr + '>';
    s += MISC_SELECT_createInner(options, default_index, hide_default);
    s += '</div>';

    return s;
}
function MISC_SELECT_createInner(options, default_index, hide_default = false) {
    let s = '';

    let def_text = '';
    let def_value = '';

    //Default
    if (default_index !== undefined) {
        let option = options[default_index];
        if (option instanceof Array) {
            def_text = option[0];
            if (option.length === 1) def_value = option[0];
            if (option.length > 1) def_value = option[1];
        } else {
            def_text = option;
            def_value = option;
        }

    } else {
        for (let option of options) {
            if (option instanceof Array) {
                if (option.length === 0) continue;
                def_text = option[0];
                if (option.length === 1) def_value = option[0];
                if (option.length > 1) def_value = option[1];
            } else {
                def_text = option;
                def_value = option;
            }
            break;
        }
    }

    //Cursor
    s += '<div class="MISC_SELECT_CURSOR" value="' + def_value + '">' + def_text + '</div>';

    //Options
    s += '<div class="MISC_SELECT_OPTIONS">';
    
    for (let option of options) {
        let text = '';
        let value = '';

        if (option instanceof Array) {
            if (option.length === 0) continue;
            text = option[0];
            if (option.length === 1) value = option[0];
            if (option.length > 1) value = option[1];
        } else {
            text = option;
            value = option;
        }
        
        s += '<div value="' + value + '" ' + (def_value === value && hide_default === true ? ' hidden' : '') + '>' + text + '</div>';
    }

    s += '</div>';

    return s;
}

function MISC_SELECT_WidthCheck_All() {
    for (let elt of document.getElementsByClassName('MISC_SELECT')) MISC_SELECT_WidthCheck(elt);
}
function MISC_SELECT_WidthCheck(misc_select) {
    let wasHidden = [];
    let cursor_elt = null;
    let options_elts = [];

    for (let child of misc_select.childNodes) {
        if (child instanceof Element && child.classList.contains('MISC_SELECT_CURSOR')) {
            cursor_elt = child;
        } else if (child instanceof Element && child.classList.contains('MISC_SELECT_OPTIONS')) {
            options_elts = child.childNodes;
        }
    }

    //Change CSS to allow full width
    misc_select.classList.add('extend');
    cursor_elt.style.width = '200px';

    for (let option of options_elts) {
        if (option instanceof Element) {
            if (option.hasAttribute('hidden')) {
                option.removeAttribute('hidden');
                wasHidden.push(option);
            }
        }
    }

    //Find max width
    setTimeout(() => {
        let max_width = 0;

        for (let option of options_elts) {
            if (option instanceof Element) {
                if (max_width < option.clientWidth) max_width = option.clientWidth;
            }
        }

        let pL = parseInt(window.getComputedStyle(cursor_elt, null).getPropertyValue('padding-left'));
        let pR = parseInt(window.getComputedStyle(cursor_elt, null).getPropertyValue('padding-right'));

        max_width -= (pL + pR);

        //Set max width to Cursor
        cursor_elt.style.width = (max_width + 0.25) + 'px';

        //Hide Unhidden again
        misc_select.classList.remove('extend');

        for (let option of wasHidden) {
            option.setAttribute('hidden', 'true');
        }
    }, 1);
}
function MISC_SELECT_SelectItem(misc_select, eventORtext, value) {
    let cursor_elt = null;

    if (typeof misc_select === 'string') {
        misc_select = document.getElementById(misc_select);
    }

    if (eventORtext instanceof Event) {
        value = eventORtext.target.getAttribute('value');
        eventORtext = eventORtext.target.innerHTML;
    }

    for (let child of misc_select.childNodes) {
        if (child instanceof Element && child.classList.contains('MISC_SELECT_CURSOR')) {
            cursor_elt = child;
            break;
        }
    }
    
    cursor_elt.innerHTML = eventORtext;
    cursor_elt.setAttribute('value', value);
}
function MISC_SELECT_GetValue(misc_select) {
    let cursor_elt = null;

    if (typeof misc_select === 'string') {
        misc_select = document.getElementById(misc_select);
    }

    for (let child of misc_select.childNodes) {
        if (child instanceof Element && child.classList.contains('MISC_SELECT_CURSOR')) {
            cursor_elt = child;
            break;
        }
    }

    return cursor_elt.getAttribute('value');
}


/* 
 * -------------------------------------
 *          USERCONFIRM
 * -------------------------------------
 */

async function MISC_USERCONFIRM(question, subtext, answers = ['YES', 'NO']) {
    if (document.getElementById('userconfirm_master')) return Promise.reject(new Error('Other UserConfirm running.')); 

    let UC = document.createElement('USERCONFIRM');
    UC.id = 'userconfirm_master';

    let s = '';
    s += '<div class="userconfirm_question">';
    s += '<center class="head">' + question + '</center>';
    s += '<center lcass="sub">' + subtext + '</center>';
    s += '</div>';
    s += '<div class="userconfirm_answers">';

    for (let ans of answers) {
        s += '<button class="userconfirm_answer" onclick="this.parentElement.parentElement.dataset.selected = \'' + ans + '\'">' + ans + '</button>';
    }

    s += '</div>';
    
    UC.innerHTML = s;
    document.getElementById('grid').appendChild(UC);
    disableContent();
    
    return await MISC_USERCONFIRM_ANSWER(document.getElementById('userconfirm_master'))
        .then(ans => {
            enableContent();
            document.getElementById('userconfirm_master').remove();
            return Promise.resolve(ans);
        });
}
async function MISC_USERCONFIRM_ANSWER(elt) {
    return new Promise((resolve, reject) => {
        let int;
        let check = () => {
            if (!elt) {
                clearInterval(int);
                return Promise.reject(new Error('Element vanished.'));
            }
            if (elt.dataset.selected !== undefined) {
                clearInterval(int);
                return resolve(elt.dataset.selected);
            }
        };


        int = setInterval(check, 500);
    });
}

/* 
 * -------------------------------------
 *              TABLE
 * -------------------------------------
 */

const MISC_TABLE_OPTIONS_REGISTER = {};
function MISC_createTable(array = [], options = {}) {
    let s = '';

    MISC_createTable_fillOptions(options);

    do {
        options.identifier = Math.floor(Math.random() * 6546544168);
    } while (MISC_TABLE_OPTIONS_REGISTER[options.identifier] !== undefined);

    MISC_TABLE_OPTIONS_REGISTER[options.identifier] = cloneJSON(options);

    //Wrapper
    s = '<customtable data-registeridentifier="' + options.identifier  + '"';
    s += 'class="' + (options.vertical ? 'vertical ' : '') + (options.disable_caps_headers ? 'blocked_caps_headers ' : '') + '" ';
    if (options.custom_data) {
        for (let key in options.custom_data) s += ' data-' + key + '="' + options.custom_data[key] + '"';
    }
    s += ' >';
    
    //Content
    //Auto Generatre Headers
    if (array.length === 0 && options.headers.length === 0) options.headers.push('No Data Found');
    else if (options.headers.length === 0) MISC_createTable_generateHeaders(array, options);
    //Create CSS for Grid
    let cols = '';
    for (let header of options.headers) cols += 'auto ';
    //Create HTML
    s += '<tablegrid style="grid-template-' + (options.vertical ? 'rows' : 'columns') + ':' + cols + ';">';
    s += MISC_createTableContent(array, options);
    s += '</tablegrid>';
    
    //UI
    if (options.pagination && options.api_root) {
        s += '<tableinterface>';
        s += MISC_createTableInterface(array, options);
        s += '</tableinterface>';
    }

   return s + '</customtable>';
}
function MISC_createTable_update(elt, array = [], options = {}) {
    let content = null;
    let ui = null;
    for (let child of elt.childNodes) {
        if (child.tagName === 'TABLEGRID') content = child;
        else if (child.tagName === 'TABLEINTERFACE') ui = child;
    }
    if (!ui || !content) return false;

    content.innerHTML = MISC_createTableContent(array, options);
    if (ui && options.pagination) ui.innerHTML = MISC_createTableInterface(array, options);
    return true;
}
function MISC_Interface_UpdatePage(elt, pagination = "") {
    //find parent
    while (elt.tagName !== 'CUSTOMTABLE' && elt.tagName !== 'BODY') {
        elt = elt.parentElement;
    }

    if (elt.tagName === 'body') return;

    //get Options
    let options = MISC_TABLE_OPTIONS_REGISTER[elt.dataset.registeridentifier];

    //fetch
    fetch(options.api_root + '?pagination=' + pagination, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            options.pagination = json.pagination;

            //replace Table Content & Update UI
            MISC_createTable_update(elt, json.data, options);
        })
        .catch(err => {
            console.log(err);
        });
}

function MISC_createTableContent(array = [], options = {}) {
    let s = '';
    MISC_createTable_fillOptions(options);

    let option_copy = cloneJSON(options);
    delete option_copy.headers;                 //WiP: Use this to change Child Headers!!
    delete option_copy.pagination;
    if (options.vertical === 'first') {
        options.vertical = true;
        delete option_copy.vertical;
    }

    //Auto Generatre Headers
    if (options.headers.length === 0) {
        MISC_createTable_generateHeaders(array, options);
    }

    //Headers
    let header_str_arr = [];
    for (let hdr of options.headers) {
        let hdr_content = '<tableheader>';

        if (options.header_content_translation instanceof Function) hdr_content += options.header_content_translation(hdr);
        else if (options.header_content_translation) hdr_content += options.header_content_translation;
        else hdr_content += hdr;
        hdr_content += '</tableheader>';
        header_str_arr.push(hdr_content);
    }

    if (!options.vertical) s += header_str_arr.join("");

    if (options.headers.length === 0) return "";

    //sort
    for (let sort in options.sort) {
        let translated = options.header_translation[sort] || sort;
        MISC_createTable_sort(array, translated, options.sort[sort]);
    }

    //Content Rows
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < options.headers.length; j++) {
            if (options.vertical) s += header_str_arr[j];
            s += '<tablecontent';
            if (j == 0) s += ' left';
            if (j == options.headers.length - 1) s += ' right';
            if (i == array.length - 1) s += ' bottom';
            if (options.add_dataset) s += ' data-custom="' + options.add_dataset(array[i], options.headers[j]) + '"';
            if (options.add_event) {
                for (let event in options.add_event) {
                    s += ' ' + event + '="' + options.add_event[event] + '"';
                }
            }
            s += '>';

            //Translate Header Name
            let translated = options.header_translation[options.headers[j]] || options.headers[j];
            if (!(translated instanceof Array)) translated = [translated];

            //Create Cell Content
            let content = "";

            for (let tranl of translated) {
                if (options.timestamps[options.headers[j]] !== undefined) content += MISC_createTable_timestamps(array[i][tranl], options.timestamps[options.headers[j]]);
                else if (options.content_translation !== undefined && options.content_translation instanceof Function) content += options.content_translation(array[i][tranl], array[i], i, content);
                else if (options.content_translation[tranl] !== undefined) content += options.content_translation[tranl] instanceof Function ? options.content_translation[tranl](array[i][tranl], array[i], i, content) : options.content_translation[tranl];
                else if (array[i][tranl] instanceof Object) {
                    let temper_options = cloneJSON(option_copy);
                    if (options.allow_auto_rotation == true) {
                        if (Object.getOwnPropertyNames(array[i][tranl]).length > 8) temper_options.vertical = true;
                        else delete temper_options.vertical;
                    }
                    content += MISC_createTable([array[i][tranl]], cloneJSON(temper_options));
                }
                else content += array[i][tranl] === undefined ? '' : array[i][tranl];
                content += options.content_join[tranl] || ' ';
            }

            //Column Addition
            if (options.column_addition[options.headers[j]]) {
                content += options.column_addition[options.headers[j]] instanceof Function ? options.column_addition[options.headers[j]](array[i], i) : options.column_addition[options.headers[j]];
            }

            //Empty?
            if (content.trim() === "") s += "-";
            else s += content;

            s += '</tablecontent>';
        }
    }
    if (array.length === 0) {
        for (let i = 0; i < options.headers.length; i++) {
            s += '<tablecontent no-split bottom';
            if (i == 0) s += ' left';
            if (i == options.headers.length - 1) s += ' right';
            s += '>';
            if (i == 0) s += '<tableemptytext>' + (options.empty_text || 'EMPTY') + '<tableemptytext>';
            s += '</tablecontent>';
        }
    }

    return s;
}
function MISC_createTableInterface(array = [], options = {}) {
    let s = '';

    let pages = GetPaginationValues(options.pagination);
    const PER_PAGE = [5, 10, 20, 50, 100];

    let per_idx = 1;
    PER_PAGE.find((elt, index) => {
        if (elt === pages[0]) {
            per_idx = index;
            return true;
        }
        return false;
    });

    //LEFT
    s += '<tableinterfaceleft>';
    s += '<span>Per Page: </span>';
    s += MISC_SELECT_create(PER_PAGE, per_idx, null, "MISC_Interface_perChange(this, '" + options.pagination + "');");
    s += '</tableinterfaceleft>';

    //RIGHT
    s += '<tableinterfaceright>';

    let empty = pages[2].pagecount === undefined ? false : pages[2].pagecount === 0;
    
    s += '<button onclick="' + "MISC_Interface_first(this, '" + options.pagination + "');" + '" ' + (pages[1] === 1 ? 'disabled' : '') + '>first</button>';
    s += '<button onclick="' + "MISC_Interface_prev(this, '" + options.pagination + "');" + '" ' + (pages[1] === 1 ? 'disabled' : '') + '>prev</button>';
    s += '<input value="' + (empty ? 0 : pages[1]) + '" step="1" min="' + (empty ? 1 : 0) + '" ' + (pages[2].pagecount !== undefined ? 'max="' + pages[2].pagecount + '"' : '') + ' onchange="MISC_Interface_input(this, ' + options.pagination + ');"/>';
    s += '<span>/' + pages[2].pagecount + '</span>';
    s += '<button onclick="' + "MISC_Interface_next(this, '" + options.pagination + "');" + '" ' + (pages[1] === pages[2].pagecount ? 'disabled' : '') + '>next</button>';
    s += '<button onclick="' + "MISC_Interface_last(this, '" + options.pagination + "');" + '" ' + (pages[1] === pages[2].pagecount ? 'disabled' : '') + '>last</button>';

    s += '</tableinterfaceright>';
    
    return s;
}

function MISC_createTable_timestamps(t_ms, mode) {
    if (t_ms === undefined) return '-';
    if (t_ms < Date.now() / 10) t_ms *= 1000;
    
    if (mode === 'relative') {
        let rel = Date.now() - t_ms;

        if (rel > 0) {
            if (rel < 60 * 1000) return 'a minute ago';
            else if (rel < 60 * 60 * 1000) return Math.floor(rel / (60 * 1000)) + ' minutes ago';
            else if (rel < 2 * 60 * 60 * 1000) return 'an hour ago';
            else if (rel < 24 * 60 * 60 * 1000) return Math.floor(rel / (60 * 60 * 1000)) + ' hours ago';
        } else {
            rel = -1 * rel;
            if (rel < 60 * 1000) return 'in ' + Math.floor(rel / 1000) + ' seconds';
            else if (rel < 2 * 60 * 1000) return 'in a minute';
            else if (rel < 60 * 60 * 1000) return 'in ' + Math.floor(rel / (60 * 1000)) + ' minutes';
            else if (rel < 2 * 60 * 60 * 1000) return 'in an hour';
            else if (rel < 24 * 60 * 60 * 1000) return 'in ' + Math.floor(rel / (60 * 60 * 1000)) + ' hours';
        }
    }

    let date = new Date(t_ms);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE').split(':').slice(0, 2).join(':');
}
function MISC_createTable_sort(array, header, dir = true) {
    if (!dir) dir = 1;
    else dir = -1;

    array.sort((a, b) => dir * (a[header] - b[header]));
}

function MISC_createTable_generateHeaders(array = [], options = {}) {
    for (let element of array) {
        for (let hdr in element) {
            if (options.skip_headers.find(elt => elt === hdr)) continue;
            if (!options.headers.find(e => e === hdr)) options.headers.push(hdr);
        }
    }
}
function MISC_createTable_fillOptions(options = {}) {
    if (options.headers === undefined) options.headers = [];
    if (options.header_translation === undefined) options.header_translation = {};
    if (options.content_translation === undefined) options.content_translation = {};
    if (options.content_join === undefined) options.content_join = {};
    if (options.timestamps === undefined) options.timestamps = {};
    if (options.column_addition === undefined) options.column_addition = {};
    if (options.skip_headers === undefined) options.skip_headers = [];
    if (options.sort === undefined) options.sort = [];
}

function MISC_Interface_first(elt, next_pagination) {
    //pagination string to numbers
    let pages = GetPaginationValues(next_pagination);

    //page = 0
    pages[1] = 0;
    
    //Update
    MISC_Interface_UpdatePage(elt, GetPaginationString(pages[0], pages[1], pages[2]));
}
function MISC_Interface_prev(elt, next_pagination) {
    //pagination string to numbers
    let pages = GetPaginationValues(next_pagination);

    //page--
    pages[1] = Math.max(pages[1]-2, 0);
    
    //Update
    MISC_Interface_UpdatePage(elt, GetPaginationString(pages[0], pages[1], pages[2]));
}
function MISC_Interface_next(elt, next_pagination) {
    //Update
    MISC_Interface_UpdatePage(elt, next_pagination);
}
function MISC_Interface_last(elt, next_pagination) {
    //pagination string to numbers
    let pages = GetPaginationValues(next_pagination);

    //page to last
    pages[1] = pages[2].pagecount || pages[1];

    //Update
    MISC_Interface_UpdatePage(elt, GetPaginationString(pages[0], pages[1], pages[2]));
}
function MISC_Interface_input(elt, next_pagination) {
    //pagination string to numbers
    let pages = GetPaginationValues(next_pagination);

    //page to input (fit to range)
    pages[1] = Math.min(0, Math.max(elt.value, pages[2].pagecount || pages[1]));

    //Update
    MISC_Interface_UpdatePage(elt, GetPaginationString(pages[0], pages[1], pages[2]));
}
function MISC_Interface_perChange(elt, next_pagination) {
    //pagination string to numbers
    let pages = GetPaginationValues(next_pagination);

    //first to input (fit to range)
    pages[0] = Math.max(5, MISC_SELECT_GetValue(elt));
    //page to 0
    pages[1] = 0;

    //Update
    MISC_Interface_UpdatePage(elt, GetPaginationString(pages[0], pages[1], pages[2]));
}

/* 
 * -------------------------------------
 *                TIMER
 * -------------------------------------
 */

async function MISC_createTimer(seconds, parent) {
    if (seconds < 1) return Promise.resolve(); 

    let past_seconds = 0;

    let html = '';
    html += '<div class="MISC_TIMER">';
    html += '<div class="MISC_TIMER_SPINNER"></div>';
    html += '<div class="MISC_TIMER_TEXT">' + seconds + '</div>';
    html += '</div>';

    parent.innerHTML = html;

    return new Promise((resolve, reject) => {
        let intv = setInterval(() => {
            //Increment Timer
            past_seconds++;

            //Update HTML
            for (let child of parent.childNodes) {
                if (child instanceof Element && child.classList.contains('MISC_TIMER')) {
                    for (let childer of child.childNodes) {
                        if (childer instanceof Element && childer.classList.contains('MISC_TIMER_TEXT')) {
                            childer.innerHTML = seconds - past_seconds;
                        }
                    }
                }
            }

            //Clear Timer
            if (past_seconds >= seconds) {
                clearInterval(intv);
                parent.innerHTML = "";
                resolve();
            }
        }, 1000);
    });
}

/*
 * -------------------------------------
 *             FILE LIBRARY
 * -------------------------------------
 */
const SUPPORTED_IMG_FILES = ['png', 'jpg', 'jpeg', 'gif', 'mp4'];
const SUPPORTED_VIDEO_FILES = ['mp4'];
const SUPPORTED_SOUND_FILES = ['ogg', 'mp3', 'wav'];
const SUPPORTED_FILES = SUPPORTED_IMG_FILES.concat(SUPPORTED_SOUND_FILES);

function MISC_createFileLibrary(files, file_dir = "/images/", title = "", types = 'all', selected, custom_class = "", custom_attribute = "", api_url = "", onchange = "") {
    let s = '<div class="MISC_FILE_LIBRARY ' + (custom_class != undefined ? custom_class : '') + '" ' + (custom_attribute != undefined ? custom_attribute : '') + ' >';

    //HEADER
    s += '<div class="MISC_FILE_LIB_HEADER">';

    //TITLE
    s += '<div class="FILE_LIB_HEADER_TITLE">' + title + '</div>';

    //REFRESH
    if (api_url) s += '<img src="/images/icons/refresh.svg" onclick="MISC_FileLibrary_Refresh(this, ' + "'" + api_url + "'" + ', ' + "'" + types + "'" + ', ' + "'" + selected + "'" + ')"/>';

    //UPLOAD
    if (api_url) {
        s += '<div class="FILE_LIB_HEADER_UPLOAD">';
        s += '<button onclick="this.parentElement.classList.toggle(' + "'expanded'" + ')">UPLOAD FILE</button>';
        s += '<input type="file" id="input" onchange="MISC_FileLibrary_UploadPreview(this)" />';

        //IMG
        s += '<img src="/images/icons/plus.png" draggable="false" onclick="MISC_FileLibrary_addFile(this)"/>';

        //Video
        s += '<video muted onmouseenter="this.play();" onmouseleave="this.pause(); this.currentTime = 0;" loop onclick="MISC_FileLibrary_addFile(this)"></video>';

        //Audio
        s += '<audio onclick="MISC_FileLibrary_addFile(this)"></audio>';

        //SIZE INFO
        s += '<span></span>';

        //UPLOAD
        s += '<button disabled onclick="MISC_FileLibrary_Upload(this, ' + "'" + api_url + "'" + ', ' + onchange + ')">UPLOAD</button>';

        s += '</div>';
    }
    
    s += '</div>';
    
    //LIST
    s += '<div class="FILE_LIST ' + (types === 'images' ? 'IMAGES_LIST' : 'IMAGES_LIST') + '">';
    for (let file of files) {
        let extension = file.split('.').pop().toLowerCase();

        if (SUPPORTED_IMG_FILES.find(elt => elt === extension) && (types == 'all' || types == 'images'))
            s += MISC_FileLibrary_addImageElement(file, file_dir, file === selected, api_url, onchange);
        else if (SUPPORTED_SOUND_FILES.find(elt => elt === extension) && (types == 'all' || types == 'sounds'))
            s += MISC_FileLibrary_addSoundElement(file, file_dir, file === selected, api_url, onchange);
    }

    //ADD Missing Selected
    if (selected && !files.find(elt => elt === selected)) s += MISC_FileLibrary_addMissingElement(selected, true);

    s += '</div>';

    //HIDDEN AUDIO CLUB
    s += '<div class="HIDDEN_AUDIO_CLUB"></div>';

    s += '</div>';
    return s;
}
function MISC_FileLibrary_addImageElement(file_name, file_dir, selected = false, api_url = "", onchange = "") {
    let s = '';
    let extension = file_name.split('.').pop().toLowerCase();
    
    s += '<div';
    s += ' class="IMAGE_ELT ' + extension.toUpperCase() + '" ';
    s += ' onclick="MISC_FileLibrary_selectFile(this); ' + (onchange != undefined ? onchange + "('" + file_name + "');" : '') + '"';
    s += ' data-file="' + file_name + '" ' + (selected ? 'selected' : '');
    if (selected) s += ' selected ';
    if (extension === 'mp4') s += ' onmouseenter="this.childNodes[1].play();" ';
    if (extension === 'mp4') s += ' onmouseleave="this.childNodes[1].pause(); this.childNodes[1].currentTime = 0;" ';
    s += ' >';

    s += '<span title="' + file_name + '">' + file_name + '</span>';
    if (extension === 'mp4') {
        s += '<video muted loop>';
        s += '<source src="' + file_dir + file_name + '" type="video/mp4">';
        s += '<img src="/images/icons/mp4.png" />';
        s += '</video>';
    }
    else s += '<img src="' + file_dir + file_name + '" />';

    s += '<div class="HOVER_ELT SINGLE">';
    s += '<img src="/images/icons/trash-alt-solid.svg" onclick="MISC_FileLibrary_deleteFile(event, this, ' + "'" + file_name + "'" + ', ' + "'" + api_url + "'" + ')"/>';
    s += '</div>';

    s += '</div>';

    return s;
}
function MISC_FileLibrary_addSoundElement(file_name, file_dir, selected = false, api_url = "", onchange = "") {
    let s = '';

    let extension = file_name.split('.').pop().toLowerCase();
    s += '<div class="IMAGE_ELT BIGGER ' + extension + '"  onclick="MISC_FileLibrary_selectFile(this); ' + (onchange != undefined ? onchange + "('" + file_name + "');" : '') + '" data-file="' + file_name + '" ' + (selected ? 'selected' : '') + '>';
    s += '<span title="' + file_name + '">' + file_name + '</span>';
    s += '<img src="/images/icons/' + extension + '.png" />';

    s += '<div class="HOVER_ELT">';
    s += '<img src="/images/icons/trash-alt-solid.svg" onclick="MISC_FileLibrary_deleteFile(event, this, ' + "'" + file_name + "'" + ', ' + "'" + api_url + "'" + ')"/>';
    s += '<img src="/images/icons/play-solid.svg" onclick="MISC_FileLibrary_playSound(this, event, ' + "'" + file_dir + file_name + "'" + ')"/>';
    s += '</div>';
    s += '</div>';

    return s;
}
function MISC_FileLibrary_addMissingElement(file_name, selected = false) {
    let s = '';
    
    s += '<div class="IMAGE_ELT BIGGER missing" onclick="MISC_FileLibrary_selectFile(this, true)" data-file="' + file_name + '" ' + (selected ? 'selected' : '') + '>';
    s += '<span title="' + file_name + '">' + file_name + '</span>';
    s += '<img src="/images/icons/missing_file.png" />';
    s += '</div>';

    return s;
}

function MISC_FileLibrary_Refresh(elt, url, types = 'all', selected) {
    let LIST = elt;

    while (LIST.tagName !== 'body' && !LIST.classList.contains('MISC_FILE_LIBRARY')) {
        LIST = LIST.parentElement;
    }

    if (LIST.tagName === 'body') LIST = null;
    else for (let child of LIST.childNodes) if (child.classList.contains('FILE_LIST')) LIST = child;

    elt.setAttribute('disabled', 'true');
    
    fetch(url, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            elt.removeAttribute('disabled');

            let s = '';
            for (let file of json.files) {
                let extension = file.split('.').pop().toLowerCase();
                
                if ((types === 'all' || types === 'images') && SUPPORTED_IMG_FILES.find(elt => elt === extension)) s += MISC_FileLibrary_addImageElement(file, file === selected, url);
                else if ((types === 'all' || types === 'sounds') && SUPPORTED_SOUND_FILES.find(elt => elt === extension)) s += MISC_FileLibrary_addSoundElement(file, file === selected, url);
            }
            LIST.innerHTML = s;
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err.message);
            elt.removeAttribute('disabled');
        });
}

function MISC_FileLibrary_addFile(elt) {
    let input = null;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'INPUT') input = child;
    if (!input) return elt.value = "";

    input.click();
}
function MISC_FileLibrary_UploadPreview(elt) {
    let IMG_PREVIEW = null;
    let VIDEO_PREVIEW = null;
    let SOUND_PREVIEW = null;
    let UPLOAD = null;
    let SIZE = null;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'IMG') IMG_PREVIEW = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'VIDEO') VIDEO_PREVIEW = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'AUDIO') SOUND_PREVIEW = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'SPAN') SIZE = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'BUTTON' && child.innerHTML === 'UPLOAD') UPLOAD = child;

    let FILE = elt.files[0];

    const reader = new FileReader();
    reader.onload = (img) => {
        IMG_PREVIEW.src = "";
        IMG_PREVIEW.style.borderColor = 'gray';
        VIDEO_PREVIEW.src = "";
        VIDEO_PREVIEW.classList.remove('show');
        SOUND_PREVIEW.src = "";
        SIZE.innerHTML = "";
        
        let type = img.target.result.substring(img.target.result.indexOf(':') + 1, img.target.result.indexOf('/'));
        let extension = elt.value.split('.').pop().toLowerCase();

        //CHECK EXTENSION
        if (!SUPPORTED_FILES.find(elt => elt === extension)) {
            OUTPUT_showError('.' + extension + ' Files are not supported!');
            IMG_PREVIEW.src = '/images/icons/plus.png';
            IMG_PREVIEW.style.borderColor = 'red';
            return;
        }
        //if (SUPPORTED_VIDEO_FILES.find(elt => elt === extension)) {
        //    OUTPUT_showError('Video File sadly cant be Uploaded right now!');
        //    IMG_PREVIEW.src = '/images/icons/plus.png';
        //    IMG_PREVIEW.style.borderColor = 'red';
        //    return;
        //}

        //CHECK SIZE
        if (FILE.size > Math.pow(1024, 2) * 2) {
            SIZE.classList.add('big');
        } else {
            SIZE.classList.remove('big');
            UPLOAD.removeAttribute('disabled');
        }
        
        if (type === 'image') IMG_PREVIEW.src = img.target.result;
        else if (type === 'audio') {
            SOUND_PREVIEW.src = img.target.result;
            IMG_PREVIEW.src = '/images/icons/' + extension + '.png';
        }
        else if (type === 'video') {
            VIDEO_PREVIEW.classList.add('show');
            VIDEO_PREVIEW.src = img.target.result;
        } else {
            return;
        }

        SIZE.innerHTML = byteToString(FILE.size) + " / 2MB";
    };
    reader.readAsDataURL(FILE);
}
function MISC_FileLibrary_Upload(elt, url, onchange) {
    let IMG_PREVIEW = null;
    let VIDEO_PREVIEW = null;
    let SOUND_PREVIEW = null;
    let INPUT = null;
    let LIST = elt;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'INPUT') INPUT = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'IMG') IMG_PREVIEW = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'VIDEO') VIDEO_PREVIEW = child;
    for (let child of elt.parentElement.childNodes) if (child.tagName === 'AUDIO') SOUND_PREVIEW = child;

    while (LIST.tagName !== 'body' && !LIST.classList.contains('MISC_FILE_LIBRARY')) {
        LIST = LIST.parentElement;
    }
    
    if (LIST.tagName === 'body') LIST = null;
    else for (let child of LIST.childNodes) if (child.classList.contains('FILE_LIST')) LIST = child;

    let file_info = {
        name: INPUT.files[0].name,
        size: INPUT.files[0].size,
        type: INPUT.files[0].type
    };
    let file_data = null;

    if (file_info.type.startsWith('audio')) {
        file_data = SOUND_PREVIEW.src;
    } else if (file_info.type.startsWith('video')) {
        file_data = VIDEO_PREVIEW.src;
    } else if (file_info.type.startsWith('image')) {
        file_data = IMG_PREVIEW.src;
    }
    
    elt.setAttribute('disabled', 'true');
    
    let opt = getAuthHeader();
    opt['method'] = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ file_info, file_data });
    
    fetch(url, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(response => {
            OUTPUT_showInfo("File added!");
            elt.removeAttribute('disabled');

            let extension = INPUT.files[0].name.split('.').pop().toLowerCase();
            if (SUPPORTED_IMG_FILES.find(elt => elt === extension)) LIST.innerHTML += MISC_FileLibrary_addImageElement(INPUT.files[0].name, false, url, onchange);
            else if (SUPPORTED_SOUND_FILES.find(elt => elt === extension)) LIST.innerHTML += MISC_FileLibrary_addSoundElement(INPUT.files[0].name, false, url, onchange);

            //Collapse Dropdown
            elt.parentElement.classList.remove('expanded');

            //Clear IMG / VIDEO / SOUND / SIZE
            for (let child of elt.parentElement.childNodes) {
                if (child.tagName === 'VIDEO' || child.tagName === 'AUDIO') {
                    child.src = "";
                } else if (child.tagName === 'IMG') {
                    child.src = "/images/icons/plus.png";
                } else if (child.tagName === 'SPAN') {
                    child.innerHTML = "";
                }
            }
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err);
            elt.removeAttribute('disabled');
        });
}

function MISC_FileLibrary_playSound(elt, e, file) {
    e.stopPropagation();

    let s = '';
    s += '<audio autoplay>';
    s += '<source src="' + file + '" type="audio/' + file.split('.').pop() + '">';
    s += '</audio>';

    let LIB = elt;
    while (LIB.tagName !== 'body' && !LIB.classList.contains('MISC_FILE_LIBRARY')) {
        LIB = LIB.parentElement;
    }
    
    if (LIB.tagName === 'body') return;
    else for (let child of LIB.childNodes) if (child.classList.contains('HIDDEN_AUDIO_CLUB')) LIB = child;
    LIB.innerHTML = s;
}
async function MISC_FileLibrary_deleteFile(e, elt, file, url) {
    e.stopPropagation();
    let answer = 'NO';
    
    try {
        answer = await MISC_USERCONFIRM("YOU SURE YOU WANT THIS?", "Do you really want to delete this File?");
    } catch (err) {

    }

    if (answer !== 'YES') return Promise.resolve();

    let opt = getAuthHeader();
    opt['method'] = 'DELETE';
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify({ file });

    fetch(url, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(response => {
            OUTPUT_showInfo("File removed!");
            elt.parentElement.parentElement.remove();
        })
        .catch(err => {
            OUTPUT_showError(err.message);
            console.log(err.message);
        });
}
async function MISC_FileLibrary_selectFile(elt, unselect_only = false) {
    if (elt.hasAttribute('selected')) return elt.removeAttribute('selected');
    if (unselect_only) return;

    for (let child of elt.parentElement.childNodes) {
        if (child instanceof Element) child.removeAttribute('selected');
    }

    elt.setAttribute('selected', 'true');
}

function MISC_FileLibrary_getSelectedFile(elt){
    let LIST = elt;
    while (LIST.tagName !== 'body' && !LIST.classList.contains('MISC_FILE_LIBRARY')) {
        LIST = LIST.parentElement;
    }

    if (LIST.tagName === 'body') return;
    else for (let child of LIST.childNodes) if (child.classList.contains('FILE_LIST')) LIST = child;

    for (let child of LIST.childNodes) {
        if (child.hasAttribute('selected') && !child.hasAttribute('missing')) return child.dataset.file;
    }

    return null;
}

function byteToString(num) {
    const letters = ['', 'K', 'M', 'G', 'T'];

    let cur = 1;
    while (Math.pow(1024, cur) < num) {
        cur++;
    }

    return (num / Math.pow(1024, cur-1)).toFixed(2) + letters[cur - 1] + 'B';
}