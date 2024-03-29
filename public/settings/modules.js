async function Modules_init() {
	//Data
	try {
        let data = await FetchSettings();

        for (let module of data.Modules || []) {
            createModule(module);
        }

        for (let module of data.Unknown_Modules || []) {
            createUnknownModule(module);
        }

        UI_init(data.auto_detected.filter(elt => !data.Modules.find(elt2 => elt2.name === elt.name)));
    } catch (err) {
        console.log(err);
        OUTPUT_showError(err.message);
        return Promise.resolve();
	}
    
	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SECTION_MODULES').style.display = 'block';

    for (let elt of document.getElementsByClassName('STAT_ARRAY')) MISC_SELECT_WidthCheck(elt);
    SWITCHBUTTON_AUTOFILL();
    ScollToHash();
    OUTPUT_create();
}

async function FetchSettings() {
    return fetch("/api/pages/settings/modules", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        });
}
async function CONTROL_ACCESS(module_name, type, is_unknown) {
    let opt = getAuthHeader();
    let url = "/api/modules/control/" + type;

    if (type === 'add') {
        opt['method'] = 'POST';
        opt['headers']['Content-Type'] = 'application/json';
        opt['body'] = JSON.stringify({ module_name });
    } else if (type === 'remove') {
        url += "?module_name=" + module_name;
        url += "&is_unknown=" + is_unknown;
    } else{
        url += "?module_name=" + module_name;
    }

    return fetch(url, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json);
            }
        });
}

//UI
function UI_init(detected = []) {
    let names = [];
    for (let mdl of detected) names.push(mdl.name);
    names.push('Custom');
    names.push('Select Module');
    document.getElementById('UI').innerHTML = MISC_SELECT_create(names, names.length - 1, 'UI_SELECT', 'UI_selectChange()', '', '', true) + document.getElementById('UI').innerHTML;
    MISC_SELECT_WidthCheck(document.getElementById('UI_SELECT'));
}
function UI_selectChange() {
    let value = MISC_SELECT_GetValue(document.getElementById('UI_SELECT'));
    if (value === 'Custom') {
        document.getElementById('UI_TEXT_1').removeAttribute('hidden');
        document.getElementById('UI_ADD').setAttribute('disabled', 'true');
    }
    else {
        document.getElementById('UI_TEXT_1').value = "";
        document.getElementById('UI_TEXT_1').setAttribute('hidden', 'true');
        document.getElementById('UI_ADD').removeAttribute('disabled');
    }
}
function UI_input1Change(value) {
    if (value !== "") document.getElementById('UI_ADD').removeAttribute('disabled');
    else document.getElementById('UI_ADD').setAttribute('disabled', 'true');
}

//Module
function createModule(module) {
    if (!module) return;

    let is_enabled = module.enabled === true;

    let s = '<output id="OUTPUT_' + module.name + '"></output>';
    s += '<div class="Module ' + (module.ready ? (is_enabled ? 'ENABLED' : 'DISABLED') : 'NOTREADY') + '" id="MODULE_' + module.name + '">';

    let img = '../images/icons/packages.svg';

    //IMG
    s += '<div class="IMG"><img src="' + (module.picture || img) + '"/></div>';

    //Name
    s += '<div class="Name" onclick="window.location.hash = \'MODULE_' + module.name + '\'; ScollToHash();">' + module.name + '</div>';

    //Control
    s += '<div class="Control">' + createModuleControl(module) + '</div>';

    //Misc
    s += '<div class="Misc">' + createModuleMisc(module) + '</div>';

    s += '</div>';

    document.getElementById('MODULES').innerHTML += s;
}
function createModuleControl(module) {
    let s = "";
    
    s += '<center class="Status"></center>';
    s += '<button class="ENABLE" onclick="CONTROL_ENABLE(\'' + module.name + '\')"></button>';
    s += '<button class="REMOVE" onclick="CONTROL_REMOVE(\'' + module.name + '\')" ' + (module.ready === false ? 'disabled' : '') + '>REMOVE</button>';

    return s;
}
function createModuleMisc(module) {
    let s = "";

    s += '<div class="Desc">' + module.description + '</div>';

    s += '<div id="DISPLAY_' + module.name + '">' + createStats(module.displayables) + '</div>';

    s += createButtons(module);
    
    return s;
}

function createStats(displayables = []) {
    let s = "";

    s += '<div class="Chapter Displays">';
    s += '<p class="header">Stats</p>';

    let statts = '';
    for (let stat of displayables) {
        statts += '<div class="Stat">';
        statts += '<p>' + stat.name + '</p>';

        if (stat.value instanceof Array) {
            stat.value.splice(0, 0, 'All ' + stat.name);
            if (stat.value.length === 1) stat.value.push('None');
            statts += '<div>' + MISC_SELECT_create(stat.value, 0, '', '', 'STAT_ARRAY', '', true) + '</div>';
        } else {
            statts += '<span>' + stat.value + '</span>';
        }

        statts += '</div>';
    }
    if (statts === '') statts = '<p>None</p>';
    s += statts;
    
    s += '</div>';

    return s;
}
function createButtons(module) {
    let s = "";

    s += '<div class="Chapter Buttons">';
    s += '<p class="header">Controls</p>';

    s += '<div class="ButtonWrapper">';

    let btns = "";

    for (let controllable of module.controllables || []) {
        btns += '<button title="' + (controllable.title || controllable.name) + '" onclick="CONTROLS_CONTROLLABLE(' + "'" + module.name + "', '" + controllable.name + "'" + ')">' + controllable.title || controllable.name + '</button>';
    }

    if (btns === "") s += '<p>none</p>';
    else s += btns;
    
    s += '</div>';

    s += '</div>';
    
    return s;
}

//Control Buttons
function CONTROL_ENABLE(module_name) {
    let module_elt = document.getElementById('MODULE_' + module_name);

    const type = module_elt.classList.contains('ENABLED') ? 'stop' : 'start';
    if (!type) return;

    document.getElementById('content').classList.add('HALT');

    CONTROL_ACCESS(module_name, type)
        .then(json => {
            //Visual
            document.getElementById('content').classList.remove('HALT');
            module_elt.classList.remove('ENABLED');
            module_elt.classList.remove('DISABLED');
            module_elt.classList.remove('NOTREADY');
            module_elt.classList.add(json.status === false ? 'NOTREADY' : (json.enable ? 'ENABLED' : 'DISABLED'));
            
            //Output
            if (json.module_name === module_name && json.status === false)
                OUTPUT_showWarning('Module not ready, check setup settings!', document.getElementById('OUTPUT_' + module_name));
             else if (json.module_name === module_name && json.status === true)
                OUTPUT_showInfo('Module ' + (type === 'start' ? 'Enable' : 'Disable') + 'd!', document.getElementById('OUTPUT_' + module_name));
            else {
                return Promise.reject(new Error('Module ' + (type === 'start' ? 'Enable' : 'Disable') + ' Failed!'));
            }

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message, document.getElementById('OUTPUT_' + module_name));

            //Visuals
            document.getElementById('content').classList.remove('HALT');
        });
}
function CONTROL_REMOVE(module_name, is_unknown = false) {
    let module_elt = document.getElementById('MODULE_' + module_name);
    document.getElementById('content').classList.add('HALT');
    
    CONTROL_ACCESS(module_name, 'remove', is_unknown)
        .then(json => {
            //Visuals
            document.getElementById('content').classList.remove('HALT');

            //Output
            if (json.module_name === module_name && json.removed === 'success') {
                OUTPUT_showInfo((is_unknown ? 'Unknown ' : '') + 'Module Removed! Shutting down ... Restart requiered!', document.getElementById('OUTPUT_' + module_name));
                module_elt.remove();
            } else {
                return Promise.reject(new Error((is_unknown ? 'Unknown ' : '') + 'Module Remove Failed!'));
            }

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message, document.getElementById('OUTPUT_' + module_name));

            //Visuals
            document.getElementById('content').classList.remove('HALT');
        });
}
function CONTROL_ADD() {
    let module_name = document.getElementById('UI_TEXT_1').value || MISC_SELECT_GetValue(document.getElementById('UI_SELECT'));
    if (module_name === 'Custom') return;

    //Visuals
    document.getElementById('UI').classList.add('DISABLED');

    CONTROL_ACCESS(module_name, 'add')
        .then(json => {
            //Visuals
            document.getElementById('UI').classList.remove('DISABLED');

            //Output
            if (json.module_name === module_name && json.added === 'success') {
                OUTPUT_showInfo('Module Added! Shutting down ... Restart requiered!');
            } else {
                return Promise.reject(new Error('Adding Module Failed!'));
            }

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);

            //Visuals
            document.getElementById('UI').classList.remove('DISABLED');
        });
}
function CONTROLS_CONTROLLABLE(module_name, controllable_name) {
    let opts = getAuthHeader();
    opts['method'] = 'PUT';
    opts['headers']['Content-Type'] = 'application/json';
    opts['body'] = JSON.stringify({ module_name, controllable_name });

    fetch('/api/modules/control/ables', opts)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (typeof json === 'string') OUTPUT_showInfo(json);
            console.log(json);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//Unknown Modules
function createUnknownModule(name) {
    if (!name) return;
    if (document.getElementById('UNKNOWN_MODULES').innerHTML.trim() == '<span>NONE</span>') document.getElementById('UNKNOWN_MODULES').innerHTML = "";

    let s = '<span id="MODULE_' + name + '"';
    s += ' title="' + name + ' is an Unknown Module found in the Config, but Files are not found."';
    s += ' onclick="removeUnknown(event, \'' + name + '\')"';

    document.getElementById('UNKNOWN_MODULES').innerHTML += s + '>' + name + '<img src="../images/icons/trash-alt-solid.svg" title="Remove from Config." /></span>';
}
function removeUnknown(e, name) {
    if (e.target.tagName !== 'IMG') return;
    CONTROL_REMOVE(name, true);
}