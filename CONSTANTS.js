let CONSTANTS = {
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
    }
};

module.exports = CONSTANTS;