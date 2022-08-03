/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Renderer-to-main electron interprocess API declaration
 ***************************************************************************/

 import {IpcRendererEvent} from 'electron';

export interface IElectronAPI {
    signalReadiness: () => Promise<void>,
    onLoadLibrary: (callback: (event: IpcRendererEvent, libData: string) => void) => void,
}//IElectronAPI

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}