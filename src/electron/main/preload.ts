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

    onLoadLibrary: (callback: (event: IpcRendererEvent, libData: string) => void) => {
        ipcRenderer.on('load-library', callback);
    },
    
    onLoadDrawing: (callback: (event: IpcRendererEvent, drawingData: string, drawingName?: string) => void) => {
        ipcRenderer.on('load-drawing', callback);
    },

    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => {
        ipcRenderer.on('command', callback);
    },

    showContextMenu: (menuID: ContextMenuID, ...args: unknown[]) => {
        // console.debug("renderer: Context menu '%s'", menuID);
        ipcRenderer.send('context-menu', menuID, ...args);
        // console.debug("renderer: sent 'context-menu' event");
    },

 });
 console.debug("Finished setting up electron API for the renderer");
 