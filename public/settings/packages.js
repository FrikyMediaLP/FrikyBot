async function Control_init() {
	//Data
	try {
		let data = await FetchSettings();
		console.log(data);

        for (let package of data.Packages) {
            createPackage(package);
        }

    } catch (err) {
		OUTPUT_showError(err.message);
	}

	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SECTION_PACKAGES').style.display = 'block';
}

async function FetchSettings() {
    return fetch("/api/settings/packages", getFetchHeader())
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        });
}

//Create
function createPackage(package) {
    if (!package) return;

    let s = '<div class="Package">';

    let img = '../images/icons/packages.svg';

    //IMG
    s += '<div class="IMG"><img src="' + img + '"/></div>';

    //Name
    s += '<div class="Name"><span>' + package.details.name + '</span></div>';

    //Control
    s += '<div class="Control">' + createPackageControl(package) + '</div>';

    //Misc
    s += '<div class="Misc">' + createPackageMisc(package) + '</div>';

    s += '</div>';

    document.getElementById('SECTION_PACKAGES').innerHTML += s;
}
function createPackageControl(package) {
    if (!package) return "";

    let s = "";

    let is_enabled = package.details.enabled === true;

    s += '<center class="Status ' + (package.status === 'ready' ? (is_enabled ? 'ENABLED' : 'DISABLED') : 'NOTREADY') + '"></center>';
    s += '<button class="' + (package.status === 'ready' ? (is_enabled ? 'DISABLE' : 'ENABLE') : 'NOTREADY') + '" onclick="CONTROL_ENABLE(\'' + package.details.name + '\', this)"></button>';
    s += '<button ' + (package.status === 'ready' && is_enabled ? '' : 'disabled') + ' onclick="CONTROL_RELOAD(\'' + package.details.name + '\', this)">RELOAD</button>';
    s += '<button class="REMOVE" title="soon" disabled>REMOVE</button>';

    if (package.details.html)
        s += '<center><a href="../' + package.details.html + '">Visit HTML</a></center>';

    return s;
}
function createPackageMisc(package) {
    if (!package) return "";

    let s = "";

    s += '<div class="Desc">' + package.details.description + '</div>';

    s += '<div class="Settings">';
    //s += '<p>Settings</p>';
    //s += '<p>Soon</p>';

    //s += createSettingINPUT('ONE', null, 'NIX LUL');
    //s += createSettingSELECT('TWO', null, [1, 2, 'oder 3?'], 2);
    //s += createSettingSWITCH('THREE', null, false);

    s += '</div>';

    s += '<div class="Interconnect">';
    //s += '<p>Package Interconnect</p><ul><p>Soon</p></ul>';
    s += '</div>';

    return s;
}

function createSettingINPUT(name, id, placeholder) {
    let s = '';

    s += '<div class="Setting INPUT">';
    s += '<p>' + name + '</p><input ' + (id ? 'id="' + id + '"' : '') + ' placeholder="' + placeholder + '"/>';
    s += '</div>';

    return s;
}
function createSettingSELECT(name, id, options, selected) {
    let s = '';

    s += '<div class="Setting SELECT">';
    s += '<p>' + name + '</p><select ' + (id ? 'id="' + id + '"' : '') + '>';

    for (let opt of options) {
        s += '<option ' + (opt === selected ? 'selected' : '') + '>' + opt + '</option>';
    }

    s += '</select>';
    s += '</div>';

    return s;
}
function createSettingSWITCH(name, id, state, disabled) {
    let s = '';

    s += '<div class="Setting SWITCH">';
    s += '<p>' + name + '</p>' + SWITCH_BUTTON_CREATE(state, disabled, null, id);
    s += '</div>';

    return s;
}

//Control Buttons
function CONTROL_ENABLE(package_name, enableButton, relButton, removeButton, statusElement) {
    const type = enableButton.classList.contains('ENABLE') === true ? 'start' : enableButton.classList.contains('DISABLE') === true ? 'stop' : null;

    if (!type)
        return;

    for (let child of enableButton.parentElement.childNodes) {
        if (child instanceof Element && child.classList.contains('REMOVE')) {
            removeButton = child;
            removeButton.setAttribute('disabled', 'true');
        } else if (child instanceof Element && child.innerHTML === 'RELOAD') {
            relButton = child;
            relButton.setAttribute('disabled', 'true');
        } else if (child instanceof Element && child.classList.contains('Status')) {
            statusElement = child;
        }
    }

    enableButton.setAttribute('disabled', 'true');

    CONTROL_ACCESS(package_name, type)
        .then(json => {
            //Visual
            relButton.removeAttribute('disabled');
            //removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');

            enableButton.classList.remove('ENABLE');
            enableButton.classList.remove('DISABLE');
            enableButton.classList.add(json.status === true ? 'DISABLE' : 'ENABLE');

            statusElement.classList.remove('ENABLED');
            statusElement.classList.remove('DISABLED');
            statusElement.classList.add(json.status === true ? 'ENABLED' : 'DISABLED');
            
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
            //removeButton.removeAttribute('disabled');
            enableButton.removeAttribute('disabled');
            enableButton.classList.remove('ENABLE');
            enableButton.classList.remove('DISABLE');
            enableButton.classList.add(json.status === true ? 'DISABLE' : 'ENABLE');

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
async function CONTROL_ACCESS(package_name, type) {
    let opt = getFetchHeader();

    return fetch("/api/packages/control?type=" + type + "&package_name=" + package_name, opt)
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json);
            }
        });
}
