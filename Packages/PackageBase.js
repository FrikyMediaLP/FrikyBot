const fs = require('fs');

class PackageBase {
    constructor(config, app, name) {
        this.config = config;
        this.app = app;
        this.name = name;

        this.API_PW_PROTECTED_ENDPOINTS = [];

        console.log(config);
    }

    MessageHandler(message) {

    }

    AddAPIEndpoint(type, endpoint, callback, pwProtected) {
        if (type == "get") {
            this.app.get('/api/' + this.name + endpoint, callback);
        } else if (type == "post") {
            this.app.post('/api/' + this.name + endpoint, callback);
        }

        if (pwProtected) {
            this.API_PW_PROTECTED_ENDPOINTS.push(endpoint);
        }
    }

    isPWProtected(endpoint) {
        for (let pwProtected of this.API_PW_PROTECTED_ENDPOINTS) {
            if (pwProtected == endpoint) {
                return true;
            }
        }

        return false;
    }
    
    checkForCompletion(source, template, required) {

    //go threw template
    for (let templ of Object.getOwnPropertyNames(template)) {

        let da = false;

        //check given for template minimum
        for (let response of Object.getOwnPropertyNames(source)) {
            //has given what template needs
            if (templ == response) {
                da = true;

                //is MUST HAVE value
                for (let req of required) {
                    if (templ == req) {
                        if (source[response] == "") {
                            return "Pls fill in/declare " + req;
                        } else {
                            for (let underObj of Object.getOwnPropertyNames(source[response])) {
                                if (source[response][underObj] == "") {
                                    return "Pls fill in/declare " + req + "." + underObj
                                }
                            }
                            break;
                        }
                    }
                }
                break;
            }
        }

        if (!da) {
            return templ + " missing";
        }
    }
    return "COMPLETE";
}

    writeFile(path, data) {
        let fd;

        try {
            fd = fs.openSync(path, 'w');
            fs.writeSync(fd, data);
        } catch (err) {
            /* Handle the error */
            console.log(err);
            return err;
        } finally {
            if (fd !== undefined) {
                fs.closeSync(fd);
            } else {
                return "fd was undefinded";
            }
        }

        return null;
    }

    readFile(path) {
        try {
            //File/Path present/valid ?
            fs.accessSync(path, fs.constants.F_OK);

            //read File
            return fs.readFileSync(path);

        } catch (err) {
            console.log("ERROR: " + err);
            return "ERROR: " + err;
        }
    }

    getName() {
        return this.name;
    }
}

module.exports.PackageBase = PackageBase;