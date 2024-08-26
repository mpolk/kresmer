/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js preload script
 ***************************************************************************/

import { contextBridge, FileFilter, ipcRenderer, IpcRendererEvent } from 'electron';
import { ContextMenuID } from './main/Menus';
import { AppInitStage } from './renderer/renderer-main';
import { ElectronAPI } from './renderer/ElectronAPI';
import { IpcMainChannel, IpcMainChannels } from './main/IpcMainHooks';
import { AppSettings } from './main/main';
import { type URLType } from './renderer/URLType';

function sendToMain<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, ...args: Parameters<H>): void;
function sendToMain(channel: IpcMainChannel, ...args: unknown[])
{
    ipcRenderer.send(channel, ...args);
}//sendToMain

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function invokeFromMain<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, ...args: Parameters<H>): Promise<any>;
async function invokeFromMain(channel: IpcMainChannel, ...args: unknown[])
{
    return await ipcRenderer.invoke(channel, ...args);
}//invokeFromMain

function exposeToRenderer(methods: ElectronAPI)
{
    contextBridge.exposeInMainWorld('electronAPI', methods);
}//expose

const initialAppSettings = JSON.parse(process.argv.find(arg => arg.startsWith("--app-settings="))!.replace("--app-settings=", ""));

console.debug("Setting up electron API for the renderer...");
exposeToRenderer({

    signalReadiness: (stage: AppInitStage) => {
        console.debug(`Main window renderer: I am ready (stage ${stage})`);
        sendToMain('renderer-ready', stage);
    },

    initialAppSettings,

    updateAppSettings: (newAppSettings: AppSettings) => {
        sendToMain("update-app-settings", newAppSettings);
    },

    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => {
        ipcRenderer.on('command', callback);
    },

    showContextMenu: (menuID: ContextMenuID, ...args: unknown[]) => {
        sendToMain('context-menu', menuID, ...args);
    },

    setDefaultDrawingFileName: (fileName: string) => {
        sendToMain('set-default-drawing-filename', fileName);
    },

    completeDrawingSaving: (dwgData: string) => {
        sendToMain("complete-drawing-saving", dwgData);
    },

    saveDrawing: (dwgData: string) => {
        return invokeFromMain("save-drawing", dwgData);
    },

    completeDrawingExportToSVG: (svgData: string) => {
        sendToMain("complete-drawing-export-to-SVG", svgData);
    },

    enableDeleteSelectedElementMenuItem: (enable: boolean) => {
        sendToMain("enable-delete-selected-element-menu-item", enable);
    },

    enableComponentOpMenuItems: (enable: boolean) => {
        sendToMain("enable-component-op-menu-items", enable);
    },

    // enableLinkOpMenuItems: (enable: boolean) => {
    //     sendToMain("enable-link-op-menu-items", enable);
    // },

    enableMoveComponentUpMenuItems: (enable: boolean) => {
        sendToMain("enable-move-component-up-menu-items", enable);
    },

    enableMoveComponentDownMenuItems: (enable: boolean) => {
        sendToMain("enable-move-component-down-menu-items", enable);
    },

    backendServerConnected: (url: string, password: string, autoConnect: boolean) => {
        sendToMain("backend-server-connected", url, password, autoConnect);
    },

    backendServerDisconnected: () => {
        sendToMain("backend-server-disconnected");
    },

    openURL: (url: string) => {
        sendToMain("open-url", url);
    },

    rulersShownOrHidden: (shown: boolean) => {
        sendToMain("rulers-shown-or-hidden", shown);
    },

    gridShownOrHidden: (shown: boolean) => {
        sendToMain("grid-shown-or-hidden", shown);
    },

    snappingToGridToggled: (snapToGrid: boolean) => {
        sendToMain("snapping-to-grid-toggled", snapToGrid)
    },

    autoAlignmentToggled: (autoAlignVertices: boolean) => {
        sendToMain("vertex-auto-alignment-toggled", autoAlignVertices)
    },

    loadLibraryFile: (libName: string, fileName?: string) => {
        return invokeFromMain("load-library-file", libName, fileName);
    },

    loadLibraryTranslation: (libName: string, language: string) => {
        return invokeFromMain("load-library-translation", libName, language);
    },

    isReloadInProgress: () => {
        return invokeFromMain("check-reload-status");
    },

    reloadContent: () => {
        sendToMain("reload-content");
    },

    selectOrLoadFile: (requiredResultType: URLType, filters: FileFilter[]) => {
        return invokeFromMain("select-or-load-file", requiredResultType, filters);
    },
});

console.debug("Finished setting up electron API for the renderer");
 