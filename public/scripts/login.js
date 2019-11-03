//TWITCH LOGIN INFOS
let TwitchScopes = ["channel:moderate", "chat:edit", "chat:read", "user_read"];

function init() {

    if (isLoggedIn()) {
        document.getElementById("twitchLoginA").removeAttribute("href");
        document.getElementById("twitchLoginA").childNodes[1].childNodes[1].src = getCookie("UserLogo");
        document.getElementById("twitchLoginA").childNodes[1].childNodes[1].id = "noFilter";
        document.getElementById("twitchLoginA").childNodes[1].childNodes[3].innerHTML = "Logged in as <a href='http://twitch.tv/" + getCookie("Username") + "'>" + getCookie("Username") + "</a> - <a style='text-decoration: underline; cursor: pointer;' onclick='logOut();'>Log out</a>";
        document.getElementById("twitchLoginA").childNodes[1].childNodes[3].style.fontWeight = "300";
        document.getElementById("twitchLoginA").childNodes[1].childNodes[3].childNodes[1].style.color = "white";

        return;
    }

    fetch("/api/TwitchNewAPI/GetLogInPageToken",
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({scopes: TwitchScopes})
        })
        .then(data => data.text())
        .then(text => document.getElementById("twitchLoginA").href = text)
        .catch(err => console.log(err));
}

function send() {
    let un = document.getElementById("usernameInput");
    let pw = document.getElementById("passwordInput");

    if (checkInput(un.value)) {
        un.style.borderColor = "red";

        if (checkInput(pw.value)) {
            pw.style.borderColor = "red";
        }

        return;
    } else if (checkInput(pw.value)) {
        pw.style.borderColor = "red";
        return;
    }

    document.location = "./options";
}

function checkInput(value) {
    if (value == "" || value.indexOf(" ") >= 0) {
        return true;
    }
}

function onInput(x) {
    x.style.borderColor = "gray";
}

function logOut() {

    fetch("/api/TwitchNewAPI/Revoke",
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token: getCookie("OAuth") })
        })
        .then(data => data.json())
        .then(json => {
            console.log(json);

            if (!json.body) {
                removeCookie("Username");
                removeCookie("OAuth");
                removeCookie("UserLogo");
                removeCookie("UserID");

                location.reload();
            } else{
                removeCookie("Username");
                removeCookie("OAuth");
                removeCookie("UserLogo");
                removeCookie("UserID");

                alert("Revoking your token didnt work ... gonna delete it from your Browser anymays!");
            }
        })
        .catch(err => console.log(err));
}