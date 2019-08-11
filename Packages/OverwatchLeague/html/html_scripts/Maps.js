let rootAPI = "https://api.overwatchleague.com";
let MAPS;
let end = true;

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
                    showMatch(json.data.liveMatch);
                });
        });

    frameRate(0.1);
}

function draw() {
    if(!end) fetch(rootAPI + "/live-match")
        .then(res => res.json())
        .then(json => {
            showMatch(json.data.liveMatch);
        });
}

function showMatch(match) {
    let scores = [match.scores[0].value, match.scores[1].value];

    let live = match.liveStatus == "LIVE";

    console.clear();
    select("body").html("<div id='Match_Maps'></div>");
    
    for (let i = 1; i <= match.games.length; i++) {
        createMap(match, i, (i == 1 ? true : (getMap(match, i - 1).state == "IN_PROGRESS"))).parent(select("#Match_Maps"));
    }

    return;

    select("body").html("<div id='Match'><div id = 'TeamA'></div><div id='Maps'></div><div id='TeamB'></div></div>");

    if (live)
        end = false;
    
    //BANNERS
    let bannerA = select("#TeamA");
    bannerA.style("background-color", "#" + match.competitors[0].primaryColor);
    bannerA.attribute("title", scores[0]);
    let bannerB = select("#TeamB");
    bannerB.style("background-color", "#" + match.competitors[1].primaryColor);
    bannerB.attribute("title", scores[0]);

    let maps = select("#Maps");

    //MAPS
    for (let i = 1; i <= match.games.length; i++) {
        let map = getMap(match, i);
        let mapDetail = getMapDetails(map.attributes.mapGuid);

        console.log(getMapWinner(map));

        let s = "";
        s += "<img class='Backimg' src='" + mapDetail.thumbnail + "'/>"
        if (map.state == "CONCLUDED") {
            if (map.points[0] == map.points[1]) {
                s += "<span class='Score'>DRAW</span>";
            } else {
                s += "<div class='Frontimg' style='background-color: #" + match.competitors[getMapWinner(map)].primaryColor + "'><div><img src='" + match.competitors[getMapWinner(map)].logo + "'/>";
            }
        }else s += "<span class='Score'>" + getMapScore(map) + "</span>";

        let div = createDiv(s);
        div.parent(maps);

        if (map.number == 4 && map.state == "CONCLUDED") {
            end = true;
        }
    }
}

function createMap(match, idx, prevLive) {

    let map = getMap(match, idx);
    console.log(prevLive);

    let details = getMapDetails(map.attributes.mapGuid);
    
    console.log(map);

    let s = "<div class='Map_Index'><p>" + idx + "</p></div>";
    s += "<div class='Map_Left' style='background-color: " + (map.state == "CONCLUDED" ? "#" + match.competitors[getMapWinner(map)].primaryColor : "orange") + ";' ></div>";
    s += "<div class='Map_Name'>" + (map.state == "CONCLUDED" ? "" : map.state == "IN_PROGRESS" ? "<p>" + getMapScore(map) + "</p>" : map.state == "PENDING" ? (!prevLive ? "" : "<p>Next Map</p>") : " ") + "<p>" + details.name.en_US + "</p></div>";
    s += "<div class='Map_Img'><img src='" + details.thumbnail + "' /></div>";
    s += "<div class='Map_Right' style='background-color: " + (map.state == "CONCLUDED" ? "#" + match.competitors[getMapWinner(map)].primaryColor : "orange") + ";' ></div>";

    let div = createDiv(s);
    div.class("Map");
    div.id(map.number);

    if ((map.state == "CONCLUDED" || map.state == "PENDING") && !prevLive) {
        div.style("grid-template-rows", "55px");
    }

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