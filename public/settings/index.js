async function Control_init() {

    let cores = [{
        name: 'Twitch API',
        enabled: true,
        buttons: [{ name: 'Check Tokens', type: 'api:tokens/check', hover: '' }],
        misc: ['<b>Channel:</b> Unknown']
    }];

	//Data
	try {
		let data = await FetchSettings();
		console.log(data);
    } catch (err) {
        OUTPUT_showError(err.message);
        return Promise.resolve();
	}

	//DONE
	document.getElementById('WAITING_FOR_DATA').remove();
    document.getElementById('SECTION_DASHBOARD').style.display = 'block';
    
    for (let core of cores) {
        //document.getElementById('CONTROL').innerHTML += createCore(core);v
    }
}

async function FetchSettings() {
    return fetch("/api/settings/dashboard", getFetchHeader())
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}

//Create
function createCore(core) {
    if (!core) return '';

    let s = '';

    s += '<div class="Core">';
    s += '<center class="Header ' + (core.enabled === true ? 'ENABLED' : 'DISABLED') + '">' + core.name + '</center>';

    //Misc
    s += '<div class="Misc">';

    //Misc - Buttons
    s += '<div class="Buttons">';
    s += '<button>' + (core.enabled === true ? 'STOP' : 'START') + '</button>';
    
    if (core.buttons) {
        for (let btn of core.buttons)
            s += '<button>' + btn.name + '</button>';
    }

    s += '</div>';

    //Misc - Info
    for (let misc of core.misc)
        s += '<p>' + misc + '</p>';
    
    //Misc - SettingsLink
    s += '<center class="SettingsLink">';
    s += '<a href="settings/setup#SETUP_TWITCH_IRC">Settings</a>';
    s += '</center>';

    s += '</div>';

    s += '</div>';

    return s;
}