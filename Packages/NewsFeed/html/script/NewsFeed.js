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

                if (replace) {
                    document.getElementById("NEWS_FEED_Feed").innerHTML = s;
                } else {
                    document.getElementById("NEWS_FEED_Feed").innerHTML += s;
                }
            }

            return json.data;
        })
        .catch(err => {
            return Promise.reject(err);
        });
}
async function NEWS_FEED_FETCH_FullPage(page) {
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

function NEWS_FEED_POST_PublishNews(data, Authentication) {
    let options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            Authentication: "TBD"
        },
        body: JSON.stringify({ data: data})
    };

    fetch("/api/NewsFeed/Publish", options)
        .then(data => data.json())
        .then(json => {
            console.log(json);
        })
        .catch(err => {
            console.log(err);
        });
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