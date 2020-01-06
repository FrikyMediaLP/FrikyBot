let fillInCharts = {

};

//Update
async function getBotData(endpoint, options) {
    let data = null;
    if (options) {
        data = await fetch(endpoint, options);
    } else {
        data = await fetch(endpoint);
    }

    return await data.json();
}
function updateNavi(data) {
    if (!data)
        return;

    //Top1
    document.getElementById("Top1").href = (data.Top1 ? "../Stats/User?name=" + data.Top1 : "");
    document.getElementById("Top1").innerHTML = "<div><center>" + (data.Top1 ? data.Top1 : "TOP1") + "</center></div>";

    //Top2
    document.getElementById("Top2").href = (data.Top2 ? "../Stats/User?name=" + data.Top2 : "");
    document.getElementById("Top2").innerHTML = "<div><center>" + (data.Top2 ? data.Top2 : "TOP2") + "</center></div>";

    //Top3
    document.getElementById("Top3").href = (data.Top3 ? "../Stats/User?name=" + data.Top3 : "");
    document.getElementById("Top3").innerHTML = "<div><center>" + (data.Top3 ? data.Top3 : "TOP3") + "</center></div>";

    //Top4
    document.getElementById("Top4").href = (data.Top4 ? "../Stats/User?name=" + data.Top4 : "");
    document.getElementById("Top4").innerHTML = "<div><center>" + (data.Top4 ? data.Top4 : "TOP4") + "</center></div>";

    //Top5
    document.getElementById("Top5").href = (data.Top5 ? "../Stats/User?name=" + data.Top5 : "");
    document.getElementById("Top5").innerHTML = "<div><center>" + (data.Top5 ? data.Top5 : "TOP5") + "</center></div>";
}

//Create Content
function displayContent(data, parentID) {
    console.log(data);
    let content = "";
    
    console.log(content);

    if (content != "") {
        document.getElementById(parentID).innerHTML = content;
    } else
        showNoData();
}
function showNoData() {
    document.getElementById("content").innerHTML = '<div id="NoData"><center>NO DATA FOUND</center></div>';
}

//Charts
function initCharts() {

}
function updateCharts() {

}