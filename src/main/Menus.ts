/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions } from "electron";
import { Position } from "kresmer";
import { sendAppCommand, localSettings, showAboutDialog, createNewDrawing, reloadContent, recentDrawings } from "./main";
import { openDrawing, loadLibrary, saveDrawingAs, exportDrawingToSVG, saveDrawing, openDrawingFromPath } from "./file-ops";
import { requestConnectToServer, requestDisconnectFromServer } from "./misc-ops";

const isMac = process.platform === 'darwin'

export interface ContextMenus {
    "drawing": (mousePos?: Position) => void,
    "component": (componentID?: number) => void,
    "link": (linkID?: number, segmentNumber?: number, mousePos?: Position) => void,
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
    "duplicate-component": ContextMenuHandler<"component">,
    "edit-component-properties": ContextMenuHandler<"component">,
    "move-component-up": ContextMenuHandler<"component">,
    "move-component-down": ContextMenuHandler<"component">,
    "move-component-to-top": ContextMenuHandler<"component">,
    "move-component-to-bottom": ContextMenuHandler<"component">,

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
    Omit<MenuItemConstructorOptions, "id"> & { id?: ContextMenuCommandID, cond?: (args: unknown[]) => boolean };

export default class Menus {

    constructor(browserWindow: BrowserWindow) {
        this.browserWindow = browserWindow;
        this.mainMenu = Menu.buildFromTemplate(Menus.appMenuTemplate);
        Menu.setApplicationMenu(this.mainMenu);
    }//ctor

    private static readonly appMenuTemplate: MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [
                { label: "New drawing", click: () => createNewDrawing()},
                { label: "Open drawing...", accelerator: "Control+O", click: () => openDrawing() },
                { label: "Open recent", id: "open-recent", submenu: []},
                { label: "Load library...", accelerator: "Control+L", click: () => loadLibrary() },
                { type: 'separator' },
                { label: "Save drawing", accelerator: "Control+S", click: () => saveDrawing() },
                { label: "Save drawing as...", click: () => saveDrawingAs() },
                { label: "Export drawing to SVG...", click: () => exportDrawingToSVG() },
                { type: 'separator' },
                {
                    label: "Connect to the backend server...", accelerator: "Control+B", id: "connectToServer",
                    click: () => requestConnectToServer(true)
                },
                {
                    label: "Disconnect from the backend server", accelerator: "Shift+Control+B", id: "disconnectFromServer",
                    click: () => requestDisconnectFromServer(), visible: false, enabled: false
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Escape', accelerator: "Escape", visible: false, enabled: true, click: () => sendAppCommand("escape") },
                { label: 'Undo', accelerator: "Control+Z", click: () => sendAppCommand("undo") },
                { label: 'Redo', accelerator: "Control+Y", click: () => sendAppCommand("redo") },
                { type: 'separator' },
                {
                    label: 'Delete drawing element', accelerator: "delete", enabled: false,
                    id: "delete-selected-element", click: () => sendAppCommand("delete-selected-element")
                },
                { type: 'separator' },
                {
                    label: 'Auto-align link vertices', type: "checkbox", checked: true, accelerator: "F2", id: "toggleVertexAutoAlignment",
                    click: () => sendAppCommand("toggle-vertex-auto-alignment")
                },
                { label: "Drawing properties...", click: () => sendAppCommand("edit-drawing-properties", { x: 0, y: 0 }) },
                { label: "Application settings...", click: () => sendAppCommand("edit-app-settings", localSettings.data) },
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Reload', accelerator: "Control+R", click: () => reloadContent(false) },
                { label: 'Force reload', accelerator: "Control+Shift+R", click: () => reloadContent(true) },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { label: 'Zoom to fit', accelerator: "Control+0", click: () => sendAppCommand("scale-drawing", "0") },
                { label: 'Zoom In', accelerator: "Control+Plus", click: () => sendAppCommand("scale-drawing", "+") },
                { label: 'Zoom Out', accelerator: "Control+-", click: () => sendAppCommand("scale-drawing", "-") },
                { label: 'Actual size', accelerator: "Control+1", click: () => sendAppCommand("scale-drawing", "1") },
                { type: 'separator' },
                { label: 'Rulers', type: "checkbox", checked: false, accelerator: "F4", id: "toggleRulers", click: () => sendAppCommand("toggle-rulers") },
                { label: 'Grid', type: "checkbox", checked: false, accelerator: "Shift+F4", id: "toggleGrid", click: () => sendAppCommand("toggle-grid") },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Component',
            submenu: [
                { label: 'Add...', accelerator: "insert", click: () => sendAppCommand("add-component") },
                { label: "Transform", id: "transform-component", enabled: false, click: () => sendAppCommand("transform-component") },
                {
                    label: 'Duplicate', accelerator: "Control+D", enabled: false, id: "duplicate-component",
                    click: () => sendAppCommand("duplicate-component")
                },
                {
                    label: 'Delete', enabled: false,
                    id: "delete-component", click: () => sendAppCommand("delete-component")
                },
                { type: 'separator' },
                { label: 'Move to top', accelerator: "Control+PageUp", id: "move-component-to-top", enabled: false, click: () => sendAppCommand("move-component-to-top") },
                { label: 'Move up', accelerator: "PageUp", id: "move-component-up", enabled: false, click: () => sendAppCommand("move-component-up") },
                { label: 'Move down', accelerator: "PageDown", id: "move-component-down", enabled: false, click: () => sendAppCommand("move-component-down") },
                { label: 'Move to bottom', accelerator: "Control+PageDown", id: "move-component-to-bottom", enabled: false, click: () => sendAppCommand("move-component-to-bottom") },
            ]
        },
        {
            label: 'Link',
            submenu: [
                { label: 'Add...', accelerator: "Alt+l", click: () => sendAppCommand("create-link") },
                { label: 'Add bundle...', accelerator: "Alt+b", click: () => sendAppCommand("create-link-bundle") },
                {
                    label: 'Delete', enabled: false,
                    id: "delete-link", click: () => sendAppCommand("delete-link")
                },
            ]
        },
        {
            role: 'help',
            submenu: [
                { label: 'About', click: () => showAboutDialog() },
            ]
        }
    ]// as MenuItemConstructorOptions[]

    private readonly contextMenus: Record<ContextMenuID, ContextMenuItemConstructorOptions[]> =
        {
            "drawing": [
                { label: "Add component...", id: "add-component" },
                { label: "Create link", id: "create-link" },
                { label: "Create link bundle", id: "create-link-bundle" },
                { type: 'separator' },
                { label: "Properties...", id: "edit-drawing-properties" },
            ],
            "component": [
                { label: "Transform component", id: "transform-component" },
                { label: "Duplicate component", id: "duplicate-component" },
                { label: "Delete component", id: "delete-component" },
                { type: 'separator' },
                { label: 'Move component to top', id: "move-component-to-top" },
                { label: 'Move component up', id: "move-component-up" },
                { label: 'Move component down', id: "move-component-down" },
                { label: 'Move component to bottom', id: "move-component-to-bottom" },
                { type: 'separator' },
                { label: " Component properties...", id: "edit-component-properties" },
            ],
            "link": [
                { label: "Align vertices", id: "align-vertices" },
                { label: "Add vertex", id: "add-vertex" },
                { type: 'separator' },
                { label: "Delete link", id: "delete-link" },
                { type: 'separator' },
                { label: "Properties...", id: "edit-link-properties" },
            ],
            "link-vertex": [
                { label: "Align vertex (double-click)", id: "align-vertex" },
                { label: "Delete vertex", id: "delete-vertex" },
            ],
            "connection-point": [
                { label: "Connect...", id: "connect-connection-point" },
            ],
        }

    private readonly browserWindow: BrowserWindow;
    private readonly mainMenu: Menu;

    public buildRecentDrawingsSubmenu()
    {
        const submenu = this.mainMenu.getMenuItemById("open-recent")!.submenu!;
        recentDrawings.paths.forEach(path => {
            submenu.append(new MenuItem({
                label: path,
                click: () => openDrawingFromPath(path),
            }));
        });
    }//buildRecentDrawingsSubmenu

    public addRecentDrawingItem(path: string)
    {
        const submenu = this.mainMenu.getMenuItemById("open-recent")!.submenu!;
        submenu.insert(0, new MenuItem({
            label: path,
            click: () => openDrawingFromPath(path),
        }));
    }//addRecentDrawingItem

    public contextMenu(id: ContextMenuID, ...args: unknown[]) {
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
