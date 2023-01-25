/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import {BrowserWindow, Menu, MenuItemConstructorOptions} from "electron";
import { Position } from "kresmer";
import { openDrawing, loadLibrary, saveDrawingAs, sendAppCommand, saveDrawing } from "./main";

const isMac = process.platform === 'darwin'

export interface ContextMenus {
  "component": (componentID: number) => void,
  "link": (linkID: number, segmentNumber: number, mousePos: Position) => void,
  "link-vertex": (linkID: number, vertexNumber: number) => void,
}//ContextMenus

export type ContextMenuID = keyof ContextMenus;

type ContextMenuHandler<MenuID extends ContextMenuID> = ContextMenus[MenuID]
export interface ContextMenuCommands {
    "transform-component": ContextMenuHandler<"component">,
    "edit-component-properties": ContextMenuHandler<"component">,
    "align-vertices": ContextMenuHandler<"link">,
    "add-vertex": ContextMenuHandler<"link">,
    "edit-link-properties": ContextMenuHandler<"link">,
    "align-vertex": ContextMenuHandler<"link-vertex">,
    "delete-vertex": ContextMenuHandler<"link-vertex">,
}//ContextMenuCommands

export type ContextMenuCommandID = keyof ContextMenuCommands;
type ContextMenuItemConstructorOptions = 
    Omit<MenuItemConstructorOptions, "id"> & {id?: ContextMenuCommandID};

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
          {type: 'separator'},
          {label: "Save drawing", accelerator: "Control+S", click: () => saveDrawing()},
          {label: "Save drawing as...", click: () => saveDrawingAs()},
          {type: 'separator'},
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
        "component" : [
          {label: "Transform", id: "transform-component"},
          {type: 'separator'},
          {label: "Properties...", id: "edit-component-properties"},
        ],
        "link": [
            {label: "Align vertices", id: "align-vertices"},
            {label: "Add vertex", id: "add-vertex"},
            {type: 'separator'},
            {label: "Properties...", id: "edit-link-properties"},
          ],
        "link-vertex": [
                {label: "Align vertex (double-click)", id: "align-vertex"},
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