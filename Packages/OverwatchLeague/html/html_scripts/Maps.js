let rootAPI = "https://api.overwatchleague.com";
let MAPS;
let end = false;

function setup() {
    noCanvas();

    fetch(rootAPI + "/maps")
        .then(res => res.json())
        .then(json => {
            console.log(json);
            MAPS = json;

            fetch(rootAPI + "/live-match")
                .then(res => res.json())
                .then(json => {
                    console.log(json.data.length);
                    showMatch(json.data.liveMatch);
                });
        });

    frameRate(0.1);
}

function draw() {
    if(!end) fetch(rootAPI + "/live-match")
        .then(res => res.json())
        .then(json => {
            console.log(json.data);
            showMatch(json.data.liveMatch);
        });
}

function showMatch(match) {

    if (!match)
        return;

    //console.clear();
    select("body").html("<div id='Match_Maps'></div>");

    for (let i = 1; i <= match.games.length; i++) {
        createMap(match, i);
    }
}

function createMap(match, idx) {

    let map = getMap(match, idx);

    let details = getMapDetails(map.attributes.mapGuid);

    console.log(map);

    let s = "<div class='Map_Index'><p>" + idx + "</p></div>";
    s += "<div class='Map_Left'></div>";
    s += "<div class='Map_Name'><p>" + details.name.en_US + "</p></div>";
    s += "<div class='Map_Img'><img src='" + details.thumbnail + "' /></div>";
    s += "<div class='Map_Right'></div>";

    //let s = "<div class='Map_Index'><p>" + idx + "</p></div>";
    //s += "<div class='Map_Left' style='background-color: " + (map.state == "CONCLUDED" ? "#" + match.competitors[getMapWinner(map)].primaryColor : "orange") + ";' ></div>";
    //s += "<div class='Map_Name'>" + (map.state == "CONCLUDED" ? "" : map.state == "IN_PROGRESS" ? "<p>" + getMapScore(map) + "</p>" : map.state == "PENDING" ? (!prevLive ? "" : "<p>Next Map</p>") : " ") + "<p>" + details.name.en_US + "</p></div>";
    //s += "<div class='Map_Img'><img src='" + details.thumbnail + "' /></div>";
    //s += "<div class='Map_Right' style='background-color: " + (map.state == "CONCLUDED" ? "#" + match.competitors[getMapWinner(map)].primaryColor : "orange") + ";' ></div>";

    let div = createDiv(s);
    div.class("Map");
    div.id(map.number);

    //if ((map.state == "CONCLUDED" || map.state == "PENDING") && !prevLive) {
    //    div.style("grid-template-rows", "55px");
    //}

    return div;
}

function getMap(match, idx) {
    for (let game of match.games) {
         
        if (game.number == idx) {
            return game;
        }
    }
    return null;
}

function getMapScore(map) {
    if (map.state == "IN_PROGRESS") {
        return map.points ? map.points[0] + " - " + map.points[1] : " 0 - 0";
    }else if (map.state == "CONCLUDED") {
        return map.points[0] + " - " + map.points[1];
    }else {
        return "";
    }
}

function getMapWinner(map) {
    if (map.points) {
        if (map.points[0] > map.points[1]) {
            return 0;
        } else {
            return 1;
        }
    }
    return "";
}

function getMapDetails(mapGUID) {
    for(let map of MAPS){
        if (map.guid == mapGUID) {
            return map;
        }
    }
    return null;
}