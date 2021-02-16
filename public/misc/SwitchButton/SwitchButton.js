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

    for (let cl of x.classList) {
        if (cl == "SWITCH_BUTTON_ON") {
            state = "ON";
        } else if (cl == "SWITCH_BUTTON_OFF") {
            state = "OFF";
        } else if (cl == "SWITCH_BUTTON_TO_ON" || cl == "SWITCH_BUTTON_TO_OFF") {
            switching = true;
        } else if (cl == "SWITCH_BUTTON_DISABLED") {
            disabled = true;
        }
    }

    if (!disabled) {
        if (state == "ON") {
            if (!switching) {
                x.setAttribute('value', 'off');
                x.className = "SWITCH_BUTTON SWITCH_BUTTON_ON SWITCH_BUTTON_TO_OFF";
                setTimeout(() => {
                    x.className = "SWITCH_BUTTON SWITCH_BUTTON_OFF";
                    SWITCH_BUTTON_SETTINGS.OnChange(id, false, x);
                }, 500);
            }
        } else {
            if (!switching) {
                x.setAttribute('value', 'on');
                x.className = "SWITCH_BUTTON SWITCH_BUTTON_OFF SWITCH_BUTTON_TO_ON";
                setTimeout(() => {
                    x.className = "SWITCH_BUTTON SWITCH_BUTTON_ON";
                    SWITCH_BUTTON_SETTINGS.OnChange(id, true, x);
                }, 500);
            }
        }
    }
}

function SWITCH_BUTTON_CREATE(state, disabled, onChange, id) {
    if (state == true) {
        return '<div class="SWITCH_BUTTON SWITCH_BUTTON_ON ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + (onChange ? onChange : "") + '"><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    } else if (state == false) {
        return '<div class="SWITCH_BUTTON SWITCH_BUTTON_OFF ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + (onChange ? onChange : "") + '"><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    } else {
        return '<div class="SWITCH_BUTTON ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + (onChange ? onChange : "") + '"><div class="SWITCH_BUTTON_CURSOR"></div></div>';
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
    if (elt.getAttribute('disabled') !== null) return;
    
    //Value
    if (state === undefined) elt.value = !elt.value;
    else if (state === true) elt.value = true;
    else if (state === false) elt.value = false;

    elt.setAttribute('value', elt.value ? 'ON' : 'OFF');

    //Animation
    if (elt.value) {
        elt.style.animation = "SWITCH_BUTTON_ON 0.5s forwards";
        elt.childNodes[0].style.animation = "SWITCH_BUTTON_ON_CURSOR 0.5s forwards";
    } else {
        elt.style.animation = "SWITCH_BUTTON_OFF 0.5s forwards";
        elt.childNodes[0].style.animation = "SWITCH_BUTTON_OFF_CURSOR 0.5s forwards";
    }
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

function MISC_SELECT_create(options, default_index, id, onclick = "") {
    if (!options || !(options instanceof Array) || options.length === 0) return '';

    let s = '';
    s += '<div class="MISC_SELECT" ' + (id !== undefined ? 'id="' + id + '"' : '') + ' onclick="MISC_SELECT_SelectItem(this, event); ' + onclick + '">';
    s += MISC_SELECT_createInner(options, default_index);
    s += '</div>';

    return s;
}
function MISC_SELECT_createInner(options, default_index) {
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

        s += '<div value="' + value + '">' + text + '</div>';
    }

    s += '</div>';

    return s;
}

function MISC_SELECT_WidthCheck(misc_select) {
    let cursor_elt = null;
    let opstions_elts = [];

    for (let child of misc_select.childNodes) {
        if (child instanceof Element && child.classList.contains('MISC_SELECT_CURSOR')) {
            cursor_elt = child;
        } else if (child instanceof Element && child.classList.contains('MISC_SELECT_OPTIONS')) {
            opstions_elts = child.childNodes;
        }
    }

    let max_width = cursor_elt.clientWidth;

    for (let option of opstions_elts) {
        if (option instanceof Element) {
            if (max_width < option.clientWidth) max_width = option.clientWidth;
        }
    }

    let pL = parseInt(window.getComputedStyle(cursor_elt, null).getPropertyValue('padding-left'));
    let pR = parseInt(window.getComputedStyle(cursor_elt, null).getPropertyValue('padding-right'));

    max_width -= (pL + pR);

    cursor_elt.style.width = max_width + 'px';
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