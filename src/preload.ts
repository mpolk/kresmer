/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js preload script
 ***************************************************************************/

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ContextMenuID } from './main/Menus';
import { AppInitStage, ElectronAPI } from './renderer/ElectronAPI';
import { IpcMainChannel, IpcMainChannels } from './main/IpcMainHooks';
import { AppSettings } from './main/main';

function sendToMain<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, ...args: Parameters<H>): void;
function sendToMain(channel: IpcMainChannel, ...args: unknown[])
{
    ipcRenderer.send(channel, ...args);
}//sendToMain

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

    completeDrawingExportToSVG: (svgData: string) => {
        sendToMain("complete-drawing-export-to-SVG", svgData);
    },

    enableDeleteMenuItem: (enable: boolean) => {
        sendToMain("enable-delete-menu-item", enable);
    },

    enableDuplicateMenuItem: (enable: boolean) => {
        sendToMain("enable-duplicate-menu-item", enable);
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

    autoAlignmentToggled: (autoAlignVertices: boolean) => {
        sendToMain("vertex-auto-alignment-toggled", autoAlignVertices)
    },

});
 console.debug("Finished setting up electron API for the renderer");
 