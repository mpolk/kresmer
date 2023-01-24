/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { IpcRendererEvent } from 'electron';
import { createApp, reactive } from 'vue';
import Hints from './Hints';
import StatusBar from './StatusBar.vue';
import ComponentPropsSidebar from './ElementPropsSidebar.vue';
import Kresmer, { 
    DrawingMergeOptions, Position, ParsingException, 
    NetworkComponentController, NetworkComponent,
    NetworkLink, NetworkElement, LinkVertex,
    TransformMode,
 } from 'kresmer';
import { AppCommandExecutor } from './AppCommands';
import DrawingMergeDialog from './DrawingMergeDialog.vue';

export const kresmer = new Kresmer('#kresmer');

export const hints = new Hints;

export type StatusBarDisplayData = {
    selectedElement: NetworkElement | null,
    hint: string,
    drawingScale: number,
};

export const statusBarData: StatusBarDisplayData = reactive({
    selectedElement: null,
    hint: "",
    drawingScale: 1,
})//statusBarData

export const vueStatusBar = createApp(StatusBar, {
    displayData: statusBarData,
}).mount("#statusBar");

const vueComponentPropsSidebar = createApp(ComponentPropsSidebar).mount("#componentPropsSidebar") as 
    InstanceType<typeof ComponentPropsSidebar>;

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
    .on("component-entered-transform-mode", onComponentEnteredTransformMode)
    .on("component-exited-transform-mode", () => hints.pop())
    .on("component-selected", onComponentSelected)
    .on("component-right-click", onComponentRightClick)
    .on("component-double-click", onComponentDoubleClick)
    .on("link-selected", onLinkSelected)
    .on("link-right-click", onLinkRightClick)
    .on("link-vertex-being-moved", indicateLinkVertexMove)
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
    .on("save-drawing", saveDrawing)
    .on("undo", () => {kresmer.undo(); updateWindowTitle();})
    .on("redo", () => {kresmer.redo(); updateWindowTitle();})
    .on("edit-component-properties", editComponentProperties)
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
                                completionSignal?: number,
                          })
{
    try {
        let mergeOptions: DrawingMergeOptions|undefined;
        if (!options?.completionSignal && !kresmer.isEmpty) {
            mergeOptions = (await drawingMergeDialog.show()) ?? undefined;
            if (!mergeOptions) {
                return;
            }//if
        }//if

        if (!kresmer.loadDrawing(drawingData, mergeOptions)) {
            alert("There were errors during drawing load (see the log)");
        } else if (options?.drawingFileName && (!mergeOptions || mergeOptions === "erase-previous-content")) {
            window.electronAPI.setDefaultDrawingFileName(options.drawingFileName);
        }//if
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch

    updateWindowTitle();
    if (options?.completionSignal) {
        window.electronAPI.signalReadiness(options.completionSignal);
    }//if
}//loadDrawing

function saveDrawing()
{
    const dwgData = kresmer.saveDrawing();
    window.electronAPI.completeDrawingSaving(dwgData);
    updateWindowTitle();
}//saveDrawing

export function updateWindowTitle()
{
    let title = "Kresmer";
    if (kresmer.drawingName) {
        title = `${kresmer.drawingName} - Kresmer`;
    }//if
    if (kresmer.isDirty) {
        title = `*${title}`;
    }//if
    window.document.title = title;
}//updateWindowTitle

function onComponentDoubleClick(controller: NetworkComponentController)
{
    vueComponentPropsSidebar.show(controller.component);
}//onComponentDoubleClick

function editComponentProperties(componentID: number)
{
    const component = kresmer.getComponentById(componentID);
    if (!component) {
        console.error(`No such component (id=${componentID})`);
        return;
    }//if
    vueComponentPropsSidebar.show(component);
}//editComponentProperties

function onComponentRightClick(controller: NetworkComponentController)
{
    window.electronAPI.showContextMenu("component", controller.component.id);
}//onComponentRightClick

function onComponentEnteredTransformMode(_: NetworkComponentController, mode: TransformMode) 
{
    hints.push(mode == "rotation" ? 
        Hints.onRotation : 
        Hints.onScaling);
}//onComponentEnteredTransformMode

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
        statusBarData.selectedElement = component;
    } else {
        statusBarData.selectedElement = null;
    }//if
}//onComponentSelected

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onComponentMutated(_controller: NetworkComponentController)
{
    hints.pop();
    updateWindowTitle();
}//onComponentMutated

function onLinkSelected(link: NetworkLink, isSelected: boolean)
{
    if (isSelected) {
        statusBarData.selectedElement = link;
    } else {
        statusBarData.selectedElement = null;
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

function indicateLinkVertexMove(vertex: LinkVertex)
{
    const coords = vertex.coords;
    const hint = `x:${coords.x.toFixed(0)} \
                  y:${coords.y.toFixed(0)}`;
    hints.setHint(hint);
}//indicateLinkVertexMove

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onLinkVertexMutated(_vertex: LinkVertex)
{
    hints.pop();
    updateWindowTitle();
}//onLinkVertexMutated

function addLinkVertex(linkID: number, segmentNumber: number, mousePos: Position)
{
    kresmer.addLinkVertex(linkID, segmentNumber, mousePos);
    updateWindowTitle();
}//addLinkVertex

function deleteLinkVertex(linkID: number, vertexNumber: number)
{
    kresmer.deleteLinkVertex(linkID, vertexNumber);
    updateWindowTitle();
}//deleteLinkVertex

function alignLinkVertex(linkID: number, vertexNumber: number)
{
    kresmer.alignLinkVertex(linkID, vertexNumber);
    updateWindowTitle();
}//alignLinkVertex