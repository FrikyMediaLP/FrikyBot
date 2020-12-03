let NAVIGATIONV2_SETTINGS = {
    ALLOW_AUTO_URL_HIGHLIGHTING: true,
    ALLOW_AUTO_SCROLL_HIGHLIGHTING: true,
    SCROLL_HIGLIGHT_DATA: [],
    SCROLL_SMOOTHER: 20,
    SCROLL_SMOOTHER_CTR: 0
};

function NAVIGATIONV2_create(data = [], name = "") {
    let s = '';

    s += '<div class="NAVIGATIONV2" id="' + name + '">';

    //Section
    for (let dataset of data) {
        s += NAVIGATIONV2_createTYPE(dataset, null, name);
    }
    
    s += '</div>';
    return s;
}
function NAVIGATIONV2_createTYPE(dataset = {}, parentType, parentName) {
    if (dataset.type === "section" && !parentType) {
        //Section
        return NAVIGATIONV2_createSection(dataset.name, dataset.contents, dataset.expandable, dataset.expanded, parentName);
    } else if (dataset.type === "subsection" && parentType === "section") {
        //SubSection
        return NAVIGATIONV2_createSubSection(dataset.name, dataset.contents, dataset.expandable, dataset.expanded, parentName);
    } else if (dataset.type === "icon" && (parentType === "section" || !parentType)) {
        //Content - Icon Style / NavigationV1
        return NAVIGATIONV2_createIconStyleContent(dataset.name, dataset.href, dataset.icon, parentName);
    } else if (!dataset.type && (parentType === "section" || !parentType)) {
        //Content - Non Icon Style / Plain
        return NAVIGATIONV2_createSectionContent(dataset.name, dataset.href, parentName);
    } else if (!dataset.type && (parentType === "subsection" || !parentType)) {
        //Content - SubSection
        return NAVIGATIONV2_createSubSectionContent(dataset.name, dataset.href, parentName);
    } else {
        return '';
    }
}

//Section
function NAVIGATIONV2_createSection(name, contents, expandable, expanded, parentName) {
    let s = '<div class="NAVIGATIONV2_Section';

    if (expandable == true)
        s += ' Expandable';

    if (expandable == true && expanded == true)
        s += ' expanded';

    s += '">';

    //Header
    s += '<div class="NAVIGATIONV2_Section_Header"><div>' + name + '</div><span onclick="toggleClass(this, \'expanded\', 2)"></span></div>';
    //Contents
    s += '<div class="NAVIGATIONV2_Section_Contents">';

    for (let cont of contents) {
        s += NAVIGATIONV2_createTYPE(cont, 'section', (parentName ? parentName + "_" : "") + name);
    }

    s += '</div>';
    return s + '</div>';
}

//Non Icon Style - Section Content
function NAVIGATIONV2_createSectionContent(name, href, parentName) {
    if (!name)
        return "";
    
    let s = '';
    s += '<a ' + (href ? 'href="' + NAVIGATIONV2_REMOVE_DOUBLE_SLASH(ROOT + href) + '" ' : '');
    s += 'class="NAVIGATIONV2_Section_Content' + (NAVIGATIONV2_URL_HL_CHECK(href) ? ' NAVIGATIONV2_URL_HIGHLIGHTED" title="Current Page"' : '"') + '>';
    s += '<span id="' + parentName + "_" + name + '">' + name + '</span>';
    s += '</a>';

    return s;
}

//NavigationV1 -> Icon Style
function NAVIGATIONV2_createIconStyleContent(name, href, icon, parentName) {
    if (!name || !icon)
        return "";
    
    let s = '';
    s += '<a ' + (href ? 'href="' + NAVIGATIONV2_REMOVE_DOUBLE_SLASH(ROOT + href) + '" ' : '');
    s += 'class="NAVIGATIONV2_Section_Icon_Content' + (NAVIGATIONV2_URL_HL_CHECK(href) ? ' NAVIGATIONV2_URL_HIGHLIGHTED" title="Current Page"' : '"') + '">';
    s += '<img src="' + ROOT + icon + '" data-type="' + getFileTypeByURL(icon) + '"/>';
    s += '<span id="' + parentName + "_" + name + '">' + name + '</span>';
    s += '</a>';

    return s;
}

//SubSection
function NAVIGATIONV2_createSubSection(name, contents, expandable, expanded, parentName) {
    let s = '<div class="NAVIGATIONV2_SubSection';

    if (expandable == true)
        s += ' Expandable';

    if (expandable == true && expanded == true)
        s += ' expanded';

    s += '">';

    //Header
    s += '<div class="NAVIGATIONV2_SubSection_Header"><div>' + name + '</div><span onclick="toggleClass(this, \'expanded\', 2)"></span></div>';
    //Contents
    s += '<div class="NAVIGATIONV2_SubSection_Contents">';

    for (let cont of contents) {
        s += NAVIGATIONV2_createTYPE(cont, 'subsection', (parentName ? parentName + "_" : "") + name);
    }

    s += '</div>';
    return s + '</div>';
}
function NAVIGATIONV2_createSubSectionContent(name, href, parentName) {
    if (!name || !href)
        return "";

    if (href.indexOf('#') >= 0) {
        NAVIGATIONV2_SETTINGS.SCROLL_HIGLIGHT_DATA.push(href.substring(href.indexOf('#') + 1));
    }

    let s = '';

    s += '<a ' + (href ? 'href="' + NAVIGATIONV2_REMOVE_DOUBLE_SLASH(ROOT + href) + '" ' : '');
    s += 'class="NAVIGATIONV2_SubSection_Content' + (NAVIGATIONV2_URL_HL_CHECK(href) ? ' NAVIGATIONV2_URL_HIGHLIGHTED" title="Current Page"' : '"') + ' >';
    s += '<span id="' + parentName + "_" + name + '">' + name + '</span>';
    s += '</a>';

    return s;
}

//UTIL
function NAVIGATIONV2_URL_HL_CHECK(name) {
    if (!name)
        return false;
    
    return NAVIGATIONV2_SETTINGS.ALLOW_AUTO_URL_HIGHLIGHTING && ((name != "/" && window.location.pathname.length >= name.length && window.location.pathname.startsWith(name)) || window.location.pathname == name || window.location.pathname == '/' + name);
}
function NAVIGATIONV2_SCROLL_HL_CHECK(now = false) {
    NAVIGATIONV2_SETTINGS.SCROLL_SMOOTHER_CTR++;

    if (now == true || NAVIGATIONV2_SETTINGS.SCROLL_SMOOTHER_CTR > NAVIGATIONV2_SETTINGS.SCROLL_SMOOTHER) {
        NAVIGATIONV2_SETTINGS.SCROLL_SMOOTHER_CTR = 0;
        //Check all Registered Scroll Highlight IDs
        for (let id of NAVIGATIONV2_SETTINGS.SCROLL_HIGLIGHT_DATA) {
            let element = document.getElementById(id);

            if (element && element.getBoundingClientRect().bottom >= 0) {
                //Find Matching Navigation Link
                let as = document.getElementsByTagName('a');
                for (let a of as) {
                    if (a.href.substring(a.href.indexOf('#') + 1) == id) {
                        //Switch Highlighted Navigation Link
                        let old = document.getElementsByClassName("NAVIGATIONV2_HASH_HIGHLIGHTED");
                        if (old.length > 0) {
                            old[0].classList.remove("NAVIGATIONV2_HASH_HIGHLIGHTED");
                        }
                        a.classList.add("NAVIGATIONV2_HASH_HIGHLIGHTED");
                        break;
                    }
                }
                break;
            }
        }
    }
}
function NAVIGATIONV2_REMOVE_DOUBLE_SLASH(url) {
    while (url.indexOf('//') > -1) {
        url = url.split('//')[0] + '/' + url.split('//')[1];
    }

    return url;
}