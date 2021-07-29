function init() {
    OUTPUT_create();
    SWITCHBUTTON_AUTOFILL();

    fetch("api/ChatModeration/filters/settings", getAuthHeader())
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            console.log(json);
            if (json.err) return Promise.reject(new Error(json.err));
            document.getElementById('CHATMOD').style.display = "block";

            initWordFilter(json['Word Filter']);
            initSpamFilter(json['Spam Filter']);
            initLinkFilter(json['Link Filter']);

            SWITCHBUTTON_AUTOFILL();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError('ACCESS DENIED');
        });
}

//Word Filter
function initWordFilter(filter) {
    if (!filter) return;
    document.getElementById('WordFilter').style.display = 'block';
    SWITCHBUTTON_TOGGLE(document.getElementById('WordFilter_enable'), filter.enabled);

    const options = {
        headers: ['word', 'by', 'at', 'settings'],
        header_translation: {
            by: 'blocked_by',
            at: 'blocked_at',
            settings: ['casesensitive', 'in_word_use', 'block_patterns', 'ignore_emotes', 'emote_only', 'include_BTTV', 'include_FFZ']
        },
        content_translation: {
            casesensitive: (x) => x ? '<img src="images/icons/caps.png" title="CaseSensitive"/>' : '',
            in_word_use: (x) => x ? '<img src="images/icons/inword.png" title="In Word Use"/>' : '',
            block_patterns: (x) => x ? '<img src="images/icons/textpattern.png" title="Block Patterns"/>' : '',
            ignore_emotes: (x) => x ? '<img src="images/icons/disabled_frikybot.png" title="Ignore Emotes"/>' : '',
            emote_only: (x) => x ? '<img src="images/icons/FrikyBot_Colored.png" title="Emote Only"/>' : '',
            include_BTTV: (x) => x ? '<img src="images/icons/BTTV.png" title="Include BTTV Emotes"/>' : '',
            include_FFZ: (x) => x ? '<img src="images/icons/FFZ.png" title="Include FFZ Emotes"/>' : ''
        },
        column_addition: { settings: (x) => '<button onclick="WordFilter_removeWord(\'' + x.word + '\')" red>REMOVE WORD</button>' },
        timestamps: { at: 'relative' }
    };
    document.getElementById('WordFilter_BL').innerHTML = MISC_createTable(filter.Blacklist, options);
    document.getElementById('WordFilter_message').value = filter.message;
}
function WordFilter_enable(elt) {
    const data = { name: 'Word Filter', action: 'enable', value: elt.value };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function WordFilter_addWord() {
    const word = document.getElementById('WordFilter_input').value;

    const casesensitive = document.getElementById('WordFilter_CS').value;
    const in_word_use = document.getElementById('WordFilter_IWU').value;
    const block_patterns = document.getElementById('WordFilter_BP').value;

    const ignore_emotes = document.getElementById('WordFilter_IE').value;
    const emote_only = document.getElementById('WordFilter_EO').value;
    const include_BTTV = document.getElementById('WordFilter_BTTV').value;
    const include_FFZ = document.getElementById('WordFilter_FFZ').value;

    if (!word) return document.getElementById('WordFilter_input').setAttribute('missing', 'true');
    const data = { name: 'Word Filter', action: 'add_word', word, casesensitive, in_word_use, block_patterns, ignore_emotes, emote_only, include_BTTV, include_FFZ };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            document.getElementById('WordFilter_input').removeAttribute('missing');
            initWordFilter(json.updated_settings);
        })
        .catch(err => {
            document.getElementById('WordFilter_input').setAttribute('missing', 'true');
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function WordFilter_removeWord(word) {
    if (!word) return;
    const data = { name: 'Word Filter', action: 'remove_word', word };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            document.getElementById('WordFilter_input').removeAttribute('missing');
            initWordFilter(json.updated_settings);
        })
        .catch(err => {
            document.getElementById('WordFilter_input').setAttribute('missing', 'true');
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
async function WordFilter_clear() {
    let answer = 'NO';

    try {
        answer = await MISC_USERCONFIRM('ARE YOU SURE YOU WANT THIS?', 'Do you really want to remove ALL Blacklisted Words?');
    } catch (err) {

    }
    if (answer !== 'YES') return Promise.resolve();

    const data = { name: 'Word Filter', action: 'clear' };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            document.getElementById('WordFilter_input').removeAttribute('missing');
            initWordFilter(json.updated_settings);
        })
        .catch(err => {
            document.getElementById('WordFilter_input').setAttribute('missing', 'true');
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function WordFilter_inputChange(elt) {
    if (elt.parentElement.innerHTML.indexOf('<button') < 0) {
        let btn = document.createElement('BUTTON');
        btn.innerHTML = 'SAVE';
        btn.setAttribute('green', 'true');
        btn.setAttribute('onclick', 'WordFilter_inputSAVE(this)');
        elt.parentElement.insertBefore(btn, elt);
    }
}
function WordFilter_inputSAVE(elt) {
    let input = elt.parentElement.childNodes[2];
    const data = {
        name: 'Word Filter',
        action: 'message',
        value: input.value
    };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo("Setting Updated!");
            elt.remove();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//Spam Filter
function initSpamFilter(filter) {
    if (!filter) return;
    document.getElementById('SpamFilter').style.display = 'block';
    SWITCHBUTTON_TOGGLE(document.getElementById('SpamFilter_enable'), filter.enabled);

    for (let elt of document.getElementById('Spam_Caps').childNodes) {
        if (!(elt instanceof Element) || elt.classList.contains('SPACER') || elt.classList.contains('SMALLSPACER')) continue;

        if (elt.childNodes[1].tagName === 'SWITCHBUTTON') {
            SWITCHBUTTON_TOGGLE(elt.childNodes[1], filter.Caps[elt.dataset.action]);
        } else {
            elt.childNodes[1].value = filter.Caps[elt.dataset.action];
        }
    }

    for (let elt of document.getElementById('Spam_Emotes').childNodes) {
        if (!(elt instanceof Element) || elt.classList.contains('SPACER') || elt.classList.contains('SMALLSPACER')) continue;

        if (elt.childNodes[1].tagName === 'SWITCHBUTTON') {
            SWITCHBUTTON_TOGGLE(elt.childNodes[1], filter.Emotes[elt.dataset.action]);
        } else {
            elt.childNodes[1].value = filter.Emotes[elt.dataset.action];
        }
    }

    for (let elt of document.getElementById('Spam_Messages').childNodes) {
        if (!(elt instanceof Element) || elt.classList.contains('SPACER') || elt.classList.contains('SMALLSPACER')) continue;

        if (elt.childNodes[1].tagName === 'SWITCHBUTTON') {
            SWITCHBUTTON_TOGGLE(elt.childNodes[1], filter.Messages[elt.dataset.action]);
        } else {
            elt.childNodes[1].value = filter.Messages[elt.dataset.action];
        }
    }
}
function SpamFilter_enable(elt) {
    const data = { name: 'Spam Filter', action: 'enable', value: elt.value };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function SpamFilter_inputChange(elt) {
    if (elt.parentElement.innerHTML.indexOf('<button') < 0) {
        let btn = document.createElement('BUTTON');
        btn.innerHTML = 'SAVE';
        btn.setAttribute('green', 'true');
        btn.setAttribute('onclick', 'SpamFilter_inputSAVE(this)');
        elt.parentElement.insertBefore(btn, elt);
        elt.parentElement.classList.add('cut');
    }
}
function SpamFilter_inputSAVE(elt) {
    let input = elt.parentElement.childNodes[2];
    const data = {
        name: 'Spam Filter',
        origin: elt.parentElement.parentElement.dataset.name,
        action: elt.parentElement.dataset.action,
        value: input.type === 'number' ? parseInt(input.value) : input.value
    };
    
    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);
    
    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo("Setting Updated!");
            elt.remove();
            elt.parentElement.classList.remove('cut');
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function SpamFilter_switchButton(elt) {
    const data = {
        name: 'Spam Filter',
        origin: elt.parentElement.parentElement.dataset.name,
        action: elt.parentElement.dataset.action,
        value: elt.value
    };
    
    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            OUTPUT_showInfo("Setting Updated!");
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

//Link Filter
function initLinkFilter(filter) {
    if (!filter) return;
    document.getElementById('LinkFilter').style.display = 'block';

    SWITCHBUTTON_TOGGLE(document.getElementById('LinkFilter_enable'), filter.enabled);
    SWITCHBUTTON_TOGGLE(document.getElementById('LinkFilter_block_all'), filter.block_all);

    document.getElementById('LinkFilter_Global_msg').value = filter.all_block_message;
    document.getElementById('LinkFilter_Domain_msg').value = filter.domain_block_message;
    document.getElementById('LinkFilter_SubDomain_msg').value = filter.subdomain_block_message;
    document.getElementById('LinkFilter_URL_msg').value = filter.url_block_message;

    let options = {
        headers: ['URL', 'by', 'at'],
        header_translation: {
            by: 'added_by',
            at: 'added_at',
            URL: ['domain', 'subdomain', 'url']
        },
        content_translation: {
            url: (x) => x ? '<span title="url">' + x + '</span>' : '',
            domain: (x) => x ? '<span title="domain">' + x + '</span>' : '',
            subdomain: (x) => x ? '<span title="subdomain">' + x + '</span>' : ''
        },
        column_addition: { at: (x) => '<button onclick="LinkFilter_unallow({ url: ' + (x.url ? "'" + x.url + "'" : undefined) + ' , domain: ' + (x.domain ? "'" + x.domain + "'" : undefined) + ', subdomain: ' + (x.subdomain ? "'" + x.subdomain + "'" : undefined) + '})" red>REMOVE ' + (x.url ? 'URL' : (x.domain ? 'DOMAIN' : 'SUBDOMAIN')) + '</button>' },
        timestamps: { at: 'relative' }
    };

    document.getElementById('LinkFilter_WL').innerHTML = MISC_createTable(filter.Whitelist, options);

    options.column_addition.at = (x) => '<button onclick="LinkFilter_unblock({ url: ' + (x.url ? "'" + x.url + "'" : undefined) + ' , domain: ' + (x.domain ? "'" + x.domain + "'" : undefined) + ', subdomain: ' + (x.subdomain ? "'" + x.subdomain + "'" : undefined) + '})" red>REMOVE ' + (x.url ? 'URL' : (x.domain ? 'DOMAIN' : 'SUBDOMAIN')) + '</button>';
    document.getElementById('LinkFilter_BL').innerHTML = MISC_createTable(filter.Blacklist, options);
}
function LinkFilter_enable(elt) {
    const data = { name: 'Link Filter', action: 'enable', value: elt.value };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function LinkFilter_block_all(elt) {
    const data = { name: 'Link Filter', action: 'block_all', value: elt.value };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

function LinkFilter_block() {
    const URL = document.getElementById('LinkFilter_input').value;
    if (!URL) return document.getElementById('LinkFilter_input').setAttribute('missing', 'true');

    const url = document.getElementById('LinkFilter_URL').value;
    const domain = document.getElementById('LinkFilter_Domain').value;
    const subdomain = document.getElementById('LinkFilter_SubDomain').value;

    if (URL.substring(0, 8) == "https://") {
        URL = URL.substring(8);
    } else if (URL.substring(0, 7) == "http://") {
        URL = URL.substring(7);
    }

    if (URL.substring(0, 4) == "www.") {
        URL = URL.substring(4);
    }

    let url_data = {};
    if (url) url_data = { url: URL };
    if (domain) url_data = { domain: getDomain(URL) };
    if (subdomain) url_data = { subdomain: getSubDomain(URL) };

    const data = { name: 'Link Filter', action: 'block', url_data };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            document.getElementById('LinkFilter_input').removeAttribute('missing');
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            document.getElementById('LinkFilter_input').setAttribute('missing', 'true');
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function LinkFilter_unblock(url_data = {}) {
    const data = { name: 'Link Filter', action: 'unblock', url_data };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);
    
    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function LinkFilter_clearBlock() {
    const data = { name: 'Link Filter', action: 'clear_blocks' };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

function LinkFilter_allow() {
    const URL = document.getElementById('LinkFilter_input').value;
    if (!URL) return document.getElementById('LinkFilter_input').setAttribute('missing', 'true');

    const url = document.getElementById('LinkFilter_URL').value;
    const domain = document.getElementById('LinkFilter_Domain').value;
    const subdomain = document.getElementById('LinkFilter_SubDomain').value;

    if (URL.substring(0, 8) == "https://") {
        URL = URL.substring(8);
    } else if (URL.substring(0, 7) == "http://") {
        URL = URL.substring(7);
    }

    if (URL.substring(0, 4) == "www.") {
        URL = URL.substring(4);
    }

    let url_data = {};
    if (url) url_data = { url: URL };
    if (domain) url_data = { domain: getDomain(URL) };
    if (subdomain) url_data = { subdomain: getSubDomain(URL) };

    const data = { name: 'Link Filter', action: 'allow', url_data };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            document.getElementById('LinkFilter_input').removeAttribute('missing');
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            document.getElementById('LinkFilter_input').setAttribute('missing', 'true');
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function LinkFilter_unallow(url_data = {}) {
    const data = { name: 'Link Filter', action: 'unallow', url_data };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}
function LinkFilter_clearAllow() {
    const data = { name: 'Link Filter', action: 'clear_allows' };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

function LinkFilter_blockchange(elt) {
    if (elt.getAttribute('disabled') === "true") return;
    let url = document.getElementById('LinkFilter_URL');
    let domain = document.getElementById('LinkFilter_Domain');
    let subdomain = document.getElementById('LinkFilter_SubDomain');

    url.removeAttribute('disabled');

    if (elt.value && elt.id === 'LinkFilter_Domain') {
        SWITCHBUTTON_TOGGLE(url, false);
        SWITCHBUTTON_TOGGLE(subdomain, false);
    } else if (elt.value && elt.id === 'LinkFilter_SubDomain') {
        SWITCHBUTTON_TOGGLE(domain, false);
        SWITCHBUTTON_TOGGLE(url, false);
    } else {
        SWITCHBUTTON_TOGGLE(subdomain, false);
        SWITCHBUTTON_TOGGLE(domain, false);
        SWITCHBUTTON_TOGGLE(url, true);
        url.setAttribute('disabled', 'true');
    }
}
function LinkFilter_inputChange(elt) {
    let url = document.getElementById('LinkFilter_URL').parentElement.childNodes[1];
    let domain = document.getElementById('LinkFilter_Domain').parentElement.childNodes[1];
    let subdomain = document.getElementById('LinkFilter_SubDomain').parentElement.childNodes[1];

    let cutted = elt.value;

    if (elt.value.substring(0, 8) == "https://") {
        cutted = elt.value.substring(8);
    } else if (elt.value.substring(0, 7) == "http://") {
        cutted = elt.value.substring(7);
    }

    if (elt.value.substring(0, 4) == "www.") {
        cutted = elt.value.substring(4);
    }

    subdomain.innerHTML = getSubDomain(cutted);
    domain.innerHTML = getDomain(cutted);
    url.innerHTML = cutted;
}

function LinkFilter_inputMessage(elt) {
    if (elt.parentElement.innerHTML.indexOf('<button') < 0) {
        
        let btn = document.createElement('BUTTON');
        btn.innerHTML = 'SAVE';
        btn.setAttribute('green', 'true');
        btn.setAttribute('onclick', 'LinkFilter_save(this)');
        elt.parentElement.insertBefore(btn, elt);
        elt.parentElement.classList.add('cut');
    }
}
function LinkFilter_save(elt) {
    let action = "";
    if (elt.id == "LinkFilter_Global_msg") action = "gobal_message";
    if (elt.id == "LinkFilter_Domain_msg") action = "domain_block_message";
    if (elt.id == "LinkFilter_SubDomain_msg") action = "subdomain_block_message";
    if (elt.id == "LinkFilter_URL_msg") action = "url_block_message";
    const data = { name: 'Link Filter', action, value: elt.parentElement.childNodes[2].value };

    let options = getAuthHeader();
    options['method'] = 'PUT';
    options['headers']['Content-Type'] = 'application/json';
    options['body'] = JSON.stringify(data);

    fetch("api/ChatModeration/filters/settings", options)
        .then(STANDARD_FETCH_RESPONSE_CHECKER)
        .then(json => {
            initLinkFilter(json.updated_settings);
            OUTPUT_showInfo("Setting Updated!");
            elt.parentElement.classList.remove('cut');
            elt.remove();
        })
        .catch(err => {
            console.log(err);
            OUTPUT_showError(err.message);
        });
}

function getDomain(URL) {
    let subdomainSplitted = getSubDomain(URL).split(".");

    if (subdomainSplitted.length < 3) {
        return URL.split("/")[0];
    } else {
        let last = subdomainSplitted[subdomainSplitted.length - 1];
        let penultimate = subdomainSplitted[subdomainSplitted.length - 2];

        if ((last == "uk" || last == "co") && (penultimate == "uk" || penultimate == "co")) {
            return subdomainSplitted[subdomainSplitted.length - 3] + penultimate + "." + last;
        } else {
            return penultimate + "." + last;
        }

        return subdomain.split(".")[1];
    }
}
function getSubDomain(URL) {
    return URL.split("/")[0].split("?")[0].split("#")[0];
}