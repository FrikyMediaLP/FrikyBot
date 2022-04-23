function init() {
    OUTPUT_create();
    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;
    
    fetch("/api/Packages", getAuthHeader())
        .then(data => data.json())
        .then(json => {
            if (json.err) return Promise.reject(new Error(json.err));

            let state = showPackages(json.data.Packages);

            if (typeof (state) == "string") {
                ERROR_OUTPUT_showError(state);
            } else if (state == false) {
                document.getElementsByTagName("h1")[0].innerHTML = "<center>NO PACKAGES INSTALLED</center>";
            }
            document.getElementById('WAITING_WRAPPER').remove();
        })
        .catch(err => {
            OUTPUT_showError(err);
            console.log(err);
            document.getElementById('WAITING_WRAPPER').remove();
        });
}

function showPackages(packages) {
    if (!packages) {
        OUTPUT_showError("<b>FETCH ERROR:</b> Data not found!");
        return;
    }

    if (typeof (packages) != "object") {
        OUTPUT_showError("<b>INTERNAL ERROR:</b> Data not in right format!");
        return;
    }

    if (Object.getOwnPropertyNames(packages).length == 0) {
        return false;
    }

    let s = "";
    
    for (let pack in packages) {
        s += '<div class="Package ' + (packages[pack].enabled !== true ? 'DISABLED' : '') + '">';
        s += '<h2>' + pack + (packages[pack].html && LOGIN_getUserlevel(false) >= USERLEVEL_INDEX(packages[pack].restricted)  ? '<a href="' + packages[pack].html + '">< go to ></a>' : "") + '</h2>';
        s += '<p>' + packages[pack].description + '</p>';
        s += '</div>';
    }

    document.getElementById("InstalledPackages").innerHTML += s;
    return true;
}