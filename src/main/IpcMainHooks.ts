/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *             An IPC interface to Electron node.js main script
 ***************************************************************************/
import { FileFilter, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { ContextMenuID } from "./Menus";
import { AppSettings } from "./main";
import type { URLType } from '../renderer/URLType';
import type { AppInitStage, fileSelectOrLoadResult } from '../renderer/renderer-main';
import { LibData } from "kresmer";

export interface IpcMainChannels {
    "update-app-settings": (newAppSettings: AppSettings) => void;
    "context-menu": (menuID: ContextMenuID, ...args: unknown[]) => void;
    "renderer-ready": (stage: AppInitStage) => void;
    "set-default-drawing-filename": (fileName: string) => void;
    "complete-drawing-saving": (dwgData: string) => void;
    "save-drawing": (dwgData: string) => boolean;
    "complete-drawing-export-to-SVG": (svgData: string) => void;
    "enable-delete-selected-element-menu-item": (enable: boolean) => void;
    "enable-component-op-menu-items": (enable: boolean) => void;
    "enable-move-component-up-menu-items": (enable: boolean) => void;
    "enable-move-component-down-menu-items": (enable: boolean) => void;
    // "enable-link-op-menu-items": (enable: boolean) => void;
    "backend-server-connected": (url: string, password: string, autoConnect: boolean) => void;
    "backend-server-disconnected": () => void;
    "open-url": (url: string) => void;
    "grid-shown-or-hidden": (shown: boolean) => void;
    "rulers-shown-or-hidden": (shown: boolean) => void;
    "snapping-to-grid-toggled": (snapToGrid: boolean) => void;
    "snapping-granularity-changed": (granularity: number) => void;
    "vertex-auto-alignment-toggled": (autoAlignVertices: boolean) => void;
    "load-initial-libraries": () => LibData;
    "load-library-file": (libName: string, fileName?: string) => string|undefined;
    "load-library-translation": (libName: string, language: string) => string|undefined;
    "load-initial-drawing": () => string | undefined;
    "check-reload-status": () => boolean;
    "reload-content": () => void;
    "select-or-load-file": (requiredResultType: URLType, filters: FileFilter[]) => fileSelectOrLoadResult;
}//IpcMainChannels

export type IpcMainChannel = keyof IpcMainChannels;

export class IpcMainHooks {
    static on<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, handler: H): void;
    static on(channel: IpcMainChannel, handler: (...args: unknown[]) => void)
    {
        ipcMain.on(channel, (event: IpcMainEvent, ...args: unknown[]) => handler(...args));
    }//on

    static once<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, handler: H): void;
    static once(channel: IpcMainChannel, handler: (...args: unknown[]) => void)
    {
        ipcMain.once(channel, (event: IpcMainEvent, ...args: unknown[]) => handler(...args));
    }//on

    static onInvokation<C extends IpcMainChannel, H extends IpcMainChannels[C]>(channel: C, handler: H): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static onInvokation(channel: IpcMainChannel, handler: (...args: unknown[]) => any)
    {
        ipcMain.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => handler(...args));
    }//on
}//IpcMainHooks
