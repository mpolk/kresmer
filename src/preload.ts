/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js preload script
 ***************************************************************************/

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ContextMenuID } from './main/Menus';
import { AppInitStage } from './renderer/ElectronAPI';
import { IpcMainChannel, IpcMainChannels } from './main/IpcMainHooks';

class IpcMainSender {
    static send<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, ...args: Parameters<H>): void;
    static send(channel: IpcMainChannel, ...args: unknown[])
    {
        ipcRenderer.send(channel, ...args);
    }//send
}//IpcMainSender

 console.debug("Setting up electron API for the renderer...");
 contextBridge.exposeInMainWorld('electronAPI', {

    signalReadiness: (stage: AppInitStage) => {
        console.debug(`Main window renderer: I am ready (stage ${stage})`);
        IpcMainSender.send('renderer-ready', stage);
    },

    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => {
        ipcRenderer.on('command', callback);
    },

    showContextMenu: (menuID: ContextMenuID, ...args: unknown[]) => {
        IpcMainSender.send('context-menu', menuID, ...args);
    },

    setDefaultDrawingFileName: (fileName: string) => {
        IpcMainSender.send('set-default-drawing-filename', fileName);
    },

    completeDrawingSaving: (dwgData: string) => {
        IpcMainSender.send("complete-drawing-saving", dwgData);
    },

    enableDeleteMenuItem: (enable: boolean) => {
        IpcMainSender.send("enable-delete-menu-item", enable);
    },

    backendServerConnected: (url: string, password: string, autoConnect: boolean) => {
        IpcMainSender.send("backend-server-connected", url, password, autoConnect);
    },

    backendServerDisconnected: () => {
        IpcMainSender.send("backend-server-disconnected");
    },

 });
 console.debug("Finished setting up electron API for the renderer");
 