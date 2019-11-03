ONCOOKIEACCEPT = onCookieAccept;
let OAUTH = null;
let USERDETAILS = null;

async function init() {

    if (window.location.hash.indexOf("#access_token=") >= 0) {
        OAUTH = window.location.hash.substring(window.location.hash.indexOf("#access_token=") + 14, window.location.hash.indexOf("&"));

        window.location.hash = "";

        let data = {
            OAuth: OAUTH
        };

        await fetch("/api/GetUserDetailsByOAuth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(data => data.json())
            .then(json => {

                if (json.err) {
                    console.error(json.err);
                    return;
                }

                USERDETAILS = json.data.User;
            })
            .catch(err => console.log(err));
    }

    if (!hasCookie("CookieAccept")) {
        displayCookieNotification(document.getElementById("contentHeader"));
    } else if (getCookie("CookieAccept") == "true"){
        onCookieAccept();
    }
}

function onCookieAccept() {
    saveUserInfo();

    if (isLoggedIn()) {
        initProfile();
        document.getElementById("SignIn_Bot_Navi").childNodes[1].childNodes[3].innerHTML = "Log out";
    }
}

function saveUserInfo() {
    if (COOKIE_ACCEPT && OAUTH) {
        setCookie("OAuth", OAUTH);

        if (USERDETAILS) {
            setCookie("Username", USERDETAILS.display_name ? USERDETAILS.display_name : USERDETAILS.name);
            setCookie("UserLogo", USERDETAILS.logo);
            setCookie("UserID", USERDETAILS._id);
        }
    }
}