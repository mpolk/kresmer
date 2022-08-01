"use strict";
/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js main script
 ***************************************************************************/
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.userPrefs = void 0;
var path = require("path");
var electron_1 = require("electron");
var settings_1 = require("./settings");
// eslint-disable-next-line @typescript-eslint/no-var-requires
var packageJson = require("../../../package.json");
var isDev = process.env.npm_lifecycle_event === "app:dev";
exports.userPrefs = new settings_1["default"]({
    fileName: "user-prefs.json",
    defaults: { window: { width: 800, height: 600 } }
});
function createWindow() {
    // Create the browser window
    var windowOptions = __assign(__assign({}, exports.userPrefs.get("window")), { icon: path.join(__dirname, "../../logo.png") });
    var mainWindow = new electron_1.BrowserWindow(windowOptions);
    // and load the index.html of the app.
    var url = isDev ?
        "http://localhost:".concat(packageJson.config.port) :
        'file://' + path.join(__dirname, '../../index.html');
    mainWindow.loadURL(url);
    if (isDev) {
        mainWindow.webContents.openDevTools();
    } //if
    mainWindow.on('resize', function () {
        exports.userPrefs.set('window', mainWindow.getBounds());
    });
} //createWindow
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.whenReady().then(function () {
    createWindow();
    electron_1.app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
