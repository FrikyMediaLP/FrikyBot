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
                x.className = "SWITCH_BUTTON SWITCH_BUTTON_ON SWITCH_BUTTON_TO_OFF";
                setTimeout(() => {
                    x.className = "SWITCH_BUTTON SWITCH_BUTTON_OFF";
                    SWITCH_BUTTON_SETTINGS.OnChange(id, false, x);
                }, 500);
            }
        } else {
            if (!switching) {
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
    let classes = elt.className;
    return (classes.indexOf("SWITCH_BUTTON_ON") >= 0 || classes.indexOf("SWITCH_BUTTON_TO_ON") >= 0);
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
 *  - UNSET CHECKMARK
    <div class="LOADING_RING">
        <div class="LOADING_RING_SPINNER"></div>
    </div>
 *
 *
 *
 *
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