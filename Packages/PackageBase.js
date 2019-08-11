const fs = require('fs');
const path = require('path');


class PackageBase {
    constructor(config, app, twitchIRC, twitchNewApi, name) {
        this.config = config;
        this.app = app;
        this.name = name

        this.htmlName;

        this.twitchIRC = twitchIRC;
        this.twitchNewApi = twitchNewApi;

        this.API_PW_PROTECTED_ENDPOINTS = [];
        this.apiName;

        //Use Config name(if used) or regular Package name
        this.removeHTML("public/" + (this.config.htmlName ? this.config.htmlName : this.name));
        this.placeHTML("public/" + (this.config.htmlName ? this.config.htmlName : this.name), "Packages/" + this.name + "/html");
    }

    MessageHandler(message) {

    }

    AddAPIEndpoint(type, endpoint, callback, pwProtected) {

        //Use Config name(if used) or regular Package name
        let name = (this.config.apiName ? this.config.apiName : this.name);

        if (type == "GET") {
            this.app.get('/api/' + name + endpoint, callback);
        } else if (type == "POST") {
            this.app.post('/api/' + name + endpoint, callback);
        } else if (type == "PUT") {
            this.app.put('/api/' + name + endpoint, callback);
        } else if (type == "DELETE") {
            this.app.delete('/api/' + name + endpoint, callback);
        } else if (type == "PATCH") {
            this.app.patch('/api/' + name + endpoint, callback);
        } else {
            return;
        }

        if (pwProtected) {
            this.API_PW_PROTECTED_ENDPOINTS.push(endpoint);
        }
    }

    removeHTML(blankPath) {
        let publicDir = path.resolve(blankPath);

        if (fs.existsSync(publicDir)) {
            let pack = this;
            fs.readdirSync(publicDir).forEach(function (file, index) {
                var curPath = path.resolve(blankPath + "/" + file);
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    pack.removeHTML(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(publicDir);
        }
    }

    placeHTML(publicDir, packageDir) {

        try {
            let publicDirRes = path.resolve(publicDir);
            let packageDirRes = path.resolve(packageDir);

            if (!fs.existsSync(packageDirRes)) {
                return;
            }

            if (!fs.existsSync(publicDirRes) && fs.lstatSync(packageDirRes).isDirectory()) {
                fs.mkdirSync(publicDirRes);
            }

            let pack = this;

            fs.readdirSync(packageDirRes).forEach(function (file, index) {
                let curPath = packageDir + "/" + file;
                let curPathRes = path.resolve(packageDir + "/" + file);
                let newPublic = publicDir + "/" + file;

                if (fs.lstatSync(curPathRes).isDirectory()) { // recurse
                    pack.placeHTML(newPublic, curPath);
                } else { // delete file
                    pack.copyFile(curPathRes, publicDirRes);
                }
            });

        } catch (err) {
            console.log("ERROR: " + err);
        }
    }

    copyFile(file, dir2) {

        //gets file name and adds it to dir2
        var f = path.basename(file);
        var source = fs.createReadStream(file);
        var dest = fs.createWriteStream(path.resolve(dir2, f));

        source.pipe(dest);
        source.on('error', function (err) { console.log(err); });
    }

    isPWProtected(endpoint) {
        for (let pwProtected of this.API_PW_PROTECTED_ENDPOINTS) {
            if (pwProtected.path == endpoint.path && pwProtected.type == endpoint.type) {
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