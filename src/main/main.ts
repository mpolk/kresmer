/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js main script
 ***************************************************************************/

import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';
import Settings from './Settings';
import Menus from "./Menus";
import { AppCommand, AppCommandFormats } from '../renderer/AppCommands';
import { createMainWindow, initIpcMainHooks, registerCustomManagementProtocols, parseCommandLine, setDefaultDrawingFileName } from './init-funcs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const packageJson = require("../../package.json");
export const isDev = process.env.npm_lifecycle_event?.startsWith("app:dev");
export const appDir = path.dirname(process.argv0);

export let mainWindow: BrowserWindow;
export let menus: Menus;

export const localSettings = new Settings("local-settings.json", {
    window: {width: 800, height: 600},
    server: {url: "http://localhost:3333", password: "", autoConnect: false as boolean},
    libDirs: ["lib", "./lib"],
    snapToGrid: true as boolean,
    snappingGranularity: 1,
    autoAlignVertices: true as boolean,
    saveDynamicPropValuesWithDrawing: false as boolean,
    customManagementProtocols: [] as CustomManagementProtocol[],
    animateComponentDragging: false as boolean,
    animateLinkBundleDragging: false as boolean,
    lastOpenedDrawing: "",
    autoloadLastDrawing: true as boolean,
});

export type AppSettings = {
    server: {url: string, password: string, autoConnect: boolean},
    libDirs: string[],
    snapToGrid: boolean,
    snappingGranularity: number,
    autoAlignVertices: boolean,
    saveDynamicPropValuesWithDrawing: boolean,
    customManagementProtocols: CustomManagementProtocol[],
    animateComponentDragging: boolean,
    animateLinkBundleDragging: boolean,
    lastOpenedDrawing: string,
    autoloadLastDrawing: boolean;
}//AppSettings

export type CustomManagementProtocol = {
    name: string,
    cmd: string,
}//CustomManagementProtocol

export const libDirs: string[] = [];
export const libsToLoad: string[] = [];

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    const libDirs = localSettings.get("libDirs");
    libDirs.forEach(libDir => addLibDir(libDir));
    parseCommandLine();
    mainWindow = createMainWindow();
    menus = new Menus(mainWindow);
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

/** Adds a specified directory path to the global list */
export function addLibDir(libDir: string)
{
    if (!libDir.match(/^\.?\//))
        libDir = path.resolve(appDir, libDir);
    if (!fs.existsSync(libDir))
        return;
    if (!libDirs.includes(libDir))
        libDirs.push(libDir);
    fs.readdirSync(libDir).forEach(lib => {
        if (lib.endsWith(".krel")) {
            addLib(path.resolve(libDir!, lib));
        }//if
    });
}//addLibDir

/** Adds a specified library file path to the global list */
export function addLib(libPath: string)
{
    if (!libsToLoad.includes(libPath))
        libsToLoad.push(libPath);
}//addLib


export function sendAppCommand<Command extends AppCommand>(command: Command, ...args: Parameters<AppCommandFormats[Command]>): void;
export function sendAppCommand<Command extends AppCommand>(command: Command, ...args: unknown[])
{
    // console.debug(command, ...args);
    mainWindow.webContents.send("command", command, ...args);
}//sendAppCommand

export function createNewDrawing()
{
    sendAppCommand("create-new-drawing");
    setDefaultDrawingFileName();
}//createNewDrawing

export function showAboutDialog()
{
    // console.debug("App version: ",  app.getVersion());
    sendAppCommand("show-about-dialog", app.getVersion());
}//showAboutDialog


let _isReloadInProgress = false;
export function isReloadInProgress()
{
    const isInProgress = _isReloadInProgress;
    _isReloadInProgress = false;
    return isInProgress;
}//isReloadInProgress

let ignoreCacheOnReload = false;
export function reloadContent(ignoreCache?: boolean)
{
    if (ignoreCache !== undefined)
        ignoreCacheOnReload = ignoreCache;
    _isReloadInProgress = true;
    if (!ignoreCacheOnReload)
        mainWindow.webContents.reload();
    else
        mainWindow.webContents.reloadIgnoringCache();
}//reloadContent
