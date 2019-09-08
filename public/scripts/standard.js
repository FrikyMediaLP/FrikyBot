function getBotStatus() {
    let x = document.getElementById("statusHeader");

    fetch("http://localhost:1337/api/Status")
        .then(res => res.json())
        .then(json => {
            console.log(json);

            if (json.data && !json.err) {
                x.innerHTML = "Status: <span style='color: #00e03c;'>" + json.data + "</span>";
            } else {
                x.innerHTML = "Status: <span style='color: red;'>ERROR! " + json.err + "</span>";
            }
        })
        .catch(err => {
            console.log(err);
            x.innerHTML = "Status: <span style='color: red;'>ERROR! " + err + "</span>";
        });
}

function GetURLParams() {
    return window.location.search.substring(1).split('&');
}

function HasURLParam(ParamName) {
    let sURLVariables = window.location.search.substring(1).split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        let sParamName = sURLVariables[i].split('=');
        if (sParamName[0] == ParamName) {
            return sParamName[1];
        }
    }
}