/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Renderer-to-main electron interprocess API declaration
 ***************************************************************************/

import {FileFilter, IpcRendererEvent} from 'electron';
import { ContextMenus, ContextMenuID } from './main/menus';
import { AppSettings } from '../main/main';
import { AppInitStage, fileSelectOrLoadResult, UrlType } from './renderer-main';

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
    // enableLinkOpMenuItems: (enable: boolean) => void,
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

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}