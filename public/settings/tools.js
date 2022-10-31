const TOOLS = [
    {
        name: 'FRIKYBOT API VISUALISER',
        description: 'FrikyBot API Structure Visualized as a Tree spanning every API/Routing Endpoint as a Branch.',
        targetid: 'API_TREE_WRAPPER',
        init_func: (data) => {
            APITREE_INIT(data['api_tree'])
        }
    },
    {
        name: 'Twitch API Scopes Translation',
        description: 'Translate a list of Scope names and descriptions into usable formats.',
        targetid: 'TTV_SCOPES_TRANSLATOR_WRAPPER'
    },
    {
        name: 'RAW LOG VISUALIZER',
        description: 'Visualize a Raw Log File in a neat Table.',
        targetid: 'RAW_LOG_VISUALIZER',
        init_func: (data) => {
            let s = '<option hidden selected>Select Log File</option>';
            for (let elt of data['RAW_LOGS']) s += '<option>' + elt.split('.')[0] + '</option>';
            document.getElementById('RAW_LOG_VISUALIZER_SELECT').innerHTML = s;
        }
    },
    {
        name: 'Twitch Local Storage Emote History',
        description: 'Visualizes a Local Storage Dump of Emote Information from twitch.tv',
        targetid: 'TTV_LOCAL_STORAGE_VIS',
        init_func: (data) => {
            EVENTSUB_VISUALIZER_setup(data.EVENTSUBS);
        }
    },
    {
        name: 'Database Visualzier',
        description: 'Visualizes Database Data in a Grid Table.',
        targetid: 'DATABASE_VISUALIZER'
    },
    {
        name: 'EventSub Visualzier',
        description: 'Visualizes active EventSubs Data in a Grid Table.',
        targetid: 'EVENTSUB_VISUALIZER'
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

        for (let tool of TOOLS) {
            if (tool.init_func === undefined) continue;
            tool.init_func(data);
        }
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

//RAW LOG VISUALIZER
async function RAW_LOG_VISULIZER_SHOW(log_name) {
    if (log_name === 'Select Log File') return Promise.resolve();
    
    return fetch("/api/logger/raw?log_name=" + log_name, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {

            if (json.err) OUTPUT_showError(json.err);
            else {
                json.sort((a, b) => (document.getElementById('RAW_LOG_VISUALIZER_INVERT').checked ? -1 : 1) * (a.time - b.time));
                let options = {
                    headers: ['time', 'source', 'type', 'message'],
                    content_translation: {
                        type: (x) => '<b ' + x + '>' + x + '</b>'
                    },
                    timestamps: { time: 'other' }
                };
                document.getElementById('RAW_LOG_VISUALIZER_TABLE').innerHTML = MISC_createTable(json, options);
            }
        })
}

//TTV VIZ
function TTV_LOCAL_STORAGE_VIS_CONVERT(str) {
    try {
        let json = JSON.parse(str);

        let emotes = [];
        let total = 0;
        for (let idx in json) {
            let emote = json[idx];
            emotes.push({ token: emote.emote.token, id: emote.emote.id, uses: emote.uses });
            total += emote.uses;
        }
        
        let s = "<ol>";
        for (let emote of emotes.sort((a,b) => b.uses - a.uses )) {
            s += '<li><img src="https://static-cdn.jtvnw.net/emoticons/v2/' + emote.id + '/default/dark/1.0" /><div><span title="' + emote.id + '">' + emote.token + '</span></div> <div><span style="text-align:right; width: 100%; display: inline-block;">' + emote.uses + '</span></div></li>';
        }
        s += '</ol>';
        document.getElementById('TTV_LOCAL_STORAGE_VIS_OUT').innerHTML = s;
        document.getElementById('TTV_LOCAL_STORAGE_VIS_IN_AREA').innerHTML = JSON.stringify(json, null, 4);
        document.getElementById('TTV_LOCAL_STORAGE_VIS_TOTAL').innerHTML = "Total Emotes Used: " + total + ' from ' + emotes.length + ' unique';

        OUTPUT_hideError();
    } catch (err) {
        console.log(err);
        OUTPUT_showError('JSON not valid!');
        document.getElementById('TTV_LOCAL_STORAGE_VIS_OUT').innerHTML = "";
        document.getElementById('TTV_LOCAL_STORAGE_VIS_TOTAL').innerHTML = "";
        return;
    }
}

//DATABASE VISUALIZER VIZ
function DATABASE_VISUALIZER_CONVERT(str) {
    let arr = [];

    for (let elt of str.split("\n")) {
        if (elt === "") continue;
        try {
            arr.push(JSON.parse(elt));
        } catch (err) {
            console.log(elt);
            console.log(err);
        }
    }

    const options = {

    };

    document.getElementById('DATABASE_VISUALIZER_OUT').innerHTML = MISC_createTable(arr || [], options);
}

//EVENTSUB VISUALIZER
function EVENTSUB_VISUALIZER_setup(arr = []) {
    document.getElementById('EVENTSUB_VISUALIZER_TABLE').innerHTML = MISC_createTable(arr, { headers: ['type', 'version', 'condition', 'created_at', 'cost'], timestamps: { created_at: 'relative' } });
}