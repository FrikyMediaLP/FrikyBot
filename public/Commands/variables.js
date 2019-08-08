let up = false;
let div;

function setup() {
    noCanvas();

    loadVariables();
    frameRate(500);
}

function draw() {
    if (div) {
        let max = 40;
        let min = 0;
        let inc = 10;
        let curHeight = (div.style.height == "" ? 0 : (div.style.height == "auto" ? div.scrollHeight - inc : parseInt(div.style.height.substring(0, div.style.height.length - 2))));
        

        if (up) {
            if (curHeight < div.scrollHeight-inc) {
                curHeight = curHeight + inc;
                div.style.height = curHeight + "px";
            } else {
                div.style.height = "auto";
                div.style.padding = "5px";
                div = null;
            }
        } else {
            div.style.padding = "0px";

            if (curHeight > min) {
                curHeight = (curHeight - inc < 0) ? 0 : (curHeight - inc);
                div.style.height = curHeight + "px";
            } else {
                div = null;
            }
        }
    }
}

function loadVariables() {
    fetch("/api/CommandHandler/Variables")
        .then(response => response.json())
        .then(json => {
            console.log(json);

            if (!json.data || json.err) {
                select('#content').html("<h2>Bot Command Variables</h2><div style='text-align: center; color: grey; padding: 3px;'>Ein Fehler ist aufgetreten</div>");
                return;
            }

            let s = "<span id='headerTitle'>Bot Command Variables</span><a href='../commands.html' id='back'>BACK</a></br></br>";

            for (let vari of Object.getOwnPropertyNames(json.data)) {
                s += "<div class=variable><span> &#8226; ";
                s += "<variable>" + vari + "</variable> - ";
                s += (json.data[vari].pretitle ? json.data[vari].pretitle : "empty...please inform me of that!");
                s += " [<CLICK onclick=expand(this)>show more</CLICK>]</span>";
                s += "<div class=expanded>" + (json.data[vari].description ? createDescription(json.data[vari].description) : (json.data[vari].Nightbot ? createNightbot(json.data[vari].Nightbot) : "")) + "</div></div>";
            }

            select('#content').html(s);
        })
        .catch(err => {
            console.log(err);
            select('#content').html("<h2>Bot Command Variables</h2><div style='text-align: center; color: grey; padding: 3px;'>Ein Fehler ist aufgetreten</div>");
        });
}

function expand(variable) {
    if (variable.parentElement.parentElement.children[1].style.height == "0px" || variable.parentElement.parentElement.children[1].style.height == "") {
        div = variable.parentElement.parentElement.children[1];
        up = true;
        variable.innerHTML = "show less";
    } else {
        div = variable.parentElement.parentElement.children[1];
        up = false;
        variable.innerHTML = "show more";
    }
}

function createNightbot(nightbot) {

    let s = "This Variable is based on a Nighbot reference! Should function exactly like the Nightbot one. Last Update on " + nightbot.version + " [<a href=" + nightbot.link + " target=_blank>Nightbot Docs</a>]";

    return s;
}

function createDescription(description) {
    return description;
}