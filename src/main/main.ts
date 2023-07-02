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
import { AppCommand, AppCommandFormats, LoadLibraryOptions } from '../renderer/AppCommands';
import console from 'console';
import { AppInitStage } from '../renderer/ElectronAPI';
import { IpcMainHooks } from './IpcMainHooks';

const isDev = process.env.npm_lifecycle_event?.startsWith("app:dev");

export let mainWindow: BrowserWindow;
export let menus: Menus;
let defaultDrawingFileName: string;

export const localSettings = new Settings("local-settings.json", {
    window: {width: 800, height: 600},
    server: {url: "http://localhost:3333", password: "", autoConnect: false as boolean},
    snapToGrid: true as boolean,
    snappingToGridStep: 1,
    saveDynamicPropsWithDrawing: false as boolean,
    customManagementProtocols: [] as CustomManagementProtocol[],
});

export type AppSettings = {
    snapToGrid: boolean,
    snappingToGridStep: number,
    saveDynamicPropsWithDrawing: boolean,
    customManagementProtocols: CustomManagementProtocol[],
}//AppSettings

export type CustomManagementProtocol = {
    name: string,
    cmd: string,
}//CustomManagementProtocol

let drawingToAutoload: string;
const libsToLoad: string[] = ["./stdlib.krel"];

/** Parses the command line and save its parameters to the global vars */
function parseCommandLine()
{
    const argv = [...process.argv];
    console.debug(`argv=${argv}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const exePath = argv.shift();
    if (argv[0] == ".")
        argv.shift();

    while (argv.length) {
        const arg = argv.shift()!;
        if (arg.startsWith('-')) {
            const option = arg.slice(1);
            const key = option[0];
            switch (key) {
                case 'l': {
                    let lib: string|undefined;
                    if (option.length > 1)
                        lib = option.slice(1);
                    else
                        lib = argv.shift();
                    if (!lib)
                        console.error("-l command line options should have an argument!");
                    else if (libsToLoad.findIndex(l => l === lib) < 0)
                        libsToLoad.push(lib);
                    break;
                }
                case 'L': {
                    let libPath: string|undefined;
                    if (option.length > 1)
                        libPath = option.slice(1);
                    else
                        libPath = argv.shift();
                    if (!libPath) {
                        console.error("-L command line options should have an argument!");
                    } else {
                        fs.readdirSync(libPath).forEach(lib => {
                            if (lib.endsWith(".krel"))
                                libsToLoad.push(path.join(libPath!, lib));
                        });
                    }//if
                    break;
                }
            }//switch
        } else {
            drawingToAutoload = arg;
        }//if
    }//while
}//parseCommandLine


/** Create the main app window */
function createMainWindow() {
    // Create the browser window
    const windowOptions = {
        ...localSettings.get("window"),
        title: "Kresmer",
        icon: path.join(__dirname, "../logo.png"),
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            additionalArguments: [`--app-settings=${JSON.stringify(localSettings.data)}`],
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
        localSettings.set('window', mainWindow.getBounds());
    });

    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        for (const proto of localSettings.get("customManagementProtocols")) {
            if (url.startsWith(`${proto.name}:`))
                return {action: "allow"};
        }//for
        openUrlWithSystemBrowser(url);
        return {action: "deny"} as const;
    });
    mainWindow.webContents.on("will-navigate", (event, url) => {
        for (const proto of localSettings.get("customManagementProtocols")) {
            if (url.startsWith(`${proto.name}:`))
                return;
        }//for
        if (url != mainWindow.webContents.getURL()) {
            event.preventDefault();
            openUrlWithSystemBrowser(url);
        }//if
    });

    return mainWindow;
}//createMainWindow


/**
 * Open an URL with the default system browser
 * @param url An URL to open
 */
function openUrlWithSystemBrowser(url: string)
{
    console.debug(`trying to open external link ${url}`);
    shell.openExternal(url);
}//openUrlWithSystemBrowser


/** Initialize IPC entries for the main process */
function initIpcMainHooks()
{
    IpcMainHooks.on('context-menu', (menuID: ContextMenuID, ...args: unknown[]) => {
        // console.debug("main: Context menu '%s'", menuID);
        menus.contextMenu(menuID, ...args);
    });

    IpcMainHooks.on('renderer-ready', (stage: number) => {initApp(stage)});

    IpcMainHooks.on('set-default-drawing-filename', (fileName: string) => {
        defaultDrawingFileName = fileName
    });

    IpcMainHooks.on('enable-delete-menu-item', (enable: boolean) => {
        Menu.getApplicationMenu()!.getMenuItemById("delete-selected-element")!.enabled = enable;
    });

    IpcMainHooks.on("backend-server-connected", (url: string, password: string, autoConnect: boolean) => {
        localSettings.set("server", {url, password, autoConnect});
        const menuConnectToServer = Menu.getApplicationMenu()!.getMenuItemById("connectToServer")!;
        menuConnectToServer.visible = false;
        menuConnectToServer.enabled = false;
        const menuDisconnectFromServer = Menu.getApplicationMenu()!.getMenuItemById("disconnectFromServer")!;
        menuDisconnectFromServer.visible = true;
        menuDisconnectFromServer.enabled = true;
    });

    IpcMainHooks.on("backend-server-disconnected", () => {
        localSettings.set("server", "autoConnect", false);
        const menuConnectToServer = Menu.getApplicationMenu()!.getMenuItemById("connectToServer")!;
        menuConnectToServer.visible = true;
        menuConnectToServer.enabled = true;
        const menuDisconnectFromServer = Menu.getApplicationMenu()!.getMenuItemById("disconnectFromServer")!;
        menuDisconnectFromServer.visible = false;
        menuDisconnectFromServer.enabled = false;
    });

    IpcMainHooks.on("open-url", openUrlWithSystemBrowser);

    IpcMainHooks.on("update-app-settings", (newAppSettings) => {
        console.debug("old settings: ", localSettings);
        console.debug("new settings: ", newAppSettings);
        for (const key in newAppSettings) {
            localSettings.set(key as keyof AppSettings, newAppSettings[key as keyof AppSettings]);
        }//for
    });

    IpcMainHooks.on("grid-shown-or-hidden", shown => {
        Menu.getApplicationMenu()!.getMenuItemById("toggleGrid")!.checked = shown;
    });

    IpcMainHooks.on("rulers-shown-or-hidden", shown => {
        Menu.getApplicationMenu()!.getMenuItemById("toggleRulers")!.checked = shown;
    });
}//initIpcMainHooks


/** Perform the next step of the App initialization in response to the signals received from the renderer process.
 *  Acts as an coroutine together with the renderer initialization procedure. When the renderer completes
 *  the next stage of its initialization it signals about its readiness with the corresponding AppInitStage.* code.
 * @param stage The ID of the initializtion stage just completed by the renderer process
 */
export function initApp(stage: AppInitStage)
{
    console.debug(`We've heard that the main window renderer is now ready (stage ${stage})`);
    switch (stage) {
        case AppInitStage.HANDLERS_INITIALIZED: 
            if (localSettings.get("server", "autoConnect")) {
                requestConnectToServer(false, AppInitStage.CONNECTED_TO_BACKEND);
                break
            }//if
        // eslint-disable-next-line no-fallthrough
        case AppInitStage.CONNECTED_TO_BACKEND: {
            console.log(`process.env.npm_lifecycle_event="${process.env.npm_lifecycle_event}"`)
            for (let i = 0; i < libsToLoad.length; i++) {
                const lib = libsToLoad[i];
                const libData = fs.readFileSync(lib, "utf-8");
                console.debug(`Library ${lib} loaded in memory`);
                const options: LoadLibraryOptions = {libraryFileName: lib};
                if (i == libsToLoad.length-1)
                    options.completionSignal = AppInitStage.STDLIB_LOADED;
                sendAppCommand("load-library", libData, options);
                console.debug(`Library ${lib} loaded to Kresmer`);
            }//for
            break;
        }
        case AppInitStage.STDLIB_LOADED: {
            if (fs.existsSync(drawingToAutoload)) {
                defaultDrawingFileName = drawingToAutoload;
                const dwgData = fs.readFileSync(drawingToAutoload, "utf-8");
                sendAppCommand("load-drawing", dwgData, 
                                {
                                    drawingFileName: drawingToAutoload, 
                                    completionSignal: AppInitStage.DRAWING_LOADED, 
                                });
            }//if
            break;
        }
    }//switch
}//initApp


/** Register custom management protocols for network devices 
 *  to open management sessions from the on-drawing hyper-links */
function registerCustomManagementProtocols()
{
    for (const proto of localSettings.get("customManagementProtocols")) {
        const protoPrefix = new RegExp(`^${proto.name}(:/*)?`);
        protocol.registerFileProtocol(proto.name, request => {
            console.debug(`Trying to open custom protocol link ${request.url}`);
            const allParams = request.url.replace(protoPrefix, "");
            const params = allParams.split(/ +/);
            let cmd = proto.cmd.replaceAll("$*", allParams);
            for (let i = 0; i < params.length; i++) {
                cmd = cmd.replaceAll(`$${i+1}`, params[i]);
            }//for
            exec(cmd, (error, stdout, stderr) => {
                console.debug(`Executed handler for url ${request.url}.\nError: ${error?.message}\nstdout: ${stdout}\nstederr: ${stderr}`);
            });
        });
    }//for
}//registerCustomManagementProtocols


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    parseCommandLine();
    mainWindow = createMainWindow();
    initIpcMainHooks();
    registerCustomManagementProtocols();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
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
        sendAppCommand("load-library", libData, {libraryFileName: filePath[0], notifyUser: true});
    }//if
}//loadLibrary


export function requestConnectToServer(forceUI: boolean, completionSignal?: AppInitStage)
{
    sendAppCommand("connect-to-server", localSettings.get("server", "url"), 
                    localSettings.get("server", "password"), forceUI, completionSignal);
}//requestConnectToServer

export function requestDisconnectFromServer()
{
    sendAppCommand("disconnect-from-server");
}//requestDisconnectFromServer