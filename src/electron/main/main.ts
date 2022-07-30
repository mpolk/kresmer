/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js main script
 ***************************************************************************/

import * as path from 'path';
import { app, BrowserWindow, nativeImage } from 'electron';
import Settings from './settings';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../../package.json");

const isDev = process.env.npm_lifecycle_event === "app:dev";

export const userPrefs = new Settings({
    fileName: "user-prefs.json", 
    defaults: {window: {width: 800, height: 600}}
});

function createWindow() {
    // Create the browser window
    const windowOptions = {
        ...userPrefs.get("window"),
        icon: path.join(__dirname, "../../logo.png"),
    }
    const mainWindow = new BrowserWindow(windowOptions);

    // and load the index.html of the app.
    const url = isDev ?
        `http://localhost:${packageJson.config.port}` :
        'file://' + path.join(__dirname, '../../index.html');
    mainWindow.loadURL(url);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }//if

    mainWindow.on('resize', () => {
        userPrefs.set('window', mainWindow.getBounds());
    });
    
}//createWindow

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});