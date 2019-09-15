const CONSTANTS = {
    API_PASSWORD: "1234",              //Api Password for Protected Access
    STATUS_SUCCESS: "SUCCESS",         //Indicades Successfull Api Request
    STATUS_FAILED: "FAILED",           //Indicades Failed Api Request
    UserLevel: {                       //Twitch User Levels
        Staff: 7,
        Admin: 6,
        Broadcaster: 5,
        Moderator: 4,
        VIP: 3,
        Subscriber: 2,
        Follower: 1,
        Regular: 0
    },
    NewTwitchAPI_TOKEN_IDENTIFIER: {    //Used in the New Twitch API Class to identify a API Endpoint to a Token Type
        AppAccess: 0,
        UserAccess: 1,
        IDAccess: 2
    }
};

module.exports = CONSTANTS;