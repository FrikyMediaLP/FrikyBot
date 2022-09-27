let DETECTED = [];
let INACTIVE_ENDPOINTS = [];
let INACTIVE_EVENTSUBS = [];

async function Packages_init() {
	//Data
	try {
        let data = await FetchSettings();
        INACTIVE_ENDPOINTS = data.inactive_endpoints || [];
        INACTIVE_EVENTSUBS = data.inactive_eventsubs || [];
        
        for (let package of data.Packages) {
            createPackage(package);
        }

        DETECTED = data.auto_detected.filter(elt => !data.Packages.find(elt2 => elt2.details.name === elt.name));

        UI_init(DETECTED, data.modules, data.server);

        SWITCHBUTTON_AUTOFILL();
        MISC_SELECT_WidthCheck_All();
    } catch (err) {
        console.log(err);
		OUTPUT_showError(err.message);
	}
    
	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SECTION_PACKAGES').style.display = 'block';

    SWITCHBUTTON_AUTOFILL();
}

async function FetchSettings() {
    return fetch("/api/pages/settings/packages", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        });
}
async function CONTROL_ACCESS(package_name, type, startparameters) {
    let opt = getAuthHeader();
    let url = "/api/packages/control/" + type;

    if (type === 'add') {
        opt['method'] = 'POST';
        opt['headers']['Content-Type'] = 'application/json';
        opt['body'] = JSON.stringify({ package_name, startparameters });
    } else {
        url += "?package_name=" + package_name;
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
function UI_init(detected = [], module_versions = [], server_version = '0.0.0.0') {
    let infos = [];

    for (let pack of detected) {
        if (typeof pack === 'string') infos.push(pack);
        else {
            let details = '';

            ////Server
            //let result = CompareVersions(pack.server, server_version, true);
            //if (details !== '' && (result.release > 0 || result.major > 0 || result.minor > 0)) {
            //    details = '<span title="Server Version Outdated!" style="color: red;">' + pack.name + '</span>';
            //}

            ////Modules
            //for (let mdl in pack.modules || []) {
            //    if (details !== '') continue;

            //    let mdl_version = module_versions.find(elt => elt.name.toLowerCase() === mdl.toLowerCase());
            //    if (!mdl_version) {
            //        details = '<span title="' + mdl + ' Module not found or outdated!" style="color: red;">' + pack.name + '</span>';
            //        continue;
            //    }

            //    let result = CompareVersions(pack.modules[mdl], mdl_version.version, true);

            //    if (result.release > 0 || result.major > 0 || result.minor > 0) {
            //        details = '<span title="' + mdl_version.name + ' Version Outdated!" style="color: red;">' + pack.name + '</span>';
            //    }
            //}

            //Package Interconnect TBD

            //HTML
            if (details === '') details = pack.name;
            infos.push(details);
        }
    }

    infos.push('Custom');
    infos.push('Select Package');

    if (document.getElementById('UI_SELECT')) document.getElementById('UI_SELECT').remove();
    document.getElementById('UI').innerHTML = MISC_SELECT_create(infos, infos.length-1, 'UI_SELECT', 'UI_selectChange()', '', '', true) + document.getElementById('UI').innerHTML;
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

//Package
function createPackage(package) {
    if (!package) return;

    let is_enabled = package.details.enabled === true;
    let s = '<div class="Package ' + (is_enabled ? (package.details.ready === true ? 'ENABLED' : 'NOTREADY') : 'DISABLED') + '">';

    let img = '../images/icons/packages.svg';

    //IMG
    s += '<div class="IMG"><img src="' + (package.details.picture || img) + '"/></div>';

    //Name
    s += '<div class="Name">' + package.details.name + '</div>';

    //Control
    s += '<div class="Control">' + createPackageControl(package) + '</div>';

    //Misc
    s += '<div class="Misc">' + createPackageMisc(package) + '</div>';

    s += '</div>';

    document.getElementById('PACKAGES').innerHTML += s;
}
function createPackageControl(package) {
    if (!package) return "";

    let s = "";

    let is_enabled = package.details.enabled === true;

    s += '<center class="Status"></center>';
    s += '<button class="ENABLE" onclick="CONTROL_ENABLE(\'' + package.details.name + '\', this)"></button>';
    s += '<button ' + (package.details.ready === true && is_enabled ? '' : 'disabled') + ' onclick="CONTROL_RELOAD(\'' + package.details.name + '\', this)">RELOAD</button>';
    s += '<button class="REMOVE" onclick="CONTROL_REMOVE(\'' + package.details.name + '\', this)">REMOVE</button>';

    if (package.details.html) s += '<center><a href="../' + package.details.html + '">Visit HTML</a></center>';

    return s;
}
function createPackageMisc(package) {
    if (!package) return "";

    let s = "";

    s += '<div class="Desc">';
    s += '<p>' + package.details.description + '</p>';

    let endpoints = [];
    for (let req of ((package.details || {}).api_requierements || {}).endpoints || []) {
        if (INACTIVE_ENDPOINTS.find(elt => elt === req)) endpoints.push(req);
    }
    if (endpoints.length > 0) s += '<p class="API_INFO">Currently Unavailable Twitch API Endpoints: ' + endpoints.join(', ') + '</p>';

    let eventsubs = [];
    for (let req of ((package.details || {}).api_requierements || {}).eventsubs || []) {
        if (INACTIVE_EVENTSUBS.find(elt => elt === req)) eventsubs.push(req);
    }

    if (endpoints.length > 0 || eventsubs.length > 0) {
        s += '<div class="API_INFO">';
        s += '<p style="margin: 0;">Reduced Functionality due to missing ... </p>';
        s += '<ul style="margin: 0;">';
        if (endpoints.length > 0) s += '<li>TTV API Endpoints: ' + endpoints.join(', ') + '</li>';
        if (eventsubs.length > 0) s += '<li>TTV API EventSubs: ' + eventsubs.join(', ') + '</li>';
        s += '</ul>';
        s += '</div>';
    }

    s += '</div>';

    s += '<div class="Settings" data-package="' + package.details.name + '">';
    s += '<p class="header">Settings';
    s += '<button class="show" onclick="showSettings(\'' + package.details.name + '\')">SHOW</button>';
    s += '<button class="save" onclick="saveSettings(\'' + package.details.name + '\')" disabled>SAVE</button>';
    s += '</p>';

    for (let setting of package.template) {
        if (setting.name === 'enabled') continue;
        setting.default = package.cfg[setting.name];
        s += createSetting(setting.name, null, package.cfg[setting.name] || setting.default, setting, package.details.name);
    }

    s += '</div>';

    if (package.interconnects && package.interconnects.length > 0) {
        s += '<div class="Interconnect" data-package="' + package.details.name + '">';
        s += '<p class="header">Package Interconnect';
        s += '<button class="show" onclick="showPIC(\'' + package.details.name + '\')">SHOW</button>';
        s += '</p>';

        s += '<p>Requested: </p><ul>';
        let pckicc = "";
        for (let icc of package.interconnects || []) {
            pckicc += '<li>' + icc.package + " -> " + icc.description + '</li>';
        }
        if (pckicc === "") s += '<li>NONE</li>';
        else s += pckicc;

        s += '</ul>';

        s += '</div>';
    }
    
    return s;
}

function createSetting(name, id, value, options = {}, packageName) {
    if (options['selection'] !== undefined) {
        return createSettingSELECT(name, id, value, options, packageName);
    } else if (options['type'] === 'number') {
        return createSettingNUMBER(name, id, value, options, packageName);
    } else if (options['type'] === 'boolean') {
        return createSettingSWITCH(name, id, value, options, packageName);
    } else if (options['type'] === 'string') {
        return createSettingINPUT(name, id, value, options, packageName);
    } else if (options['type'] === 'array') {
        return createSettingARRAY(name, id, value, options, packageName);
    }

    return "";
}

function createSettingNUMBER(name, id, value, options = {}, packageName) {
    let s = '';

    s += '<div class="Setting NUMBER" data-package="' + packageName + '">';
    s += '<p>';
    s += '<span>' + (options.title || name) + '</span>';
    if (options.description) s += '<span title="' + options.description + '">i</span>';
    s += '</p>';
    s += '<input type="number" class="SETTING_PACKAGE_' + packageName + '" oninput="changeSettings(\'' + packageName + '\')" data-name="' + name + '"';

    //id
    if (id) s += ' id="' + id + '"';

    //value
    s += ' value="' + (value || options.default) + '"';

    //options
    if (options.default !== undefined) s += ' placeholder="' + options.default + '"';
    if (options.min !== undefined) s += ' min="' + options.min + '"';
    if (options.max !== undefined) s += ' max="' + options.max + '"';
    if (options.step !== undefined) s += ' step="' + options.step + '"';

    s += '/></div>';

    return s;
}
function createSettingINPUT(name, id, value, options = {}, packageName) {
    let s = '';

    s += '<div class="Setting INPUT" data-package="' + packageName + '">';
    s += '<p>';
    s += '<span>' + (options.title || name) + '</span>';
    if (options.description) s += '<span title="' + options.description + '">i</span>';
    s += '</p>';

    s += '<input class="SETTING_PACKAGE_' + packageName + '" oninput="changeSettings(\'' + packageName + '\')" data-name="' + name + '"';

    //id
    if (id) s += ' id="' + id + '"';

    //value
    s += ' value="' + (value || options.default) + '"';

    //options
    if (options.default !== undefined) s += ' placeholder="' + options.default + '"';

    s += '/></div>';

    return s;
}
function createSettingSWITCH(name, id, value, options = {}, packageName) {
    let s = '';

    s += '<div class="Setting SWITCH">';
    s += '<p>';
    s += '<span>' + (options.title || name) + '</span>';
    if (options.description) s += '<span title="' + options.description + '">i</span>';
    s += '</p>';
    s += SWITCHBUTTON_CREATE(value, options.disabled, "changeSettings('" + packageName + "')", id, 'class="SETTING_PACKAGE_' + packageName + '" data-name="' + name + '"');
    s += '</div>';

    return s;
}
function createSettingARRAY(name, id, value, options = {}, packageName) {
    let s = '';

    value = value || options['default'] || [];
    if (options['title']) value.unshift(options['title']);
    if (value[0] === options['title']) value.push('NONE');
    
    s += '<div class="Setting ARRAY">';
    s += '<p>';
    s += '<span>' + (options.title || name) + '</span>';
    if (options.description) s += '<span title="' + options.description + '">i</span>';
    s += '</p>';
    s += MISC_SELECT_create(value, 0, id, "changeSettings('" + packageName + "')", null, null, true);
    s += '</div>';

    return s;
}

function createSettingSELECT(name, id, value, options = {}, packageName) {
    let s = '';

    s += '<div class="Setting SELECT">';
    s += '<p>';
    s += '<span>' + (options.title || name) + '</span>';
    if (options.description) s += '<span title="' + options.description + '">i</span>';
    s += '</p>';

    let idx = 0;
    if (!options.selection) options.selection = [];
    options.selection.find((elt, index) => {
        if (elt === value) {
            idx = index;
            return true;
        }
    });
    s += MISC_SELECT_create(options.selection, idx, null, "changeSettings('" + packageName + "')", 'SETTING_PACKAGE_' + packageName, 'data-name="' + name + '"');
    s += '</div>';

    return s;
}

function changeSettings(name) {
    for (let elt of document.getElementsByClassName('Settings')) {
        if (elt.dataset.package !== name) continue;
        elt.childNodes[0].childNodes[2].removeAttribute('disabled');
    }
}
function saveSettings(name) {
    let cfg = {};
    for (let settingElts of document.getElementsByClassName('SETTING_PACKAGE_' + name)) {
        if (settingElts.type === 'number') cfg[settingElts.dataset.name] = parseInt(settingElts.value);
        else if (settingElts.classList.contains('MISC_SELECT')) cfg[settingElts.dataset.name] = MISC_SELECT_GetValue(settingElts);
        else cfg[settingElts.dataset.name] = settingElts.value;
    }
    
    let opt = getAuthHeader();
    let url = "/api/packages/settings?package_name=" + name;
    opt['method'] = 'POST';
    opt['headers']['Content-Type'] = 'application/json';
    opt['body'] = JSON.stringify({ cfg });
    
    fetch(url, opt)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) return Promise.reject(new Error(json.err));
            OUTPUT_showInfo("Settings Updated!");

            for (let elt of document.getElementsByClassName('Settings')) {
                if (elt.dataset.package === name) {
                    elt.childNodes[0].childNodes[2].setAttribute('disabled', 'true');
                }
            }
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function showSettings(name) {
    for (let elt of document.getElementsByClassName('Settings')) {
        if (elt.dataset.package !== name) continue;
        elt.classList.toggle('show');
        elt.childNodes[0].childNodes[1].innerHTML = elt.classList.contains('show') ? 'HIDE' : 'SHOW';
    }

    MISC_SELECT_WidthCheck_All();
    setInputWidth(name);
}
function showPIC(name) {
    for (let elt of document.getElementsByClassName('Interconnect')) {
        if (elt.dataset.package !== name) continue;
        elt.classList.toggle('show');
        elt.childNodes[0].childNodes[1].innerHTML = elt.classList.contains('show') ? 'HIDE' : 'SHOW';
    }
}

function setInputWidth() {
    for (let settingElts of document.getElementsByClassName('Setting')) {
        settingElts.style.gridTemplateColumns = 'auto 0';
        settingElts.style.gridTemplateColumns = 'auto minmax(50px, ' + settingElts.childNodes[1].scrollWidth + 'px)';
    }
}

//Control Buttons
function CONTROL_ENABLE(package_name, enableButton, relButton, removeButton, packageElt) {
    for (let child of enableButton.parentElement.childNodes) {
        if (child instanceof Element && child.classList.contains('REMOVE')) {
            removeButton = child;
            removeButton.setAttribute('disabled', 'true');
        } else if (child instanceof Element && child.innerHTML === 'RELOAD') {
            relButton = child;
            relButton.setAttribute('disabled', 'true');
        }
    }

    if (!packageElt) packageElt = enableButton;

    while (!packageElt.classList.contains('Package') && packageElt.tagName !== 'BODY') {
        packageElt = packageElt.parentElement;
    }

    const type = packageElt.classList.contains('DISABLED') ? 'start' : 'stop';
    if (!type) return;
    
    enableButton.setAttribute('disabled', 'true');

    CONTROL_ACCESS(package_name, type)
        .then(json => {
            //Visual
            enableButton.removeAttribute('disabled');
            if (json.status === true) relButton.removeAttribute('disabled');
            removeButton.removeAttribute('disabled');

            packageElt.classList.remove('ENABLED');
            packageElt.classList.remove('DISABLED');
            packageElt.classList.remove('NOTREADY');
            packageElt.classList.add(json.status === true ? 'ENABLED' : 'DISABLED');
            
            //Output
            if (json.package_name === package_name && (json.enable === 'success' || json.disable === 'success'))
                OUTPUT_showInfo('Package ' + (type === 'start' ? 'Enable' : 'Disable') + 'd!');
            else {
                return Promise.reject(new Error('Package ' + (type === 'start' ? 'Enable' : 'Disable') + ' Failed!'));
            }

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);

            //Visuals
            relButton.removeAttribute('disabled');
            removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');
        });
}
function CONTROL_RELOAD(package_name, relButton, enableButton, removeButton) {
    //Visuals
    relButton.setAttribute('disabled', 'true');

    for (let child of relButton.parentElement.childNodes) {
        if (child instanceof Element && (child.classList.contains('DISABLE') || child.classList.contains('ENABLE'))) {
            enableButton = child;
            enableButton.setAttribute('disabled', 'true');
        } else if (child instanceof Element && child.classList.contains('REMOVE')) {
            removeButton = child;
            removeButton.setAttribute('disabled', 'true');
        }
    }

    CONTROL_ACCESS(package_name, 'reload')
        .then(json => {
            //Visuals
            relButton.removeAttribute('disabled');
            removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');

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

            //Visuals
            relButton.removeAttribute('disabled');
            removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');
        });
}
function CONTROL_REMOVE(package_name, relButton, enableButton, removeButton) {
    //Visuals
    relButton.setAttribute('disabled', 'true');

    for (let child of relButton.parentElement.childNodes) {
        if (child instanceof Element && (child.classList.contains('DISABLE') || child.classList.contains('ENABLE'))) {
            enableButton = child;
            enableButton.setAttribute('disabled', 'true');
        } else if (child instanceof Element && child.classList.contains('REMOVE')) {
            removeButton = child;
            removeButton.setAttribute('disabled', 'true');
        }
    }

    packageElt = enableButton;

    while (!packageElt.classList.contains('Package') && packageElt.tagName !== 'BODY') {
        packageElt = packageElt.parentElement;
    }

    CONTROL_ACCESS(package_name, 'remove')
        .then(json => {
            //Visuals
            relButton.removeAttribute('disabled');
            removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');

            //Output
            if (json.package_name === package_name && json.removed === 'success') {
                OUTPUT_showInfo('Package Removed!');
                packageElt.remove();
            } else {
                return Promise.reject(new Error('Package Remove Failed!'));
            }

            return Promise.resolve();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);

            //Visuals
            relButton.removeAttribute('disabled');
            removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');
        });
}
function CONTROL_ADD() {
    let package_name = document.getElementById('UI_TEXT_1').value || MISC_SELECT_GetValue(document.getElementById('UI_SELECT'));
    if (package_name === 'Custom') return;

    //Visuals
    document.getElementById('UI').classList.add('DISABLED');

    CONTROL_ACCESS(package_name, 'add', document.getElementById('UI_TEXT_2').value)
        .then(json => {
            //Visuals
            document.getElementById('UI').classList.remove('DISABLED');

            //Output
            if (json.package_name === package_name && (json.added === 'success' || json.added === 'partial')) {
                OUTPUT_showInfo('Package Added! ' + (json.added === 'partial' ? 'But not installed. Files are missing.' : ''));
                if (json.added === 'success') createPackage(json.package);

                let idx = -1;
                DETECTED.find((elt, index) => {
                    if (elt === package_name) {
                        idx = index;
                        return true;
                    }
                    return false;
                });

                if (idx >= 0) DETECTED.splice(idx, 1);
                UI_init(DETECTED);
            } else {
                return Promise.reject(new Error('Adding Package Failed!'));
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