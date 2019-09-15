let ROOT = "http://localhost:1337/"

function Standard_Page_Init() {
    getBotStatus();
}

function getBotStatus() {
    let x = document.getElementById("statusHeader");

    fetch("/api/Status")
        .then(res => res.json())
        .then(json => {
            console.log(json);

            if (json.data && !json.err) {
                x.innerHTML = "Status: <span style='color: #00e03c;'>" + json.data.Status + "</span></br>";
                
                if (json.data.LogIn && json.data.LogIn.Status) {
                    x.innerHTML += "Log In: <span style='color: #00e03c;'>" + json.data.LogIn.Name + "</span>";
                } else {
                    x.innerHTML += "Log In: <span style='color: red;'> Access Token discontinued! Please <b>Log in again!</b></span>";
                    let nav = document.getElementById("SignIn_Bot_Navi");
                    nav.children[0].children[1].innerHTML = "Sign In";
                }
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