function init() {
    OUTPUT_create();

    Bot_Status_Details_Settings.ErrorOutput = OUTPUT_showError;
    Bot_Status_Details_Settings.Use_Cookies = false;

    BOT_STATUS_DETAILS_NORMAL();

    NEWS_FEED_SETTINGS.reversed = true;
    NEWS_FEED_FETCH_Feed("latest", "first=2");
}