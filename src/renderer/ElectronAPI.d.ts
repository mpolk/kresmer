/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Renderer-to-main electron interprocess API declaration
 ***************************************************************************/

import {IpcRendererEvent} from 'electron';
import { ContextMenus, ContextMenuID } from './main/menus';

export interface ElectronAPI {
    signalReadiness: (stage: AppInitStage) => void,
    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => void,
    showContextMenu: <MenuID extends ContextMenuID>(menuID: MenuID, ...args: Parameters<ContextMenus[MenuID]>) => void,
    setDefaultDrawingFileName: (fileName: string) => void,
    completeDrawingSaving: (dwgData: string) => void,
    enableDeleteMenuItem: (enable: boolean) => void,
    backendServerConnected: (url: string, password: string, autoConnect: boolean) => void,
    backendServerDisconnected: () => void,
}//IElectronAPI


export const enum AppInitStage {
    HANDLERS_INITIALIZED = 0,
    CONNECTED_TO_BACKEND = 1,
    STDLIB_LOADED = 2,
    DRAWING_LOADED = 3,
}//AppInitStage

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}