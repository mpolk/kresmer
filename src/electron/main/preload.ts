/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js preload script
 ***************************************************************************/

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ContextMenuID } from './menus';

 console.debug("Setting up electron API for the renderer...");
 contextBridge.exposeInMainWorld('electronAPI', {

    signalReadiness: (stage: number) => {
        console.debug(`Main window renderer: I am ready (stage ${stage})`);
        ipcRenderer.send('renderer-ready', stage);
    },

    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => {
        ipcRenderer.on('command', callback);
    },

    showContextMenu: (menuID: ContextMenuID, ...args: unknown[]) => {
        ipcRenderer.send('context-menu', menuID, ...args);
    },

 });
 console.debug("Finished setting up electron API for the renderer");
 