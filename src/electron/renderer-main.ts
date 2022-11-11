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
import Kresmer from '../Kresmer';
import ParsingException from '../parsers/ParsingException';
import StatusBar from './status-bar.vue';
import NetworkComponentController from '../NetworkComponent/NetworkComponentController';

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
    .on("drawing-mouse-leave", () => hints.reset())
    .on("mode-reset", () => hints.reset())
    .on("component-mouse-enter", () => hints.push(Hints.onComponentMouseEnter))
    .on("component-mouse-leave", () => hints.pop())
    .on("component-move-started", () => hints.push(Hints.onDrag))
    .on("component-moved", () => hints.pop())
    .on("component-being-moved", indicateComponentMove)
    .on("component-transform-started", () => hints.push(""))
    .on("component-being-transformed", indicateComponentTransform)
    .on("component-transformed", () => hints.pop())
    .on("component-entered-transform-mode", (_, mode) => hints.push(mode == "rotation" ? 
                                                                        Hints.onRotation : 
                                                                        Hints.onScaling))
    .on("component-exited-transform-mode", () => hints.pop())
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
});

window.electronAPI.signalReadiness(0);

function indicateComponentTransform(controller: NetworkComponentController)
{
    const hint = controller.transformMode === "rotation" ? 
        controller.transform.rotation.angle.toFixed(0) + '°' :
        `x:${controller.transform.scale.x.toFixed(controller.transform.scale.x < 10 ? 2 : 0)} \
         y:${controller.transform.scale.y.toFixed(controller.transform.scale.y < 10 ? 2 : 0)}`;
    hints.setHint(hint);
}//indicateComponentTransform

function indicateComponentMove(controller: NetworkComponentController)
{
    const hint = `x:${controller.origin.x.toFixed(0)} \
                  y:${controller.origin.y.toFixed(0)}`;
    hints.setHint(hint);
}//indicateComponentMove

