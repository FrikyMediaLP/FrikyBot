function init() {
    OUTPUT_create();

    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;
    Bot_Status_Details_Settings.Use_Cookies = false;

    BOT_STATUS_DETAILS_NORMAL();
    
    SWITCHBUTTON_AUTOFILL();
    let scheduled = false;

    //Authorization
    if (LOGIN_isLoggedIn() && USERLEVEL_INDEX(LOGIN_getCookies()['user']['user_level']) > USERLEVEL_INDEX('moderator')) {
        scheduled = getCookie('NEWSFEED_ALLOW_SCHEDULED') == 'true';
        SWITCHBUTTON_TOGGLE(document.getElementById('NEWS_SWITCHER'), scheduled);
        document.getElementById('NEWS_SWITCH').style.display = 'inline-block';
    }

    NEWS_FEED_FETCH_Feed(null, "first=2" + (scheduled ? '' : '&end=' + Date.now() ));
}
function news_switch(elt) {
    if (elt.value) {
        NEWS_FEED_FETCH_Feed(null, "first=2");
    } else {
        NEWS_FEED_FETCH_Feed(null, "first=2&end=" + Date.now());
    }
    setCookie('NEWSFEED_ALLOW_SCHEDULED', elt.value);
}