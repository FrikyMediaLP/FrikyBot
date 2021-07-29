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
    s += '<div class="MISC_SELECT ' + extraclass + '" ' + (id !== undefined ? 'id="' + id + '"' : '') + ' onclick="MISC_SELECT_SelectItem(this, event); ' + onclick + '" ' + attributeStr + '>';
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
        value = eventORtext.toElement.getAttribute('value');
        eventORtext = eventORtext.toElement.innerHTML;
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

    disableContent();
    UC.innerHTML = s;
    document.getElementById('grid').appendChild(UC);
    
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

function MISC_createTable(array = [], options = {}) {
    let s = '';
    let cols = '';

    if (options.headers === undefined) options.headers = [];
    if (options.header_translation === undefined) options.header_translation = {};
    if (options.content_translation === undefined) options.content_translation = {};
    if (options.content_join === undefined) options.content_join = {};
    if (options.timestamps === undefined) options.timestamps = {};
    if (options.column_addition === undefined) options.column_addition = {};
    if (options.skip_headers === undefined) options.skip_headers = [];
    if (options.sort === undefined) options.sort = [];
    
    let option_copy = cloneJSON(options);
    if (options.vertical === 'first') {
        options.vertical = true;
        delete option_copy.vertical;
    }

    //Headers
    if (options.headers.length === 0) {
        for (let element of array) {
            for (let hdr in element) {
                if (options.skip_headers.find(elt => elt === hdr)) continue;
                if (!options.headers.find(e => e === hdr)) options.headers.push(hdr);
            }
        }
    }

    let header_str_arr = [];
    for (let hdr of options.headers) {
        let hdr_content = '<tableheader>';

        if (options.header_content_translation instanceof Function) hdr_content += options.header_content_translation(hdr);
        else if (options.header_content_translation) hdr_content += options.header_content_translation;
        else hdr_content += hdr;
        hdr_content += '</tableheader>';
        header_str_arr.push(hdr_content);
        cols += ' auto';
    }
    s = '<customtable style="grid-template-columns:' + cols + ';" class="' + (options.vertical ? 'vertical ' : '') + (options.disable_caps_headers ? 'blocked_caps_headers ' : '') + '">';

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
            if (options.add_dataset) s += ' data-custom="' + options.add_dataset(array[i], options.headers[j])  + '"';
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
            if (i == 0) s += '<tableemptytext>EMPTY<tableemptytext>';
            s += '</tablecontent>';
        }
    }
    
   return s + '</customtable>';
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