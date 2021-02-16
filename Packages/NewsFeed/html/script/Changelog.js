const CHANGLOG_SETTINGS = {
    API_ENDPOINT: '/api/news/Changelog',
    ENABLE_FUNCTION_PARAMERS_CSS: true,
    FUNCTION_PARAMERS: ["String", "Integer", "Boolean", "Object", "Array", "TwitchAPI", "ExpressRouter"],
    FUNCTION_PARAMETER_CSS: "color: #ff9a57;",
    ENABLE_TYPE_CSS: true,
    ADDED_CSS: "color: green;",
    REMOVED_CSS: "color: red;",
    CHANGED_CSS: "color: #e6bf25;",
    COMMENT_CSS: "color: dimgray; font-style: italic; padding-left: 15px; font-size: 17px;",
    WARNING_CSS: "color: red; font-style: italic; ",
    MODULES: {
        LOGGER: ["LOGGER", "images/icons/pen-solid.svg"],
        SERVER: ["SERVER.js", "images/icons/server-solid.svg"],
        TWITCHAPI: ["TWITCH API", "images/icons/twitch_colored.png"],
        TWITCHIRC: ["TWITCH IRC", "images/icons/twitch_colored_alt.png"],
        WEBAPP: ["WEBAPP", "images/icons/wifi-solid.svg"],
        DATACOLLECTION: ["DATACOLLECTION", "images/icons/chart-bar.svg"]
    },
    PACKAGES: {
        PACKAGE: ["UNKOWN PACKAGE", "images/Profiles/orange_transparent.png"],
        PACKAGEBASE: ["PACKAGE BASE", "images/Profiles/orange_transparent.png"],
        COMMANDHANDLER: ["CommandHandler", "images/icons/command.svg"],
        NEWSFEED: ["NewsFeed", "images/icons/newspaper-solid.svg"],
        DOCS: ["Docs", "images/icons/pencil-ruler-solid.svg"],
        CHATMODERATION: ["ChatModeration", "images/icons/user-secret-solid.svg"]
    },
    "3rdParty": {
        "3rdParty": ["UNKOWN 3rdParty", "images/icons/external-link-alt-solid.svg"],
        "BTTV": ["BetterTTV", "images/icons/BTTV.png"],
        "FFZ": ["FrankerFaceZ", "images/icons/FFZ.png"]
    }
};

////////////////////////////////////
//          CHANGELOG
////////////////////////////////////

//API
async function fetchChangelog(name = "") {
    return fetch(CHANGLOG_SETTINGS.API_ENDPOINT + name)
        .then(data => data.json())
        .then(json => {
            if (json.error) {
                return Promise.reject(new Error(json.error + " - " + json.message));
            } else {
                return Promise.resolve(json.data);
            }
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

//Create
function createChangelog(jsonData, prev = "") {
    let s = '<div class="CHANGELOG" id="THISONE">';
    
    s += "<h1>" + (jsonData.title ? jsonData.title : "FRIKYBOT-CHANGELOG - " + jsonData.date);

    let dtCount = 0;
    for (let chapt in jsonData.chapters) {
        dtCount += searchDetailed(jsonData.chapters[chapt]);
    }

    if (dtCount > 0) {
        s += '<button onclick="toggleDetailed(this.parentElement.parentElement)">DETAILED (' + dtCount + ')</button>';
    }

    s += "</h1>";

    for (let chapt in jsonData.chapters) {
        s += '<h2 id="' + MakeIDFriendly(chapt) + '">' + chapt + createIDRefLink(chapt) + '</h2>';

        for (let thing of jsonData.chapters[chapt]) {
            s += createTHING(thing, chapt);
        }
    }

    return s + "</div>";
}

function createTHING(thing, prev) {
    if (thing.type == "PLAIN") {
        return createChangelogPlain(thing, prev);
    } else if (thing.type == "DASHED_PLAIN") {
        return createChangelogDashedPlain(thing, prev);
    }else if (thing.type == "LIST") {
        return createChangelogList(thing, prev);
    } else if (thing.type == "CHANGES") {
        return createChangelogChanges(thing, prev);
    } else if (thing.type == "HEADER") {
        return createChangelogHeader(thing, prev);
    }

    return "";
}

function createChangelogHeader(headerData, prev) {
    return '<h3 id="' + MakeIDFriendly(prev + "_" + headerData.text) + '">' + headerData.text + createIDRefLink(prev + "_" + headerData.text) + '</h3>';
}
function createChangelogPlain(plainData, prev) {
    let s = "";

    for (let p of plainData.paragraphs) {
        if (p instanceof Object) {
            s += '<p' + (p.detailed ? ' class="detailed" hidden' : "")+ '>' + createText(p.text, p.type) + "</p>";
        } else {
            s += "<p>" + p + "</p>";
        }
    }

    return s;
}
function createChangelogDashedPlain(dPlainData, prev) {
    let s = "";

    for (let p of dPlainData.paragraphs) {
        if (p instanceof Object) {
            s += '<p' + (p.detailed ? ' class="detailed" hidden' : "")+ '>' + createText((p.type != "COMMENT" ? "- " : "") + p.text, p.type) + "</p>";
        } else {
            s += "<p>- " + p + "</p>";
        }
    }

    return s;
}
function createChangelogList(listData, prev) {
    let s = "<ul>";
    
    for (let li of listData.elements) {
        if (li instanceof Object) {
            let classes = "";
            if (li.detailed) {
                classes += "detailed ";
            }

            if (li.type == "COMMENT") {
                classes += " COMMENT ";
            }
            s += '<li' + (classes != "" ? ' class="' + classes + '" ' : "") + (li.detailed ? "hidden": "") + '>' + createText(li.text, li.type) + "</li>";
        } else {
            s += "<li>" + li + "</li>";
        }
    }
    
    return s + "</ul>";
}
function createChangelogChanges(changesData, prev) {
    let infos = null;
    
    if (changesData.module_type == "PACKAGE") {
        infos = CHANGLOG_SETTINGS.PACKAGES[changesData.packagename];

        if (!infos) {
            infos = CHANGLOG_SETTINGS.PACKAGES.PACKAGE;
            infos[0] = changesData.packagename;
        }
    } else if (changesData.module_type == "ThirdParty") {
        infos = CHANGLOG_SETTINGS["3rdParty"][changesData.packagename];

        if (!infos) {
            infos = CHANGLOG_SETTINGS["3rdParty"]["3rdParty"];
            infos[0] = changesData.module_name;
        }
    } else {
        infos = CHANGLOG_SETTINGS.MODULES[changesData.module_type];
    }

    if (!infos) {
        return "";
    }

    let s = '<div class="PreChanges" id="' + MakeIDFriendly(prev + "_" + infos[0]) + '"><div class="CHANGES">';
    s += '<div class="Header ' + (changesData.module_type == "PACKAGE" || changesData.module_type == "ThirdParty" ? changesData.packagename + " " : "" ) + changesData.module_type + '">';
    s += '<div class="IMG"><img src="' + ROOT +  infos[1] + '"/></div>';
    s += '<p>' + infos[0] + createIDRefLink(prev + "_" + infos[0]) +"</p>";

    let dtCount = searchDetailed(changesData.contents);
    if (dtCount > 0) {
        s += '<button onclick="toggleDetailed(this.parentElement.parentElement)">DETAILED (' + dtCount + ')</button>';
    }
    s += "</div>";
    
    s += '<div class="CONTENT">';

    for (let thing of changesData.contents) {
        s += createTHING(thing, prev);
    }

    s += "</div>";

    return s + "</div></div>";
}

function createText(text, type) {
    let copyPasta = text + "";

    if (CHANGLOG_SETTINGS.ENABLE_FUNCTION_PARAMERS_CSS) {
        for (let prm of CHANGLOG_SETTINGS.FUNCTION_PARAMERS) {
            const tag = ": " + prm;

            let i = -1;
            do {
                i = copyPasta.indexOf(tag);
                if (i < 0)
                    continue;
                let addIn = ': <span style="' + CHANGLOG_SETTINGS.FUNCTION_PARAMETER_CSS + '">' + prm + '</span>';
                copyPasta = copyPasta.substring(0, i) + addIn + copyPasta.substring(i + tag.length);
            } while (i >= 0);
        }
    }

    if (CHANGLOG_SETTINGS.ENABLE_TYPE_CSS) {
        if (type == "ADDED") {
            return '<span style="' + CHANGLOG_SETTINGS.ADDED_CSS + '">' + copyPasta + '</span>';
        } else if (type == "REMOVED") {
            return '<span style="' + CHANGLOG_SETTINGS.REMOVED_CSS + '">' + copyPasta + '</span>';
        } else if (type == "CHANGED") {
            return '<span style="' + CHANGLOG_SETTINGS.CHANGED_CSS + '">' + copyPasta + '</span>';
        } else if (type == "COMMENT") {
            return '<span style="' + CHANGLOG_SETTINGS.COMMENT_CSS + '">' + copyPasta + '</span>';
        } else if (type == "WARNING") {
            return '<span style="' + CHANGLOG_SETTINGS.WARNING_CSS + '">' + copyPasta + '</span>';
        }
    }
    
    return copyPasta;
}

function createIDRefLink(name) {
    //MAKE SURE PARENT IS position: relative and add a hover to display: inline it!
    return '<img class="REF_LINK_IMG" src="' + ROOT + 'images/icons/paperclip-solid.svg" onclick="document.location.hash = ' + "'" + MakeIDFriendly(name) + "'" + '; ScollToHash();" title="' + MakeIDFriendly(name) + '"/>';
}

//UTIL
function MakeIDFriendly(name) {
    let splitted = name.split(" ");
    let combinded = splitted[0];

    for (let i = 1; i < splitted.length; i++) {
        if (splitted[i] == "/")
            continue;

        combinded += "_" + splitted[i];
    }

    return combinded;
}
function toggleDetailed(issueElt) {
    for (let child of issueElt.childNodes) {
        if (child.classList) {

            let detailed = false;
            let visible = false;

            for (let className of child.classList) {
                if (className == "detailed") {
                    detailed = true;
                }

                if (className == "detailed_visible") {
                    visible = true;
                }

                if (detailed && visible) {
                    break;
                }
            }

            if (detailed) {
                if (visible) {
                    child.classList.remove("detailed_visible");
                    child.setAttribute('hidden', "true");
                } else {
                    child.classList.add("detailed_visible");
                    child.removeAttribute('hidden', "");
                }
            }

            toggleDetailed(child);
        }
    }
}
function searchDetailed(data) {
    let detailed = 0;
    for (let inner of data) {
        if (inner instanceof Object) {
            if (inner.detailed) {
                detailed++;
            }

            if (inner.elements) {
                detailed += searchDetailed(inner.elements);
            } else if (inner.paragraphs) {
                detailed += searchDetailed(inner.paragraphs);
            } else if (inner.contents) {
                detailed += searchDetailed(inner.contents);
            }
        }
    }

    return detailed;
}