/* -------------------------------------
 *          NEEDED HTML CODE
 * -------------------------------------
 * 
    <div id="News_Feed">
        <!-- News will be placed here -->
    </div>
 * 
 * -------------------------------------
 *            DOCUMENTATION
 * -------------------------------------
 * 
 *  -> See BIG Documentation .../Util/NewsFeed
 * 
 * -------------------------------------
 *             API ENDPOINT
 * -------------------------------------
 * 
 * 
 * 
 *  -------------------------------------
 *         ADDITIONAL FETURES
 * -------------------------------------
 * 
 */

let NEWS_FEED_SETTINGS = {
    reversed: false,
    folder: "News/",
    publicFolder: "../",
    DEFAULT_LINK_TARGET: "_blank",
    ROOT_URL: "/api/News/"
};
const NEWS_FEED_NEWSMAKER_ELEMENTS = {
    title_id: 'Editor_Input_Title',
    data_id: 'Editor_Input_Date',
    page_id: 'Editor_Input_Page',
    top_id: 'Editor_Input_Description_Top',
    bottom_id: 'Editor_Input_Description_Bottom',
    image_class: 'NEWS_FEED_NEWSMAKER_IMAGE',
    misc_class: 'NEWS_FEED_NEWSMAKER_MISC'
};

function NEWS_FEED_Settings(settings) {
    for (key in settings) {
        NEWS_FEED_SETTINGS[key] = settings[key];
    }
}

////////////////////////////////////
//          API STUFF
////////////////////////////////////

async function NEWS_FEED_FETCH(endpoint, querry) {
    return fetch(NEWS_FEED_SETTINGS.ROOT_URL + endpoint + (querry ? "?" + querry : ""))
        .then(data => data.json())
        .then(json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            } else {
                return Promise.resolve(json);
            }
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

async function NEWS_FEED_FETCH_Feed(endpoint, querry, replace) {
    try {
        document.getElementById("NEWS_FEED_Feed").innerHTML = '<div id="NEWS_FEED_Feed_WAITER">' + MISC_LOADING_RING_CREATE() + '</div>';
    } catch (err) {

    }

    return NEWS_FEED_FETCH(endpoint, querry)
        .then(json => {
            if (document.getElementById("NEWS_FEED_Feed") && json.data.News && Array.isArray(json.data.News)) {
                let s = "";

                for (let news of json.data.News) {
                    if (NEWS_FEED_SETTINGS.reversed) {
                        s = NEWS_FEED_createFeed(news) + s;
                    } else {
                        s += NEWS_FEED_createFeed(news);
                    }
                }

                if (s === "") {
                    s = '<center class="NEWS_FEED_NO_NEWS">NO NEWS FOUND</center>';
                }

                if (replace) {
                    document.getElementById("NEWS_FEED_Feed").innerHTML = s;
                } else {
                    document.getElementById("NEWS_FEED_Feed").innerHTML += s;
                }
            }
            
            if (document.getElementById("NEWS_FEED_Feed_WAITER")) document.getElementById("NEWS_FEED_Feed_WAITER").remove();
            return json.data;
        })
        .catch(err => {
            if (document.getElementById("NEWS_FEED_Feed_WAITER")) document.getElementById("NEWS_FEED_Feed_WAITER").remove();
            return Promise.reject(err);
        });
}
async function NEWS_FEED_FETCH_FullPage(page) {
    try {
        document.getElementById("NEWS_FEED_Feed").innerHTML = '<div id="NEWS_FEED_Feed_WAITER">' + MISC_LOADING_RING_CREATE() + '</div>';
    } catch (err) {

    }

    return NEWS_FEED_FETCH("News", 'page=' + page)
        .then(json => {
            if (document.getElementById("NEWS_FEED_FullPage") && json.data.News && json.data.News[0]) {
                document.getElementById("NEWS_FEED_FullPage").innerHTML = NEWS_FEED_createFullPage(json.data.News[0]);
            }

            return json.data;
        })
        .catch(err => {
            return Promise.reject(err);
        });
}

function NEWS_FEED_API_Publish(data) {
    let options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + (TTV_PROFILE_getCookieData() ? TTV_PROFILE_getCookieData().id_token : undefined)
        },
        body: JSON.stringify(data)
    };

    fetch(NEWS_FEED_SETTINGS.ROOT_URL + "publish", options)
        .then(checkResponse)
        .then(json => {
            console.log(json);
        })
        .catch(err => {
            console.log(err);
        });
}
async function checkResponse(response) {
    if (response.status === 200) {
        return response.json();
    } else if (response.status === 401) {
        return Promise.reject(new Error("Unauthorized"));
    } else {
        return Promise.reject(new Error("Error: " + response.status + " - " + response.statusText));
    }
}

////////////////////////////////////
//          CreateParts
////////////////////////////////////

function NEWS_FEED_createFeed(data) {
    
    if (!data.title || !data.date) {
        return "";
    }

    //HEADERS - Title / Date
    let News_Feed_Header = '<div class="News_Feed_Header"><h2><a ' + (data.Page ? 'href="' + NEWS_FEED_SETTINGS.folder + data.Page + '"' : '') + '>' + data.title + '</a></h2><p>' + NEWS_FEED_getDateString(data.date) + '</p></div >';

    //BODY
    let News_Feed_Body = '<div class="News_Feed_Body">' + NEWS_FEED_createImages(data.images, data.Page) + NEWS_FEED_createDescription(data.description.top, "News_Feed_Text_Top") + NEWS_FEED_createDescription(data.description.bottom, "News_Feed_Text_Bottom") + NEWS_FEED_createMisc(data.misc) + '</div >';
    
    //News Wrapper
    let News_Feed_News = '<div class="News_Feed_News">' + News_Feed_Header + News_Feed_Body + '</div>';


    return News_Feed_News;
}
function NEWS_FEED_createFullPage(data) {
    if (!data.title || !data.date) {
        return "";
    }

    //HEADERS - Title / Date
    let News_Feed_Header = '<div class="News_Feed_Header"><h2>' + data.title + '</h2><p>' + NEWS_FEED_getDateString(data.date) + '</p></div >';

    //BODY
    let News_Feed_Big_Image = data.images && data.images.length >= 1 ? NEWS_FEED_createA(NEWS_FEED_createImage(data.images[0].source, data.images[0].title), (data.images[0].link == "this" ? data.images[0].source : data.images[0].link), data.images[0].target, "News_Feed_Big_Image") : "";
    let News_Feed_Body = '<div class="News_Feed_Body">' + News_Feed_Big_Image + NEWS_FEED_createDescription(data.description.top, "News_Feed_Text_Top") + NEWS_FEED_createDescription(data.description.bottom, "News_Feed_Text_Bottom") + NEWS_FEED_createMisc(data.misc) + '</div >';
    
    //News Wrapper
    return '<div class="Wrapper">' + News_Feed_Header + News_Feed_Body + "</div>" + NEWS_FEED_getExtraImages(data.images);
    
}

function NEWS_FEED_createImages(images, page) {
    let News_Feed_Images = '';

    if (images && Array.isArray(images)) {

        let Images = '';

        for (let i = 0; i < images.length && i < 5; i++) {
            let img = images[i];

            if (!img.source) {
                continue;
            }

            Images += NEWS_FEED_createA(NEWS_FEED_createImage(img.source, img.title), (img.link == "this" ? img.source : img.link), img.target, (i == 0 ? "News_Feed_Big_Image" : "News_Feed_Small_Image"));
        }

        if (images.length >= 5) {
            Images += '<a ' + (page ? 'href="' + NEWS_FEED_SETTINGS.folder + page + '"' : '') + ' class="News_Feed_More_Images">...</a>';
        }

        News_Feed_Images = '<div class="News_Feed_Images">' + Images + '</div>';
    }

    return News_Feed_Images;
}
function NEWS_FEED_createDescription(array, Class) {
    if (array && Array.isArray(array)) {
        let content = '';
        for (let p of array) {
            if (typeof p === 'string' || p instanceof String) {
                content += '<p>' + p + '</p>';
            } else if (p.text && (!p.isHeadline || p.isHeadline == false)) {
                content += '<p>' + p.text + '</p>';
            } else if (p.text && p.isHeadline == true) {
                content += '<h3>' + p.text + '</h3>';
            }
        }
        return '<div ' + (Class ? ' class="' + Class + '" ' : '') +  '>' + content + '</div>';
    }
    return "";
}
function NEWS_FEED_createMisc(miscs) {
    if (miscs && Array.isArray(miscs)) {

        let Miscs = "";

        for (let misc of miscs) {
            if (!misc.icon || !misc.type || !misc.text) {
                continue;
            }

            if (misc.type == "link" && misc.link) {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + NEWS_FEED_createA(misc.text, (misc.type == "link" ? (misc.link == "this" ? misc.icon : misc.link) : null), misc.target) + '</div>';
            } else if (isColor(misc.type)) {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + '<a style="color: ' + misc.type + '">' + misc.text + '</a></div>';
            } else if (isSize(misc.type)) {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + '<a style="font-size: ' + misc.type + '">' + misc.text + '</a></div>';
            } else {
                Miscs += '<div class="News_Feed_Text_Misc">' + NEWS_FEED_createImage(misc.icon) + '<a>' + misc.text + '</a></div>';
            }
        }

        return '<div class="News_Feed_Text_Miscs">' + Miscs + '</div>';
    }

    return "";
}
function NEWS_FEED_getExtraImages(images) {
    if (images && Array.isArray(images) && images.length >= 2) {
        let AllImages = '';

        for (let img of images) {
            if (!img.source) {
                continue;
            }
            AllImages += NEWS_FEED_createA(NEWS_FEED_createImage(img.source, img.title), (img.link == "this" ? img.source : img.link), img.target);
        }
        return '<div class="News_Feed_Images"><h2>Other Images</h2><div>' + AllImages + '</div></div>';
    }
    return "";
}

////////////////////////////////////
//          CreateElements
////////////////////////////////////

function NEWS_FEED_createImage(source, title) {
    return '<img src="' + NEWS_FEED_CheckSource(source) + '"' + (title ? 'title="' + title + '"' : "") + '/>';
}
function NEWS_FEED_createA(text, link, target, Class, id) {
    return '<a ' + (Class ? ' class="' + Class + '" ' : '') + (id ? ' id="' + id + '" ' : '') + ' ' + (link ? ' href="' + NEWS_FEED_CheckSource(link) + '" ' : "") + 'target="' + (target ? target : NEWS_FEED_SETTINGS.DEFAULT_LINK_TARGET) + '" >' + text + '</a>';
}

////////////////////////////////////
//           NewsMaker
////////////////////////////////////

function NEWS_FEED_NEWSMAKER_updatePreview() {
    document.getElementById("NEWS_FEED_FullPage").innerHTML = NEWS_FEED_createFullPage(NEWS_FEED_NEWSMAKER_generateJSON());

    if (document.getElementById("NEWS_FEED_FullPage").innerHTML == "" && document.getElementById("Publish_Button_enabled")) {
        document.getElementById("Publish_Button_enabled").id = "Publish_Button_disabled";
    } else if (document.getElementById("NEWS_FEED_FullPage").innerHTML != "" && document.getElementById("Publish_Button_disabled")) {
        document.getElementById("Publish_Button_disabled").id = "Publish_Button_enabled";
    }
}
function NEWS_FEED_NEWSMAKER_generateJSON() {
    //Collect Data
    let preview = {
        title: document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.title_id).value,
        description: {
            top: [],
            bottom: []
        },
        images: [],
        misc: [],
        date: new Date(document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.data_id).value).getTime(),
        Page: document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.page_id).value
    };

    //Add Top Paragraphs
    for (let p of document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.top_id).value.split("\n")) {
        if (p.indexOf("#") == 0) {
            preview.description.top.push({ text: p.substring(1), isHeadline: true });
        } else if (p.length > 0) {
            preview.description.top.push(p);
        }
    }

    //Add Bottom Paragraphs
    for (let p of document.getElementById(NEWS_FEED_NEWSMAKER_ELEMENTS.bottom_id).value.split("\n")) {
        if (p.indexOf("#") == 0) {
            preview.description.bottom.push({ text: p.substring(1), isHeadline: true });
        } else if (p.length > 0) {
            preview.description.bottom.push(p);
        }
    }
    
    //Add Images
    for (let img of document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class)) {
        let img_json = {
            source: img.childNodes[1].childNodes[0].value ? img.childNodes[1].childNodes[0].value : "",
            title: img.childNodes[1].childNodes[1].value ? img.childNodes[1].childNodes[1].value : "",
            link: img.childNodes[1].childNodes[3].value ? img.childNodes[1].childNodes[3].value : "",
            target: img.childNodes[1].childNodes[4].value ? img.childNodes[1].childNodes[4].value : ""
        };
        preview.images.push(img_json);
    }

    //Add Misc
    for (let misc of document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class)) {
        let misc_json = {
            text: misc.childNodes[1].childNodes[0].value ? misc.childNodes[1].childNodes[0].value : "",
            icon: misc.childNodes[1].childNodes[1].value ? misc.childNodes[1].childNodes[1].value : "",
            type: misc.childNodes[1].childNodes[3].childNodes[0].value ? misc.childNodes[1].childNodes[3].childNodes[0].value : ""
        };

        if (misc_json.type == "link") {
            misc_json.link = misc.childNodes[1].childNodes[3].childNodes[1].value ? misc.childNodes[1].childNodes[3].childNodes[1].value : "";
            misc_json.target = misc.childNodes[1].childNodes[3].childNodes[2].value ? misc.childNodes[1].childNodes[3].childNodes[2].value : "";
        } else if (misc_json.type == "color") {
            misc_json.type = misc.childNodes[1].childNodes[3].childNodes[1].value ? misc.childNodes[1].childNodes[3].childNodes[1].value : "";
        } else if (misc_json.type == "size") {
            misc_json.type = misc.childNodes[1].childNodes[3].childNodes[1].value ? misc.childNodes[1].childNodes[3].childNodes[1].value : "";
        }
        preview.misc.push(misc_json);
    }

    //Return Data
    return preview;
}

function NEWS_FEED_NEWSMAKER_ADD_IMAGE() {
    let s = '<center>' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class).length + 1) + '</center>';
    s += '<div>';
    s += '<input placeholder="Source here" />';
    s += '<input placeholder="Title here" />';
    s += '<br />';
    s += '<input placeholder="Link here" />';
    s += '<select><option value="" selected>target</option><option value="_blank">_blank</option><option value="_self">_self</option><option value="_parent">_parent</option><option value="_top">_top</option></select>';
    s += '</div>';

    let elt = document.createElement("div");
    elt.classList.add("Element");
    elt.classList.add(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class);
    elt.id = 'Image_' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.image_class).length + 1);
    elt.setAttribute("draggable", "true");
    elt.setAttribute("ondragover", "NEWS_FEED_NEWSMAKER_allowDrop(event)");
    elt.setAttribute("ondragstart", "NEWS_FEED_NEWSMAKER_drag(event)");
    elt.setAttribute("ondrop", "NEWS_FEED_NEWSMAKER_dropSwap(event)");
    elt.innerHTML = s;
    document.getElementById("Image_List").append(elt);
}
function NEWS_FEED_NEWSMAKER_ADD_MISC() {
    let s = '<center>' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class).length + 1) + '</center>';
    s += '<div>';
    s += '<input placeholder="Text here" />';
    s += '<input placeholder="Icon Source here" />';
    s += '<br />';
    s += '<div>';
    s += '<select oninput="Misc_Type_Change(this)">';
    s += '<option value="info">info</option>';
    s += '<option value="link">Link</option>';
    s += '<option value="color">color</option>';
    s += '<option value="size">size</option>';
    s += '</select>';
    s += '</div>';
    s += '</div>';

    let elt = document.createElement("div");
    elt.classList.add("Element");
    elt.classList.add(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class);
    elt.id = 'Misc_' + (document.getElementsByClassName(NEWS_FEED_NEWSMAKER_ELEMENTS.misc_class).length + 1);
    elt.setAttribute("draggable", "true");
    elt.setAttribute("ondragover", "NEWS_FEED_NEWSMAKER_allowDrop(event)");
    elt.setAttribute("ondragstart", "NEWS_FEED_NEWSMAKER_drag(event)");
    elt.setAttribute("ondrop", "NEWS_FEED_NEWSMAKER_dropSwap(event)");
    elt.innerHTML = s;
    document.getElementById("Misc_List").append(elt);
}
function NEWS_FEED_NEWSMAKER_MISC_Change() {
    let types = '<option value="info">info</option><option value="link">Link</option><option value="color">color</option><option value="size">size</option>';
    let elt = x.parentElement;
    let idx = 0;

    if (x.value == "link") {
        types = '<option value="info">info</option><option value="link" selected>Link</option><option value="color">color</option><option value="size">size</option>';
        types += '<input type="text" placeholder="Link in here (can be /"this/")" /><select><option value="" selected>target</option><option value="_blank">_blank</option><option value="_self">_self</option><option value="_parent">_parent</option><option value="_top">_top</option></select>';
        idx = 1;
    } else if (x.value == "color") {
        types = '<option value="info">info</option><option value="link">Link</option><option value="color" selected>color</option><option value="size">size</option>';
        types += '<input type="text" placeholder="Color here!" />';
        idx = 2;
    } else if (x.value == "size") {
        types = '<option value="info">info</option><option value="link">Link</option><option value="color">color</option><option value="size" selected>size</option>';
        types += '<input type="text" placeholder="Size here! (px and em only)" />';
        idx = 3;
    }

    console.log(x.value);

    elt.innerHTML = '<select oninput="Misc_Type_Change(this)">' + types + '</select>';
}

function NEWS_FEED_NEWSMAKER_publish() {
    if (document.getElementById("Publish_Button_enabled")) {
        NEWS_FEED_API_Publish(NEWS_FEED_NEWSMAKER_generateJSON());
    }
}

function NEWS_FEED_NEWSMAKER_allowDrop(event) {
    event.preventDefault();
}
function NEWS_FEED_NEWSMAKER_drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}
function NEWS_FEED_NEWSMAKER_dropTrash(event) {
    event.preventDefault();
    let elt = document.getElementById(event.dataTransfer.getData("text"));
    let elts = document.getElementsByClassName(elt.classList[1]);
    let i = 0;

    elt.remove();

    for (let elte of elts) {
        elte.id = elte.id.sub(0, elte.id.indexOf("_") + 1) + (++i);
        elte.childNodes[0].innerHTML = i;
    }
}
function NEWS_FEED_NEWSMAKER_dropSwap(event) {
    event.preventDefault();
    let elt1 = document.getElementById(event.dataTransfer.getData("text"));
    let elt2 = event.srcElement;

    if (!elt1 || !elt2) {
        return;
    }

    do {
        elt2 = elt2.parentElement;
    } while (!elt2.classList.contains("Element"));

    if (elt1.classList.value == elt2.classList.value && elt1 != elt2) {
        //Swap ID
        let temp = elt1.id;
        elt1.id = elt2.id;
        elt2.id = temp;

        //Save Values
        elt1 = elt1.childNodes[1];
        elt2 = elt2.childNodes[1];

        let values1 = [];
        let values2 = [];

        for (let v of elt1.childNodes) {
            values1.push(v.value);
        }
        for (let v of elt2.childNodes) {
            values2.push(v.value);
        }

        //SWAP
        temp = elt1.innerHTML;
        elt1.innerHTML = elt2.innerHTML;
        elt2.innerHTML = temp;

        for (let i = 0; i < elt2.childNodes.length && i < values1.length; i++) {
            if (values1[i]) {
                elt2.childNodes[i].value = values1[i];
            }
        }
        for (let i = 0; i < elt1.childNodes.length && i < values2.length; i++) {
            if (values2[i]) {
                elt1.childNodes[i].value = values2[i];
            }
        }
    }
}

////////////////////////////////////
//              UTIL
////////////////////////////////////

function NEWS_FEED_CheckSource(source) {
    return (source.indexOf("http://") == -1 && source.indexOf("https://") == -1 ? NEWS_FEED_SETTINGS.publicFolder + source : source);
}
function NEWS_FEED_getDateString(ISO_Integer) {
    let d = new Date(ISO_Integer);

    if (!(d.getTime() === d.getTime())) {
        return "--.--.----";
    }

    return d.getDate() + "." + (d.getMonth()+1) + "." + d.getFullYear();
}