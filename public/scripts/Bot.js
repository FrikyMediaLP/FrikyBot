let once = false;

function init() {

    fetch("/api/TwitchNewAPI/GetBot")
        .then(data => data.json())
        .then(json => {

            if (json == {}) {
                document.getElementById("headTitle").innerHTML = "Hmmm site loaded to fast? Can you reload pls? :)";
                return;
            }

            document.getElementById("profile_pic").src = json.profile_image_url;
            document.getElementById("headTitle").innerHTML = "Bot Logged in to Twitch!";
            document.getElementById("underTitle").innerHTML = "Profile - " + json.display_name;

            let s = "";
            s += "<p>" + json.description + "</p>";
            s += "<p>Bot-User ID: " + json.id + "</p>";
            s += "<p>Bot-User Broadcaster Type: " + json.broadcaster_type + "</p>";
            s += "<div id='viewcount'></div>";

            document.getElementById("DUMP").innerHTML = s;
            let i = 0;

            s = "";

            for (i = 1; i < Math.trunc(json.view_count / 100); i++) {
                s += "<div class='view' style='background-color: lightgreen' title='" + addDots(i * 100) + " Views'></div>";
            }

            s += "<div class='view' style='background-color: rgb(" + Math.trunc((100 - json.view_count % 100) * 2.55) + "," + Math.trunc((json.view_count % 100) * 2.55) + "," + "0);' title='" + addDots((i-1) * 100 + json.view_count % 100) + " Views'></div>";

            for (let j = i; j < (document.getElementById("viewcount").clientWidth / 13); j++) {
                s += "<div class='view' style='background-color: lightgray;' title='" + addDots(j * 100) + " Views'></div>";
            }
            document.getElementById("viewcount").innerHTML = s;
            document.getElementById("viewcount").style.width = "100%";
        })
        .catch(err => {
            document.getElementById("headTitle").innerHTML = "Failed Log in to Twitch!";
            document.getElementById("underTitle").innerHTML = "Pls try again or contact me!";
            document.getElementById("DUMP").innerHTML = "";

            console.log(err);
        });
}

function addDots(nbr) {

    if (nbr < 1000) {
        return nbr + "";
    }

    nbr = nbr + "";

    let s = "";

    for (let i = 1; i < nbr.length+1; i++) {
        if (i%3 == 0) {
            s = "." + nbr.charAt(nbr.length - i) + s
        } else {
            s = nbr.charAt(nbr.length - i) + s;
        }
    }

    return s;
}