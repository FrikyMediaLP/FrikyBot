PAGE_IS_PROTECTED = true;

async function init() {
    OUTPUT_create();
    
    //Navigation
    try {
        await init_Navigation();
    } catch (err) {
        OUTPUT_showError(err.message);
        return Promise.resolve();
    }
}

async function fetchNav() {
    return fetch("/api/pages/settings/navigation", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json.data);
            }
        });
}
async function init_Navigation() {
    let navData;
    try {
        navData = await fetchNav();
        document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(navData);
    } catch (err1) {
        try {
            await NAVIVATION_init();
        } catch (err2) {

        }
        return Promise.reject(err1);
    }
    
    return Promise.resolve();
}

//UTIL
function GetTime(time) {
    let date = new Date(time);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString('de-DE', { hour: 'numeric', minute: 'numeric' });
}
function ExtractFromVersionString(string = '') {
    let split = string.split('.');

    return {
        patch: split.pop(),
        minor: split.pop(),
        major: split.pop(),
        release: split.pop()
    };
}
function CreateVersionString(release = 0, major = 0, minor = 0, patch = 0) {
    return release + '.' + major + '.' + minor + '.' + patch;
}
function CompareVersions(string_a, string_b, detailed = false) {
    //Returns a positive number, when a is a higher version than b
    //Returns a negative number, when b is a higher version than a

    //NOTE: When in Detailed Mode, an object with all segment-differences is returned

    //Returns 0, when both version are the same

    let a = ExtractFromVersionString(string_a);
    let b = ExtractFromVersionString(string_b);

    let details = {};

    for (let segment of ['release', 'major', 'minor', 'patch']) {
        let result = a[segment] - b[segment];
        if (result === 0) continue;

        if (detailed) {
            details[segment] = result;
            continue;
        }

        return result;
    }

    if (detailed) return details;
    return 0;
}