/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import {BrowserWindow, Menu, MenuItemConstructorOptions} from "electron";
import { openDrawing, loadLibrary, sendAppCommand } from "./main";

const isMac = process.platform === 'darwin'

export interface ContextMenus {
    "link-vertex": (linkID: number, vertexNumber: number) => void,
}//ContextMenus

export type ContextMenuID = keyof ContextMenus;

type ContextMenuHandler<MenuID extends ContextMenuID> = ContextMenus[MenuID]
export interface ContextMenuCommands {
    "adjust-vertex-position": ContextMenuHandler<"link-vertex">,
    "delete-vertex": ContextMenuHandler<"link-vertex">,
}//ContextMenuCommands

export type ContextMenuCommandID = keyof ContextMenuCommands;
type ContextMenuItemConstructorOptions = 
    Omit<MenuItemConstructorOptions, "id"> & {id: ContextMenuCommandID};

export default class Menus {

    constructor(browserWindow: BrowserWindow)
    {
        this.browserWindow = browserWindow;
        Menu.setApplicationMenu(Menu.buildFromTemplate(Menus.appMenuTemplate));
    }//ctor
    
    private static readonly appMenuTemplate: MenuItemConstructorOptions[] = [
      // { role: 'fileMenu' }
      {
        label: 'File',
        submenu: [
          {label: "Open drawing...", accelerator: "Control+O", click: () => openDrawing()},
          {label: "Load library...", accelerator: "Control+L", click: () => loadLibrary()},
          { type: 'separator' },
          isMac ? { role: 'close' } : { role: 'quit' }
        ]
      },
      // { role: 'editMenu' }
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: "Control+Z", click: () => sendAppCommand("undo") },
          { label: 'Redo', accelerator: "Control+Y", click: () => sendAppCommand("redo") },
          { type: 'separator' },
          { role: 'delete' },
        ]
      },
      // { role: 'viewMenu' }
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        role: 'help',
        submenu: [
          { role: 'about' },
        ]
      }
    ]// as MenuItemConstructorOptions[]

    private readonly contextMenus: Record<ContextMenuID, ContextMenuItemConstructorOptions[]> =
        {
            "link-vertex": [
                {label: "Adjust vertex position", id: "adjust-vertex-position"},
                {label: "Delete vertex", id: "delete-vertex"},
            ],
        }

    private readonly browserWindow: BrowserWindow;

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