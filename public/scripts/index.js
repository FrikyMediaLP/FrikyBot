function init() {
    OUTPUT_create();

    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;
    Bot_Status_Details_Settings.Use_Cookies = false;

    BOT_STATUS_DETAILS_NORMAL();

    NEWS_FEED_SETTINGS.reversed = true;
    NEWS_FEED_FETCH_Feed("latest", "first=2");

    let data = [
        {
            "type": "section",
            "name": "Main Navigation",
            "contents": [
                {
                    type: "icon", name: "Homepage", href: "/", icon: "images/icons/home.svg"
                }, {
                    type: "icon", name: "Commands", href: "/Commands", icon: "images/icons/command.svg"
                }
            ]
        }, {
            "type": "section",
            "name": "Packages",
            "contents": [
                {
                    type: "icon", name: "News", href: "/News", icon: "images/icons/newspaper-solid.svg"
                }, {
                    type: "icon", name: "More Packages", href: "/Packages", icon: "images/icons/packages.svg"
                }
            ]
        }, {
            "type": "section",
            "name": "Settings",
            "contents": [
                {
                    type: "icon", name: "Bot Details", href: "/Bot", icon: "images/icons/FrikyBot.png"
                }, {
                    type: "icon", name: "Options", href: "/Settings", icon: "images/icons/gear.svg"
                }, {
                    type: "icon", name: "Login", href: "/Login", icon: "images/icons/twitch.svg"
                }
            ]
        }, {
            "type": "section",
            "name": "Settings",
            "contents": [
                {
                    name: "Bot Details", href: "/Bot", icon: "images/icons/FrikyBot.png"
                }, {
                    name: "Options", href: "/Settings", icon: "images/icons/gear.svg"
                }, {
                    name: "Login", href: "/Login", icon: "images/icons/twitch.svg"
                }
            ]
        }, {
            "type": "section",
            "name": "Settings",
            "contents": [
                {
                    "type": "subsection",
                    "name": "Subber Sectioniro",
                    "expandable": true,
                    "expanded": true,
                    "contents": [
                        {
                            name: "Bot Status", href: "/#BOT_STATUS_DETAILS_NORMAL"
                        }, {
                            name: "News", href: "/#NEWS_FEED_Feed"
                        }
                    ]
                }
            ]
        }
    ];
}