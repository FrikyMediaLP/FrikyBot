async function Control_init() {
	//Data
	try {
		let data = await FetchSettings();
        console.log(data);

        if (!data.Config || data.Config.isSetup !== true) {
            //window.location.href = 'settings/setup';
        }

        for (let mdl in data) {
            updateModule(mdl, data[mdl]);
        }

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
function updateModule(name, data) {
    let elt = document.getElementById('Module_' + name);
    if (!elt) return;
    
    if (data.installed === true) {
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
        if (data.enabled === false) elt.setAttribute('disabled', "");
        //Other Infos
        //...
        //Errors
    }
}