/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js main script
 ***************************************************************************/

import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { app, BrowserWindow, dialog, Menu, protocol, shell } from 'electron';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../package.json");
import Settings from './Settings';
import Menus, {ContextMenuID} from "./Menus";
import { AppCommand, AppCommandFormats } from '../renderer/AppCommands';
import console from 'console';
import { AppInitStage } from '../renderer/ElectronAPI';
import { IpcMainHooks } from './IpcMainHooks';

const isDev = process.env.npm_lifecycle_event?.startsWith("app:dev");

export let mainWindow: BrowserWindow;
export let menus: Menus;
let defaultDrawingFileName: string;

export const userPrefs = new Settings("user-prefs.json", {
    window: {width: 800, height: 600},
    server: {url: "http://localhost:3333", password: "", autoConnect: false as boolean},
    customManagementProtocols: [] as {name: string, cmd: string}[],
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

    // and load the index page of the app
    const indexPage = "index.electron.html";
    const url = isDev ?
        `http://localhost:${packageJson.config.port}/${indexPage}` :
        'file://' + path.join(__dirname, `../${indexPage}`);
    mainWindow.loadURL(url);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }//if

    mainWindow.on('resize', () => {
        userPrefs.set('window', mainWindow.getBounds());
    });

    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        for (const proto of userPrefs.get("customManagementProtocols")) {
            if (url.startsWith(`${proto.name}:`))
                return {action: "allow"};
        }//for
        openURL(url);
        return {action: "deny"} as const;
    });
    mainWindow.webContents.on("will-navigate", (event, url) => {
        for (const proto of userPrefs.get("customManagementProtocols")) {
            if (url.startsWith(`${proto.name}:`))
                return;
        }//for
        if (url != mainWindow.webContents.getURL()) {
            event.preventDefault();
            openURL(url);
        }//if
    });

    return mainWindow;
}//createWindow


function openURL(url: string)
{
    console.debug(`trying to open external link ${url}`);
    shell.openExternal(url);
}//openURL


function initIpcMainHooks()
{
    IpcMainHooks.on('context-menu', (menuID: ContextMenuID, ...args: unknown[]) => {
        // console.debug("main: Context menu '%s'", menuID);
        menus.contextMenu(menuID, ...args);
    });

    IpcMainHooks.on('renderer-ready', (stage: number) => {initApp(mainWindow, stage)});

    IpcMainHooks.on('set-default-drawing-filename', (fileName: string) => {
        defaultDrawingFileName = fileName
    });

    IpcMainHooks.on('enable-delete-menu-item', (enable: boolean) => {
        Menu.getApplicationMenu()!.getMenuItemById("delete-selected-element")!.enabled = enable;
    });

    IpcMainHooks.on("backend-server-connected", (url: string, password: string, autoConnect: boolean) => {
        userPrefs.set("server", {url, password, autoConnect});
        const menuConnectToServer = Menu.getApplicationMenu()!.getMenuItemById("connectToServer")!;
        menuConnectToServer.visible = false;
        menuConnectToServer.enabled = false;
        const menuDisconnectFromServer = Menu.getApplicationMenu()!.getMenuItemById("disconnectFromServer")!;
        menuDisconnectFromServer.visible = true;
        menuDisconnectFromServer.enabled = true;
    });

    IpcMainHooks.on("backend-server-disconnected", () => {
        userPrefs.set("server", "autoConnect", false);
        const menuConnectToServer = Menu.getApplicationMenu()!.getMenuItemById("connectToServer")!;
        menuConnectToServer.visible = true;
        menuConnectToServer.enabled = true;
        const menuDisconnectFromServer = Menu.getApplicationMenu()!.getMenuItemById("disconnectFromServer")!;
        menuDisconnectFromServer.visible = false;
        menuDisconnectFromServer.enabled = false;
    });

    IpcMainHooks.on("open-url", openURL);
}//initIpcMainHooks


// Initializing the application when it is ready to be initialized
export function initApp(mainWindow: BrowserWindow, stage: AppInitStage)
{
    console.debug(`We've heard that the main window renderer is now ready (stage ${stage})`);
    switch (stage) {
        case AppInitStage.HANDLERS_INITIALIZED: 
            if (userPrefs.get("server", "autoConnect")) {
                requestConnectToServer(false, AppInitStage.CONNECTED_TO_BACKEND);
                break
            }//if
        // eslint-disable-next-line no-fallthrough
        case AppInitStage.CONNECTED_TO_BACKEND: {
            console.log(`process.env.npm_lifecycle_event="${process.env.npm_lifecycle_event}"`)
            const libData = fs.readFileSync("./stdlib.krel", "utf-8");
            console.debug("Standard library loaded in memory");
            sendAppCommand("load-library", libData, AppInitStage.STDLIB_LOADED);
            console.debug("Standard library loaded to Kresmer");
            break;
        }
        case AppInitStage.STDLIB_LOADED: {
            const argv = process.argv;
            console.debug(`argv=${argv}`);
            const autoload = argv[1] == "." ? argv[2] : argv[1];
            if (fs.existsSync(autoload)) {
                defaultDrawingFileName = autoload;
                const dwgData = fs.readFileSync(autoload, "utf-8");
                sendAppCommand("load-drawing", dwgData, 
                                {
                                    drawingFileName: autoload, 
                                    completionSignal: AppInitStage.DRAWING_LOADED, 
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
    initIpcMainHooks();

    for (const proto of userPrefs.get("customManagementProtocols")) {
        const protoPrefix = new RegExp(`^${proto.name}(:/*)?`);
        protocol.registerFileProtocol(proto.name, request => {
            console.debug(`Trying to open custom protocol link ${request.url}`);
            const params = request.url.replace(protoPrefix, "");
            const cmd = proto.cmd.replaceAll("$*", params);
            exec(cmd, (error, stdout, stderr) => {
                console.debug(`error: ${error?.message}\nstdout: ${stdout}\nstederr: ${stderr}`);
            });
        });
    }//for

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
        IpcMainHooks.once("complete-drawing-saving", (dwgData: string) => {
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
        
        IpcMainHooks.once("complete-drawing-saving", (dwgData: string) => {
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


export function requestConnectToServer(forceUI: boolean, completionSignal?: AppInitStage)
{
    sendAppCommand("connect-to-server", userPrefs.get("server", "url"), 
                    userPrefs.get("server", "password"), forceUI, completionSignal);
}//requestConnectToServer

export function requestDisconnectFromServer()
{
    sendAppCommand("disconnect-from-server");
}//requestDisconnectFromServer