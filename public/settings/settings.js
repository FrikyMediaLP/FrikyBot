async function init() {
    OUTPUT_create();
    
    //Navigation
    try {
        await init_Navigation();
    } catch (err) {
        OUTPUT_showError(err.message);
        return Promise.resolve();
    }
}

async function fetchNav() {
    return fetch("/api/settings/navigation", getFetchHeader())
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}
async function init_Navigation() {
    let navData;
    try {
        navData = await fetchNav();
        document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(navData);
    } catch (err) {
        try {
            await NAVIVATION_init();
        } catch (err) {

        }
        return Promise.reject(err);
    }
    
    return Promise.resolve();
}

//UTIL
function getFetchHeader() {
    return {
        headers: {
            "Authorization": "Bearer " + TTV_PROFILE_getCookieData().id_token
        }
    };
}
async function checkResponse(response) {
    if (response.status === 200) {
        return response.json();
    } else if (response.status === 401) {
        let error = null;

        try {
            error = await response.text();
        } catch (err) {

        }

        return Promise.reject(new Error("Unauthorized" + (error && error !== 'Unauthorized' ? ": " + error : '')));
    } else {
        return Promise.reject(new Error("Error: " + response.status + " - " + response.statusText));
    }
}
function HTMLElementArrayToArray(html_arr) {
    let arr = [];

    for (let elt of html_arr) {
        arr.push(elt);
    }

    return arr;
}
function GetTime(time) {
    let date = new Date(time);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString('de-DE', { hour: 'numeric', minute: 'numeric' });
}