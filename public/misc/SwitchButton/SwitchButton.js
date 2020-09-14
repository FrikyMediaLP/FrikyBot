/* -------------------------------------
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
        return '<div class="SWITCH_BUTTON SWITCH_BUTTON_ON ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + onChange + '"><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    } else if (state == false) {
        return '<div class="SWITCH_BUTTON SWITCH_BUTTON_OFF ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + onChange + '"><div class="SWITCH_BUTTON_CURSOR"></div></div>';
    } else {
        return '<div class="SWITCH_BUTTON ' + (disabled ? "SWITCH_BUTTON_DISABLED" : "") + '" ' + (id ? 'id="' + id + '"' : "") + ' onclick="SWITCH_BUTTON_TOGGLE(this); ' + onChange + '"><div class="SWITCH_BUTTON_CURSOR"></div></div>';
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