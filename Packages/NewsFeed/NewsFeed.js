const CONSTANTS = require('./../../Util/CONSTANTS.js');
const express = require('express');
const fs = require('fs');
const PATH = require('path');

const SETTINGS_REQUIERED = {
    HTML_ROOT_NAME: "News",
    API_ROOT_NAME: "News",
    News_File_Dir: "Packages/NewsFeed/News/News.json",
    Changelog_Dir: "Packages/NewsFeed/News/Changelogs/"
};

const API_SETTINGS = {
    API_NEWS_FIRST_DEFAULT: 10,
    API_NEWS_OLDEST_FIRST_DEFAULT: 1,
    API_NEWS_LATEST_FIRST_DEFAULT: 1,
    API_NEWS_DATE_FIRST_DEFAULT: 1
};

const API_ENDPOINT_PARAMETERS = {
    latest: {
        first: true,
        pagination: true
    },
    oldest: {
        first: true,
        pagination: true
    },
    news: {
        idx: true,
        page: true,
        title: true,
        date: true,
        first: true,
        pagination: true
    }
};

class NewsFeed extends require('./../PackageBase.js').PackageBase {
    constructor(expressapp, twitchirc, twitchapi, datacollection, startparameters, logger) {
        super("NewsFeed", "News Feed used to Share Updates and Informations on recent Events.", expressapp, twitchirc, twitchapi, datacollection, startparameters, logger);
    }

    async Init() {
        if (!this.isEnabled()) return Promise.resolve();

        //API ROUTE
        let APIRouter = express.Router();
        APIRouter.get('/latest', this.checkParams, async (request, response) => {
            let params = request.query;
            let news_data = this.getLatest(params.first, params.pagination);

            if (news_data && typeof (news_data) != "string") {
                if (Array.isArray(news_data)) {
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        data: {                             //Data
                            News: news_data
                        }
                    });
                } else {
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        data: news_data
                    });
                }
            } else {
                response.json({
                    status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                    err: typeof (news_data) == "string" ? news_data : "Internal Error."
                });
            }
        });
        APIRouter.get('/oldest', this.checkParams, async (request, response) => {
            let params = request.query;
            let news_data = this.getOldest(params.first, params.pagination);

            if (news_data && typeof (news_data) != "string") {
                if (Array.isArray(news_data)) {
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        data: {                             //Data
                            News: news_data
                        }
                    });
                } else {
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        data: news_data
                    });
                }
            } else {
                response.json({
                    status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                    req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                    err: typeof (news_data) == "string" ? news_data : "Internal Error."
                });
            }
        });
        APIRouter.get('/News', this.checkParams, async (request, response) => {
            let params = request.query;
            let news_data = this.getNews(params);

            if (news_data && typeof (news_data) != "string") {
                if (Array.isArray(news_data)) {
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        data: {                             //Data
                            News: news_data
                        }
                    });
                } else {
                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,   //Sending Success confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        data: news_data
                    });
                }
            } else {
                response.json({
                    status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                    req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                    err: typeof (news_data) == "string" ? news_data : "Internal Error."
                });
            }
        });
        APIRouter.post('/Publish', async (request, response) => {
            if (request.headers.authentication) {
                //AUTHENTICATION FOLLOWS

                let dta = this.validate(request.body.data);

                if (dta == true) {
                    this.LoadNews();
                    this.News.push(request.body.data);

                    if (!this.ExportNews()) {
                        console.log("NEWS EXPORT FAILED!");
                    }

                    response.json({
                        status: CONSTANTS.STATUS_SUCCESS,    //Sending Failure confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        data: {
                            status: "News Successfully published"
                        }
                    });
                } else {
                    response.json({
                        status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                        req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                        err: "News unfinished / has errors"
                    });
                }
            } else {
                response.json({
                    status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                    req: request.body,                  //Mirror-Request (for debug reasons / sending error detection)
                    err: "Authentication missing"
                });
            }
        });

        APIRouter.get('/Changelog', async (request, response) => {
            let data = this.GetLastestChangelog();
            if (data instanceof Object) {
                response.json(data);
            } else {
                response.json({ error: "404", message: "changelog not found" });
            }
        });
        APIRouter.get('/Changelog/:changelog', async (request, response) => {
            let data = this.GetChangelog(request.params.changelog);
            if (data instanceof Object) {
                response.json(data);
            } else {
                response.json({ error: "404", message: "changelog not found" });
            }
        });
        super.setAPIRouter(APIRouter);

        //STATIC FILE ROUTE
        let StaticRouter = express.Router();
        StaticRouter.use("/", (req, res, next) => {
            if (req.url.toLowerCase() == "/newsmaker") {
                //AUTHENTICATION
                if (false) {
                    res.sendFile(PATH.resolve("Packages/NewsFeed/html/NewsMaker.html"));
                } else {
                    res.sendFile(PATH.resolve("DATA/PAGES/NoAccess.html"));
                }
            } else if (req.url.toLowerCase() == "/news_styles") {
                res.sendFile(PATH.resolve("Packages/NewsFeed/html/style/NewsFeed.css"));
            } else if (req.url.toLowerCase() == "/news_scripts") {
                res.sendFile(PATH.resolve("Packages/NewsFeed/html/script/NewsFeed.js"));
            } else if (req.url.toLowerCase() == "/changelog_styles") {
                res.sendFile(PATH.resolve("Packages/NewsFeed/html/style/Changelog.css"));
            } else if (req.url.toLowerCase() == "/changelog_scripts") {
                res.sendFile(PATH.resolve("Packages/NewsFeed/html/script/Changelog.js"));
            } else if (req.url.toLowerCase().startsWith('/changelog')) {
                res.sendFile(PATH.resolve("Packages/NewsFeed/html/Changelog_Template.html"));
            } else {
                res.sendFile(PATH.resolve("Packages/NewsFeed/html/News_Template.html"));
            }
        });
        super.setFileRouter(StaticRouter);

        //HTML Navigation
        super.setHTMLNavigation({
            name: "News",
            href: this.getHTMLROOT(),
            icon: "images/icons/newspaper-solid.svg"
        });
        
        return this.reload();
    }
    
    async reload() {
        if (!this.isEnabled()) return Promise.reject(new Error("Package is disabled!"));
        
        //Load News Data
        this.LoadNews();

        this.Logger.info("NewsFeed (Re)Loaded!");
        return Promise.resolve();
    }

    CheckSettings(settings) {
        return this.AddObjectElementsToOtherObject(settings, SETTINGS_REQUIERED, msg => this.Logger.info("CONFIG UPDATE: " + msg));
    }
    
    //////////////////////////////////////////
    //              DATABASE
    //////////////////////////////////////////

    //News
    LoadNews() {
        if (!this.Settings.News_File_Dir) {
            return false;
        }

        if (!fs.existsSync(this.Settings.News_File_Dir)) {
            super.writeFile(this.Settings.News_File_Dir, JSON.stringify({ News: [] }, null, 4));
            this.News = [];
            return true;
        } else {
            try {
                let s = super.readFile(this.Settings.News_File_Dir);
                let json = JSON.parse(s);

                if (json.News) {
                    this.News = json.News;
                    return true;
                } else {
                    this.News = [];
                    return false;
                }
            } catch (err) {
                console.log(err);
                this.News = [];
                return false;
            }
        }
    }
    ExportNews() {
        if (!this.Settings.News_File_Dir || !this.News) {
            return false;
        }

        try {
            super.writeFile(this.Settings.News_File_Dir, JSON.stringify({ News: this.News }, null, 4));
            return true;
        } catch (err) {
            return false;
        }
    }

    getNews(param) {
        //Returns:
        //      - NULL: when internal Error
        //      - string: when an error String is available
        //      - Object/Array: when all went well


        if (!this.News) {
            return null;
        }

        ////////////////////////////////
        //     NO PAGINATION
        ////////////////////////////////
        if (param.idx) {
            if (isNaN(param.idx) || parseInt(param.idx) < 0 || parseInt(param.idx) >= this.News.length) {
                return "Parameter is NaN or out of Bounds.";
            } else {
                return [this.News[parseInt(param.idx)]];
            }
        } else if (param.page) {
            return this.getPage(param.page);
        } else if (param.title) {
            return this.getTitle(param.title);
        } else {
            ////////////////////////////////
            //     YES PAGINATION
            ////////////////////////////////

            //Pagination Consistency Test

            //Date Filter
            if (param.date) {
                if (param.date.indexOf("-") == -1) {
                    return this.getDate(param.date, param.date, param.first, param.pagination);
                } else {
                    return this.getDate(param.date.substring(0, param.date.indexOf("-")), param.date.substring(param.date.indexOf("-") + 1), param.first, param.pagination);
                }
            } else {
                //All News

                //First - Check
                let first = API_SETTINGS.API_NEWS_FIRST_DEFAULT;

                if (param.first) {
                    first = param.first;
                }

                //Pagination - Check
                let pagination = 0;

                if (param.pagination) {
                    pagination = this.decryptPage(param.pagination, first);

                    if (isNaN(pagination)) {
                        return pagination ? pagination : "Internal error";
                    }
                }

                //Output Data
                let output = {
                    pagination: this.getPagination(first, pagination / first, true),
                    News: []
                };

                for (let i = pagination; i < pagination + first && i < this.News.length; i++) {
                    output.News.push(this.News[i]);
                }

                //Error Check
                if (typeof (output.News) == "string") {
                    return output.News;
                } else if (output.News.length == 0) {
                    return "News not found";
                }

                return output;
            }
        }
    }

    //Pagination
    getLatest(first, pagination) {
        if (!this.News) {
            return null;
        }

        //First - Check
        if (!first) {
            first = API_SETTINGS.API_NEWS_LATEST_FIRST_DEFAULT;
        } else if (isNaN(first)) {
            return "Parameter is not a Number";
        }

        //pagination - Check
        if (!pagination) {
            pagination = 0;
        } else if (typeof (pagination) == "string") {
            pagination = this.decryptPage(pagination, first);

            if (isNaN(pagination)) {
                return pagination ? pagination : "Internal error";
            }
        }

        //Get News
        let output = {
            pagination: this.getPagination(first, pagination / first, true),
            News: []
        };

        for (let i = this.News.length - pagination - 1; i >= 0 && i >= this.News.length - first - pagination; i--) {
            output.News.push(this.News[i]);
        }

        output.News.reverse();

        //Error Check
        return output.News.length == 0 ? "News not found" : output;
    }
    getOldest(first, pagination) {
        if (!this.News) {
            return null;
        }

        //First - Check
        if (!first) {
            first = API_SETTINGS.API_NEWS_OLDEST_FIRST_DEFAULT;
        } else if (isNaN(first)) {
            return "Parameter is not a Number";
        }

        //pagination - Check
        if (!pagination) {
            pagination = 0;
        } else if (typeof (pagination) == "string") {
            pagination = this.decryptPage(pagination, first);

            if (isNaN(pagination)) {
                return pagination ? pagination : "Internal error";
            }
        }

        //Get News
        let output = {
            pagination: this.getPagination(first, pagination / first, true),
            News: []
        };

        for (let i = pagination; i < first + pagination && i < this.News.length; i++) {
            output.News.push(this.News[i]);
        }

        //Error Check
        return output.News.length == 0 ? "News not found" : output;
    }
    getDate(start, end, first, pagination) {
        if (!this.News) {
            return null;
        }

        //start - Check
        if (!start) {
            return "No Start Date specified";
        } else if (isNaN(start)) {
            return "Parameter is not a Number";
        }

        //Convert to ms
        start = start * Math.pow(10, 13 - ("" + start).length);

        //end - Check
        if (!end) {
            end = start;
        } else if (isNaN(end)) {
            return "Parameter is not a Number";
        }

        //Convert to ms
        end = end * Math.pow(10, 13 - ("" + end).length);

        //First - Check
        if (!first) {
            first = API_SETTINGS.API_NEWS_DATE_FIRST_DEFAULT;
        } else if (isNaN(first)) {
            return "Parameter is not a Number";
        }

        //pagination - Check
        if (!pagination) {
            pagination = 0;
        } else if (typeof (pagination) == "string") {
            pagination = this.decryptPage(pagination, first);

            if (isNaN(pagination)) {
                return pagination ? pagination : "Internal error";
            }
        }

        //Get News
        let output = {
            pagination: this.getPagination(first, pagination / first, true),
            News: []
        };

        //Create Dates
        let Date1 = new Date(parseInt(start));
        let Date2 = new Date(parseInt(end));

        //Check if dates are valid
        if (!(Date1.getTime() === Date1.getTime())) {
            return "Date is invalid";
        }
        if (!(Date2.getTime() === Date2.getTime())) {
            return "Date is invalid";
        }

        //Used to Check end point
        let i = pagination;

        //Start at Pagination (last end) until enough Elements (first) are collected or no News left
        for (i; output.News.length < first && i < this.News.length; i++) {
            if (this.News[i].date && !isNaN(this.News[i].date)) {

                //Create News Date
                let t = new Date(this.News[i].date);

                //Check if News Date is valid
                if (!(t.getTime() === t.getTime())) {
                    continue;
                } else {
                    //Year in Range, Month in Range, Day in Range
                    if (Date1.getFullYear() <= t.getFullYear() && t.getFullYear() <= Date2.getFullYear()) {
                        if (Date1.getMonth() <= t.getMonth() && t.getMonth() <= Date2.getMonth()) {
                            if (Date1.getDate() <= t.getDate() && t.getDate() <= Date2.getDate()) {
                                //Add to Output
                                output.News.push(this.News[i]);
                            }
                        }
                    }
                }
            }
        }

        //Dont increment Pagination when all News have been checked
        if (i == this.News.length) {
            output.News.pagination = this.getPagination(first, pagination / first, false);
        }

        //Error Check
        return output.News.length == 0 ? "News not found" : output;
    }

    //No Pagination
    getPage(pageString) {
        if (typeof (pageString) != "string") {
            return "Parameter is not a string";
        } else if (!this.News) {
            return null;
        }

        for (let news of this.News) {
            if (news.Page && news.Page == pageString) {
                return [news];
            }
        }

        return "News not found";
    }
    getTitle(titleString) {
        if (typeof (titleString) != "string") {
            return "Parameter is not a string";
        } else if (!this.News) {
            return null;
        }

        for (let news of this.News) {
            if (news.title && news.title == titleString) {
                return [news];
            }
        }

        return "News not found";
    }

    //VALIDATE POST
    validate(jsonData) {
        if (!jsonData.title || !jsonData.date) {
            return false;
        }

        if (isNaN(jsonData.date) || typeof (jsonData.title) != "string") {
            return false;
        }

        //Description
        if (jsonData.description) {
            if (jsonData.description.top) {
                if (!Array.isArray(jsonData.description.top)) {
                    return false;
                }

                for (let p of jsonData.description.top) {
                    if (typeof (p) == "object") {
                        if (!p.text) {
                            return false;
                        }
                    } else if (typeof (p) != "string") {
                        return false;
                    }
                }
            }

            if (jsonData.description.bottom) {
                if (!Array.isArray(jsonData.description.bottom)) {
                    return false;
                }

                for (let p of jsonData.description.bottom) {
                    if (typeof (p) == "object") {
                        if (!p.text) {
                            return false;
                        }
                    } else if (typeof (p) != "string") {
                        return false;
                    }
                }
            }
        }

        //Images
        if (jsonData.images) {
            if (!Array.isArray(jsonData.images)) {
                return false;
            }

            for (let p of jsonData.images) {
                if (!p.source) {
                    return false;
                }
            }
        }


        //Misc
        if (jsonData.misc) {
            if (!Array.isArray(jsonData.misc)) {
                return false;
            }

            for (let p of jsonData.misc) {
                if (!p.icon || !p.text || !p.type) {
                    return false;
                }

                if (p.type == "link") {
                    if (!p.link) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    //Changelog
    GetLastestChangelog() {
        try {
            let paths = fs.readdirSync(PATH.resolve(this.Settings.Changelog_Dir));

            if (paths.length == 0) {
                return false;
            }

            let latest = [0, 0, 0];

            for (let path of paths) {
                let y = parseInt(path.split("_")[2]);
                let m = parseInt(path.split("_")[1]);
                let d = parseInt(path.split("_")[0]);

                if (y > latest[2] || (y == latest[2] && m > latest[1]) || (y == latest[2] && m == latest[1] && d > latest[0])) {
                    latest = [d, m, y];
                }
            }

            for (let i = 0; i < latest.length; i++) {
                if (latest[i] < 10) {
                    latest[i] = "0" + latest[i];
                }
            }

            return this.GetChangelog(latest[0] + "_" + latest[1] + "_" + latest[2]);
        } catch (err) {
            console.log(err);
        }

        return false;
    }
    GetChangelog(name) {
        if (!name) {
            return;
        }

        if (fs.existsSync(PATH.resolve(this.Settings.Changelog_Dir + name + ".json"))) {
            try {
                let json = JSON.parse(fs.readFileSync(PATH.resolve(this.Settings.Changelog_Dir + name + ".json")));
                return json;
            } catch (err) {
                console.log(err);
            }
        }

        return false;
    }

    //////////////////////////////////////////
    //              UTIL
    //////////////////////////////////////////
    getPagination(first, pagination, autoInc) {
        //A...B -> PageIndex by given Settings   ... Is resettet to the last available Page, when there is no next page
        //B...C -> Max News per Page
        //C...D -> News Count at creation (used for error checking)

        if (autoInc && autoInc == true)
            return "A" + (this.News.length / first <= pagination / first + 1 ? pagination / first : pagination / first + 1) + "B" + first + "C" + this.News.length + "D";
        else
            return "A" + pagination + "B" + first + "C" + this.News.length + "D";
    }
    decryptPage(paginationString, first) {
        //Returns:
        //      - NULL: when internal Error
        //      - string: when an error String is available
        //      - integer: when all went well

        //A...B -> PageIndex by given Settings
        //B...C -> Max News per Page
        //C...D -> News Count at creation (used for error checking)

        if (!paginationString || !this.News) {
            return null;
        } else if (paginationString.indexOf("A") == -1 || paginationString.indexOf("B") == -1 || paginationString.indexOf("C") == -1 || paginationString.indexOf("D") == -1 || !this.charsInWrongOrder(paginationString, ["A", "B", "C", "D"])) {
            return "Pagination not valid"
        }

        let idx = paginationString.substring(1, paginationString.indexOf("B"));
        let max = paginationString.substring(paginationString.indexOf("B") + 1, paginationString.indexOf("C"));
        let count = paginationString.substring(paginationString.indexOf("C") + 1, paginationString.indexOf("D"));

        if (isNaN(idx) || isNaN(max) || isNaN(count)) {
            return "Pagination not valid";
        } else {
            if (parseInt(count) != this.News.length) {
                return "Pagination outdated"
            } else if (max != first) {
                return "First doesnt match given Pagination"
            } else {
                return parseInt(idx) * parseInt(max);
            }
        }
    }
    checkParams(req, res, next) {
        let url = req.route.path.substring(1);
        let params = req.query;
        if (API_ENDPOINT_PARAMETERS[url]) {
            for (let param in params) {
                if (!API_ENDPOINT_PARAMETERS[url][param]) {
                    res.json({
                        status: CONSTANTS.STATUS_FAILED,    //Sending Failure confimation
                        err: "Unkown Paramerter: " + param
                    });
                    return;
                }
            }
        }
        next();
    }
    charsInWrongOrder(s, charArr) {
        //Checks the string s, if the given Chars in the charArr come in that order
        //DOESNT CHECK, if they even exist

        let toTest = [];

        for (let i = 0; i < charArr.length; i++) {
            if (i == 0) {
                toTest.push(s.indexOf(charArr[i]));
            } else {
                if (s.indexOf(charArr[i]) < toTest[i - 1]) {
                    return false;
                } else {
                    toTest.push(s.indexOf(charArr[i]));
                }
            }
        }

        return true;
    }
}

module.exports.NewsFeed = NewsFeed;