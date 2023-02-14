/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js main script
 ***************************************************************************/

import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import Settings from './Settings';
import Menus, {ContextMenuID} from "./Menus";
import { AppCommand, AppCommandFormats } from '../renderer/AppCommands';
import console from 'console';

const isDev = process.env.npm_lifecycle_event?.startsWith("app:dev");

let mainWindow: BrowserWindow;
export let menus: Menus;
let defaultDrawingFileName: string;

export const userPrefs = new Settings("user-prefs.json", {
    window: {width: 800, height: 600},
    server: {url: "http://localhost:3333", password: "", autoConnect: false as boolean},
});

function createWindow() {
    // Create the browser window
    const windowOptions = {
        ...userPrefs.get("window"),
        title: "Kresmer",
        icon: path.join(__dirname, "../logo.png"),
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
        }
    }//windowOptions
    const mainWindow = new BrowserWindow(windowOptions);

    menus = new Menus(mainWindow);
    // if (userPrefs.get("server", "autoConnect")) {
    //     requestConnectToServer(false);
    // }//if

    // and load the index page of the app
    const indexPage = "index.electron.html";
    const url = 'file://' + path.join(__dirname, `../${indexPage}`);
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
    ipcMain.on('set-default-drawing-filename', (_event, fileName: string) => {
        defaultDrawingFileName = fileName
    });
    ipcMain.on('enable-delete-menu-item', (_event, enable) => {
        Menu.getApplicationMenu()!.getMenuItemById("delete-selected-element")!.enabled = enable;
    });
    ipcMain.on("save-backend-server-connection", (_event, url: string, password: string, autoConnect: boolean) => {
        userPrefs.set("server", {url, password, autoConnect});
    });

    return mainWindow;
}//createWindow


// Initializing the application when it is ready to be initialized
function initApp(mainWindow: BrowserWindow, stage: number)
{
    console.debug(`We've heard that the main window renderer is now ready (stage ${stage})`);
    switch (stage) {
        case 0: {
            console.log(`process.env.npm_lifecycle_event="${process.env.npm_lifecycle_event}"`)
            const libData = fs.readFileSync("./stdlib.krel", "utf-8");
            console.debug("Standard library loaded in memory");
            sendAppCommand("load-library", libData, 1);
            console.debug("Standard library loaded to Kresmer");
            break;
        }
        case 1: {
            const argv = process.argv;
            console.debug(`argv=${argv}`);
            const autoload = argv[1] == "." ? argv[2] : argv[1];
            if (fs.existsSync(autoload)) {
                defaultDrawingFileName = autoload;
                const dwgData = fs.readFileSync(autoload, "utf-8");
                sendAppCommand("load-drawing", dwgData, 
                                {
                                    drawingFileName: autoload, 
                                    completionSignal: 2, 
                                });
            }//if
            break;
        }
    }//switch
}//initApp

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


export function sendAppCommand<Command extends AppCommand>(command: Command, ...args: Parameters<AppCommandFormats[Command]>): void;
export function sendAppCommand<Command extends AppCommand>(command: Command, ...args: unknown[])
{
    // console.debug(command, ...args);
    mainWindow.webContents.send("command", command, ...args);
}//sendAppCommand


export function openDrawing()
{
    // console.debug("About to show 'Open drawing dialog...'")
    const filePath = dialog.showOpenDialogSync(mainWindow, {
        title: "Open drawing file",
        filters: [
            {name: "Kresmer drawing files (*.kre)", extensions: ["kre"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    });

    if (filePath) {
        const dwgData = fs.readFileSync(filePath[0], "utf-8");
        const drawingFileName = path.basename(filePath[0]);
        sendAppCommand("load-drawing", dwgData, {drawingFileName});
    }//if
}//openDrawing


export function saveDrawing()
{
    if (!defaultDrawingFileName) {
        saveDrawingAs();
    } else {
        ipcMain.once("complete-drawing-saving", (_event, dwgData: string) => {
                console.debug(`About to save the drawing to the file "${defaultDrawingFileName}"`);
                fs.writeFileSync(defaultDrawingFileName, dwgData);
        });
        sendAppCommand("save-drawing");
    }//if
}//saveDrawing


export function saveDrawingAs()
{
    let filePath = dialog.showSaveDialogSync(mainWindow, {
        title: "Save drawing",
        filters: [
            {name: "Kresmer drawing files (*.kre)", extensions: ["kre"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    });

    if (filePath) {
        if (!path.extname(filePath)) {
            filePath += ".kre";
        }//if

        if (fs.existsSync(filePath) && dialog.showMessageBoxSync(mainWindow, {
            message: `File "${path.basename(filePath)}" exists! Overwrite?`,
            buttons: ["Ok", "Cancel"],
            defaultId: 1,
            })) 
        {
            return;
        }//if
        
        ipcMain.once("complete-drawing-saving", (_event, dwgData: string) => {
            console.debug(`About to save the drawing to the file "${filePath}"`);
            fs.writeFileSync(filePath!, dwgData);
        });
        sendAppCommand("save-drawing");
    }//if
}//saveDrawingAs


export function loadLibrary()
{
    // console.debug("About to show 'Open drawing dialog...'")
    const filePath = dialog.showOpenDialogSync(mainWindow, {
        title: "Load library...",
        filters: [
            {name: "Kresmer library files (*.krel)", extensions: ["krel"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    });

    if (filePath) {
        const libData = fs.readFileSync(filePath[0], "utf-8");
        sendAppCommand("load-library", libData);
    }//if
}//loadLibrary


export function requestConnectToServer(forceUI: boolean)
{
    sendAppCommand("connect-to-server", userPrefs.get("server", "url"), userPrefs.get("server", "password"), forceUI);
}//requestConnectToServer