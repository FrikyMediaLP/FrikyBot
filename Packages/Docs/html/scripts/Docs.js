//DOCSV2
async function createOverviewPage(data) {
    if (!data) {
        try {
            data = await fetchNav();
        } catch (err) {
            console.log(err);
        }
    }

    let s = '';
    s += '<center class="DOCS_OVERVIEW_HEADER">Welcome to the FrikyBot Documentation</center>';
    if (data) {
        s += '<h1>REFERENCE</h1>';

        for (let cat of data[1].contents) {
            s += '<h2>' + cat.name + '</h2>';
            s += '<div class="DOCS_OVERVIEW_REF">';
            for (let card of cat.contents) {
                s += '<div class="DOCS_OVERVIEW_CARD">';
                s += '<center class="DOCS_OVERVIEW_CARD_TITLE">' + card.name + '</center>';
                s += '<center><a href="' + card.href + '">Visit Docs</a></center>';
                s += '</div>';
            }
            s += '</div>';
        }
        
        s += '<h1>GUIDE</h1>';
        s += '<p>soon</p>';
    }

    return s;
}
async function createModuleOverview(data) {
    if (!data) {
        try {
            data = await fetchDocsData();
            data = data[getModuleName()];
        } catch (err) {
            return Promise.reject(err);
        }
    }
    data = data[getModuleName()];

    let s = '';

    //TITLE
    s += '<h1>' + getModuleName() + '.js</h1>';
    s += '<p>' + data.description + '</p>';

    //MODULES / DEPENDENCIES
    if (data.modules) {
        s += '<h1 id="DOCS_MODULE_MODULES">Modules / Dependencies</h1>';
        s += '<div class="DOCS_DEPENDENCIES">';
        for (let mod in data.modules) {
            let href = '';
            let title = '';

            if (data.modules[mod] == 'npm') {
                title = 'title="NPM Module"';
                href = 'href="https://www.npmjs.com/package/' + mod + '"';
            } else if (data.modules[mod] == 'NodeJS Module') {
                title = 'title="Core Node Module"';
            } else if (data.modules[mod] == 'FrikyBot Module') {
                title = 'title="Local FrikyBot Module"';
            }

            s += '<a ' + href + ' target="_blank" ' + title + '><center>' + mod + '</center></a>';
        }
        s += '</div>';
    }

    //Variables
    if (data.variables) {
        s += '<h2 id="DOCS_MODULE_VARIABLES">Variables</h2>';
        s += createTable(data.variables, ['name', 'type', 'description'], (name, data) => '<a href="?ext=VAR_' + name + '">' + name + '</a>');
    }

    //Functions
    if (data.functions) {
        s += '<h2 id="DOCS_MODULE_FUNCTIONS">Functions</h2>';
        const headerCallback = (name, data) => {
            let h = '<a style="background-color: rgba(25, 163, 255, 0.2);" href="?ext=FUNC_' + name + '">';
            h += '<div style="width: 100%; height: 25px;">' + createFunctionHeader(name, data) + '</div></a>';
            return h;
        };
        s += createTable(data.functions, ['name', 'description'], headerCallback);
    }

    //Classes
    if (data.classes) {
        s += '<h2 id="DOCS_MODULE_CLASSES">Classes</h2>';
        s += createTable(data.classes, ['name', 'description'], (name, data) => '<a href="' + getModuleName() + '/' + name + '">' + name + '</a>');
    }


    //API
    if (data.API) {
        s += DOCS_createAPI(data.API.ROOT, data.API.Endpoints, false);
    }

    //FileHosting
    if (data.FileHosting) {
        s += DOCS_createFileHosting(data.FileHosting.ROOT, data.FileHosting.Static, data.FileHosting.Routes, false);
    }

    //Exports
    if (data.exports) {
        s += '<h2 id="DOCS_MODULE_EXPORTS">Module Exports</h2>';
        if (data.exports instanceof Object)
            s += createTable(data.exports, ['name', 'type']);
        else
            s += data.exports.toString();
    }

    return Promise.resolve(s);
}
async function createModuleExpanded(data) {
    if (!data) {
        try {
            data = await fetchDocsData();
            data = data[getModuleName()];
        } catch (err) {
            return Promise.reject(err);
        }
    }
    data = data[getModuleName()];

    let s = '';

    //TITLE
    s += '<h1>' + getModuleName() + '.js</h1>';
    s += '<p>' + data.description + '</p>';

    //MODULES / DEPENDENCIES
    s += '<h1>Modules / Dependencies</h1>';
    if (data.modules) {
        s += '<div class="DOCS_DEPENDENCIES">';
        for (let mod in data.modules) {
            let href = '';
            let title = '';

            if (data.modules[mod] == 'npm') {
                title = 'title="NPM Module"';
                href = 'href="https://www.npmjs.com/package/' + mod + '"';
            } else if (data.modules[mod] == 'NodeJS Module') {
                title = 'title="Core Node Module"';
            } else if (data.modules[mod] == 'FrikyBot Module') {
                title = 'title="Local FrikyBot Module"';
            }

            s += '<a ' + href + ' target="_blank" ' + title + '><center>' + mod + '</center></a>';
        }
        s += '</div>';
    } else {
        s += '<p>None</p>';
    }

    //Variables
    s += '<h2>Variables</h2>';
    if (data.variables) {
        for (let name in data.variables) {
            s += '<div class="DOCS_VARIABLE_SINGLE" id="VAR_' + name + '">';
            s += '<p><span class="Name">' + name + '</span><a class="Type">' + data.variables[name].type + '</a></p>';
            s += '<div class="DOCS_VARIABLE_DETAILS">';
            s += '<p>' + data.variables[name].description + '</p></div></div>';
        }
    } else {
        s += '<p>None</p>';
    }

    //Functions
    s += '<h2>Functions</h2>';
    if (data.functions) {
        for (let name in data.functions) {
            s += '<div class="DOCS_FUNCTION_SINGLE"  id="FUNC_' + name + '">';
            s += createFunctionHeader(name, data.functions[name], getModuleName(), false);
            s += '<div class="DOCS_FUNCTION_DETAILS">';
            s += '<p>' + data.functions[name].description + '</p></div></div>';
        }
    } else {
        s += '<p>None</p>';
    }

    //Classes
    s += '<h2>Classes</h2>';
    if (data.classes) {
        s += createTable(data.classes, ['name', 'description'], (name, data) => '<a href="' + getModuleName() + '/' + name + '">' + name + '</a>');
    } else {
        s += '<p>None</p>';
    }
    
    //API
    if (data.API) {
        s += DOCS_createAPI(data.API.ROOT, data.API.Endpoints, true);
    }

    //FileHosting
    if (data.FileHosting) {
        s += DOCS_createFileHosting(data.FileHosting.ROOT, data.FileHosting.Static, data.FileHosting.Routes, true);
    }

    //Exports
    s += '<h2>Module Exports</h2>';
    if (data.exports) {
        if (data.exports instanceof Object)
            s += createTable(data.exports, ['name', 'type']);
        else
            s += data.exports.toString();
    } else {
        s += '<p>None</p>';
    }

    return s;
}
async function createClass(data) {
    if (!data) {
        try {
            data = await fetchDocsData();
            data = data[getModuleName()];
        } catch (err) {
            return Promise.reject(err);
        }
    }
    data = data[getClassName()];

    let s = '';

    //TITLE
    s += '<h1>' + getModuleName() + '::' + getClassName() + '</h1>';
    s += '<p>' + data.description + '</p>';

    //Parent Class
    s += '<h1>Parent Class</h1>';
    if (data.parent) {
        s += '<div class="DOCS_DEPENDENCIES">';

        let href = '';
        let title = '';

        if (data.parent.from.npm == true) {
            title = 'title="NPM Module"';
            href = 'href="https://www.npmjs.com/package/' + data.parent.name + '"';
        } else if (data.parent.from.type == 'NodeJS Module') {
            title = 'title="Core Node Module"';
        } else if (data.parent.from.type == 'FrikyBot Module') {
            title = 'title="Local FrikyBot Module"';
            href = 'href="' + ROOT + "Docs/" + data.parent.from.name + '/' + data.parent.name + '"';
        }

        s += '<a ' + href + ' ' + title + '><center>' + data.parent.name + '</center></a>';

        s += '</div>';
    } else {
        s += '<p>None</p>';
    }

    //Constructor
    s += '<h2>Constructor</h2>';
    if (data.constructor) {
        s += '<div class="DOCS_FUNCTION_SINGLE"  id="FUNC_constructor">';
        s += createFunctionHeader('constructor', data.constructor, getClassName(), false);
        s += '<div class="DOCS_FUNCTION_DETAILS">';
        s += '<p>' + data.constructor.description + '</p></div></div>';
    } else {
        s += '<p>HMMMM there should be something .... </p>';
    }

    //Variables
    s += '<h2>Variables</h2>';
    if (data.variables) {
        for (let name in data.variables) {
            s += '<div class="DOCS_VARIABLE_SINGLE" id="VAR_' + name + '">';
            s += '<p><span class="Name">' + name + '</span><a class="Type">' + data.variables[name].type + '</a></p>';
            s += '<div class="DOCS_VARIABLE_DETAILS">';
            s += '<p>' + data.variables[name].description + '</p></div></div>';
        }
    } else {
        s += '<p>None</p>';
    }
    
    //Functions
    s += '<h2>Functions</h2>';
    if (data.functions) {
        for (let name in data.functions) {
            s += '<div class="DOCS_FUNCTION_SINGLE"  id="FUNC_' + name + '">';
            s += createFunctionHeader(name, data.functions[name], getModuleName(), false);
            s += '<div class="DOCS_FUNCTION_DETAILS">';
            s += '<p>' + data.functions[name].description + '</p></div></div>';
        }
    } else {
        s += '<p>None</p>';
    }

    //API
    if (data.API) {
        s += DOCS_createAPI(data.API.ROOT, data.API.Endpoints, true);
    }

    //FileHosting
    if (data.FileHosting) {
        s += DOCS_createFileHosting(data.FileHosting.ROOT, data.FileHosting.Static, data.FileHosting.Routes, true);
    }

    return s;
}

function DOCS_createAPI(root, endpoints, printNone = false) {
    let s = '';
    
    if (root || endpoints || printNone == true) {
        s += '<h2>API</h2>';
    }

    if (root) {
        s += '<h3><b>Root: ' + root + '</b></h3>';
    }

    if (endpoints) {
        for (let endpoint of endpoints) {
            s += '<div class="DOCS_API_ENDPOINT" id="API_' + replaceAll(endpoint.name, " ", "_") + '">';
            s += '<h3>' + endpoint.name + '</h3>';

            if (endpoint.restricted === "partial") {
                s += '<center class="DOCS_API_ENDPOINT_INFO">This Endpoint is partially restricted by Authentication!</center>';
            } else if (endpoint.restricted === "full") {
                s += '<center class="DOCS_API_ENDPOINT_INFO">This Endpoint is restricted by Authentication!</center>';
            }

            s += '<p>' + endpoint.description + '</p>';

            //REQUEST
            if (endpoint.request) {
                if (endpoint.request.querry) {
                    s += '<h4>Request Querry Parameters</h4>';
                    s += createTable(endpoint.request.querry, ['name', 'type', 'description']);
                }

                if (endpoint.request.method) {
                    s += '<p><b>Method: ' + endpoint.request.method + '</b></p>';
                }

                if (endpoint.request.body) {
                    s += '<h4>Request Body Fields</h4>';
                    s += createTable(endpoint.request.body, ['name', 'type', 'description']);
                }
            } else {
                s += '<h4>Request Parameters</h4>';
                s += '<p>None</p>';
            }

            //RESPONSE
            s += '<h4>Response Fields</h4>';
            if (endpoint.response) {
                s += createTable(endpoint.response, ['name', 'type', 'description']);
            } else {
                s += '<p>None</p>';
            }

            s += '</div>';
        }
    } else if (printNone == true && !root && !endpoints) {
        s += '<p>None</p>';
    }

    return s;
}
function DOCS_createFileHosting(root, static, routes, printNone = false) {
    let s = '';
    
    if (root || static || routes || printNone == true) {
        s += '<h2>File Hosting</h2>';
        s += '<h3><b>Root: ' + root + '</b></h3>';
    }

    if (static) {
        s += '<p><b>Static File Routing</b>: ' + (static ? static + '-Folder' : 'None') + '</p>';
    }

    if (routes) {
        s += '<h3>Other Routes</h3>';
        for (let route in routes) {
            s += '<div class="DOCS_FILEHOS" id="FILEHOS_' + replaceAll(removeNonAlphabet(route), " ", "_") + '">';
            s += '<h3>' + route + '</h3>';

            if (routes[route].restricted === "partial") {
                s += '<center class="DOCS_FILEHOS_ROUTE_INFO">This Route is partially restricted by Authentication!</center>';
            } else if (routes[route].restricted === "full") {
                s += '<center class="DOCS_FILEHOS_ROUTE_INFO">This Route is restricted by Authentication!</center>';
            }

            s += '<p>' + routes[route].description + '</p>';

            s += '</div>';
        }
    } else if (printNone == true && !root && !routes && !static) {
        s += '<p>None</p>';
    }

    return s;
}

//Function
function createFunctionHeader(name, funct, ClassName, showClass = true, desc) {
    if (funct.params == null)
        funct.params = [];

    let s = '<div class="DOCS_FUNCTION_HEADER">';

    s += '<div class="DOCS_FUNCTION_HEADER_MAIN">';
    if (ClassName && showClass) {
        s += '<span class="DOCS_FUNCTION_HEADER_CLASSNAME">' + ClassName + '</span>';
        s += '<span class="DOCS_FUNCTION_HEADER_CLASSNAME_SEP">::</span>';
    }

    s += '<span class="DOCS_FUNCTION_HEADER_NAME">' + name + '</span>';
    s += '<span class="DOCS_FUNCTION_HEADER_BR_OPEN">(</span>';

    for (let i = 0; i < funct.params.length; i++) {
        if (funct.params[i].opt == true)
            s += '<span class="DOCS_FUNCTION_HEADER_PARAM_OPT_OPEN">[</span>';

        s += '<span class="' + (funct.params[i].opt == true ? 'DOCS_FUNCTION_HEADER_PARAM_OPT_NAME' : 'DOCS_FUNCTION_HEADER_PARAM_NAME') + '">' + funct.params[i].name + '</span>';

        if (funct.params[i].opt == true)
            s += '<span class="DOCS_FUNCTION_HEADER_PARAM_OPT_CLOSE">]</span>';

        if (i < funct.params.length - 1)
            s += '<span class="DOCS_FUNCTION_HEADER_COMMA">, </span>';
    }

    s += '<span class="DOCS_FUNCTION_HEADER_BR_CLOSE">)</span>';
    s += '</div>';

    //Hover Info
    s += '<div class="DOCS_FUNCTION_HEADER_EXTENDED">';
    s += '<div class="DOCS_FUNCTION_HEADER_HEADER">';
    if (ClassName) {
        s += '<span class="DOCS_FUNCTION_HEADER_CLASSNAME">' + ClassName + '</span>';
        s += '<span class="DOCS_FUNCTION_HEADER_CLASSNAME_SEP">::</span>';
    }

    s += '<span class="DOCS_FUNCTION_HEADER_NAME">' + name + '</span>';
    s += '<span class="DOCS_FUNCTION_HEADER_BR_OPEN">(</span>';

    if (funct.params.length == 0) {
        s += '<span class="DOCS_FUNCTION_HEADER_PARAM_TYPE">void</span>';
    } else{
        for (let i = 0; i < funct.params.length; i++) {
            s += '<span class="DOCS_FUNCTION_HEADER_PARAM_NAME">' + funct.params[i].name + '</span>';
            s += '<span class="DOCS_FUNCTION_HEADER_PARAM_SEP">: </span>';
            s += '<span class="DOCS_FUNCTION_HEADER_PARAM_TYPE">' + funct.params[i].type + '</span>';
            if (i < funct.params.length - 1)
                s += '<span class="DOCS_FUNCTION_HEADER_COMMA">, </span>';
        }
    }
    
    s += '<span class="DOCS_FUNCTION_HEADER_BR_CLOSE">)</span>';
    s += '</div>';
    s += '<div class="DOCS_FUNCTION_HEADER_DESC">';
    if(desc) s += desc;
    s += '</div>';
    s += '</div>';
    
    return s + '</div>';
}

//DOCS TABLE
function createTable(data, headers = ['name', 'type', 'description'], nameModifyCallback = (name, data) => '<a>' + name + '</a>') {
    if (data == null)
        return;
    
    let s = '<div class="DOCS_TABLE">';
    s += '<div class="DOCS_TABLE_ROW DOCS_TABLE_HEADER">';

    for (let header of headers) {
        s += '<div class="DOCS_TABLE_CELL"><span>' + header.toUpperCase() + '</span></div>';
    }

    s += '</div>';
    
    if (data instanceof Array) {
        for (let row of data) {
            s += '<div class="DOCS_TABLE_ROW">';
            for (let header of headers) {
                if (header === 'name') {
                    s += '<div class="DOCS_TABLE_CELL">' + nameModifyCallback(row.name, row) + '</div>';
                } else {
                    s += '<div class="DOCS_TABLE_CELL"><span>' + row[header] + '</span></div>';
                }
            }
            s += '</div>';
        }
    } else if (data instanceof Object) {
        for (let row in data) {
            s += '<div class="DOCS_TABLE_ROW">';
            for (let col of headers) {
                if (col === 'name') {
                    s += '<div class="DOCS_TABLE_CELL">' + nameModifyCallback(row, data[row]) + '</div>';
                } else {
                    if (data[row] instanceof Object) 
                        s += '<div class="DOCS_TABLE_CELL"><span>' + data[row][col] + '</span></div>';
                    else
                        s += '<div class="DOCS_TABLE_CELL"><span>' + data[row] + '</span></div>';
                }
            }
            s += '</div>';
        }
    }
    
    return s + '</div>';
}
function checkAllTables() {
    for (let table of document.getElementsByClassName('DOCS_TABLE')) {
        typeWidthCheck(table);
    }
}
function typeWidthCheck(x) {
    let rows = x.childNodes;
    let cols = [];
    let skipCols = 0;
    let max = window.innerWidth / 3;

    for (let i = 0; i < rows[0].childNodes.length-1; i++) {
        cols.push(0);
    }
    
    for (let i = 0; i < rows.length; i++) {
        let cells = rows[i].childNodes;

        for (let j = skipCols; j < cells.length-1; j++) {
            if (cells[j].childNodes[0].clientWidth > cols[j]) {
                cols[j] = cells[j].childNodes[0].clientWidth;

                if (max >= 0 && cols[j] >= max) {
                    cols[j] = max;
                    skipCols++;
                }
            }
        }
    }
    
    for (let row of x.childNodes) {
        let style = "";

        for (let i = 0; i < cols.length; i++) {
            style += (cols[i] + 25) + 'px ';
        }

        row.style.gridTemplateColumns = style + 'auto';
    }
}

//UTIL
function getModuleName() {
    let base = window.location.href.substring(window.location.href.indexOf("/Docs") + 6);
    let entquerried = base.indexOf('?') >= 0 ? base.substring(0, base.indexOf('?')) : base;
    let enthashed = entquerried.indexOf('#') >= 0 ? entquerried.substring(0, entquerried.indexOf('#')) : entquerried;
    return enthashed.split("/")[0];
}
function getClassName() {
    let base = window.location.href.substring(window.location.href.indexOf("/Docs") + 6);
    let entquerried = base.indexOf('?') >= 0 ? base.substring(0, base.indexOf('?')) : base;
    let enthashed = entquerried.indexOf('#') >= 0 ? entquerried.substring(0, base.indexOf('#')) : entquerried;
    return enthashed.split("/").length > 1 ? enthashed.split("/")[1] : null;
}
function changeDocsURLHeader() {
    document.getElementById('DOCS_URL_HEADER').innerHTML = "Documentation" + document.location.pathname.substring(5);
}
function changeTitle() {
    document.title = (getModuleName() ? getModuleName() : "Documentation") + " - FrikyDocs";
}

async function fetchNav() {
    return fetch('/api/Docs/Navigation')
        .then(data => data.json())
        .then(async json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            }

            if (json.data != undefined) {
                return Promise.resolve(json.data);
            }

            return Promise.reject(new Error("Internal Error."));
        })
        .catch(async err => Promise.reject(err));
}
async function fetchDocsData() {
    return fetch('/api/Docs/Data/' + getModuleName() + (getClassName() ? "/" + getClassName() : ""))
        .then(data => data.json())
        .then(async json => {
            if (json.err) {
                return Promise.reject(new Error(json.err));
            }
            
            if (json.data != undefined) {
                return Promise.resolve(json.data);
            }
            
            return Promise.reject(new Error("Internal Error."));
        })
        .catch(async err => Promise.reject(err));
}
function setDocsNavigation(data) {
    let navData = [];
    if (data instanceof Array) {
        navData = data;
    } else {
        const FEATURES = ['modules', 'variables', 'functions', 'classes', 'API', 'FileHosting'];

        for (let section in data) {
            console.log(section);
            let secData = {
                type: "section",
                name: section,
                contents: []
            };

            for (let subsection of FEATURES) {
                if (!data[section][subsection]) {
                    continue;
                }

                let subsecData = {
                    type: "subsection",
                    name: subsection,
                    contents: []
                };

                for (let content in data[section][subsection]) {
                    subsecData.contents.push({ "name": content, "href": ROOT + 'Docs/' + getModuleName() + "#" + content });
                }

                secData.contents.push(subsecData);
            }

            navData.push(secData);
        }
    }

    document.getElementById("mainNavi").innerHTML = NAVIGATIONV2_create(navData);
}