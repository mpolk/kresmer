/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        File operation procedures for the Electron node.js main script
 ***************************************************************************/

import { FileFilter, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { mainWindow, sendAppCommand, libDirs, localSettings, menus, recentDrawings } from './main';
import { defaultDrawingFileName, setDefaultDrawingFileName } from './init-funcs';
import { IpcMainHooks } from './IpcMainHooks';
import { URLType } from '../renderer/URLType';

export class RecentDrawings
{
    static MAX = 10;

    constructor()
    {
        this.paths = [...new Set(localSettings.get("recentDrawings"))];
    }//ctor

    paths: string[];

    get last() { return this.paths[0]; }
    set last(newPath: string)
    {
        const i = this.paths.indexOf(newPath);
        if (i < 0) {
            if (this.paths.unshift(newPath) >= RecentDrawings.MAX)
                this.paths.pop();
            menus.addRecentDrawingItem(newPath);
        } else {
            this.paths.splice(i, 1);
            this.paths.unshift(newPath);
        }//if
        localSettings.set("recentDrawings", this.paths);
    }//last
}//RecentDrawings


export function openDrawing()
{
    const options: Record<string, unknown> = {
        title: "Open drawing file",
        filters: [
            {name: "Kresmer drawing files (*.kre)", extensions: ["kre"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    };
    if (recentDrawings.last) {
        options.defaultPath = path.dirname(recentDrawings.last);
    }//if
    const filePaths = dialog.showOpenDialogSync(mainWindow, options);

    if (filePaths) {
        openDrawingFromPath(filePaths[0]);
    }//if
}//openDrawing


export function openDrawingFromPath(path: string)
{
    const dwgData = fs.readFileSync(path, "utf-8");
    sendAppCommand("load-drawing", dwgData, {drawingFileName: path});
    recentDrawings.last = path;
}//openDrawingFromPath


export async function saveDrawing(dwgData?: string): Promise<boolean>
{
    if (!defaultDrawingFileName) {
        return await saveDrawingAs(dwgData);
    } else if (dwgData) {
        fs.writeFileSync(defaultDrawingFileName, dwgData);
        return true;
    } else {
        IpcMainHooks.once("complete-drawing-saving", (dwgData: string) => {
                console.debug(`About to save the drawing to the file "${defaultDrawingFileName}"`);
                fs.writeFileSync(defaultDrawingFileName!, dwgData);
        });
        sendAppCommand("save-drawing");
        return true;
    }//if
}//saveDrawing


export async function saveDrawingAs(dwgData?: string): Promise<boolean>
{
    const options: Record<string, unknown> = {
        title: "Save drawing",
        filters: [
            {name: "Kresmer drawing files (*.kre)", extensions: ["kre"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    }//options
    if (defaultDrawingFileName) {
        options.defaultPath = defaultDrawingFileName;
    }//if
    
    let {filePath} = await dialog.showSaveDialog(mainWindow, options);

    if (!filePath)
        return false;

    if (!path.extname(filePath)) {
        filePath += ".kre";
    }//if

    if (fs.existsSync(filePath) && dialog.showMessageBoxSync(mainWindow, {
        message: `File "${path.basename(filePath)}" exists! Overwrite?`,
        buttons: ["Ok", "Cancel"],
        defaultId: 1,
        })) 
    {
        return false;
    }//if
    
    setDefaultDrawingFileName(filePath);
    if (dwgData) {
        fs.writeFileSync(filePath!, dwgData);
    } else {
        IpcMainHooks.once("complete-drawing-saving", (dwgData: string) => {
            console.debug(`About to save the drawing to the file "${filePath}"`);
            fs.writeFileSync(filePath!, dwgData);
        });
        sendAppCommand("save-drawing");
    }//if
    recentDrawings.last = filePath;
    return true;
}//saveDrawingAs


export function exportDrawingToSVG()
{
    let filePath = dialog.showSaveDialogSync(mainWindow, {
        title: "Export drawing to SVG",
        filters: [
            {name: "Scalable Vector Graphics files (*.svg)", extensions: ["svg"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ],
        defaultPath: defaultDrawingFileName?.replace(/.kre$/, ".svg"),
    });

    if (filePath) {
        if (!path.extname(filePath)) {
            filePath += ".svg";
        }//if

        if (fs.existsSync(filePath) && dialog.showMessageBoxSync(mainWindow, {
            message: `File "${path.basename(filePath)}" exists! Overwrite?`,
            buttons: ["Ok", "Cancel"],
            defaultId: 1,
            })) 
        {
            return;
        }//if
        
        IpcMainHooks.once("complete-drawing-export-to-SVG", (svgData: string) => {
            console.debug(`About to export the drawing to the file "${filePath}"`);
            fs.writeFileSync(filePath!, svgData);
        });
        sendAppCommand("export-drawing-to-SVG");
    }//if
}//exportDrawingToSVG


export function loadLibrary()
{
    // console.debug("About to show 'Open drawing dialog...'")
    const filePath = dialog.showOpenDialogSync(mainWindow, {
        title: "Load library...",
        filters: [
            {name: "Kresmer library files (*.krel)", extensions: ["krel"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    });

    if (filePath) {
        const libData = fs.readFileSync(filePath[0], "utf-8");
        sendAppCommand("load-library", libData, {libraryFileName: filePath[0], notifyUser: true});
    }//if
}//loadLibrary


export function loadLibraryFile(libName: string, fileName?: string)
{
    console.debug(`Trying to load library "${libName}" (fileName="${fileName}")`);
    const libFile = fileName ?? `${libName}.krel`;
    for (const libDir of libDirs) {
        const libPath = path.resolve(libDir, libFile);
        if (fs.existsSync(libPath)) {
            try {
                const libData = fs.readFileSync(libPath, "utf-8");
                console.debug(`Library "${libPath}" loaded`);
                return libData;
            } catch {
                console.debug(`Error loading library "${libPath}"`);
                return undefined;
            }
        }//if
    }//for

    console.debug(`Could not load library "${libName}" (fileName="${fileName}")`);
    return undefined;
}//loadLibraryFile


export function loadLibraryTranslation(libName: string, language: string)
{
    console.debug(`Trying to load library "${libName}" translation`);
    const libTransFile = `${libName}.${language}.krelt`;
    for (const libDir of libDirs) {
        const libTransPath = path.resolve(libDir, libTransFile);
        if (fs.existsSync(libTransPath)) {
            try {
                const libTransData = fs.readFileSync(libTransPath, "utf-8");
                console.debug(`Library translation "${libTransPath}" loaded`);
                return libTransData;
            } catch {
                console.debug(`Error loading library "${libTransPath}"`);
                return undefined;
            }
        }//if
    }//for

    console.debug(`Could not load library "${libName}" translation`);
    return undefined;
}//loadLibraryTranslation


export function selectOrLoadFile(requiredResultType: URLType, filters: FileFilter[]) 
{
    const filePaths = dialog.showOpenDialogSync(mainWindow, {
        title: "Open file...",
        filters
    });

    let filePath = filePaths ? filePaths[0] : undefined
    let data: string|undefined;

    if (filePath) {
        switch (requiredResultType) {
            case URLType.data: 
                data = fs.readFileSync(filePath).toString("base64");
                break;
            case URLType.fileRel:
                filePath = path.relative(filePath, ".");
        }//switch
    }//if

    return {filePath, data};
}//selectOrLoadFile