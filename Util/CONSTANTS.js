//Paths relative to the main rep
const CONSTANTS = {
    MODULE_BOOT_ORDER: ['WebApp', 'TwitchIRC', 'TwitchAPI'],
    FILESTRUCTURE: {
        CONFIG_FILE_PATH: "config.json",
        PACKAGES_INSTALL_ROOT: "Packages/",
        MODULES_INSTALL_ROOT: "Modules/",
        UTIL_INSTALL_ROOT: "UTIL/",
        ThirdrdPary_INSTALL_ROOT: "3rdParty/",
        DATA_STORAGE_ROOT: "DATA/",
        PUBLIC_ROOT: "public/"
    },
    Package_Status: ["Operational", "Outages", "Fatal"],
    UserLevel: {                       //Twitch User Levels
        broadcaster: 7,
        admin: 6,
        staff: 6,
        global_mod: 6,
        moderator: 6,
        vip: 5,
        founder: 4,
        subscriber: 3,
        partner: 2,
        other: 1,
        follower: 1,
        regular: 0
    }
};

module.exports = CONSTANTS;