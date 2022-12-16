/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Renderer-to-main electron interprocess API declaration
 ***************************************************************************/

import {IpcRendererEvent} from 'electron';
import { ContextMenuID } from './main/menus';

export interface IElectronAPI {
    signalReadiness: (stage: number) => void,
    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => void,
    showContextMenu: (menuID: ContextMenuID, ...args: unknown[]) => void,
}//IElectronAPI

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}