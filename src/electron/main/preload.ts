/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js preload script
 ***************************************************************************/

import { contextBridge, ipcMain, ipcRenderer, IpcRendererEvent } from 'electron';
import { menus } from './main';
import { ContextMenuID } from './menus';

 console.debug("Setting up electron API for the renderer...");
 contextBridge.exposeInMainWorld('electronAPI', {

    signalReadiness: (stage: number) => {
        console.debug(`Main window renderer: I am ready (stage ${stage})`);
        ipcRenderer.send('renderer-ready', stage);
    },

    onLoadLibrary: (callback: (event: IpcRendererEvent, libData: string) => void) => {
        ipcRenderer.on('load-library', callback);
    },
    
    onLoadDrawing: (callback: (event: IpcRendererEvent, drawingData: string, drawingName?: string) => void) => {
        ipcRenderer.on('load-drawing', callback);
    },

    showContextMenu: (menuID: ContextMenuID) => {
        console.debug("renderer: Context menu '%s'", menuID);
        ipcRenderer.send('context-menu', menuID);
        console.debug("renderer: sent 'context-menu' event");
    },

 });
 console.debug("Finished setting up electron API for the renderer");
 