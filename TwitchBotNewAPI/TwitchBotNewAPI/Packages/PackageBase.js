const fs = require('fs');

class PackageBase {
    constructor(config, app, name) {
        this.config = config;
        this.app = app;
        this.name = name;

        this.API_PW_PROTECTED_ENDPOINTS = [];

        console.log(config);
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

    isPWProtected(endpoint) {
        for (let pwProtected of this.API_PW_PROTECTED_ENDPOINTS) {
            if (pwProtected == endpoint) {
                return true;
            }
        }

        return false;
    }
}

module.exports.PackageBase = PackageBase;