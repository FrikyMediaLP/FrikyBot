const CONSTANTS = {
    API_PASSWORD: "1234",              //Api Password for Protected Access
    STATUS_SUCCESS: "SUCCESS",         //Indicades Successfull Api Request
    STATUS_FAILED: "FAILED",           //Indicades Failed Api Request
    UserLevel: {                       //Twitch User Levels
        Admin: 10,
        Staff: 9,
        Broadcaster: 8,
        Global_Mod: 7,
        Moderator: 7,
        VIP: 6,
        Founder: 5,
        Subscriber: 4,
        Partner: 3,
        Other: 2,
        Follower: 1,
        Regular: 0
    },
    NewTwitchAPI_TOKEN_IDENTIFIER: {    //Used in the New Twitch API Class to identify a API Endpoint to a Token Type
        AppAccess: 0,
        UserAccess: 1,
        IDAccess: 2
    },
    BADGES: {

    }
};

module.exports = CONSTANTS;