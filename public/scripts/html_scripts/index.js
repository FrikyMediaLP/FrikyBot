async function init() {
    initProfile();
    updateNavi();
    //displayContent((await getBotData("/api/MessageDatabase/test")).data, "content");
    updateCharts();

    fillTop([{ name: "FrikyBot", value: 9658 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }, { name: "FrikyBot", value: 9657 }], "TopChatters");
    fillTop([{ name: "PogChamp", value: 9658 }, { name: "LUL", value: 9657 }, { name: "LUL", value: 9657 }, { name: "LUL", value: 9657 }, { name: "LUL", value: 9657 }], "TopEmotes");
    fillTop([{ name: "!zeit", value: 9658 }, { name: "!modonly", value: 9657 }, { name: "LUL", value: 9657 }], "TopCommands");

    fillCardSelection([{ name: "DAMAGE", value: 45976854 }, { name: "ROCT", value: "IST RICHTIG NICE!" }, { name: "ROCT", value: "IST RICHTIG NICE!" }, { name: "ROCT", value: "IST RICHTIG NICE!" }], "CardSelection1");

    updateViewerCurve(["EINS", "ZWEI", "DREI", "VIER"], [15, 2, 3, 3]);
}

function fillTop(data, parent) {
    let htmlString = "";

    for (let i = 0; i < data.length; i++) {
        htmlString += '<div id="Index">' + (i + 1) + '</div>';
        htmlString += '<div id="Name">' + data[i].name + '</div>';
        htmlString += '<div id="Value">' + data[i].value + '</div>';
    }

    document.getElementById(parent).innerHTML = htmlString;
}
function fillCardSelection(data, parent) {
    let htmlString = "";

    for (let i = 0; i < data.length; i++) {
        htmlString += '<div class="Card">';
        htmlString += '<center>' + data[i].name + '</center>';
        htmlString += '<center>' + data[i].value +'</center>';
        htmlString += '</div>';
    }

    document.getElementById(parent).innerHTML = htmlString;
} 

function updateViewerCurve(labels, data) {
    fillInCharts["viewerCurve"] = new Chart("viewerCurve", {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views per Stream',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}