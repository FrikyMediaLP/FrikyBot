async function init() {
    initProfile();
    updateNavi();
    //displayContent((await getBotData("/api/MessageDatabase/test")).data, "content");
    updateCharts();
}