let biggestIDX = 0;
let errorDiv = "<div style='text-align: center; color: grey; padding: 3px;'>An error has occurred</div>";
let variableDiv = "<div style='text-align: center; color: grey; padding: 3px; border-top: 1px solid gray'>Checkout <a href='/Commands/Variables' style='text-decoration: none; color:blue;'>Command Variables</a> for more Features</div>";

function setup() {
    noCanvas();

    loadCommands();
}

function draw() {

}

function loadCommands() {
    fetch("/api/CommandHandler/Commands")
        .then(response => response.json())
        .then(json => {
            console.log(json);

            if (!json.data || json.err || !json.data.Hardcoded || !json.data.Custom) {
                select('#master').html(errorDiv + variableDiv);
                return;
            }

            if (json.data.Hardcoded.length == 0 && json.data.Custom.length == 0) {
                select('#master').html("<div style='text-align: center; color: grey; padding: 3px;'>No Commands found!</div>" + variableDiv);
            } else {

                select('#master').html("<div id='row'><div id='command_index'><p>UID</p></div><div id='command_name'><p>Name</p></div><div id='command_description'><p>Description</p></div></div>");

                for (let command of json.data.Hardcoded) {
                    createCommand(command).parent(select('#master'));
                }

                for (let command of json.data.Custom) {
                    createCommand(command).parent(select('#master'));
                }

                select('#master').html(select('#master').html() + variableDiv);
            }

            ajustGrid();
        })
        .catch(err => {
            console.log(err);
            select('#master').html(errorDiv + variableDiv);
        });
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