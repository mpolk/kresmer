/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import {BrowserWindow, Menu, MenuItemConstructorOptions} from "electron";
import { Position } from "kresmer";
import { openDrawing, loadLibrary, saveDrawingAs, sendAppCommand, saveDrawing, 
         requestConnectToServer, requestDisconnectFromServer, localSettings } from "./main";

const isMac = process.platform === 'darwin'

export interface ContextMenus {
  "drawing": (mousePos?: Position) => void,
  "component": (componentID: number) => void,
  "link": (linkID: number, segmentNumber: number, mousePos: Position) => void,
  "link-vertex": (linkID: number, vertexNumber: number) => void,
  "connection-point": (componentID: number, connectionPointName: number) => void,
}//ContextMenus

export type ContextMenuID = keyof ContextMenus;

type ContextMenuHandler<MenuID extends ContextMenuID> = ContextMenus[MenuID]
export interface ContextMenuCommands {
    "add-component": ContextMenuHandler<"drawing">,
    "edit-drawing-properties": ContextMenuHandler<"drawing">,
    "create-link": ContextMenuHandler<"drawing">,
    "create-link-bundle": ContextMenuHandler<"drawing">,

    "transform-component": ContextMenuHandler<"component">,
    "delete-component": ContextMenuHandler<"component">,
    "edit-component-properties": ContextMenuHandler<"component">,

    "align-vertices": ContextMenuHandler<"link">,
    "add-vertex": ContextMenuHandler<"link">,
    "delete-link": ContextMenuHandler<"link">,
    "edit-link-properties": ContextMenuHandler<"link">,

    "align-vertex": ContextMenuHandler<"link-vertex">,
    "delete-vertex": ContextMenuHandler<"link-vertex">,

    "connect-connection-point": ContextMenuHandler<"connection-point">,
}//ContextMenuCommands

export type ContextMenuCommandID = keyof ContextMenuCommands;
type ContextMenuItemConstructorOptions = 
    Omit<MenuItemConstructorOptions, "id"> & {id?: ContextMenuCommandID, cond?: (args: unknown[]) => boolean};

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
          {label: "Connect to the backend server...", accelerator: "Control+B", id: "connectToServer", 
                  click: () => requestConnectToServer(true)},
          {label: "Disconnect from the backend server", accelerator: "Control+D", id: "disconnectFromServer", 
                  click: () => requestDisconnectFromServer(), visible: false, enabled: false},
          {type: 'separator'},
          isMac ? { role: 'close' } : { role: 'quit' }
        ]
      },
      // { role: 'editMenu' }
      {
        label: 'Edit',
        submenu: [
          { label: 'Escape', accelerator: "Escape", visible: false, enabled: true, click: () => sendAppCommand("escape") },
          { label: 'Undo', accelerator: "Control+Z", click: () => sendAppCommand("undo") },
          { label: 'Redo', accelerator: "Control+Y", click: () => sendAppCommand("redo") },
          { type: 'separator' },
          { label: 'Add component...', accelerator: "insert", click: () => sendAppCommand("add-component") },
          { label: 'Add link...', accelerator: "Alt+l", click: () => sendAppCommand("create-link") },
          { label: 'Add link bundle...', accelerator: "Alt+b", click: () => sendAppCommand("create-link-bundle") },
          { label: 'Delete network element', accelerator: "delete", enabled: false,
            id: "delete-selected-element", click: () => sendAppCommand("delete-selected-element")},
          { type: 'separator' },
          { label: 'Auto-align link vertices', type: "checkbox", checked: true, accelerator: "Alt+A", id: "toggleVertexAutoAlignment", 
            click: () => sendAppCommand("toggle-vertex-auto-alignment") },
          { label: "Drawing properties...", click: () => sendAppCommand("edit-drawing-properties", {x: 0, y: 0})},
          { label: "Application settings...", click: () => sendAppCommand("edit-app-settings", localSettings.data)},
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
          { label: 'Zoom to fit', accelerator: "Control+0", click: () => sendAppCommand("scale-drawing", "0")},
          { label: 'Zoom In', accelerator: "Control+Plus", click: () => sendAppCommand("scale-drawing", "+")},
          { label: 'Zoom Out', accelerator: "Control+-", click: () => sendAppCommand("scale-drawing", "-")},
          { label: 'Actual size', accelerator: "Control+1", click: () => sendAppCommand("scale-drawing", "1")},
          { type: 'separator' },
          { label: 'Grid', type: "checkbox", checked: false, accelerator: "Alt+g", id: "toggleGrid", click: () => sendAppCommand("toggle-grid") },
          { label: 'Rulers', type: "checkbox", checked: false, accelerator: "Alt+r", id: "toggleRulers", click: () => sendAppCommand("toggle-rulers") },
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
        "drawing": [
          {label: "Add component...", id: "add-component"},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {label: "Create link", id: "create-link"},
          {label: "Create link bundle", id: "create-link-bundle"},
          {type: 'separator'},
          {label: "Properties...", id: "edit-drawing-properties"},
        ],
        "component" : [
          {label: "Transform", id: "transform-component"},
          {label: "Delete component", id: "delete-component"},
          {type: 'separator'},
          {label: "Properties...", id: "edit-component-properties"},
        ],
        "link": [
            {label: "Align vertices", id: "align-vertices"},
            {label: "Add vertex", id: "add-vertex"},
            {type: 'separator'},
            {type: 'separator'},
            {label: "Delete link", id: "delete-link"},
            {type: 'separator'},
            {label: "Properties...", id: "edit-link-properties"},
          ],
        "link-vertex": [
            {label: "Align vertex (double-click)", id: "align-vertex"},
            {label: "Delete vertex", id: "delete-vertex"},
          ],
        "connection-point": [
            {label: "Connect...", id: "connect-connection-point"},
          ],
      }

    private readonly browserWindow: BrowserWindow;

    public contextMenu(id: ContextMenuID, ...args: unknown[])
    {
        const template = [...this.contextMenus[id]];
        for (const item of template) {
            if (item.cond && !item.cond(args)) {
              item.enabled = item.visible = false;
            }//if
            item.click = () => {
                this.browserWindow.webContents.send("command", item.id, ...args);
            }
        }//for
        console.debug("Context menu args:", args);
        const menu = Menu.buildFromTemplate(template);
        menu.popup();
    }//contextMenu

}//Menus