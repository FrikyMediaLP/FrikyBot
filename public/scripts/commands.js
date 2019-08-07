let biggestIDX = 0;

function setup() {
    noCanvas();

    loadCommands();
}

function draw() {

}

function loadCommands() {
    let data = {
        Authentication: "1234"
    };


    let req = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };

    fetch("/api/bot/reload-commands", req)
        .then(response => response.json())
        .then(json => {
            console.log(json);

            if (!json.data || json.err) {
                select('#content').html("<div style='text-align: center; color: grey; padding: 3px;'>Ein Fehler ist aufgetreten</div>");
                return;
            }

            if (json.data.length == 0) {
                select('#content').html("<div style='text-align: center; color: grey; padding: 3px;'>Keine Commands gefunden</div>");
            } else {

                select('#content').html("<div id='row'><div id='command_index'><p>UID</p></div><div id='command_name'><p>Name</p></div><div id='command_description'><p>Description</p></div></div>");

                for (let command of json.data) {
                    createCommand(command).parent(select('#content'));
                }
            }

            ajustGrid();
        })
        .catch(err => console.log(err));
}

function createCommand(command) {
    let div = createDiv("");
    div.class("row");
    
    let idDiv = createDiv("<p>" + command.uid + "</p>");
    idDiv.class("command_index");
    idDiv.parent(div);
    
    if (biggestIDX < idDiv.child()[0].offsetWidth) {
        biggestIDX = idDiv.child()[0].offsetWidth;
    }

    let nameDiv = createDiv("<p>" + command.prefix + command.name + "</p>");
    nameDiv.class("command_name");
    nameDiv.parent(div);

    let descDiv = createDiv("<p>" + command.output_string + "</p>");
    descDiv.class("command_description");
    descDiv.parent(div);

    return div;
}

function ajustGrid() {

    if (select("#row")) {

        select("#row").style('grid-template-columns', (biggestIDX + 10) + 'px 100px auto');

        for (let row of selectAll(".row")) {
            row.style('grid-template-columns', (biggestIDX + 10) + 'px 100px auto');
        }
    }
}