async function Control_init() {
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
    document.getElementById('SECTION_LOGS').style.display = 'block';
}

async function FetchSettings() {
    return fetch("/api/settings/logs", getFetchHeader())
        .then(checkResponse)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        })
}