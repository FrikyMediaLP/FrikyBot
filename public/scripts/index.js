function init() {
    OUTPUT_create();

    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;
    Bot_Status_Details_Settings.Use_Cookies = false;

    BOT_STATUS_DETAILS_NORMAL();
    
    let scheduled = false;

    if (NEWS_FEED_FETCH_Feed) {
        let div = document.createElement('DIV');
        div.id = 'NEWS_FEED_Feed';
        document.getElementById('content').insertBefore(div, document.getElementById('BOT_STATUS_DETAILS_NORMAL').nextSibling);

        let h2 = document.createElement('H2');
        h2.innerHTML = '<a href="/News">News</a> <span id="NEWS_SWITCH"><span>SCHEDULED</span><switchbutton id="NEWS_SWITCHER" value="true" onclick="news_switch(this);"></switchbutton></span>';
        document.getElementById('content').insertBefore(h2, document.getElementById('BOT_STATUS_DETAILS_NORMAL').nextSibling);
        
        NEWS_FEED_FETCH_Feed(null, "first=2" + (scheduled ? '' : '&end=' + Date.now()));
    }

    SWITCHBUTTON_AUTOFILL();

    //Authorization
    if (LOGIN_isLoggedIn() && USERLEVEL_INDEX(LOGIN_getCookies()['user']['user_level']) > USERLEVEL_INDEX('moderator')) {
        scheduled = getCookie('NEWSFEED_ALLOW_SCHEDULED') == 'true';
        SWITCHBUTTON_TOGGLE(document.getElementById('NEWS_SWITCHER'), scheduled);
        document.getElementById('NEWS_SWITCH').style.display = 'inline-block';
    }
}
function news_switch(elt) {
    if (elt.value) {
        NEWS_FEED_FETCH_Feed(null, "first=2");
    } else {
        NEWS_FEED_FETCH_Feed(null, "first=2&end=" + Date.now());
    }
    setCookie('NEWSFEED_ALLOW_SCHEDULED', elt.value);
}