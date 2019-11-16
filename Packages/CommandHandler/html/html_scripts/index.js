let BADGES = {

};

let Hierarchy = {
    Admin: 10,
    Staff: 9,
    Broadcaster: 8,
    Global_Mod: 7,
    Moderator: 7,
    VIP: 6,
    Founder: 5,
    Subscriber: 4,
    Partner: 3,
    Other: 2,
    Follower: 1,
    Regular: 0
};
let Commands = [];
let HCCommands = [];

let perPage = 5;
let currentPage = 0;
let BadgeSelectionDiv = "";

let change = [false, false, false, false, false];

async function setup() {
    noCanvas();
    noLoop();
    
    await updateBadges();

    updateSelectionDiv();

    await fetch("/api/CommandHandler/Commands")
        .then(data => data.json())
        .then(json => {
            if (json.status == "SUCCESS") {
                if (json.data) {
                    if (json.data.Hardcoded) {
                        let i = 0;
                        for (let cmd of json.data.Hardcoded) {
                            addHCContent(cmd, i++);
                        }
                    }

                    if (json.data.Custom) {
                        for (let cmd of json.data.Custom) {
                            Commands.push(cmd);
                        }
                    }
                }
            }
        })
        .catch(err => console.log(err));

    Commands.sort(sortByUIDDEC);
    updateTable();
}

//Hardcoded
function toggleShow() {

    if (select("#masterWrapper").class() == "blur") {
        return;
    }

    if (select("#Hardcoded").height == 60) {
        select("#Hardcoded").elt.style.height = "auto";
        select("#HCarrow").html("▲");
    } else {
        select("#Hardcoded").elt.style.height = "60px";
        select("#HCarrow").html("▼");
    }
}
function addHCContent(obj, id) {

    let s = '<div class="HardcodedName">' + obj.name + '</div>';
    s += '<div class="HarcodedDetails">';

    let output = "";

    s += output;
    s += '</div>';
    s += '<div>';
    s += '<span>Enabled:</span>';
    s += '<div class="switchButtonOnOff ' + (obj.enabled ? 'switchButtonOn' : 'switchButtonOff') + '" onclick="switchButton(this)" disabled>';
    s += '<div class="switchButtonSlider">';
    s += '</div>';
    s += '</div>';
    s += '</div>';

    select("#contentHC").html(select("#contentHC").html() + s);
}

//Table
function updateTable() {
    
    let s = "";

    //Headers
    s += '<div id="CommandGrid">';

    s += '<div class="name" id="nameHeader">Command</div>';
    s += '<div class="output" id="outputHeader">Output</div>';
    s += '<div class="userlevel" id="userlevelHeader">Userlevel</div>';
    s += '<div class="cooldown" id="cooldownHeader">Cooldown</div>';
    s += '<div class="settings" id="settingsHeader">Settings</div>';

    s += '</div>';
    
    select("#CommandGridMaster").html(s);
    
    for (let i = (currentPage * perPage); i < Commands.length && i < (currentPage * perPage) + perPage; i++){
        addRow(Commands[i], i, select("#CommandGrid"));
    }

    //Name Width
    let max = 100;

    for (let o of selectAll(".name")) {
        if (o.elt.children[0]) {
            if (o.elt.children[0].offsetWidth > max)
                max = o.elt.children[0].offsetWidth;
        }
    }

    max += 12;

    select("#CommandGrid").elt.style.gridTemplateColumns = max + "px auto minmax(85px, 100px) 90px minmax(75px, 110px)";
    select("#currentPageLabel").html((currentPage + 1) + "/" + ceil(Commands.length / perPage));
}
function addRow(row, idx, parent) {

    if (!row)
        return false;

    let div;

    //Command
    div = createDiv(row.name ? "<b>" + row.name + "</b>" : "<center>-</center>");
    div.class("name row" + idx);
    div.parent(parent);

    //Output
    div = createDiv(row.output ? row.output : "<center>-</center>");
    div.class("output row" + idx);
    div.parent(parent);

    //Userlevel
    let badge = getBadgeObjByName(row.userlevel);

    div = createDiv(!badge ? row.userlevel : "<center>" + getImgFromBadge(badge, 4) + "</center>");
    div.class("userlevel row" + idx);
    div.parent(parent);

    //Cooldown
    div = createDiv("<center>" + row.cooldown + "</center>");
    div.class("cooldown row" + idx);
    div.parent(parent);

    //Settings
    div = createDiv("<center><button onclick='createInfo(this)'>INFO</button> <button onclick='createEdit(this)'>EDIT</button></center>");
    div.class("settings row" + idx);
    div.parent(parent);

    return true;
}

//UI
function perPageChange(x) {
    perPage = x.value;

    if (currentPage >= ceil(Commands.length / perPage)) {
        lastPage();
        return;
    }

    updateTable();
}
function firstPage() {
    currentPage = 0;
    updateTable();
}
function nextPage() {
    currentPage++;

    if (currentPage >= ceil(Commands.length / perPage)) {
        lastPage();
        return;
    }

    updateTable();
}
function prevPage() {
    currentPage--;
    if (currentPage < 0) {
        firstPage();
        return;
    }

    updateTable();
}
function lastPage() {
    currentPage = ceil(Commands.length / perPage)-1;
    updateTable();
}

//ADD
function createAdd() {
    //Visuals
    blurStuff();


    let options = "<div id='ADD'>";

    //basically same as EDIT just no start values

    //ExitButton
    options += "<div id='ExitButton' onclick='exitEDITINFOADD()'><center>X</center></div>"

    //Header
    options += "<h3>ADD COMMAND</h3>";
    options += "<h4>WORK IN PROGRESS</h4>"
    options += "</div>";

    select("#content").html(select("#content").html() + options);
}

//EDIT/INFO
function getHierarchy() {
    let asdas = "";

    let prev = -1;
    let keys = Object.getOwnPropertyNames(Hierarchy);

    for (let i = 0; i < keys.length; i++) {
        let level = keys[i];

        if (prev == -1) {
            asdas += ""
        } else {
            asdas += "<span>"
            if (prev > Hierarchy[level]) {
                asdas += "<";
            } else if (prev == Hierarchy[level]) {
                asdas += "=";
            } else {
                asdas += ">";
            }

            asdas += "</span>"
        }

        //next one is same and prev is not same-> open wrapper
        if (prev != Hierarchy[level] && i + 1 < keys.length && Hierarchy[level] == Hierarchy[keys[i + 1]]) {
            asdas += "<span class='Wrapper'>"
        }

        asdas += "<span class='Badge'>" + getImgFromBadge(getBadgeObjByName(level)) + "</span>";

        //is same as prev
        if (prev == Hierarchy[level]) {
            //next is also same
            if (i + 1 < keys.length && Hierarchy[level] == Hierarchy[keys[i + 1]]) {
                //nothing
            //close wrapping span
            } else {
                asdas += "</span>"
            }
        }

        prev = Hierarchy[level];
    }

    return asdas.substring(0, asdas.length - 3);
}
function exitEDITINFOADD() {
    select("#masterWrapper").class("");
    if (select("#INFO")) select("#INFO").remove();
    if (select("#EDIT")) select("#EDIT").remove();
    if (select("#ADD")) select("#ADD").remove();

    //Enable Button
    let allBtns = selectAll("button", "#CommandGrid");

    for (let btn of allBtns) {
        btn.removeAttribute("disabled");
    }

    select("#commandAddButton").removeAttribute("disabled");

    change = [false, false, false, false, false];
}
function blurStuff() {
    select("#masterWrapper").class("blur");

    //Disable Button
    let allBtns = selectAll("button", "#CommandGrid");

    for (let btn of allBtns) {
        btn.attribute("disabled", "");
    }

    select("#commandAddButton").attribute("disabled", "");
}

//EDIT
function createEdit(x) {
    let rowID = -1;

    //get Row ID
    for (let cls of x.parentElement.parentElement.className.split(" ")) {
        if (cls.substring(0, 3) == "row") {
            rowID = parseInt(cls.substring(3));
        }
    }

    //Visuals
    blurStuff();

    let options = "<div id='EDIT'>";

    //ExitButton
    options += "<div id='ExitButton' onclick='exitEDITINFOADD()'><center>X</center></div>"

    //Header
    options += "<h3>EDIT COMMAND</h3>";

    //Options
    options += "<div id='Options'>";

    options += "<p class='Header'>Name</p>";
    options += "<input id='EDITName' type='text' value='" + Commands[rowID].name + "' name='Name' onInput='checkForChange(this, 0)'/>";

    options += "<p class='Header'>Output</p>";
    options += "<textarea id='EDITOutput' onInput='checkForChange(this, 1)'>" + Commands[rowID].output + "</textarea>";
    options += '<p id="VariableLink">Check out the available <a href="../Commands/Variables" target="_blank">variables</a></p>'

    options += "<p class='Header'>Userlevel: </p>";

    //Userlevel Selector
    options += '<div id="UserlevelSelector">';


    //Selector Slot
    options += '<div class="Selector" id="SelectorNr0">';

    options += '<div class="plus" title="Enter Userlevel" onclick="showSelection(' + "'0'" + ')">';
    options += '<img class="HeaderIcon" data-badge-Value="' + Commands[rowID].userlevel + '" src="' + getBadgeObjByName(Commands[rowID].userlevel).image_url_4x + '" />';
    options += '</div>';

    options += '<div class="Selection">' + BadgeSelectionDiv + '</div>';

    options += '</div>';

    //Name
    options += '<div id="NameInfo">' + getBadgeObjByName(Commands[rowID].userlevel).title + '</div>';

    options += '</div>';


    //Reminder
    options += '<p id="UserlevelInfo" ' + (getRealUserlevel(Commands[rowID].userlevel) == Hierarchy["Other"] ? "" : "hidden") + '>';
    options += 'Reminder! Badges MUST BE EQUIPPED to be detected! There is no API Endpoint to check ALL available Badges by a user atm. In order to use e.g. the Bits-Badges-Access then the Bits-Badge MUST BE EQUIPPED!!!</p > '
    options += '</p>';

    //onclick
    window.addEventListener('click', (event) => {
        if (event.target.className == "SelectionItem") {
            setHeaderImg('<img class="HeaderIcon" data-badge-Value="' + event.target.id.trim() + '" src="' + getBadgeObjByName(event.target.id.trim()).image_url_4x + '" />');
            select("#NameInfo").html(getBadgeObjByName(event.target.id.trim()).title);

            if (getRealUserlevel(event.target.id.trim()) == Hierarchy["Other"]) {
                select("#UserlevelInfo").elt.removeAttribute("hidden");
            } else {
                select("#UserlevelInfo").elt.setAttribute("hidden", "true");
            }

            checkForChange({ name: "Userlevel", value: event.target.id.trim() }, rowID);
        }

        if (event.target.className != "Selection" && event.target.className != "HeaderIcon") {
            hideSelection();
        }
    });

    //Cooldown
    options += '<div id="cooldownSlider">';
    options += '<p id="cooldownSliderHeader">Cooldown: <span>' + Commands[rowID].cooldown + '</span></p>';
    options += '<input id="cooldownSliderIn" type="range" step="1" min="0" value="' + sliderInputInverse(Commands[rowID].cooldown) + '" max="10" oninput="sliderInput(this.value, ' + rowID + ')"/>';
    options += '</div>';

    //Buttons
    options += "<div id='Buttons' hidden><button id='Save'>SAVE</button><button id='Reset' onclick='reset(" + rowID + ")'>RESET</button></div>";
    options += "</div>";

    //Hierachy
    options += "<div id='Info_Hierarchy_Wrapper'>";
    options += '<div id="Info_Hierarchy_Header"><center>Userlevel Hierarchy</center></div>';
    options += '<div id="Info_Hierarchy"><center>' + getHierarchy() + '</center></div>';
    options += "</div>";

    options += "</div>";

    select("#content").html(select("#content").html() + options);
}

//INFO
function createInfo(x) {
    let rowID = -1;
    
    //get Row ID
    for (let cls of x.parentElement.parentElement.className.split(" ")) {
        if (cls.substring(0, 3) == "row") {
            rowID = parseInt(cls.substring(3));
        }
    }

    if (rowID == -1)
        return;

    //Visuals
    blurStuff();


    let options = "<div id='INFO'>";

    //ExitButton
    options += "<div id='ExitButton' onclick='exitEDITINFOADD()'><center>X</center></div>"

    //Header
    options += "<h3>COMMAND INFO</h3>";
    
    //Options
    options += "<div id='Options'>";

    options += "<p class='Header'>Name</p>";
    options += "<input type='text' value='" + Commands[rowID].name + "' name='Name' disabled/>";

    options += "<p class='Header'>Output</p>";
    options += "<textarea disabled>" + Commands[rowID].output + "</textarea>";
    options += '<p id="VariableLink">Check out the available <a href="../Commands/Variables" target="_blank">variables</a></p>'

    options += "<p class='Header'>Userlevel: </p>";

    //Userlevel Selector
    options += '<div id="UserlevelSelector">';


    //Selector Slot
    options += '<div class="Selector">';

    options += '<div class="plus">';
    options += '<img class="HeaderIcon" data-badge-Value="' + Commands[rowID].userlevel + '" src="' + getBadgeObjByName(Commands[rowID].userlevel).image_url_4x + '" />';
    options += '</div>';

    options += '</div>';

    //Name
    options += '<div id="NameInfo">' + getBadgeObjByName(Commands[rowID].userlevel).title + '</div>';

    options += '</div>';
    
    //Reminder
    options += '<p id="UserlevelInfo" ' + (getRealUserlevel(Commands[rowID].userlevel) == Hierarchy["Other"] ? "" : "hidden") + '>';
    options += 'Reminder! Badges MUST BE EQUIPPED to be detected! There is no API Endpoint to check ALL available Badges by a user atm. In order to use e.g. the Bits-Badges-Access then the Bits-Badge MUST BE EQUIPPED!!!</p > '
    options += '</p>';

    //Cooldown
    options += '<div id="cooldownSlider">';
    options += '<p id="cooldownSliderHeader">Cooldown: <span>' + Commands[rowID].cooldown + '</span></p>';
    options += '<input type="range" step="1" min="0" value="' + sliderInputInverse(Commands[rowID].cooldown) + '" max="10" disabled/>';
    options += '</div>';

    options += '</div>';

    //Hierachy
    options += "<div id='Info_Hierarchy_Wrapper'>";
    options += '<div id="Info_Hierarchy_Header"><center>Userlevel Hierarchy</center></div>';
    options += '<div id="Info_Hierarchy"><center>' + getHierarchy() + '</center></div>';
    options += "</div>";

    select("#content").html(select("#content").html() + options);
}

//OPTIONS
function reset(id) {
    if (id >= 0 && id < Commands.length) {
        //Name 
        select("#EDITName").value(Commands[id].name);
        change[0] = false;

        //Output
        select("#EDITOutput").html(Commands[id].output);
        change[1] = false;

        //Userlevel
        setHeaderImg('<img class="HeaderIcon" data-badge-Value="' + Commands[id].userlevel + '" src="' + getBadgeObjByName(Commands[id].userlevel).image_url_4x + '" />');
        select("#NameInfo").html(getBadgeObjByName(Commands[id].userlevel).title);

        if (getRealUserlevel(event.target.id.trim()) == Hierarchy["Other"]) {
            select("#UserlevelInfo").elt.removeAttribute("hidden");
        } else {
            select("#UserlevelInfo").elt.setAttribute("hidden", "true");
        }
        change[2] = false;

        //Cooldown
        select("#cooldownSliderHeader").html('Cooldown: <span>' + Commands[id].cooldown + '</span>');
        select("#cooldownSliderIn").value(sliderInputInverse(Commands[id].cooldown));
        change[3] = false;

        for (let ch of change) {
            if (ch) {
                return;
            }
        }

        hideButtons();
    }
}
function checkForChange(e, id) {
    let compare = "";
    let changeID = -1;
    let toLC = false;

    if (e.name == "Name") {
        compare = Commands[id].name;
        changeID = 0;
    } else if (e.name == "Output") {
        compare = Commands[id].output;
        changeID = 1;
    } else if (e.name == "Userlevel") {
        compare = Commands[id].userlevel.toLowerCase();
        toLC = true;
        changeID = 2;
    } else if (e.name == "Cooldown") {
        compare = Commands[id].cooldown;
        changeID = 3;
    } else {
        return;
    }

    if ((toLC && compare == e.value.toLowerCase()) || (!toLC && compare == e.value)) {
        change[changeID] = false;

        for (let chg of change) {
            if (chg) {
                showButtons();
                return;
            }
        }

        hideButtons();
    } else {
        change[changeID] = true;
        showButtons();
    }
}
function showButtons() {
    select("#Buttons").removeAttribute("hidden");
}
function hideButtons() {
    select("#Buttons").attribute("hidden", "");
}

//UserlevelSelect
function updateSelectionDiv() {
    let s = '';

    var icons = [];

    for (let badge in Hierarchy) {

        let obj = getBadgeObjByName(badge);
        s += '<img class="SelectionItem" id="' + badge + '" src="' + obj.image_url_4x + '" title="' + obj.title + '"/>';
    }

    for (let badge in BADGES) {
        let end = false;

        for (let hierBadge in Hierarchy) {
            if (hierBadge == badge || hierBadge.toLowerCase() == badge.toLowerCase()) {
                end = true;
                break;
            }
        }

        if (end) {
            continue;
        }

        for (let version in BADGES[badge].versions) {
            s += '<img class="SelectionItem" id="' + badge + ':' + version + ' " src="' + BADGES[badge].versions[version].image_url_4x + '" title="' + badge + ' Version: ' + version + '"/>';
        }
    }

    BadgeSelectionDiv = s;
}

function setHeaderImg(img) {
    let id = "0";
    if (id && select("#SelectorNr" + id) && img) {
        selectAll(".HeaderIcon", "#SelectorNr" + id)[0].remove();
        selectAll(".plus", "#SelectorNr" + id)[0].html(img);
    }
}
function getHeaderData(id) {
    if (id && select("#SelectorNr" + id) && select("img", "#SelectorNr" + id)) {
        return select("img", "#SelectorNr" + id).elt.dataset["badgeValue"];
    }
    return null;
}

function showSelection(id) {
    if (id && select('#SelectorNr' + id))
        select('#SelectorNr' + id).elt.className = ('Selector showSelection');
}
function hideSelection() {
    let elements = selectAll(".Selector");

    for (let el of elements) {
        el.class("Selector");
    }
}

//Badges
async function updateBadges() {
    BADGES = (await getBadges()).badge_sets;
    let ownBadges = {
        Other: {
            versions: {
                1: {
                    title: "Every Other Badge",
                    description: "Every Other Regular Twitch Badge",
                    image_url_1x: "../images/Badges/" + "Other.png",
                    image_url_2x: "../images/Badges/" + "Other.png",
                    image_url_4x: "../images/Badges/" + "Other.png",
                    last_updated: null,
                    click_action: "none",
                    click_url: ""
                }
            }
        },
        Unknown: {
            versions: {
                1: {
                    title: "Unknown Badge",
                    description: "Idk why, but we could find that Badge!",
                    image_url_1x: "../images/Badges/" + "Unknown.png",
                    image_url_2x: "../images/Badges/" + "Unknown.png",
                    image_url_4x: "../images/Badges/" + "Unknown.png",
                    last_updated: null,
                    click_action: "none",
                    click_url: ""
                }
            }
        },
        Follower: {
            versions: {
                1: {
                    title: "Followers",
                    description: "Followers Badge/Userlevel",
                    image_url_1x: "../images/Badges/" + "Follow.png",
                    image_url_2x: "../images/Badges/" + "Follow.png",
                    image_url_4x: "../images/Badges/" + "Follow.png",
                    last_updated: null,
                    click_action: "none",
                    click_url: ""
                }
            }
        },
        Regular: {
            versions: {
                1: {
                    title: "Regular User",
                    description: "Regular Users Badge",
                    image_url_1x: "../images/Badges/" + "Regular.png",
                    image_url_2x: "../images/Badges/" + "Regular.png",
                    image_url_4x: "../images/Badges/" + "Regular.png",
                    last_updated: null,
                    click_action: "none",
                    click_url: ""
                }
            }
        }
    };

    for (let own in ownBadges) {
        BADGES[own] = ownBadges[own];
    }
}
async function getBadges() {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await fetch("https://badges.twitch.tv/v1/badges/global/display?language=en")
            let json = await data.json();
            resolve(json);
        } catch (err) {
            reject(err);
        }
    });
}

function getBadgeObjByName(name) {
    let nameLC = name.toLowerCase();
    let nameUC = name;
    let VERSION = null;
    let badgeObj = null;

    if (name.lastIndexOf(":") >= 0) {
        VERSION = name.substring(name.lastIndexOf(":") + 1);
        nameLC = nameLC.substring(0, nameLC.lastIndexOf(":"));
        nameUC = nameUC.substring(0, nameUC.lastIndexOf(":"));
    }

    if (BADGES[nameUC]) {
        badgeObj = BADGES[nameUC];
    } else if (BADGES[nameLC]) {
        badgeObj = BADGES[nameLC];
    }

    if (badgeObj) {
        if (VERSION) {
            try {
                if (badgeObj.versions[VERSION]) {
                    badgeObj = badgeObj.versions[VERSION];
                } else if (badgeObj.versions[parseInt(VERSION)]) {
                    badgeObj = badgeObj.versions[parseInt(VERSION)];
                }
            } catch{
                return BADGES["Unknown"];
            }
        } else {
            badgeObj = badgeObj.versions[Object.getOwnPropertyNames(badgeObj.versions)[0]];
        }
        return badgeObj;
    }
    return BADGES["Unknown"];
}
function getImgFromBadge(obj, res) {
    if (!obj || !obj.title || !obj.description || !obj.image_url_1x || !obj.image_url_2x || !obj.image_url_4x || !obj.click_action) {
        return null;
    }

    let temp = '<img src="' + obj['image_url_' + (res ? res : 1) + 'x'] + '" title="' + obj.title + '" />';

    if (obj.click_action == "visit_url") {
        return '<a href="' + obj.click_url + '" target="_blank">' + temp + '</a>'
    } else {
        return temp;
    }
}
function getBadgeString(name) {
    if (name.lastIndexOf(":") >= 0) {
        if (name.substring(name.lastIndexOf(":") + 1) != "1" && name.substring(name.lastIndexOf(":") + 1) != "0") {
            return name.substring(0, name.lastIndexOf(":")) + " Version: " + name.substring(name.lastIndexOf(":") + 1);
        } else {
            return name.substring(0, name.lastIndexOf(":"));
        }
    } else {
        return name;
    }
}
function getRealUserlevel(name) {

    //Is in Hirachy
    for (let key in Hierarchy) {
        if (key == name || key.toLowerCase() == name.toLowerCase()) {
            return Hierarchy[key];
        }
    }

    if (name.lastIndexOf(":") >= 0) {
        name = name.substring(0, name.lastIndexOf(":"));
    }

    if (BADGES[name] || BADGES[name.toLowerCase()]) {
        return Hierarchy["Other"];
    }

    return -1;
}

//Cooldown
function sliderInput(value, id) {

    let out = "";

    switch (parseInt(value)) {
        case 0:
            out = "1s";
            break;
        case 1:
            out = "2s";
            break;
        case 2:
            out = "3s";
            break;
        case 3:
            out = "5s";
            break;
        case 4:
            out = "30s";
            break;
        case 5:
            out = "1m";
            break;
        case 6:
            out = "2m";
            break;
        case 7:
            out = "5m";
            break;
        case 8:
            out = "10m";
            break;
        case 9:
            out = "30m";
            break;
        case 10:
            out = "1h";
            break;

    }

    if (out != "") {
        select("span", "#cooldownSliderHeader").html(out);
        checkForChange({ name: "Cooldown", value: out }, id);
    }
}
function sliderInputInverse(value) {
    if (value == "1s") {
        return 0;
    } else if (value == "2s") {
        return 1;
    } else if (value == "3s") {
        return 2;
    } else if (value == "5s") {
        return 3;
    } else if (value == "30s") {
        return 4;
    } else if (value == "1m") {
        return 5;
    } else if (value == "2m") {
        return 6;
    } else if (value == "5m") {
        return 7;
    } else if (value == "10m") {
        return 8;
    } else if (value == "30m") {
        return 9;
    } else if (value == "1h") {
        return 10;
    } else {
        return null;
    }
}
function compareCD(a, b) {

    if(!a || !b) return 0;

    let qA = a.substring(a.length - 1);
    let qB = b.substring(b.length - 1);

    let qs = {
        "s": 1,
        "m": 60,
        "h": 3600,
    };

    if (!qs[qA] || !qs[qB]) {
        return 0;
    }

    let valueA = qs[qA] * parseInt(a.substring(0, a.length - 1));
    let valueB = qs[qB] * parseInt(b.substring(0, b.length - 1));
    
    return valueA - valueB;
}

//Sort
function sortByUIDACC(a, b) {
    return b.uid - a.uid;
}
function sortByUIDDEC(a, b) {
    return a.uid - b.uid;
}

function sortByCDACC(a, b) {
    return compareCD(a.cooldown, b.cooldown);
}
function sortByCDDEC(a, b) {
    return compareCD(b.cooldown, a.cooldown);
}

function sortByUserlevelDEC(a, b) {
    return getRealUserlevel(b.userlevel) - getRealUserlevel(a.userlevel);
}
function sortByUserlevelACC(a, b) {
    return getRealUserlevel(a.userlevel) - getRealUserlevel(b.userlevel);
}

function sortByNameDEC(a, b) {
    let temp = [a.name, b.name];

    temp.sort();

    if (temp[0] == a.name) {
        return -1;
    } else {
        return 1;
    }
}
function sortByNameACC(a, b) {
    let temp = [a.name, b.name];

    temp.sort();

    if (temp[0] == a.name) {
        return 1;
    } else {
        return -1;
    }
}

function sortByOutputDEC(a, b) {
    let temp = [a.output, b.output];

    temp.sort();

    if (temp[0] == a.output) {
        return -1;
    } else {
        return 1;
    }
}
function sortByOutputACC(a, b) {
    let temp = [a.output, b.output];

    temp.sort();

    if (temp[0] == a.output) {
        return 1;
    } else {
        return -1;
    }
}