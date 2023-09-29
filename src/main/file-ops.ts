/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        File operation procedures for the Electron node.js main script
 ***************************************************************************/

import { dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { mainWindow, sendAppCommand, libDirs, localSettings } from './main';
import { defaultDrawingFileName } from './init-funcs';
import { IpcMainHooks } from './IpcMainHooks';


export function openDrawing()
{
    // console.debug("About to show 'Open drawing dialog...'")
    const filePath = dialog.showOpenDialogSync(mainWindow, {
        title: "Open drawing file",
        filters: [
            {name: "Kresmer drawing files (*.kre)", extensions: ["kre"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    });

    if (filePath) {
        const dwgData = fs.readFileSync(filePath[0], "utf-8");
        const drawingFileName = path.basename(filePath[0]);
        sendAppCommand("load-drawing", dwgData, {drawingFileName});
        localSettings.set("lastOpenedDrawing", filePath[0]);
    }//if
}//openDrawing


export function saveDrawing(dwgData?: string): boolean
{
    if (!defaultDrawingFileName) {
        return saveDrawingAs(dwgData);
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


export function saveDrawingAs(dwgData?: string): boolean
{
    let filePath = dialog.showSaveDialogSync(mainWindow, {
        title: "Save drawing",
        filters: [
            {name: "Kresmer drawing files (*.kre)", extensions: ["kre"]},
            {name: "All files (*.*)", extensions: ["*"]},
        ]
    });

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
    
    if (dwgData) {
        fs.writeFileSync(filePath!, dwgData);
    } else {
        IpcMainHooks.once("complete-drawing-saving", (dwgData: string) => {
            console.debug(`About to save the drawing to the file "${filePath}"`);
            fs.writeFileSync(filePath!, dwgData);
        });
        sendAppCommand("save-drawing");
    }//if
    localSettings.set("lastOpenedDrawing", filePath);
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
