/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js main script
 ***************************************************************************/

import path from 'path';
import fs from 'fs';
import process from 'process';
import { app, BrowserWindow, ipcMain } from 'electron';
import Settings from './settings';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../../package.json");
import Menus, {ContextMenuID} from "./menus";
import { AppCommand, AppCommandFormats } from '../app-commands';

const isDev = process.env.npm_lifecycle_event === "app:dev";

export let menus: Menus;

export const userPrefs = new Settings({
    fileName: "user-prefs.json", 
    defaults: {window: {width: 800, height: 600}}
});

function createWindow() {
    // Create the browser window
    const windowOptions = {
        ...userPrefs.get("window"),
        title: "Kresmer",
        icon: path.join(__dirname, "../../logo.png"),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    }//windowOptions
    const mainWindow = new BrowserWindow(windowOptions);
    menus = new Menus(mainWindow);

    // and load the index.html of the app.
    const url = isDev ?
        `http://localhost:${packageJson.config.port}/index.electron.html` :
        'file://' + path.join(__dirname, '../../index.electron.html');
    mainWindow.loadURL(url);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }//if

    mainWindow.on('resize', () => {
        userPrefs.set('window', mainWindow.getBounds());
    });

    ipcMain.on('context-menu', (_event, menuID: ContextMenuID, ...args: unknown[]) => {
        // console.debug("main: Context menu '%s'", menuID);
        menus.contextMenu(menuID, ...args);
    });

    ipcMain.on('renderer-ready', (_event, stage: number) => {initApp(mainWindow, stage)});
    return mainWindow;
}//createWindow


// Initializing the application when it is ready to be initialized
function initApp(mainWindow: BrowserWindow, stage: number)
{
    console.debug(`We've heard that the main window renderer is now ready (stage ${stage})`);
    switch (stage) {
        case 0: {
            const libData = fs.readFileSync("./stdlib.krel", "utf-8");
            console.debug("Standard library loaded in memory");
            sendAppCommand("load-library", libData);
            console.debug("Standard library loaded to Kresmer");
            break;
        }
        case 1: {
            const argv = process.argv;
            console.debug(`argv=${argv}`);
            const autoload = argv[1] == "." ? argv[2] : argv[1];
            if (fs.existsSync(autoload)) {
                const dwgData = fs.readFileSync(autoload, "utf-8");
                const fileName = path.basename(autoload);
                sendAppCommand("load-drawing", dwgData, fileName);
            }//if
            break;
        }
    }//switch
}//initApp

let mainWindow: BrowserWindow;

export function sendAppCommand<Command extends AppCommand>(command: Command, ...args: Parameters<AppCommandFormats[Command]>): void;
export function sendAppCommand<Command extends AppCommand>(command: Command, ...args: unknown[])
{
    mainWindow.webContents.send("command", command, ...args);
}//sendAppCommand


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    mainWindow = createWindow();
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