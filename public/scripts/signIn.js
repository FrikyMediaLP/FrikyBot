function onUnlockBtn(x) {
    if (x.innerHTML == "LOCK") {
        x.innerHTML = "UNLOCK";
        x.style.backgroundColor = "lightcoral";

        for (let scope of document.getElementsByClassName("Input_Scopes")) {
            scope.disabled = true;
        }
    } else {
        x.innerHTML = "LOCK";
        x.style.backgroundColor = "lime";

        for (let scope of document.getElementsByClassName("Input_Scopes")) {
            scope.disabled = false;
        }
    }
}

function test() {
    let scopes = [];

    for (let scope of document.getElementsByClassName("Input_Scopes")) {
        if (scope.checked) 
            scopes.push(scope.value);
    }

    let data = {
        scopes: scopes
    };


    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };

    console.log(options);

    fetch("api/TwitchNewAPI/GetLogInPage", options)
        .then(data => data.text())
        .then(text => {
            console.log(text);
            window.location = text;
        })
        .catch(err => console.log(err));
}

function createTwitchRequest() {
    let clientID = document.getElementById("Input_Client_ID").value;

    let scopes = "";

    for (let scope of document.getElementsByClassName("Input_Scopes")) {
        if (scope.checked) {
            scopes += scope.value + "+";
        }
    }

    scopes = scopes.substring(0, scopes.length-1);

    console.log(clientID);

    if (!clientID || clientID == "") {
        return;
    }

    let query = "https://id.twitch.tv/oauth2/authorize"
    query += "?client_id=" + clientID;
    query += "&redirect_uri=http://localhost:1337/Twitch-redirect";
    query += "&response_type=code";
    if (scopes != "") query += "&scope=" + scopes;

    console.log(query);

    window.location = query;
}