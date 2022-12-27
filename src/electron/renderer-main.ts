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
import { Position } from '../Transform/Transform';

export const kresmer = new Kresmer('#kresmer');
let drawingFileName: string;

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
    .on("component-moved", onComponentMutated)
    .on("component-being-moved", indicateComponentMove)
    .on("component-transform-started", () => hints.push(""))
    .on("component-being-transformed", indicateComponentTransform)
    .on("component-transformed", onComponentMutated)
    .on("component-entered-transform-mode", (_, mode) => hints.push(mode == "rotation" ? 
                                                                        Hints.onRotation : 
                                                                        Hints.onScaling))
    .on("component-exited-transform-mode", () => hints.pop())
    .on("component-selected", onComponentSelected)
    .on("link-selected", onLinkSelected)
    .on("link-right-click", onLinkRightClick)
    .on("link-vertex-moved", onLinkVertexMutated)
    .on("link-vertex-connected", onLinkVertexMutated)
    .on("link-vertex-disconnected", onLinkVertexMutated)
    .on("link-vertex-right-click", onLinkVertexRightClick)
    ;

const drawingMergeDialog = createApp(DrawingMergeDialog).mount("#dlgDrawingMerge") as 
    InstanceType<typeof DrawingMergeDialog>;

const appCommandExecutor = new AppCommandExecutor;
appCommandExecutor
    .on("load-library", loadLibrary)
    .on("load-drawing", loadDrawing)
    .on("undo", () => {kresmer.undo(); setWindowTitle();})
    .on("redo", () => {kresmer.redo(); setWindowTitle();})
    .on("add-vertex", addLinkVertex)
    .on("delete-vertex", deleteLinkVertex)
    .on("align-vertex", alignLinkVertex)
    ;

window.electronAPI.onCommand((_event: IpcRendererEvent, command: string, ...args: unknown[]) => {
    appCommandExecutor.execute(command, ...args);
});

window.electronAPI.signalReadiness(0);

function loadLibrary(libData: string, completionSignal?: number)
{ 
    try {
        if (!kresmer.loadLibrary(libData)) {
            alert("There were errors during library load (see the log)");
        } else if (completionSignal === undefined) {
            alert("Library loaded successfully");
        }//if
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch

    if (completionSignal !== undefined) {
        window.electronAPI.signalReadiness(completionSignal);
    }//if
}//loadLibrary

async function loadDrawing(drawingData: string, 
                     options?: {
                        drawingFileName?: string,
                        mergeOptions?: DrawingMergeOptions,
                        completionSignal?: number,
                    })
{ 
    try {
        let mergeOptions: DrawingMergeOptions|null|undefined = options?.mergeOptions;
        if (!mergeOptions) {
            mergeOptions = await drawingMergeDialog.show();
            if (!mergeOptions) {
                return;
            }//if
        }//if

        if (!kresmer.loadDrawing(drawingData, mergeOptions))
            alert("There were errors during drawing load (see the log)");
        else if (options?.drawingFileName && (!options.mergeOptions || options.mergeOptions === "erase-previous-content")) {
            drawingFileName = options?.drawingFileName;
        }//if
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch

    setWindowTitle();
    if (options?.completionSignal) {
        window.electronAPI.signalReadiness(options.completionSignal);
    }//if
}//loadDrawing

function setWindowTitle()
{
    let title = "Kresmer";
    if (kresmer.drawingName) {
        title = `${kresmer.drawingName} - Kresmer`;
    }//if
    if (kresmer.isDirty) {
        title = `*${title}`;
    }//if
    window.document.title = title;
}//setWindowTitle

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
        hints.push(`${component}`);
    } else {
        hints.pop();
    }//if
}//onComponentSelected

function onComponentMutated(controller: NetworkComponentController)
{
    hints.pop();
    hints.setHint(`${controller.component}`);
    setWindowTitle();
}//onComponentMutated

function onLinkSelected(link: NetworkLink, isSelected: boolean)
{
    if (isSelected) {
        hints.push(`${link}`);
    } else {
        hints.pop();
    }//if
}//onLinkSelected

function onLinkRightClick(link: NetworkLink, segmentNumber: number, mouseEvent: MouseEvent)
{
    window.electronAPI.showContextMenu("link", link.id, segmentNumber, {x: mouseEvent.clientX, y: mouseEvent.clientY});
}//onLinkRightClick

function onLinkVertexRightClick(vertex: LinkVertex, /* _mouseEvent: MouseEvent */)
{
    window.electronAPI.showContextMenu("link-vertex", vertex.link.id, vertex.vertexNumber);
}//onLinkVertexRightClick

function onLinkVertexMutated(vertex: LinkVertex)
{
    hints.setHint(`${vertex.link}`);
    setWindowTitle();
}//onLinkVertexMutated

function addLinkVertex(linkID: number, segmentNumber: number, mousePos: Position)
{
    kresmer.addLinkVertex(linkID, segmentNumber, mousePos);
    setWindowTitle();
}//addLinkVertex

function deleteLinkVertex(linkID: number, vertexNumber: number)
{
    kresmer.deleteLinkVertex(linkID, vertexNumber);
    setWindowTitle();
}//deleteLinkVertex

function alignLinkVertex(linkID: number, vertexNumber: number)
{
    kresmer.alignLinkVertex(linkID, vertexNumber);
    setWindowTitle();
}//alignLinkVertex