/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Electron node.js preload script
 ***************************************************************************/

 import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

 console.debug("Setting up electron API for the renderer...");
 contextBridge.exposeInMainWorld('electronAPI', {

    signalReadiness: () => {ipcRenderer.send('renderer-ready')},
    onLoadLibrary: (callback: (event: IpcRendererEvent, libData: string) => void) => {
        ipcRenderer.on('load-library', callback);
    },

 });
 console.debug("Finished setting up electron API for the renderer");
 