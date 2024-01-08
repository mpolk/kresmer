/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *       Initialization procedures for the Electron node.js main script
 ***************************************************************************/

import path from "path";
import fs from "fs";
import { exec } from 'child_process';
import { BrowserWindow, Menu, protocol } from "electron";
import { localSettings, menus, isDev, packageJson, sendAppCommand, libsToLoad, 
         AppSettings, addLib, addLibDir, isReloadInProgress, reloadContent } from "./main";
import { ContextMenuID } from "./Menus";
import { AppInitStage } from '../renderer/ElectronAPI';
import { IpcMainHooks } from './IpcMainHooks';
import { loadLibraryFile, saveDrawing, selectOrLoadFile } from './file-ops';
import { openUrlWithSystemBrowser, requestConnectToServer } from './misc-ops';

export let defaultDrawingFileName: string|undefined;
export let drawingToAutoload: string;

/** Parses the command line and save its parameters to the global vars */
export function parseCommandLine()
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
                    let libPath: string|undefined;
                    if (option.length > 1)
                        libPath = option.slice(1);
                    else
                        libPath = argv.shift();
                    if (!libPath)
                        console.error("-l command line options should have an argument!");
                    else 
                        addLib(libPath);
                    break;
                }
                case 'L': {
                    let libDir: string|undefined;
                    if (option.length > 1)
                        libDir = option.slice(1);
                    else
                        libDir = argv.shift();
                    if (!libDir) {
                        console.error("-L command line options should have an argument!");
                    } else 
                        addLibDir(libDir);
                    break;
                }
            }//switch
        } else {
            drawingToAutoload = arg;
        }//if
    }//while
}//parseCommandLine

/** Create the main app window */
export function createMainWindow() {
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

/** Initialize IPC entries for the main process */
export function initIpcMainHooks()
{
    IpcMainHooks.on('context-menu', (menuID: ContextMenuID, ...args: unknown[]) => {
        // console.debug("main: Context menu '%s'", menuID);
        menus.contextMenu(menuID, ...args);
    });

    IpcMainHooks.on('renderer-ready', (stage: number) => {initApp(stage)});

    IpcMainHooks.on('set-default-drawing-filename', (fileName: string) => {
        defaultDrawingFileName = fileName;
    });

    IpcMainHooks.on('enable-delete-component-menu-item', (enable: boolean) => {
        Menu.getApplicationMenu()!.getMenuItemById("delete-selected-element")!.enabled = enable;
    });

    IpcMainHooks.on('enable-component-op-menu-items', (enable: boolean) => {
        Menu.getApplicationMenu()!.getMenuItemById("duplicate-component")!.enabled = enable;
        Menu.getApplicationMenu()!.getMenuItemById("transform-component")!.enabled = enable;
    });

    IpcMainHooks.on('enable-move-component-up-menu-items', (enable: boolean) => {
        Menu.getApplicationMenu()!.getMenuItemById("move-component-up")!.enabled = enable;
        Menu.getApplicationMenu()!.getMenuItemById("move-component-to-top")!.enabled = enable;
    });

    IpcMainHooks.on('enable-move-component-down-menu-items', (enable: boolean) => {
        Menu.getApplicationMenu()!.getMenuItemById("move-component-down")!.enabled = enable;
        Menu.getApplicationMenu()!.getMenuItemById("move-component-to-bottom")!.enabled = enable;
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

    IpcMainHooks.on("vertex-auto-alignment-toggled", autoAlignVertices => {
        Menu.getApplicationMenu()!.getMenuItemById("toggleVertexAutoAlignment")!.checked = autoAlignVertices;
        localSettings.set("autoAlignVertices", autoAlignVertices);
    });

    IpcMainHooks.onInvokation("load-library-file", (libName: string, fileName?: string) => {
        return loadLibraryFile(libName, fileName);
    });

    IpcMainHooks.onInvokation("save-drawing", (dwgData: string) => {
        return saveDrawing(dwgData);
    });

    IpcMainHooks.onInvokation("check-reload-status", () => {
        return isReloadInProgress();
    });

    IpcMainHooks.on("reload-content", () => {
        reloadContent();
    });

    IpcMainHooks.onInvokation("select-or-load-file", selectOrLoadFile);
}//initIpcMainHooks


/** Perform a single step of the App initialization in response to the signals received from the renderer process.
 *  Acts as an coroutine together with the renderer initialization procedure. When the renderer completes
 *  the next stage of its initialization it signals about its readiness with the corresponding AppInitStage.* code.
 * @param stage The ID of the initialization stage just completed by the renderer process
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
        case AppInitStage.CONNECTED_TO_BACKEND:
            console.log(`process.env.npm_lifecycle_event="${process.env.npm_lifecycle_event}"`);
            sendAppCommand("load-initial-libraries", libsToLoad);
            break;
        case AppInitStage.LIBS_LOADED: {
            if (!drawingToAutoload && localSettings.get("autoloadLastDrawing")) {
                drawingToAutoload = localSettings.get("lastOpenedDrawing");
            }//if
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
export function registerCustomManagementProtocols()
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
                console.debug(`Executed handler for url ${request.url}.\nError: ${error?.message}\nstdout: ${stdout}\nstderr: ${stderr}`);
            });
        });
    }//for
}//registerCustomManagementProtocols


export function setDefaultDrawingFileName(newName?: string|undefined)
{
    defaultDrawingFileName = newName;
}//setDefaultDrawingFileName