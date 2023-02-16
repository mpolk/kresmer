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

class RendererToMainBridge {
    static send<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, ...args: Parameters<H>): void;
    static send(channel: IpcMainChannel, ...args: unknown[])
    {
        ipcRenderer.send(channel, ...args);
    }//send

    static expose(methods: ElectronAPI)
    {
        contextBridge.exposeInMainWorld('electronAPI', methods);
    }//expose
}//RendererToMainBridge


console.debug("Setting up electron API for the renderer...");
RendererToMainBridge.expose({

    signalReadiness: (stage: AppInitStage) => {
        console.debug(`Main window renderer: I am ready (stage ${stage})`);
        RendererToMainBridge.send('renderer-ready', stage);
    },

    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => {
        ipcRenderer.on('command', callback);
    },

    showContextMenu: (menuID: ContextMenuID, ...args: unknown[]) => {
        RendererToMainBridge.send('context-menu', menuID, ...args);
    },

    setDefaultDrawingFileName: (fileName: string) => {
        RendererToMainBridge.send('set-default-drawing-filename', fileName);
    },

    completeDrawingSaving: (dwgData: string) => {
        RendererToMainBridge.send("complete-drawing-saving", dwgData);
    },

    enableDeleteMenuItem: (enable: boolean) => {
        RendererToMainBridge.send("enable-delete-menu-item", enable);
    },

    backendServerConnected: (url: string, password: string, autoConnect: boolean) => {
        RendererToMainBridge.send("backend-server-connected", url, password, autoConnect);
    },

    backendServerDisconnected: () => {
        RendererToMainBridge.send("backend-server-disconnected");
    },

 });
 console.debug("Finished setting up electron API for the renderer");
 