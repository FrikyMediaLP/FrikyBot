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
    return fetch("/api/pages/settings/navigation", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        });
}
async function init_Navigation() {
    let navData;
    try {
        navData = await fetchNav();
        document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(navData);
    } catch (err1) {
        try {
            await NAVIVATION_init();
        } catch (err2) {

        }
        return Promise.reject(err1);
    }
    
    return Promise.resolve();
}

//UTIL
function GetTime(time) {
    let date = new Date(time);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString('de-DE', { hour: 'numeric', minute: 'numeric' });
}