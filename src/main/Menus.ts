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
    "area": (areaID?: number, mousePos?: Position) => void,
    "area-segment": (areaID: number, segmentNumber: number, mousePos: Position) => void,
    "area-vertex": (areaID: number, vertexNumber: number) => void,
}//ContextMenus

export type ContextMenuID = keyof ContextMenus;

type ContextMenuHandler<MenuID extends ContextMenuID> = ContextMenus[MenuID]
export interface ContextMenuCommands {
    "add-component": ContextMenuHandler<"drawing">,
    "edit-drawing-properties": ContextMenuHandler<"drawing">,
    "create-link": ContextMenuHandler<"drawing">,
    "create-link-bundle": ContextMenuHandler<"drawing">,
    "create-area": ContextMenuHandler<"drawing">,

    "transform-component": ContextMenuHandler<"component">,
    "delete-component": ContextMenuHandler<"component">,
    "duplicate-component": ContextMenuHandler<"component">,
    "edit-component-properties": ContextMenuHandler<"component">,
    "move-component-up": ContextMenuHandler<"component">,
    "move-component-down": ContextMenuHandler<"component">,
    "move-component-to-top": ContextMenuHandler<"component">,
    "move-component-to-bottom": ContextMenuHandler<"component">,

    "align-link-vertices": ContextMenuHandler<"link">,
    "add-link-vertex": ContextMenuHandler<"link">,
    "delete-link": ContextMenuHandler<"link">,
    "edit-link-properties": ContextMenuHandler<"link">,

    "align-link-vertex": ContextMenuHandler<"link-vertex">,
    "delete-link-vertex": ContextMenuHandler<"link-vertex">,

    "connect-connection-point": ContextMenuHandler<"connection-point">,

    "duplicate-area": ContextMenuHandler<"area">,
    "delete-area": ContextMenuHandler<"area">,
    "move-area-up": ContextMenuHandler<"area">,
    "move-area-down": ContextMenuHandler<"area">,
    "move-area-to-top": ContextMenuHandler<"area">,
    "move-area-to-bottom": ContextMenuHandler<"area">,
    "align-area-vertices": ContextMenuHandler<"area">,
    "edit-area-properties": ContextMenuHandler<"area">,

    "add-area-vertex": ContextMenuHandler<"area-segment">,
    "set-area-segment-type-to-L": ContextMenuHandler<"area-segment">,
    "set-area-segment-type-to-C": ContextMenuHandler<"area-segment">,
    "set-area-segment-type-to-S": ContextMenuHandler<"area-segment">,
    "set-area-segment-type-to-Q": ContextMenuHandler<"area-segment">,
    "set-area-segment-type-to-T": ContextMenuHandler<"area-segment">,
    "set-area-border": ContextMenuHandler<"area-segment">,
    "remove-area-border": ContextMenuHandler<"area-segment">,

    "align-area-vertex": ContextMenuHandler<"area-vertex">,
    "delete-area-vertex": ContextMenuHandler<"area-vertex">,
}//ContextMenuCommands

export type ContextMenuCommandID = keyof ContextMenuCommands;
type ContextMenuItemConstructorOptions =
    Omit<MenuItemConstructorOptions, "id" | "submenu"> & { 
        id?: ContextMenuCommandID, cond?: (args: unknown[]) => boolean,
        submenu?: ContextMenuItemConstructorOptions[] | Menu
    };

export default class Menus {

    constructor(private browserWindow: BrowserWindow) {
        Menu.setApplicationMenu(this.mainMenu);
    }//ctor

    private readonly appMenuTemplate: MenuItemConstructorOptions[] = [
        {
            label: t("menu.file._", 'File'),
            submenu: [
                { label: t("menu.file.new-drawing", "New drawing"), click: () => createNewDrawing()},
                { label: t("menu.file.open-drawing", "Open drawing..."), accelerator: "Control+O", click: () => openDrawing() },
                { label: t("menu.file.open-recent", "Open recent"), id: "open-recent", submenu: []},
                { label: t("menu.file.load-library", "Load library..."), accelerator: "Control+L", click: () => loadLibrary() },
                { type: 'separator' },
                { label: t("menu.file.save-drawing", "Save drawing"), accelerator: "Control+S", click: () => saveDrawing() },
                { label: t("menu.file.save-drawing-as", "Save drawing as..."), click: () => saveDrawingAs() },
                { label: t("menu.file.export-drawing-to-svg", "Export drawing to SVG..."), accelerator: "Control+G", click: () => exportDrawingToSVG() },
                { type: 'separator' },
                {
                    label: t("menu.file.connect-to-server", "Connect to the backend server..."), 
                    id: "connectToServer",
                    click: () => requestConnectToServer(true)
                },
                {
                    label: t("menu.file.disconnect-from-server", "Disconnect from the backend server"), 
                    id: "disconnectFromServer",
                    click: () => requestDisconnectFromServer(), visible: false, enabled: false
                },
                { type: 'separator' },
                { label: t("menu.file.quit", "Quit"), click: quitApp }
            ]
        },
        {
            label: t("menu.edit._", 'Edit'),
            submenu: [
                { label: 'Escape', accelerator: "Escape", visible: false, enabled: true, click: () => sendAppCommand("escape") },
                { label:  t("menu.edit.undo", 'Undo'), accelerator: "Control+Z", click: () => sendAppCommand("undo") },
                { label:  t("menu.edit.redo", 'Redo'), accelerator: "Control+Y", click: () => sendAppCommand("redo") },
                { type: 'separator' },
                {
                    label:  t("menu.edit.auto-align-vertices", 'Auto-align vertices'), type: "checkbox", checked: true, accelerator: "F2", id: "toggleVertexAutoAlignment",
                    click: () => sendAppCommand("toggle-vertex-auto-alignment")
                },
                {
                    label:  t("menu.edit.snap-to-grid", 'Snap to grid'), type: "checkbox", checked: true, accelerator: "F3", id: "toggleSnappingToGrid",
                    click: () => sendAppCommand("toggle-snapping-to-grid")
                },
                { label: t("menu.edit.background-editing-mode", "Background Editing Mode"), 
                    accelerator: "Control+B", type: "checkbox", checked: false,
                    id: "toggleBackgroundEditingMode", click: () => sendAppCommand("toggle-background-editing-mode")
                },
                { label:  t("menu.edit.drawing-properties", "Drawing properties..."), click: () => sendAppCommand("edit-drawing-properties", { x: 0, y: 0 }) },
                { label:  t("menu.edit.app-settings", "Application settings..."), click: () => sendAppCommand("edit-app-settings", localSettings.data) },
            ]
        },
        {
            label:  t("menu.view._", "View"),
            submenu: [
                { label: t("menu.view.reload", "Reload"), accelerator: "Control+R", click: () => reloadContent(false) },
                { label: t("menu.view.force-reload", "Force reload"), accelerator: "Control+Shift+R", click: () => reloadContent(true) },
                { label: t("menu.view.toggle-dev-tools", "Toggle DevTools"), click: toggleDevTools, accelerator: "Control+Shift+I" },
                { type: 'separator' },
                { label: t("menu.view.zoom-to-fit", "Zoom to Fit"), accelerator: "Control+0", click: () => sendAppCommand("scale-drawing", "0") },
                { label: t("menu.view.zoom-in", "Zoom In"), accelerator: "Control+Plus", click: () => sendAppCommand("scale-drawing", "+") },
                { label: t("menu.view.zoom-out", "Zoom Out"), accelerator: "Control+-", click: () => sendAppCommand("scale-drawing", "-") },
                { label: t("menu.view.actual-size", "Actual Size"), accelerator: "Control+1", click: () => sendAppCommand("scale-drawing", "1") },
                { type: 'separator' },
                { label: t("menu.view.rulers", "Rulers"), type: "checkbox", checked: false, accelerator: "F4", id: "toggleRulers", click: () => sendAppCommand("toggle-rulers") },
                { label: t("menu.view.grid", "Grid"), type: "checkbox", checked: false, accelerator: "Shift+F4", id: "toggleGrid", click: () => sendAppCommand("toggle-grid") },
                { type: 'separator' },
                { label: t("menu.view.toggle-full-screen", "Toggle Full Screen"), click: toggleFullScreen, accelerator: "F11" }
            ]
        },
        {
            label: t("menu.element._", "Element"),
            submenu: [
                { label: t("menu.element.add._", "Add"), submenu: [
                    { label: t("menu.element.add.component", "Component..."), accelerator: "insert", id: "add-component", click: () => sendAppCommand("add-component") },
                    { label: t("menu.element.add.link", "Link..."), accelerator: "Alt+l", id: "create-link", click: () => sendAppCommand("create-link") },
                    { label: t("menu.element.add.bundle", "Bundle..."), accelerator: "Alt+b", id: "create-link-bundle", click: () => sendAppCommand("create-link-bundle") },
                    { label: t("menu.element.add.area", "Area..."), accelerator: "Alt+a", id: "create-area", click: () => sendAppCommand("create-area") },
                    ]},
                { label: t("menu.element.transform", "Transform"), id: "transform-component", enabled: false, click: () => sendAppCommand("transform-component") },
                {
                    label: t("menu.element.duplicate", "Duplicate"), accelerator: "Control+D", enabled: false, id: "duplicate-selected-element",
                    click: () => sendAppCommand("duplicate-selected-element")
                },
                {
                    label:  t("menu.element.delete", 'Delete selected element'), accelerator: "delete", enabled: false,
                    id: "delete-selected-element", click: () => sendAppCommand("delete-selected-element")
                },
                { type: 'separator' },
                { label: t("menu.element.move-to-top", "Move to Top"), accelerator: "Control+PageUp", id: "move-selected-element-to-top", enabled: false, click: () => sendAppCommand("move-selected-element-to-top") },
                { label: t("menu.element.move-up", "Move Up"), accelerator: "PageUp", id: "move-selected-element-up", enabled: false, click: () => sendAppCommand("move-selected-element-up") },
                { label: t("menu.element.move-down", "Move Down"), accelerator: "PageDown", id: "move-selected-element-down", enabled: false, click: () => sendAppCommand("move-selected-element-down") },
                { label: t("menu.element.move-to-bottom", "Move to Bottom"), accelerator: "Control+PageDown", id: "move-selected-element-to-bottom", enabled: false, click: () => sendAppCommand("move-selected-element-to-bottom") },
            ]
        },
        {
            label: t("menu.help._", "Help"),
            submenu: [
                { label: t("menu.help.about", "About..."), click: () => showAboutDialog() },
            ]
        }
    ]

    readonly mainMenu: Menu = Menu.buildFromTemplate(this.appMenuTemplate);

    private readonly contextMenus: Record<ContextMenuID, ContextMenuItemConstructorOptions[]> =
        {
            "drawing": [
                { label: t("ctx-menu.drawing.add._", "Add"), submenu: [
                    { label: t("ctx-menu.drawing.add.component", "Component..."), id: "add-component" },
                    { label: t("ctx-menu.drawing.add.link", "Link..."), id: "create-link" },
                    { label: t("ctx-menu.drawing.add.bundle", "Bundle..."), id: "create-link-bundle" },
                    { label: t("ctx-menu.drawing.add.area", "Area..."), id: "create-area" },
                ]},
                { label: t("ctx-menu.drawing.properties", "Drawing properties..."), id: "edit-drawing-properties" },
            ],
            "component": [
                { label: t("ctx-menu.component.transform", "Transform"), id: "transform-component" },
                { label: t("ctx-menu.component.duplicate", "Duplicate"), id: "duplicate-component" },
                { label: t("ctx-menu.component.delete", "Delete"), id: "delete-component" },
                { type: 'separator' },
                { label: t("ctx-menu.component.move-to-top", "Move to Top"), id: "move-component-to-top" },
                { label: t("ctx-menu.component.move-up", "Move Up"), id: "move-component-up" },
                { label: t("ctx-menu.component.move-down", "Move Down"), id: "move-component-down" },
                { label: t("ctx-menu.component.move-to-bottom", "Move to Bottom"), id: "move-component-to-bottom" },
                { type: 'separator' },
                { label: t("ctx-menu.component.properties", "Component Properties..."), id: "edit-component-properties" },
            ],
            "link": [
                { label: t("ctx-menu.link.align-vertices", "Align Vertices"), id: "align-link-vertices" },
                { label: t("ctx-menu.link.add-vertex", "Add Vertex"), id: "add-link-vertex" },
                { type: 'separator' },
                { label: t("ctx-menu.link.delete", "Delete Link"), id: "delete-link" },
                { type: 'separator' },
                { label: t("ctx-menu.link.properties", "Link Properties..."), id: "edit-link-properties" },
            ],
            "link-vertex": [
                { label: t("ctx-menu.link-vertex.align", "Align Vertex"), id: "align-link-vertex" },
                { label: t("ctx-menu.link-vertex.delete", "Delete Vertex"), id: "delete-link-vertex" },
            ],
            "connection-point": [
                { label: t("ctx-menu.connection-point.connect", "Connect..."), id: "connect-connection-point" },
            ],
            "area": [
                { label: t("ctx-menu.area.align-vertices", "Align Vertices"), id: "align-area-vertices" },
                { type: 'separator' },
                { label: t("ctx-menu.area.duplicate", "Duplicate"), id: "duplicate-area" },
                { label: t("ctx-menu.area.delete", "Delete Area"), id: "delete-area" },
                { type: 'separator' },
                { label: t("ctx-menu.area.move-to-top", "Move to Top"), id: "move-area-to-top" },
                { label: t("ctx-menu.area.move-up", "Move Up"), id: "move-area-up" },
                { label: t("ctx-menu.area.move-down", "Move Down"), id: "move-area-down" },
                { label: t("ctx-menu.area.move-to-bottom", "Move to Bottom"), id: "move-area-to-bottom" },
                { type: 'separator' },
                { label: t("ctx-menu.area.properties", "Area Properties..."), id: "edit-area-properties" },
            ],
            "area-segment": [
                { label: t("ctx-menu.area-segment.add-vertex", "Add Vertex"), id: "add-area-vertex" },
                { label: t("ctx-menu.area-segment.set-type", "Set Segment Type to"), submenu: [
                    {label: t("ctx-menu.area-segment.set-type-to-L", "L (straight line)"), id: "set-area-segment-type-to-L"},
                    {label: t("ctx-menu.area-segment.set-type-to-C", "C (cubic Bezier curve)"), id: "set-area-segment-type-to-C"},
                    {label: t("ctx-menu.area-segment.set-type-to-S", "S (smooth cubic Bezier curve)"), id: "set-area-segment-type-to-S"},
                    {label: t("ctx-menu.area-segment.set-type-to-Q", "Q (quadratic Bezier curve)"), id: "set-area-segment-type-to-Q"},
                    {label: t("ctx-menu.area-segment.set-type-to-T", "T (smooth quadratic Bezier curve)"), id: "set-area-segment-type-to-T"},
                ]},
                { label: t("ctx-menu.area-segment.set-border", "Set Border"), id: "set-area-border" },
                { label: t("ctx-menu.area-segment.remove-border", "Remove Border"), id: "remove-area-border" },
            ],
            "area-vertex": [
                { label: t("ctx-menu.area-vertex.align", "Align Vertex"), id: "align-area-vertex" },
                { label: t("ctx-menu.area-vertex.delete", "Delete Vertex"), id: "delete-area-vertex" },
                { label: t("ctx-menu.area-segment.set-border", "Set Border"), id: "set-area-border" },
                { label: t("ctx-menu.area-segment.remove-border", "Remove Border"), id: "remove-area-border" },
            ],
        }

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

    private initCtxSubmenu(originalTemplate: ContextMenuItemConstructorOptions[], ...args: unknown[])
    {
        const template = [...originalTemplate];
        for (const item of template) {
            if (item.cond && !item.cond(args)) {
                item.enabled = item.visible = false;
            }//if
            item.click = () => {
                this.browserWindow.webContents.send("command", item.id, ...args);
            }
            if (Array.isArray(item.submenu)) {
                item.submenu = this.initCtxSubmenu(item.submenu, ...args);
            }//if
        }//for
        return template;
    }//initCxtSubmenu

    public contextMenu(id: ContextMenuID, ...args: unknown[]) {
        const template = this.initCtxSubmenu(this.contextMenus[id], ...args);
        console.debug("Context menu args:", args);
        const menu = Menu.buildFromTemplate(template);
        menu.popup();
    }//contextMenu

}//Menus
