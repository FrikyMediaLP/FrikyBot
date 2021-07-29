const TOOLS = [
    {
        name: 'FRIKYBOT API VISUALISER',
        description: 'FrikyBot API Structure Visualized as a Tree spanning every API/Routing Endpoint as a Branch.',
        targetid: 'API_TREE_WRAPPER'
    },
    {
        name: 'Twitch API Scopes Translation',
        description: 'Translate a list of Scope names and descriptions into usable formats.',
        targetid: 'TTV_SCOPES_TRANSLATOR_WRAPPER'
    },
    {
        name: 'Config JSON Modifier',
        description: 'SoonTM'
    },
    {
        name: 'HTML Template',
        description: 'SoonTM'
    },
    {
        name: 'Color Palettes',
        description: 'SoonTM'
    },
    {
        name: 'Grid Layout Customizer',
        description: 'SoonTM'
    },
    {
        name: 'Module Template',
        description: 'SoonTM'
    },
    {
        name: 'Package Template',
        description: 'SoonTM'
    }
];

async function Tools_init() {
	//Data
	try {
		let data = await FetchSettings();

        APITREE_INIT(data['api_tree']);
    } catch (err) {
        OUTPUT_showError(err.message);
        return Promise.resolve();
    }

    UI_createList(TOOLS);

	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('TOOLS').style.display = 'block';
}

async function FetchSettings() {
    return fetch("/api/pages/settings/tools", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}

//UI
function UI_createList(tools = []) {
    let s = "";
    for (let tool of tools) {
        s += createToolButton(tool.name, tool.description, tool.targetid);
    }
    document.getElementById("TOOL_SELECT").innerHTML = s;
}
function createToolButton(name = "TOOL NAME HERE", description = "TOOL DESCRIPTION TEXT HERE", targetid) {
    let s = '';

    s += '<div class="TOOL" ' + (targetid !== undefined ? 'data-targetid="' + targetid + '"' : '') + ' >';

    s += '<center class="header">' + name + '</center>';

    s += '<div class="desc">';
    s += '<center>' + description + '</center>';
    s += '</div>';

    s += '</div>';

    return s;
}
function UI_CLICK(e) {
    let toolElt = e.target;

    while (!toolElt.classList.contains('TOOL')) {
        toolElt = toolElt.parentElement;
        if (toolElt.tagName === 'BODY') return;
    }

    if (!toolElt.dataset.targetid) return;

    document.getElementById('TOOL_SELECT').style.display = 'none';
    document.getElementById('TOOL_BACK').style.display = 'inline-block';

    document.getElementById(toolElt.dataset.targetid).style.display = 'block';
}
function UI_BACK() {
    for (let elt of document.getElementsByClassName('TOOL_CONTENT')) {
        if (elt.style.display === 'block') toolElt = elt;
    }

    document.getElementById('TOOL_SELECT').style.display = 'grid';
    document.getElementById('TOOL_BACK').style.display = 'none';

    toolElt.style.display = 'none';
}

//API TREE
function APITREE_INIT(api_tree = {}) {
    let s = '';
    for (let router in api_tree) {
        s += '<h3>' + router + '</h3>';
        s += createTree(api_tree[router].tree);
    }
    document.getElementById('API_TREE').innerHTML = s;
}
function createTree(tree) {
    let s = "";

    s += '<ul>';

    for (let layer in tree) {
        s += '<li>' + layer + '</li>';

        s += '<ul>';
        if (tree[layer].mount !== undefined) {
            s += '<li>' + (tree[layer].name || tree[layer].type || tree[layer].mount) + (tree[layer].methods ? ' - <b>' + Object.getOwnPropertyNames(tree[layer].methods)[0].toUpperCase() + '</b>': '') + '</li>';
        } else if (tree[layer] instanceof Array) {
            for (let sub of tree[layer]) {
                s += '<li>' + (sub.name || sub.type || sub.mount) + '</li>';
            }
        } else if (tree[layer] instanceof Object) {
            s += createTree(tree[layer]);
        }
        s += '</ul>';
    }
    
    s += '</ul>';

    return s;
}

//Twitch API Scopes Translation
function TTV_Scopes_Translation_add(name = "", desc = "") {
    let div = document.createElement('DIV');
    div.innerHTML = '<input type="text" autocomplete="stooop" value="' + name + '" placeholder="name" oninput="TTV_Scopes_Translation_update()"/><input type="text" autocomplete="stooop" value="' + desc + '" placeholder="description" oninput="TTV_Scopes_Translation_update()"/><button onclick="TTV_Scopes_Translation_remove(this)">remove</button>';
    document.getElementById('TTV_SCOPES_TRANSLATOR_editor').appendChild(div);
}
function TTV_Scopes_Translation_remove(elt) {
    elt.parentElement.remove();
}
function TTV_Scopes_Translation_update() {
    let arr = [];

    for (let div of document.getElementById('TTV_SCOPES_TRANSLATOR_editor').childNodes) {
        if (div instanceof Element && div.tagName === 'DIV') {
            let inputs = HTMLArray2RealArray(div.childNodes).filter(elt => elt instanceof Element);
            if (inputs[0].value && inputs[1].value) arr.push({ name: inputs[0].value, description: inputs[1].value });
        }
    }

    //SERVER
    let prev_1 = {};
    for (let scope of arr) {
        prev_1[scope.name] = scope.description;
    }
    document.getElementById('TTV_SCOPES_TRANSLATOR_prev_1').childNodes[3].value = JSON.stringify(prev_1, null, 4);

    let prev_2 = {};

    try {
        prev_2 = JSON.parse(document.getElementById('TTV_SCOPES_TRANSLATOR_prev_2').childNodes[3].value);
    } catch (err) {
        prev_2 = {};
    }

    for (let scope of arr) {
        prev_2[scope.name] = {
            desc: scope.description,
            enabled: (prev_2[scope.name] || {}).enabled || true,
            state: (prev_2[scope.name] || {}).state || false
        };
    }
    document.getElementById('TTV_SCOPES_TRANSLATOR_prev_2').childNodes[3].value = JSON.stringify(prev_2, null, 4);
}
function TTV_Scopes_Translation_update_prev1(elt) {
    try {
        let json = JSON.parse(elt.value);

        for (let key in json) {
            TTV_Scopes_Translation_add(key, json[key]);
        }

        TTV_Scopes_Translation_update();
    } catch (err) {

    }
}
function TTV_Scopes_Translation_update_prev2(elt) {
    try {
        let json = JSON.parse(elt.value);

        for (let key in json) {
            TTV_Scopes_Translation_add(key, json[key].desc);
        }
        TTV_Scopes_Translation_update();
    } catch (err) {

    }
}