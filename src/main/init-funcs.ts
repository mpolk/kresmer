/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *       Initialization procedures for the Electron node.js main script
 ***************************************************************************/

import path from "path";
import fs from "fs";
import { exec } from 'child_process';
import { BrowserWindow, Menu, protocol } from "electron";
import { localSettings, menus, isDev, libsToLoad,
         AppSettings, addLib, addLibDir, isReloadInProgress, reloadContent, recentDrawings} from "./main";
import { ContextMenuID } from "./Menus";
import { IpcMainHooks } from './IpcMainHooks';
import { loadLibraryFile, loadLibraryTranslation, saveDrawing, selectOrLoadFile } from './file-ops';
import { openUrlWithSystemBrowser } from './misc-ops';
import { LibData } from "kresmer";

export let defaultDrawingFileName: string|undefined;
export let drawingToAutoload: string;

/** Parses the command line and save its parameters to the global vars */
export function parseCommandLine()
{
    const argv = [...process.argv];
    console.debug(`argv=${argv}`);
    /* const exePath =  */argv.shift();
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
                        console.error('"-l" command line options should have an argument!');
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
                        console.error('"-L" command line options should have an argument!');
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
export async function createMainWindow() {
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
    const packageJson = await import("../../package.json");
    const url = isDev ?
        `http://localhost:${packageJson.config.port}/${indexPage}` :
        `file://${path.join(__dirname, `../${indexPage}`)}`;
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

    IpcMainHooks.on('set-default-drawing-filename', (fileName: string) => {
        defaultDrawingFileName = fileName;
    });

    IpcMainHooks.on('enable-delete-selected-element-menu-item', (enabled: boolean) => {
        modifyMenuItemFlags("delete-selected-element")({enabled});
    });

    IpcMainHooks.on('enable-component-op-menu-items', (enabled: boolean) => {
        modifyMenuItemFlags(/* "delete-component", */ "duplicate-selected-element", "transform-component")({enabled});
    });

    // IpcMainHooks.on('enable-link-op-menu-items', (enable: boolean) => {
    //     // Menu.getApplicationMenu()!.getMenuItemById("delete-link")!.enabled = enable;
    // });

    IpcMainHooks.on('enable-area-op-menu-items', (enabled: boolean) => {
        modifyMenuItemFlags(/* "delete-area", */ "duplicate-selected-element")({enabled});
    });

    IpcMainHooks.on('enable-move-element-up-menu-items', (enabled: boolean) => {
        modifyMenuItemFlags("move-selected-element-up", "move-selected-element-to-top")({enabled});
    });

    IpcMainHooks.on('enable-move-element-down-menu-items', (enabled: boolean) => {
        modifyMenuItemFlags("move-selected-element-down", "move-selected-element-to-bottom")({enabled});
    });

    IpcMainHooks.on("backend-server-connected", (url: string, password: string, autoConnect: boolean) => {
        localSettings.set("server", {url, password, autoConnect});
        modifyMenuItemFlags("connectToServer")({visible: false, enabled: false});
        modifyMenuItemFlags("disconnectFromServer")({visible: true, enabled: true});
    });

    IpcMainHooks.on("backend-server-disconnected", () => {
        localSettings.set("server", "autoConnect", false);
        modifyMenuItemFlags("connectToServer")({visible: true, enabled: true});
        modifyMenuItemFlags("disconnectFromServer")({visible: false, enabled: false});
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
        modifyMenuItemFlags("toggleGrid")({checked: shown});
    });

    IpcMainHooks.on("rulers-shown-or-hidden", shown => {
        modifyMenuItemFlags("toggleRulers")({checked: shown});
    });

    IpcMainHooks.on("snapping-to-grid-toggled", snapToGrid => {
        modifyMenuItemFlags("toggleSnappingToGrid")({checked: snapToGrid});
        localSettings.set("snapToGrid", snapToGrid);
    });

    IpcMainHooks.on("snapping-granularity-changed", granularity => {
        localSettings.set("snappingGranularity", granularity);
    });

    IpcMainHooks.on("vertex-auto-alignment-toggled", autoAlignVertices => {
        modifyMenuItemFlags("toggleVertexAutoAlignment")({checked: autoAlignVertices});
        localSettings.set("autoAlignVertices", autoAlignVertices);
    });

    IpcMainHooks.onInvokation("load-initial-libraries", () => {
        return loadInitialLibraries();
    });

    IpcMainHooks.onInvokation("load-library-file", (libName: string, fileName?: string) => {
        return loadLibraryFile(libName, fileName);
    });

    IpcMainHooks.onInvokation("load-library-translation", (libName: string, language: string) => {
        return loadLibraryTranslation(libName, language);
    });

    IpcMainHooks.onInvokation("load-initial-drawing", () => {
        return loadInitialDrawing();
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


function modifyMenuItemFlags(...ids: string[])
{
    return function(options: {enabled?: boolean, visible?: boolean, checked?: boolean}) {
        for (const id of ids) {
            if (options.enabled !== undefined)
                Menu.getApplicationMenu()!.getMenuItemById(id)!.enabled = options.enabled;
            if (options.visible !== undefined)
                Menu.getApplicationMenu()!.getMenuItemById(id)!.visible = options.visible;
            if (options.checked !== undefined)
                Menu.getApplicationMenu()!.getMenuItemById(id)!.checked = options.checked;
        }//for
    }
}//modifyMenuItemFlags


/** Loads all the libraries found in the library directories */
export function loadInitialLibraries(): LibData
{
    const libData: LibData = new Map();
    for (const libPath of libsToLoad) {
        libData.set(path.basename(libPath, ".krel"), fs.readFileSync(libPath, "utf8"));
    }//for
    return libData;
}//loadInitialLibraries


/** Loads all the libraries found in the library directories */
export function loadInitialDrawing(): string | undefined
{
    let dwgFile = drawingToAutoload;
    if (!dwgFile && localSettings.get("autoloadLastDrawing")) {
        dwgFile = recentDrawings.last;
    }//if
    if (fs.existsSync(dwgFile)) {
        defaultDrawingFileName = dwgFile;
        return fs.readFileSync(dwgFile, "utf-8");
    }//if
}//loadInitialDrawing


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