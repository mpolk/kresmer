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
import Kresmer, { DrawingMergeOptions } from '../Kresmer';
import ParsingException from '../parsers/ParsingException';
import StatusBar from './status-bar.vue';
import NetworkComponentController from '../NetworkComponent/NetworkComponentController';
import NetworkComponent from '../NetworkComponent/NetworkComponent';
import NetworkLink from '../NetworkLink/NetworkLink';
import LinkVertex from '../NetworkLink/LinkVertex';
import { AppCommandExecutor } from './app-commands';
import DrawingMergeDialog from './drawing-merge-dialog.vue';

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
    .on("component-selected", onComponentSelected)
    .on("link-selected", onLinkSelected)
    .on("link-vertex-right-click", onLinkVertexRightClick)
    ;

const drawingMergeDialog = createApp(DrawingMergeDialog).mount("#dlgDrawingMerge") as 
    InstanceType<typeof DrawingMergeDialog>;

const appCommandExecutor = new AppCommandExecutor;
appCommandExecutor
    .on("load-library", loadLibrary)
    .on("load-drawing", loadDrawing)
    .on("undo", () => {kresmer.undo()})
    .on("redo", () => {kresmer.redo()})
    .on("delete-vertex", deleteLinkVertex)
    ;

window.electronAPI.onCommand((_event: IpcRendererEvent, command: string, ...args: unknown[]) => {
    appCommandExecutor.execute(command, ...args);
});

window.electronAPI.signalReadiness(0);

function loadLibrary(libData: string)
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
}//loadLibrary

async function loadDrawing(drawingData: string, 
                     options?: {
                        drawingName?: string,
                        mergeOptions?: DrawingMergeOptions,
                        completionSignal?: number,
                    })
{ 
    try {
        if (!options?.mergeOptions) {
            await drawingMergeDialog.show();
        }//if

        if (!kresmer.loadDrawing(drawingData, options?.mergeOptions))
            alert("There were errors during drawing load (see the log)");
        else if (options?.drawingName)
            window.document.title = `${options.drawingName} - Kresmer`;
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
    if (options?.completionSignal) {
        window.electronAPI.signalReadiness(options.completionSignal);
    }//if
}//loadDrawing

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

function onComponentSelected(component: NetworkComponent, isSelected: boolean)
{
    if (isSelected) {
        hints.push(`${component.name}: ${component.getClass().name}`);
    } else {
        hints.pop();
    }//if
}//onComponentSelected

function onLinkSelected(link: NetworkLink, isSelected: boolean)
{
    if (isSelected) {
        hints.push(`${link.name}: ${link.getClass().name}`);
    } else {
        hints.pop();
    }//if
}//onLinkSelected

function onLinkVertexRightClick(vertex: LinkVertex, /* _mouseEvent: MouseEvent */)
{
    window.electronAPI.showContextMenu("link-vertex", vertex.link.id, vertex.vertexNumber);
}//onLinkVertexRightClick

function deleteLinkVertex(linkID: number, vertexNumber: number)
{
    kresmer.deleteLinkVertex(linkID, vertexNumber);
}//deleteLinkVertex