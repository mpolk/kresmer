"use strict";
/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *  Dictionary for holding various setting collections and persisting them
 *  in the plain JSON files
 ***************************************************************************/
exports.__esModule = true;
var path = require("path");
var electron_1 = require("electron");
var fs = require("fs");
var Settings = /** @class */ (function () {
    function Settings(options) {
        this.fileName = path.join(electron_1.app.getPath("userData"), options.fileName);
        try {
            this.data = JSON.parse(fs.readFileSync(this.fileName, "utf8"));
        }
        catch (error) {
            this.data = options.defaults;
        } //catch
    } //ctor
    Settings.prototype.get = function (key) {
        return this.data[key];
    }; //get
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Settings.prototype.set = function (key, value) {
        this.data[key] = value;
        fs.writeFileSync(this.fileName, JSON.stringify(this.data));
    }; //set
    return Settings;
}()); //Settings
exports["default"] = Settings;
