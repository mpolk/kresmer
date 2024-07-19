/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions } from "electron";
import { Position } from "kresmer";
import { sendAppCommand, localSettings, showAboutDialog, createNewDrawing, reloadContent, recentDrawings, quitApp, toggleDevTools, toggleFullScreen } from "./main";
import { openDrawing, loadLibrary, saveDrawingAs, exportDrawingToSVG, saveDrawing, openDrawingFromPath } from "./file-ops";
import { requestConnectToServer, requestDisconnectFromServer } from "./misc-ops";
import {t} from "i18next";

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
            label: t("main:menu.file._", 'File'),
            submenu: [
                { label: t("main:menu.file.new-drawing", "New drawing"), click: () => createNewDrawing()},
                { label: t("main:menu.file.open-drawing", "Open drawing..."), accelerator: "Control+O", click: () => openDrawing() },
                { label: t("main:menu.file.open-recent", "Open recent"), id: "open-recent", submenu: []},
                { label: t("main:menu.file.load-library", "Load library..."), accelerator: "Control+L", click: () => loadLibrary() },
                { type: 'separator' },
                { label: t("main:menu.file.save-drawing", "Save drawing"), accelerator: "Control+S", click: () => saveDrawing() },
                { label: t("main:menu.file.save-drawing-as", "Save drawing as..."), click: () => saveDrawingAs() },
                { label: t("main:menu.file.export-drawing-to-svg", "Export drawing to SVG..."), click: () => exportDrawingToSVG() },
                { type: 'separator' },
                {
                    label: t("main:menu.file.connect-to-server", "Connect to the backend server..."), 
                    accelerator: "Control+B", id: "connectToServer",
                    click: () => requestConnectToServer(true)
                },
                {
                    label: t("main:menu.file.disconnect-from-server", "Disconnect from the backend server"), 
                    accelerator: "Shift+Control+B", id: "disconnectFromServer",
                    click: () => requestDisconnectFromServer(), visible: false, enabled: false
                },
                { type: 'separator' },
                { label: t("main:menu.file.quit", "Quit"), click: quitApp }
            ]
        },
        {
            label: t("main:menu.edit._", 'Edit'),
            submenu: [
                { label: 'Escape', accelerator: "Escape", visible: false, enabled: true, click: () => sendAppCommand("escape") },
                { label:  t("main:menu.edit.undo", 'Undo'), accelerator: "Control+Z", click: () => sendAppCommand("undo") },
                { label:  t("main:menu.edit.redo", 'Redo'), accelerator: "Control+Y", click: () => sendAppCommand("redo") },
                { type: 'separator' },
                {
                    label:  t("main:menu.edit.delete", 'Delete selected element'), accelerator: "delete", enabled: false,
                    id: "delete-selected-element", click: () => sendAppCommand("delete-selected-element")
                },
                { type: 'separator' },
                {
                    label:  t("main:menu.edit.auto-align-vertices", 'Auto-align vertices'), type: "checkbox", checked: true, accelerator: "F2", id: "toggleVertexAutoAlignment",
                    click: () => sendAppCommand("toggle-vertex-auto-alignment")
                },
                { label:  t("main:menu.edit.drawing-properties", "Drawing properties..."), click: () => sendAppCommand("edit-drawing-properties", { x: 0, y: 0 }) },
                { label:  t("main:menu.edit.app-settings", "Application settings..."), click: () => sendAppCommand("edit-app-settings", localSettings.data) },
            ]
        },
        {
            label:  t("main:menu.view._", "View"),
            submenu: [
                { label: t("main:menu.view.reload", "Reload"), accelerator: "Control+R", click: () => reloadContent(false) },
                { label: t("main:menu.view.force-reload", "Force reload"), accelerator: "Control+Shift+R", click: () => reloadContent(true) },
                { label: t("main:menu.view.toggle-dev-tools", "Toggle DevTools"), click: toggleDevTools, accelerator: "Control+Shift+I" },
                { type: 'separator' },
                { label: t("main:menu.view.zoom-to-fit", "Zoom to Fit"), accelerator: "Control+0", click: () => sendAppCommand("scale-drawing", "0") },
                { label: t("main:menu.view.zoom-in", "Zoom In"), accelerator: "Control+Plus", click: () => sendAppCommand("scale-drawing", "+") },
                { label: t("main:menu.view.zoom-out", "Zoom Out"), accelerator: "Control+-", click: () => sendAppCommand("scale-drawing", "-") },
                { label: t("main:menu.view.actual-size", "Actual Size"), accelerator: "Control+1", click: () => sendAppCommand("scale-drawing", "1") },
                { type: 'separator' },
                { label: t("main:menu.view.rulers", "Rulers"), type: "checkbox", checked: false, accelerator: "F4", id: "toggleRulers", click: () => sendAppCommand("toggle-rulers") },
                { label: t("main:menu.view.grid", "Grid"), type: "checkbox", checked: false, accelerator: "Shift+F4", id: "toggleGrid", click: () => sendAppCommand("toggle-grid") },
                { type: 'separator' },
                { label: t("main:menu.view.toggle-full-screen", "Toggle Full Screen"), click: toggleFullScreen, accelerator: "F11" }
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
