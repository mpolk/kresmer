/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import {BrowserWindow, Menu, MenuItemConstructorOptions} from "electron";

export interface ContextMenus {
    "link-vertex": (linkID: number, vertexNumber: number) => void,
}//ContextMenus

export type ContextMenuID = keyof ContextMenus;
export interface ContextMenuCommands {
    "delete-vertex": (linkID: number, vertexNumber: number) => void,
}//ContextMenuCommands

export type ContextMenuCommandID = keyof ContextMenuCommands;

export default class Menus {

    private readonly contextMenus: Record<ContextMenuID, MenuItemConstructorOptions[]> =
        {
            "link-vertex": [
                {label: "Adjust vertex position", id: "adjust-vertex-position"},
                {label: "Delete vertex", id: "delete-vertex"},
            ],
        }

    private browserWindow: BrowserWindow;

    constructor(browserWindow: BrowserWindow)
    {
        this.browserWindow = browserWindow;
    }//ctor

    public contextMenu(id: ContextMenuID, ...args: unknown[])
    {
        const template = [...this.contextMenus[id]];
        for (const item of template) {
            item.click = () => {
                this.browserWindow.webContents.send("command", item.id, ...args);
            }
        }//for
        Menu.buildFromTemplate(template).popup();
    }//contextMenu

}//Menus