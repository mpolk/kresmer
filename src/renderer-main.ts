/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { IpcRendererEvent } from 'electron';
import { createApp, reactive } from 'vue';
import Hints from './hints';
import initApp from './init';
import Kresmer from './Kresmer';
import ParsingException from './parsers/ParsingException';
import StatusBar from './status-bar.vue';

export const kresmer = new Kresmer('#kresmer');

export const hints = new Hints;
export const statusBarData = reactive({
    hint: "",
    drawingScale: 1,
})//statusBarData

export const vueStatusBar = createApp(StatusBar, {
    displayData: statusBarData,
}).mount("#statusBar");

kresmer
    .on("drawing-scale", (newScale) => statusBarData.drawingScale = newScale)
    .on("drawing-mouse-enter", () => hints.push("Drag any component to move it or ctrl-click to transform it"))
    .on("drawing-mouse-leave", () => hints.pop())
    .on("component-move-started", () => hints.push("Drag and drop the component where you want to leave it..."))
    .on("component-moved", () => hints.pop())
    .on("component-transform-started", () => hints.push(""))
    .on("component-transformed", () => hints.pop())
    .on("component-entered-transform-mode", (controller, mode) => hints.push(
        mode == "rotation" ?
            "Rotate the component around the center mark or click to switch to the scaling mode" :
            "Drag any handle to scale, drag the center to move or click to switch to the rotaion mode"
        ))
    .on("component-exited-transform-mode", () => hints.pop())
    .on("hint", (hint) => hints.setHint(hint))
    ;

window.electronAPI.onLoadLibrary((_event: IpcRendererEvent, libData: string) => 
{ 
    try {
        if (!kresmer.loadLibrary(libData))
            alert("There were errors during library load (see the log)");
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
    window.electronAPI.signalReadiness(1);
});

window.electronAPI.onLoadDrawing((_event: IpcRendererEvent, drawingData: string, drawingName?: string) => 
{ 
    try {
        if (!kresmer.loadDrawing(drawingData))
            alert("There were errors during drawing load (see the log)");
        else if (drawingName)
            window.document.title = `${drawingName} - Kresmer`;
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
    window.electronAPI.signalReadiness(2);
    initApp();
});

window.electronAPI.signalReadiness(0);

