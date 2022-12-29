/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Renderer-to-main electron interprocess API declaration
 ***************************************************************************/

import {IpcRendererEvent} from 'electron';
import { ContextMenus, ContextMenuID } from './main/menus';

export interface IElectronAPI {
    signalReadiness: (stage: number) => void,
    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => void,
    showContextMenu: <MenuID extends ContextMenuID>(menuID: MenuID, ...args: Parameters<ContextMenus[MenuID]>) => void,
    completeDrawingSaving: (dwgData: string, defaultDrawingFileName?: string) => void,
}//IElectronAPI

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}