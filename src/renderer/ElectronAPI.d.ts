/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Renderer-to-main electron interprocess API declaration
 ***************************************************************************/

import {FileFilter, IpcRendererEvent} from 'electron';
import { ContextMenus, ContextMenuID } from './main/menus';
import { AppSettings } from '../main/main';
import { fileSelectOrLoadResult, UrlType } from './renderer-main';

export interface ElectronAPI {
    signalReadiness: (stage: AppInitStage) => void,
    initialAppSettings: AppSettings,
    updateAppSettings: (newAppSettings: AppSettings) => void,
    onCommand: (callback: (event: IpcRendererEvent, command: string, ...args: unknown[]) => void) => void,
    showContextMenu: <MenuID extends ContextMenuID>(menuID: MenuID, ...args: Parameters<ContextMenus[MenuID]>) => void,
    setDefaultDrawingFileName: (fileName: string) => void,
    completeDrawingSaving: (dwgData: string) => void,
    saveDrawing: (dwgData: string) => Promise<boolean>,
    completeDrawingExportToSVG: (svgData: string) => void,
    enableDeleteSelectedElementMenuItem: (enable: boolean) => void,
    enableComponentOpMenuItems: (enable: boolean) => void,
    enableMoveComponentUpMenuItems: (enable: boolean) => void,
    enableMoveComponentDownMenuItems: (enable: boolean) => void,
    enableLinkOpMenuItems: (enable: boolean) => void,
    backendServerConnected: (url: string, password: string, autoConnect: boolean) => void,
    backendServerDisconnected: () => void,
    openURL: (url: string) => void,
    rulersShownOrHidden: (shown: boolean) => void,
    gridShownOrHidden: (shown: boolean) => void,
    autoAlignmentToggled: (autoAlignVertices: boolean) => void,
    loadLibraryFile: (libName: string, fileName?: string) => Promise<string|undefined>,
    isReloadInProgress: () => Promise<boolean>,
    reloadContent: () => void,
    selectOrLoadFile: (requiredResultType: UrlType, filters: FileFilter[]) => Promise<fileSelectOrLoadResult>,
}//IElectronAPI


export const enum AppInitStage {
    HANDLERS_INITIALIZED = 0,
    CONNECTED_TO_BACKEND = 1,
    LIBS_LOADED = 2,
    DRAWING_LOADED = 3,
}//AppInitStage

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}