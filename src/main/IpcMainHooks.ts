/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *             An IPC interface to Electron node.js main script
 ***************************************************************************/
import { ipcMain, IpcMainEvent } from "electron";
import { AppInitStage } from "../renderer/ElectronAPI";
import { ContextMenuID } from "./Menus";
import { AppSettings } from "./main";

export interface IpcMainChannels {
    "update-app-settings": (newAppSettings: AppSettings) => void;
    "context-menu": (menuID: ContextMenuID, ...args: unknown[]) => void;
    "renderer-ready": (stage: AppInitStage) => void;
    "set-default-drawing-filename": (fileName: string) => void;
    "complete-drawing-saving": (dwgData: string) => void;
    "enable-delete-menu-item": (enable: boolean) => void;
    "backend-server-connected": (url: string, password: string, autoConnect: boolean) => void;
    "backend-server-disconnected": () => void;
    "open-url": (url: string) => void;
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
}//IpcMainHooks
