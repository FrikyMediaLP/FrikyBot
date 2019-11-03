function setup() {
    noCanvas();

    fetch("/api/Packages")
        .then(data => data.json())
        .then(json => {

            console.log(json);

            initPackageGrid(json.data.Packages);
        })
        .catch(err => console.log(err));
}

function draw() {

}

function initPackageGrid(packages) {
    let master = select("#master");

    let s = '<div class="package_index"><p>UID</p></div>';
    s += '<div class="package_name"><p>PACKAGE NAME</p></div>';
    s += '<div class="package_description"><p>DESCRIPTION</p></div>';
    s += '<div class="package_capabilities"><p>CAPABILITIES</p></div>';
    s += '<div class="package_other"><p>SETTINGS</p></div>';

    let q = s;

    //add Packages
    for (let pack of Object.getOwnPropertyNames(packages)) {


        if (!packages[pack].UID || !packages[pack].Description || !packages[pack].Capabilities || !packages[pack].Settings) {
            continue;
        }

        q += '<div class="package_index">';
        q += '<p>' + packages[pack].UID + '</p></div>';

        q += '<div class="package_name">';
        
        if (packages[pack].Capabilities.HTML) {
            q += '<p><a href="' + packages[pack].Capabilities.HTML.html + '">' + pack + '</a></p>'
        } else {
            q += "<p>" + pack + "</p>";
        }

        q += '</div>';

        q += '<div class="package_description">';
        q += '<p>' + packages[pack].Description + '</p></div>';

        q += '<div class="package_capabilities">';
        q += createCapabalilitiesDiv(packages[pack].Capabilities) + '</div>';

        q += '<div class="package_other">';
        q += createOtherDiv(packages[pack]) + '</div>';
    }

    if (q == s) {
        //ERROR DIV
        master.html("<h3>SERVER ERROR</h3>");
    } else {
        master.html(q);
    }
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

function createOtherDiv(pack) {
    let div = '<div>';

    if (pack.Settings.enabled == true) {
        div += "ENABLED";
    } else {
        div += "DISABLED";
    }

    div += '<div class="enableButton" onclick="switchButton(this);"><div class="';

    if (pack.Settings.enabled == true) {
        div += 'enabled"';
    } else {
        div += 'disabled"';
    }

    div += '"><div class="'

    if (pack.Settings.enabled == true) {
        div += 'enabledBox"';
    } else {
        div += 'disabledBox"';
    }

    div += '"></div ></div ></div> <br />';

    if (pack.Capabilities.HTML) {
        div += '<a href = "' + pack.Capabilities.HTML.html + '"> Other Settings</a>';
    }
    
    div += '</div>';

    return div;
}

function switchButton(x) {

    //API REQUEST TO SWITCH



    //AFTER THAT CHANGE DISPLAY

    if (hasClass(x.children[0], "enabled") || hasClass(x.children[0], "enabledAni")) {
        x.children[0].classList.remove("enabled");
        x.children[0].children[0].classList.remove("enabledBox");

        x.children[0].classList.remove("enabledAni");
        x.children[0].classList.add("disabledAni");

        x.children[0].children[0].classList.remove("enabledAniBox");
        x.children[0].children[0].classList.add("disabledAniBox");

        x.parentElement.innerHTML = x.parentElement.innerHTML.replace("ENABLED", "DISABLED");
    } else {
        x.children[0].classList.remove("disabled");
        x.children[0].children[0].classList.remove("disabledBox");

        x.children[0].classList.remove("disabledAni");
        x.children[0].classList.add("enabledAni");
        
        x.children[0].children[0].classList.remove("disabledAniBox");
        x.children[0].children[0].classList.add("enabledAniBox");

        x.parentElement.innerHTML = x.parentElement.innerHTML.replace("DISABLED", "ENABLED");
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