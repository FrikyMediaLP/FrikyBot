function init() {
    OUTPUT_create();
    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;

    let opt = {};
    if (TTV_PROFILE_getCookieData())
        opt = { headers: { "Authorization": "Baerer " + TTV_PROFILE_getCookieData().id_token } };
    fetch("/api/Packages", opt)
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                ERROR_OUTPUT_showError("<b>INTERNAL ERROR:</b> " + json.err);
            } else {
                console.log(json.data);

                let state = showPackages(json.data.Packages);

                if (typeof (state) == "string") {
                    ERROR_OUTPUT_showError(state);
                } else if (state == false) {
                    document.getElementsByTagName("h1")[0].innerHTML = "<center>NO PACKAGES INSTALLED</center>";
                }
            }
        })
        .catch(err => {
            OUTPUT_showError(err);
            console.log(err);
        });
}

//V1
function initPackageGrid(packages) {
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

    let s = '<div class="package_index"><p>UID</p></div>';
    s += '<div class="package_name"><p>PACKAGE NAME</p></div>';
    s += '<div class="package_description"><p>DESCRIPTION</p></div>';
    s += '<div class="package_capabilities"><p>CAPABILITIES</p></div>';
    s += '<div class="package_settings"><p>SETTINGS</p></div>';
    
    //add Packages
    for (let pack in packages) {
        if (!packages[pack].UID || !packages[pack].Description || !packages[pack].Capabilities || !packages[pack].Settings) {
            continue;
        }

        s += '<div class="package_index">';
        s += '<p>' + packages[pack].UID + '</p></div>';

        s += '<div class="package_name">';
        
        if (packages[pack].Capabilities.HTML) {
            s += '<p><a href="' + packages[pack].Capabilities.HTML.html + '">' + pack + '</a></p>'
        } else {
            s += "<p>" + pack + "</p>";
        }

        s += '</div>';

        s += '<div class="package_description">';
        s += '<p>' + packages[pack].Description + '</p></div>';

        s += '<div class="package_capabilities">';
        s += createCapabalilitiesDiv(packages[pack].Capabilities) + '</div>';

        console.log(packages[pack]);

        if (packages[pack].Settings != undefined) {
            s += '<div class="package_settings"><div>' + (packages[pack].Settings.enabled == true ? '<p style="color: green;">ENABLED' : '<p style="red: green;">DISABLED') + '</p><p>IZ DA</p></div></div>';
        } else {
            s += '<div class="package_settings"><p>IZ NICH DA</p></div>';
        }
    }

    document.getElementById("content").innerHTML += '<div id="master">' + s + '</div>';
    return true;
}
function createCapabalilitiesDiv(caps) {
    let div = '<div>';


    for (let cap of Object.getOwnPropertyNames(caps)) {
        
        if (getIconForCapability(cap)) {
            div += '<img src="' + getIconForCapability(cap) + '"';

            if (caps[cap].title) {
                div += 'title="' + cap + ': ' + caps[cap].title + '"';
            } else {
                div += 'title="' + cap + '"';
            }

            div += '/>';
        }
    }

    div += '</div>'

    return div;
}
function getIconForCapability(name) {
    if (name == "HTML") {
        return "../images/icons/network.svg";
    } else if (name == "Overlay") {
        return "../images/icons/overlay.svg";
    } else if (name == "3rdPartyAPI") {
        return "../images/icons/API.png";
    } else if (name == "Chat") {
        return "../images/icons/chat.svg";
    } else if (name == "TwitchAPI") {
        return "../images/icons/twitch.svg";
    } else if (name == "Stats") {
        return "../images/icons/cup.svg";
    } else {
        console.log(name + " : No Icon found!");
        return null;
    }
}
function hasClass(x, testClass) {
    for (let cl of x.classList) {
        if (cl == "." + testClass || cl == testClass) {
            return true;
        }
    }
    return;
}


//V2
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
        s += '<div class="Package">';
        s += '<h2>' + pack + (packages[pack].html ? '<a href="' + packages[pack].html + '">< go to ></a>' : "") + '</h2>';
        s += '<p>' + packages[pack].description + '</p>';
        s += '</div>';
    }

    document.getElementById("InstalledPackages").innerHTML += s;
    return true;
}