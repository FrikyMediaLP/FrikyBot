//Paths relative to the main rep
const CONSTANTS = {
    FRIKYBOT_FILESTRUCTURE: {

    },
    DEFAULT_CONFIG_FILE_PATH: "config.json",
    PACKAGES_INSTALL_ROOT: "Packages/",
    UTIL_INSTALL_ROOT: "UTIL/",
    ThirdrdPary_INSTALL_ROOT: "3rdParty/",
    DATA_STORAGE_ROOT: "DATA/",
    Static_Hosting_ROOT: "public/",
    STATUS_SUCCESS: "SUCCESS",         //Indicades Successfull Api Request
    STATUS_FAILED: "FAILED",           //Indicades Failed Api Request
    Package_Status: ["Operational", "Outages", "Fatal"],
    TTV_API_ROOT_URL: "https://api.twitch.tv/helix",
    TTV_API_ACCESS_TOKEN_TYPES: {
        ANY_TOKEN: 0,
        APP_ACCESS: 1,
        USER_ACCESS: 2
    },
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