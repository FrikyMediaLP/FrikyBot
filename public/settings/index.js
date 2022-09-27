const CORE_MODULES = ['WebApp', 'TwitchIRC', 'TwitchAPI'];
const WIP_MODULES = [];

async function Control_init() {
	//Data
	try {
        let data = await FetchSettings();

        for (let module of data.Modules) createModule(module);
        for (let module of CORE_MODULES.filter(elt => data.Modules.find(elt2 => elt === elt2.name) === undefined)) createModule({ name: module, installed: false });

        for (let package of data.Packages.sort((a,b) => sortEnabled(a, b, -1))) createPackage(package);
    } catch (err) {
        OUTPUT_showError(err.message);
        return Promise.resolve();
	}

	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('DASHBOARD').style.display = 'block';
}

async function FetchSettings() {
    return fetch("/api/pages/settings/dashboard", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}

//Modules
function createModule(module) {
    let s = '';

    s += '<div class="Module ' + (WIP_MODULES.find(elt => elt === module.name) ? 'WIP' : '') + '" id="Module_' + module.name + '" ' + (module.installed === false ? '' : 'installed ' + (module.ready ? (module.enabled ? '' : 'disabled') : 'notready')) + '>';

    s += '<span class="hdr">' + module.name + '</span>';

    s += '<div class="ctrl">';

    if (module.installed === false) s += '<a href="settings/setup" style="margin-left: 35px;">install</a>';
    else {
        for (let controllable of module.controllables || []) {
            s += '<button title="' + (controllable.title || controllable.name) + '" onclick="CONTROLS_CONTROLLABLE(true, ' + "'" + module.name + "', '" + controllable.name + "'" + ')">' + controllable.title || controllable.name + '</button>';
        }
    }

    s += '</div>';

    s += '<div class="misc">';

    if ((module.displayables || []).length === 0) s += '<span style="text-align: right;">NO STATS AVAILABLE</span>';
    for (let i = 0; i < 5 && i < (module.displayables || []).length; i++) {
        let stat = module.displayables[i];
        s += '<span>' + stat.name + ':</span><span style="text-align: right;">' + ColorValue(stat.value, stat.name) + '</span>';
    }

    s += '</div>';
    
    s += '</div>';

    document.getElementById('Modules').innerHTML += s;
}
function updateModule(module) {
    let elt = document.getElementById('Module_' + module.name);
    if (!elt) return;

    let ctrl;
    let misc;

    //Get Child Elements
    for (let child of elt.childNodes) {
        if (child instanceof Element && child.classList.contains('ctrl')) {
            ctrl = child;
        } else if (child instanceof Element && child.classList.contains('misc')) {
            misc = child;
        }
    }

    //Set Installed
    elt.setAttribute('installed', "");
    //Enabled/Disabled
    if (module.enabled === false) elt.setAttribute('disabled', "");
    if (module.ready === false) elt.setAttribute('notready', "");

}
function CONTROLS_CONTROLLABLE(module = true, type_name, controllable_name) {
    let opts = getAuthHeader();
    opts['method'] = 'PUT';
    opts['headers']['Content-Type'] = 'application/json';

    let body = { controllable_name };

    if (module) body.module_name = type_name;
    else body.package_name = type_name;

    opts['body'] = JSON.stringify(body);

    fetch('/api/' + (module ? 'modules' : 'packages') + '/control/ables', opts)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            console.log(json);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//Packages
function createPackage(package) {
    let s = '';
    
    s += '<div class="Package " id="Package_' + package.name + '" ' + (package.enabled ? '' : 'disabled') + '>';

    s += '<span class="hdr">' + package.name + '</span>';

    s += '<div class="ctrl">';
    s += '<button onclick="CONTROL_ENABLE(\'' + package.name + '\', this);">' + (package.enabled ? 'STOP' : 'START') + '</button>';
    s += '<button class="RELOAD" onclick="CONTROL_RELOAD(\'' + package.name + '\', this);">RELOAD</button>';
    
    for (let controllable of package.controllables || []) {
        s += '<button title="' + (controllable.title || controllable.name) + '" onclick="CONTROLS_CONTROLLABLE(false, ' + "'" + package.name + "', '" + controllable.name + "'" + ')">' + controllable.title || controllable.name + '</button>';
    }

    s += '</div>';
    
    s += '<div class="misc">';

    if ((package.displayables || []).length === 0) s += '<span style="text-align: right;">NO STATS AVAILABLE</span>';

    for (let i = 0; i < 5 && i < (package.displayables || []).length; i++) {
        let stat = package.displayables[i];
        s += '<span>' + stat.name + ':</span><span style="text-align: right;">' + ColorValue(stat.value, stat.name) + '</span>';
    }


    s += '</div>';

    s += '</div>';

    document.getElementById('Packages').innerHTML = s + document.getElementById('Packages').innerHTML;
}
//Control Buttons
function CONTROL_ENABLE(package_name, elt) {
    fetch("/api/packages/control/" + elt.innerHTML.toLowerCase() + "?package_name=" + package_name, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            //Output
            if (json.package_name === package_name && (json.enable === 'success' || json.disable === 'success'))
                OUTPUT_showInfo('Package ' + (elt.innerHTML.toLowerCase() === 'start' ? 'Enable' : 'Disable') + 'd!');
            else {
                return Promise.reject(new Error('Package ' + (type === 'start' ? 'Enable' : 'Disable') + ' Failed!'));
            }

            //Visual
            elt.innerHTML = json.status === true ? 'STOP' : 'START';
            if (json.status === true) elt.parentElement.parentElement.removeAttribute('disabled');
            else elt.parentElement.parentElement.setAttribute('disabled', 'true');
            

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function CONTROL_RELOAD(package_name, elt) {
    fetch("/api/packages/control/reload?package_name=" + package_name, getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            console.log(json);
            //Output
            if (json.package_name === package_name && json.reload === 'success')
                OUTPUT_showInfo('Package Reloaded!');
            else {
                return Promise.reject(new Error('Package Reload Failed!'));
            }

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//UTIL
function ColorValue(value, name) {
    if (value === 'ONLINE' || value === 'FULL' || value === 'OPEN' ) return '<green>' + value + '</green>';
    if (value === 'OFFLINE' || value === 'NONE' || value === 'CLOSED') return '<red>' + value + '</red>';
    if (value === 'PARTIAL' || value === 'CLOSING' || value === 'OPENING') return '<yellow>' + value + '</yellow>';
    if (name === 'Authenticator') return '<blue>' + value + '</blue>';

    return value;
}
function sortEnabled(a, b, dir) {
    if (a.enabled === b.enabled) return 0;
    if (a.enabled === true && b.enabled === false) return -1 * dir;
    return 1 * dir;
}