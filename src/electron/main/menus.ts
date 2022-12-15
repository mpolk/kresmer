/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Menus for Electron application
 ***************************************************************************/
import {Menu} from "electron";

export type ContextMenuID = 
    "link-vertex"
    ;

export default class Menus {

    private readonly contextMenus: Record<ContextMenuID, Menu>;

    constructor()
    {
        this.contextMenus = {"link-vertex": Menu.buildFromTemplate([
            {label: "Adjust"},
            {label: "Delete"},
            ]),
        }
    }//ctor

    public contextMenu(id: ContextMenuID, ...args: unknown[])
    {
        this.contextMenus[id].popup();
    }//contextMenu

}//Menus