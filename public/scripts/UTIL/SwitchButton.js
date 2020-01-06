//Buttons
function switchButton(x) {
    if (isSwitchButtonDisabled(x)) return;
    setSwitchButton(x, !isSwitchButtonOn(x));
}
function isSwitchButtonOn(elt) {
    if (elt.className.split(" ")[1] == "switchButtonOn" || elt.className.split(" ")[1] == "switchButtonToOn") {
        return true;
    } else {
        return false;
    }
}
function setSwitchButton(elt, state) {
    if (!state) {
        elt.className = "switchButtonOnOff switchButtonToOff";
    } else {
        elt.className = "switchButtonOnOff switchButtonToOn";
    }
}
function isSwitchButtonDisabled(elt) {
    for (let att of elt.attributes) {
        if (att.name == 'disabled') {
            return true;
        }
    }

    return false;
}