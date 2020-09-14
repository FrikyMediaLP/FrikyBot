/* -------------------------------------
 *          NEEDED HTML CODE
 * -------------------------------------
 * 
 * 
 *  <div id="BOT_STATUS_DETAILS_NORMAL">
        
    </div>
 *
 *  <div id="BOT_STATUS_DETAILS_MINI">

    </div>
 * -------------------------------------
 *             API ENDPOINT
 * -------------------------------------
 *  GET : /api/BotStatus
 *   returns:   {
                    Status: {
                        status: "Operational",
                        errors: {
                            fatal: {

                            },
                            outage: {

                            }
                        }
                    },
                    Username: "",
                    Channel: "",
                    Description: "",
                    Type: "",
                    Image: ""
                };
 * 
 * -------------------------------------
 *         ADDITIONAL FETURES
 * -------------------------------------
 *    - Uses ErrorOutput.js
 *          -> set Output Function to Bot_Status_Details_Settings.ErrorOutput
 *          
 *    - Uses Cookies
 *          -> Saves Data in Cookies to speed up Page Loading (Session Only)
 *          -> REQUIRES standard.js AND Cookie confirmation
 */

let Bot_Status_Details_Settings = {
    ErrorOutput: console.error,
    Use_Cookies: true
};

//Fetch
async function Bot_Status_Details_Fetch() {
    return fetch("/api/BotStatus")
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                if (Bot_Status_Details_Settings.Use_Cookies)
                    BOT_STATUS_DETAILS_updateCookies(json);
                return Promise.resolve(json);
            }
        })
        .catch(err => {
            return Promise.reject(new Error(err));
        });
}

//Fetch + Create
async function BOT_STATUS_DETAILS_NORMAL() {
    if (document.getElementById("BOT_STATUS_DETAILS_NORMAL")) {
        if (Bot_Status_Details_Settings.Use_Cookies) {
            let dta = BOT_STATUS_DETAILS_getCookiesData();
            if (dta) {
                BOT_STATUS_DETAILS_createNormal(dta);
                return;
            }
        }

        //Init if not present
        BOT_STATUS_DETAILS_createNormal(null);

        return Bot_Status_Details_Fetch()
            .then(data => {
                BOT_STATUS_DETAILS_createNormal(data);
                return Promise.resolve();
            })
            .catch(err => {
                Bot_Status_Details_Settings.ErrorOutput(err.message);
                return Promise.reject(err);
            });
    }
}
async function BOT_STATUS_DETAILS_MINI() {
    if (document.getElementById("BOT_STATUS_DETAILS_MINI")) {
        if (Bot_Status_Details_Settings.Use_Cookies) {
            let dta = BOT_STATUS_DETAILS_getCookiesData();
            if (dta && dta.updated_at && dta.updated_at + 1000 * 60 * 1 > Date.now()) {
                BOT_STATUS_DETAILS_createMini(dta);
                return;
            } else {
                BOT_STATUS_DETAILS_resetCookiesData();
            }
        }

        //Init if not present
        BOT_STATUS_DETAILS_createMini(null);

        return Bot_Status_Details_Fetch()
            .then(data => {
                BOT_STATUS_DETAILS_createMini(data);
                return Promise.resolve();
            })
            .catch(err => {
                Bot_Status_Details_Settings.ErrorOutput(err.message);
                return Promise.reject(err);
            });
    }
}

//Create only
function BOT_STATUS_DETAILS_createNormal(data) { 
    if (document.getElementById("BOT_STATUS_DETAILS_NORMAL") && !document.getElementById("Bot_Status_Detail_Username")) {
        let s = '<div id="top"><div id="left"><div class="Detail"><p class="top">BOT USERNAME</p><p class="bottom" id="Bot_Status_Detail_Username">- - - - -</p></div><br /><div class="Detail"><p class="top">CURRENT CHANNEL</p>';
        s += '<p class="bottom" id="Bot_Status_Detail_Channel">- - - - -</p></div><br /><div class="Detail">';
        s += '<p class="top">BOT USER DESCRIPTION</p><p class="bottom" id="Bot_Status_Detail_Description">- - - - -</p></div></div><div id="right"><img id="Bot_Status_Detail_Image" src="images/no_image_found.png" /></div></div>';
        s +=  '<div id="bottom"><p style="grid-area: title;"><b>STATUS</b></p><p id="Bot_Status_Bar_Title" style="grid-area: value; text-align: right;">-</p><div id="Bot_Status_Bar"><center>-</center><span id="Info">NO DATA FETCHED</span></div></div>';
        document.getElementById("BOT_STATUS_DETAILS_NORMAL").innerHTML = s;
        BOT_STATUS_DETAILS_createNormal(data);
    } else if (document.getElementById("BOT_STATUS_DETAILS_NORMAL") && data) {
        if (data.Username) {
            document.getElementById("Bot_Status_Detail_Username").innerHTML = data.Username;

            if (data.Type == "affiliate") {
                document.getElementById("Bot_Status_Detail_Username").innerHTML += " ✔";
            } else if (data.Type == "partner") {
                document.getElementById("Bot_Status_Detail_Username").innerHTML += " ✅";
            }
        }

        if (data.Channel)
            document.getElementById("Bot_Status_Detail_Channel").innerHTML = data.Channel;
        if (data.Description)
            document.getElementById("Bot_Status_Detail_Description").innerHTML = data.Description;
        if (data.Image)
            document.getElementById("Bot_Status_Detail_Image").src = data.Image;

        let s = '<center>-</center>';
        s += '<span id="Info">';
        s += '<span id="tip"></span>NO DATA FETCHED</span> ';

        if (data.Status && data.Status.status) {

            if (data.Status.errors && data.Status.errors.fatal && data.Status.errors.outage) {
                let fatals = Object.getOwnPropertyNames(data.Status.errors.fatal).length;
                let outes = Object.getOwnPropertyNames(data.Status.errors.outage).length;


                s = '<center>' + (fatals == 0 && outes > 0 ? (outes + " OUTAGES") : ((fatals + outes) + " ERRORS")) + '</center>';
                s += '<span id="Info">';
                s += '<span id="tip"></span>';
                s += fatals + ' Fatal Errors occured: <br />';

                if (fatals > 0) {
                    for (let fat in data.Status.errors.fatal) {
                        s += ' - ' + fat + ' : ' + data.Status.errors.fatal[fat] + ' <br />';
                    }
                } else {
                    s += ' - <br />';
                }

                s += outes + '  Outages occured: <br />';

                if (outes > 0) {
                    for (let out in data.Status.errors.outage) {
                        s += ' - ' + out + ' : ' + data.Status.errors.outage[out] + ' <br />';
                    }
                } else {
                    s += ' - <br />';
                }

                s += '</span> ';
            }

            document.getElementById("Bot_Status_Bar_Title").innerHTML = data.Status.status;

            document.getElementById("Bot_Status_Bar_Title").style.color = BOT_STATUS_DETAILS_gerColoredStatus(data.Status.status);
            document.getElementById("Bot_Status_Bar").style.backgroundColor = BOT_STATUS_DETAILS_gerColoredStatus(data.Status.status);
        } else {
            document.getElementById("Bot_Status_Bar_Title").style.color = "gray";
            document.getElementById("Bot_Status_Bar").style.backgroundColor = "gray";
        }

        document.getElementById("Bot_Status_Bar").innerHTML = s;
    }
}
function BOT_STATUS_DETAILS_createMini(data) {
    if (document.getElementById("BOT_STATUS_DETAILS_MINI") && !document.getElementById("BOT_STATUS_DETAILS_STATUS")) {
        let s = '<span>Status: </span> <a href="Bot" id="BOT_STATUS_DETAILS_STATUS">-</a><div>';
        s += '<img id="BOT_STATUS_DETAILS_MINI_IMG" src="images/no_image_found.png"/>';
        s += '<div id="BOT_STATUS_DETAILS_MINI_TEXT">-</div></div>';

        document.getElementById("BOT_STATUS_DETAILS_MINI").innerHTML = s;
        BOT_STATUS_DETAILS_createMini(data);
    } else if (document.getElementById("BOT_STATUS_DETAILS_MINI") && data) {
        let text = '';
        let head = '-';
        let title = '';

        if (data.Status && data.Status.errors && data.Status.errors.fatal && Object.getOwnPropertyNames(data.Status.errors.fatal).length > 0) {
            head = '<p>ERROR MESSAGE</p>';
            title = Object.getOwnPropertyNames(data.Status.errors.fatal)[0] + " - " + data.Status.errors.fatal[Object.getOwnPropertyNames(data.Status.errors.fatal)[0]];
            text = '<p style="cursor: help;" title="' + title + '">' + title + '</p>';
        } else if (data.Status && data.Status.errors && data.Status.errors.outage && Object.getOwnPropertyNames(data.Status.errors.outage).length > 0) {
            head = '<p>ERROR MESSAGE</p>';
            title = Object.getOwnPropertyNames(data.Status.errors.outage)[0] + " - " + data.Status.errors.outage[Object.getOwnPropertyNames(data.Status.errors.outage)[0]];
            text = '<p style="cursor: help;" title="' + title + '">' + title + '</p>';
        } else if (data.Username) {
            head = '<p>USERNAME</p>';
            text = '<p>' + data.Username + '</p>';
        }

        document.getElementById("BOT_STATUS_DETAILS_MINI_TEXT").innerHTML = head + text;

        if (data.Image)
            document.getElementById("BOT_STATUS_DETAILS_MINI_IMG").src = data.Image;
        if (data.Status && data.Status.status) {
            document.getElementById("BOT_STATUS_DETAILS_STATUS").innerHTML = data.Status.status;
            document.getElementById("BOT_STATUS_DETAILS_STATUS").style.color = BOT_STATUS_DETAILS_gerColoredStatus(data.Status.status);
        }
    }
}

function BOT_STATUS_DETAILS_gerColoredStatus(status) {
    if (status == "Operational") {
        return "#43b581";
    } else if (status == "Outages") {
        return "#ffcc80";
    } else if (status == "Fatal") {
        return "#ff6666";
    }
}

//Cookies
function BOT_STATUS_DETAILS_resetCookiesData() {
    removeCookie("BOT_STATUS_DETAILS", true);
}
function BOT_STATUS_DETAILS_updateCookies(data) {
    if (COOKIE_ACCEPT) {
        data.updated_at = Date.now();
        setCookie("BOT_STATUS_DETAILS", JSON.stringify(data), true);
    }
}
function BOT_STATUS_DETAILS_getCookiesData() {
    if (COOKIE_ACCEPT) {
        try {
            return JSON.parse(getCookie("BOT_STATUS_DETAILS", true));
        } catch{
            return null
        }
    } else {
        return null;
    }
}