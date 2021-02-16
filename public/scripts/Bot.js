let alternateColors = true;

function init() {
    OUTPUT_create();

    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;
    Bot_Status_Details_Settings.Use_Cookies = false;

    BOT_STATUS_DETAILS_NORMAL();

    DisplayChatModeration()
        .catch(err => {
            //console.log(err);
            //OUTPUT_showError(err);
            document.getElementById('WAITING_WRAPPER').remove();
            document.getElementById('ChatModerationSettingsV2').innerHTML += '<h4>Disabled</h4>';
        });
}

async function DisplayChatModeration() {
	return fetch("/api/ChatModeration/filters")
        .then(data => data.json())
        .then(json => {
            if (json.err) return Promise.reject(new Error(json.err)); 

            let s = '<h2>Chat Moderation Overview</h2>';
            let content = null;

            if (document.getElementById("ChatModerationSettingsV1")) {
                content = getRecursiveObjectContentV1(json.data.Filter);
                if (content != null)
                    document.getElementById("ChatModerationSettingsV1").innerHTML = s + content;
            } else if (document.getElementById("ChatModerationSettingsV2")) {

                if (json.data.enabled) {
                    content = getRecursiveObjectContentV2(json.data.Filter);
                } else {
                    content = '<h3 style="color: lightcoral;">DISABLED</h3>';
                }

                if (content != null)
                    document.getElementById("ChatModerationSettingsV2").innerHTML = s + content;
            }

            //RESIZE
            for (let elt of document.getElementsByClassName("autoSizePls")) {
                autoSizeFont(elt);
            }
        });
}

//V1
function getRecursiveObjectContentV1(data, level = 0) {
    alternateColors = !alternateColors;
    if (data instanceof Object) {
        if (data.enabled != undefined && data.enabled != true) {
            return '<div class="Value DISABLED" data-level=' + level + '>DISABLED</div>';
        } else {
            let s = '<div class="Object_Wrapper"' + (level == 0 ? " id='first'" : "") + ' data-level="' + level + '">';

            for (let key in data) {
                if (key == "enabled") continue;

                s += '<div class="Object_Key ' + (data[key] instanceof Object || data[key] instanceof Array ? '' : 'endvalue') + '">';
                s += '<div class="Object_Key_Name ' + (alternateColors ? 'LIGHT' : 'DARK') + '">' + key + '</div>';
                s += getRecursiveObjectContentV1(data[key], level + 1);
                s += '</div>';
            }

            return s + '</div>';
        }
    } else if (data instanceof Array) {
        //Array -> show Elements with index, then recursive
        let s = '<div class="Array_Wrapper"' + (level == 0 ? " id='first'" : "") + ' data-level="' + level + '">';

        for (let key in data) {
            s += '<div class="Object_Key">' + key + '</div>';
            s += getRecursiveObjectContentV1(data[key], level + 1);
        }

        return s + '</div>';
    } else {
        return '<div class="Value endvalue" data-level=' + level + '>' + data + '</div>';
    }
}

//V2
function getRecursiveObjectContentV2(data, level = 0) {
    let s = '';

    for (let key in data) {
        if (key === "enabled") {
            continue;
        }

        if (data[key] instanceof Object) {

            let isDisabled = data[key].enabled != undefined && data[key].enabled == false;
            let isFinal = !(Object.getOwnPropertyNames(data[key])[0] instanceof Object);

            for (let key2 in data[key]) {
                isFinal &= !(data[key][key2] instanceof Object);
            }

            s += '<div class="Object_Wrapper" data-level="' + level + '" data-show="false">';

            if (isDisabled) {
                s += '<h3 class="DISABLED">' + key + '<span>DISABLED</span>' + '</h3>';
            } else {
                s += '<h3>' + key + '<span onclick="toggleShow(this)">ENABLED</span></h3>';
                s += '<div class="Object_Content ' + (isFinal ? "FINAL" : "") + '">';
                s += getRecursiveObjectContentV2(data[key], level + 1);
                s += '</div>';
            }

            s += '</div>';
        } else {
            s += createCard(key, data[key]);
        }
    }
    
    return s;
}
function createCard(name, value) {
    let specClass = "";

    if (typeof value === "boolean") {
        specClass = value ? "ON" : "OFF";
    }

    let s = '<div class="Setting ' + specClass + '">';
    s += '<div class="Value"><span class="autoSizePls"><span>' + (typeof value === "boolean" ? specClass : value) + '</span></span></div>';
    s += '<div class="Name"><span class="autoSizePls"><span>' + name + '</span></span></div>';

    return s + '</div>';
}

function toggleShow(elt) {
    elt.parentElement.parentElement.dataset.show = elt.parentElement.parentElement.dataset.show == undefined ? "true" : elt.parentElement.parentElement.dataset.show == "false";

    //RESIZE
    for (let elt of document.getElementsByClassName("autoSizePls")) {
        autoSizeFont(elt);
    }
}

function autoSizeFont(elt, offsetH = 0, offsetW = 0, defaultValue = 12) {
    let curHeight = elt.clientHeight;
    let curWidth = elt.clientWidth;
    let destHeight = elt.parentElement.clientHeight;
    let destWidth = elt.parentElement.clientWidth;

    let enbiggenMode = true;
    let adjustFurther = false;

    let maxTries = 100;

    //WHAT TO DO?!
    if (Math.abs(curWidth, destWidth)) {
        if (curWidth + offsetW > destWidth) {
            enbiggenMode = false;
        } else if (curWidth + offsetW < destWidth && enbiggenMode) {
            enbiggenMode = true;
        }
    }

    if (Math.abs(curHeight, destHeight)) {
        if (curHeight + offsetH > destHeight) {
            enbiggenMode = false;
        } else if (curHeight + offsetH< destHeight && enbiggenMode) {
            enbiggenMode = true;
        }
    }
    
    //DO IT!
    do {
        curHeight = elt.clientHeight;
        curWidth = elt.clientWidth;
        
        adjustFurther = false;
        maxTries--;

        if (Math.abs(curWidth, destWidth)) {
            if (enbiggenMode) {
                if (curWidth + offsetW < destWidth && curHeight + offsetH < destHeight) {
                    adjustFurther = true;
                }
            } else {
                if (curWidth + offsetW > destWidth || curHeight + offsetH > destHeight) {
                    adjustFurther = true;
                }
            }
        }

        if (adjustFurther) {
            if (enbiggenMode) {
                elt.style.fontSize = ((elt.style.fontSize ? parseFloat(elt.style.fontSize) : defaultValue) + 1) + "px";
            } else {
                elt.style.fontSize = ((elt.style.fontSize ? parseFloat(elt.style.fontSize) : defaultValue) - 1) + "px";
            }
        }
    } while (adjustFurther && maxTries);

    elt.style.marginLeft = (destWidth - curWidth)/2 + "px";
}