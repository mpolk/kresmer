/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { IpcRendererEvent } from 'electron';
import { createApp, reactive, toRaw } from 'vue';
// import vueDevtools from '@vue/devtools';
import Hints from './Hints';
import StatusBar from './StatusBar.vue';
import ToastPane from './ToastPane.vue';
import AppSettingsSidebar from './AppSettingsSidebar.vue';
import DrawingPropsSidebar from './DrawingPropsSidebar.vue';
import ComponentPropsSidebar from './ElementPropsSidebar.vue';
import Kresmer, { 
    Position, KresmerException, KresmerParsingException, LibraryImportException,
    NetworkComponentController, NetworkComponent,
    NetworkLink, NetworkElement, LinkVertex,
    TransformMode, ConnectionPointProxy,
 } from 'kresmer';
import { AppCommandExecutor, LoadDrawingOptions, LoadLibraryOptions } from './AppCommands';
import MessageBox from './message-box.vue';
import DrawingMergeDialog from './DrawingMergeDialog.vue';
import { DrawingMergeDialogResult } from './DrawingMergeDialog';
import ComponentClassSelectionSidebar from './ComponentClassSelectionSidebar.vue';
import LinkClassSelectionDialog from './LinkClassSelectionDialog.vue';
import BackendConnectionDialog from './BackendConnectionDialog.vue';
import AboutDialog from './AboutDialog.vue';
import { AppInitStage } from './ElectronAPI.d';
import { AppSettings } from '../main/main';
import kresmerCSS from '../../packages/kresmer/dist/style.css?inline';
import { MessageBoxButtons, MessageBoxResult } from './message-box.d';

// if (process.env.NODE_ENV === 'development') {
//     vueDevtools.connect(/* host, port */)
// }//if
  

export const hints = new Hints;

export type StatusBarDisplayData = {
    selectedElement: NetworkElement | null,
    hint: string,
    serverURL: string,
    drawingScale: number,
    notificationsCount: number,
    autoAlignVertices: boolean,
};

export const statusBarData: StatusBarDisplayData = reactive({
    selectedElement: null,
    hint: "",
    serverURL: "",
    drawingScale: 1,
    notificationsCount: 0,
    autoAlignVertices: true,
})//statusBarData

export const vueStatusBar = createApp(StatusBar, {
    displayData: statusBarData,
}).mount("#statusBar") as InstanceType<typeof StatusBar>;

export const kresmer = new Kresmer("#kresmer", {...window.electronAPI.initialAppSettings, ...calcKresmerSize()});
statusBarData.drawingScale = kresmer.drawingScale;
window.electronAPI.rulersShownOrHidden(kresmer.showRulers);
window.electronAPI.gridShownOrHidden(kresmer.showGrid);
statusBarData.autoAlignVertices = kresmer.autoAlignVertices;

function calcKresmerSize()
{
    const mountingBox = document.body.getBoundingClientRect();
    mountingBox.height -= vueStatusBar.getHeight();
    return {
        mountingWidth: mountingBox.width,
        mountingHeight: mountingBox.height,
    }
}//calcKresmerSize

window.addEventListener("resize", () => {
    const {mountingWidth, mountingHeight} = calcKresmerSize();
    kresmer.mountingWidth = mountingWidth;
    kresmer.mountingHeight = mountingHeight;
});

export type fileSelectOrLoadResult = {
    filePath: string|undefined;
    data?: string|undefined;
}; //fileSelectOrLoadResult

const vueMessageBox = createApp(MessageBox).mount("#dlgMessageBox") as InstanceType<typeof MessageBox>;
const vueDrawingPropsSidebar = createApp(DrawingPropsSidebar).mount("#drawingPropsSidebar") as 
    InstanceType<typeof DrawingPropsSidebar>;
const vueAppSettingsSidebar = createApp(AppSettingsSidebar).mount("#appSettingsSidebar") as 
    InstanceType<typeof AppSettingsSidebar>;
const vueComponentPropsSidebar = createApp(ComponentPropsSidebar).mount("#componentPropsSidebar") as 
    InstanceType<typeof ComponentPropsSidebar>;
const vueLinkClassSelectionDialog = createApp(LinkClassSelectionDialog).mount("#dlgLinkClassSelection") as
    InstanceType<typeof LinkClassSelectionDialog>;
const vueComponentClassSelectionDialog = createApp(ComponentClassSelectionSidebar).mount("#componentClassSelectionSidebar") as
    InstanceType<typeof ComponentClassSelectionSidebar>;
const vueDrawingMergeDialog = createApp(DrawingMergeDialog).mount("#dlgDrawingMerge") as 
    InstanceType<typeof DrawingMergeDialog>;
const vueBackendConnectionDialog = createApp(BackendConnectionDialog).mount("#dlgBackendConnection") as 
    InstanceType<typeof BackendConnectionDialog>;
const vueAboutDialog = createApp(AboutDialog).mount("#dlgAbout") as 
    InstanceType<typeof AboutDialog>;
export const vueToastPane = createApp(ToastPane).mount("#divToastPane") as InstanceType<typeof ToastPane>;

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


window.onbeforeunload = (event: Event) =>
{
    if (!kresmer.isDirty) 
        return undefined;

    window.electronAPI.isReloadInProgress().then(reloadInProgress => {
        const [continuationHandler, opName] = reloadInProgress ?
            [() => window.electronAPI.reloadContent(), "reload"] :
            [() => window.close(), "closing"];
        askForUnsavedChanges(opName).then(async(answer) => {
            switch (answer)
            {
                case MessageBoxResult.YES:
                    if (await window.electronAPI.saveDrawing(kresmer.saveDrawing()))
                        continuationHandler();
                    break;
                case MessageBoxResult.NO:
                    kresmer.isDirty = false;
                    continuationHandler();
            }//switch
        });
    });

    event.preventDefault();
    return false;
}//onbeforeunload


async function askForUnsavedChanges(opName: string): Promise<MessageBoxResult>
{
    const prompt = `The current drawing has unsaved changes.\nDo you want to save it before ${opName}?`;
    return await vueMessageBox.ask(prompt, {buttons: MessageBoxButtons.YES_NO_CANCEL});
}//askForUnsavedChanges



// Processing Kresmer events (coming from the main Kresmer component)
kresmer
    .on("got-dirty", updateWindowTitle)
    .on("drawing-mouse-leave", () => hints.reset())
    .on("mode-reset", () => {hints.reset(); vueToastPane.hide();})
    .on("component-mouse-enter", () => hints.push(Hints.onComponentMouseEnter))
    .on("component-mouse-leave", () => hints.pop())
    .on("component-move-started", () => hints.push(Hints.onDrag))
    .on("component-moved", () => hints.pop())
    .on("component-transform-started", () => hints.push(""))
    .on("component-transformed", () => hints.pop())
    .on("component-exited-transform-mode", () => hints.pop())
    .on("link-vertex-moved", () => hints.pop())
    .on("link-vertex-connected", () => hints.pop())
    .on("link-vertex-disconnected", () => hints.pop())
    ;

kresmer.on("drawing-scale", (newScale) => {
    statusBarData.drawingScale = newScale;
});

kresmer.on("canvas-right-click", (mouseEvent: MouseEvent) =>
{
    window.electronAPI.showContextMenu("drawing", {x: mouseEvent.clientX, y: mouseEvent.clientY});
});

kresmer.on("component-double-click", (controller: NetworkComponentController) =>
{
    vueComponentPropsSidebar.show(controller.component);
});//onComponentDoubleClick

kresmer.on("component-right-click", (controller: NetworkComponentController) =>
{
    window.electronAPI.showContextMenu("component", controller.component.id);
});//onComponentRightClick

kresmer.on("component-entered-transform-mode", (_: NetworkComponentController, mode: TransformMode) =>
{
    hints.push(mode == "rotation" ? Hints.onRotation : Hints.onScaling);
});//onComponentEnteredTransformMode

kresmer.on("component-being-transformed", (controller: NetworkComponentController) =>
{
    const hint = controller.transformMode === "rotation" ? 
        controller.transform.rotation.angle.toFixed(0) + '°' :
        `x:${controller.transform.scale.x.toFixed(controller.transform.scale.x < 10 ? 2 : 0)} \
         y:${controller.transform.scale.y.toFixed(controller.transform.scale.y < 10 ? 2 : 0)}`;
    hints.setHint(hint);
});//indicateComponentTransform

kresmer.on("component-being-moved", (controller: NetworkComponentController) =>
{
    const hint = `x:${controller.origin.x.toFixed(0)} \
                  y:${controller.origin.y.toFixed(0)}`;
    hints.setHint(hint);
});//indicateComponentMove

kresmer.on("component-selected", (component: NetworkComponent, isSelected: boolean) =>
{
    statusBarData.selectedElement = isSelected ? component : null;
    window.electronAPI.enableDeleteSelectedElementMenuItem(isSelected);
    window.electronAPI.enableComponentOpMenuItems(isSelected);
    window.electronAPI.enableMoveComponentUpMenuItems(isSelected && !kresmer.networkComponents.isOnTop(component.controller!));
    window.electronAPI.enableMoveComponentDownMenuItems(isSelected && !kresmer.networkComponents.isOnBottom(component.controller!));
});//onComponentSelected

kresmer.on("link-selected", (link: NetworkLink, isSelected: boolean) => 
{
    statusBarData.selectedElement = isSelected ? link : null;
    window.electronAPI.enableDeleteSelectedElementMenuItem(isSelected);
    window.electronAPI.enableLinkOpMenuItems(isSelected);
});//onLinkSelected

kresmer.on("link-right-click", (link: NetworkLink, segmentNumber: number, mouseEvent: MouseEvent) =>
{
    window.electronAPI.showContextMenu("link", link.id, segmentNumber, {x: mouseEvent.clientX, y: mouseEvent.clientY});
});//onLinkRightClick

kresmer.on("link-double-click", (link: NetworkLink, /* segmentNumber: number,  mouseEvent: MouseEvent */) =>
{
    vueComponentPropsSidebar.show(link);
});//onLinkDoubleClick

kresmer.on("link-vertex-right-click", (vertex: LinkVertex, /* _mouseEvent: MouseEvent */) =>
{
    window.electronAPI.showContextMenu("link-vertex", vertex.link.id, vertex.vertexNumber);
});//onLinkVertexRightClick

kresmer.on("link-vertex-being-moved", (vertex: LinkVertex) =>
{
    const {x, y} = vertex.coords;
    const hint = `x:${x.toFixed(0)} y:${y.toFixed(0)}`;
    hints.setHint(hint);
});//indicateLinkVertexMove

kresmer.on("connection-point-right-click", (connectionPoint: ConnectionPointProxy) =>
{
    window.electronAPI.showContextMenu("connection-point", connectionPoint.hostElement.id, connectionPoint.name);
});//onConnectionPointRightClick

kresmer.on("error", (error: KresmerException) => 
{
    vueToastPane.show({
        message: error.message, 
        title: error.source ?? "Error", 
        severity: error.severity
    });
});//onError

kresmer.on("open-url", (url: string) => {
    console.debug(`Passing url ${url} to the main process`);
    window.electronAPI.openURL(url);
    return true;
});//onOpenURL

kresmer.on("library-import-requested", async(libName: string, fileName?: string) => {
    return window.electronAPI.loadLibraryFile(libName, fileName);
});//onLibraryImportRequested



// Processing application comand (coming from the main process)
const appCommandExecutor = new AppCommandExecutor;
appCommandExecutor
    .on("undo", () => {kresmer.undo()})
    .on("redo", () => {kresmer.redo()})
    ;

window.electronAPI.onCommand((_event: IpcRendererEvent, command: string, ...args: unknown[]) => {
    appCommandExecutor.execute(command, ...args);
});


appCommandExecutor.on("load-library", async(libData: string, options?: LoadLibraryOptions) =>
{ 
    try {
        const rc = await kresmer.loadLibrary(libData);
        if (rc > 0) {
            alert("There were errors during library load (see the log)");
        } else if (options?.notifyUser) {
            alert(rc ? "Library already loaded" : "Library loaded successfully");
        }//if
    } catch (exc) {
        if (exc instanceof KresmerParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
});//loadLibrary


appCommandExecutor.on("load-initial-libraries", async(libPaths: string[]) =>
{ 
    for (const libPath of libPaths) {
        const libData = await window.electronAPI.loadLibraryFile("", libPath);
        if (libData)
            await kresmer.loadLibrary(libData);
        else
            kresmer.raiseError(new LibraryImportException({fileName: libPath}));
    }//for

    window.electronAPI.signalReadiness(AppInitStage.LIBS_LOADED);
});//loadLibrary


appCommandExecutor.on("create-new-drawing", async() => {
    if (kresmer.isDirty) {
        const reply = await vueMessageBox.ask("The drawing is modified. Save it before replacing with a new one?", 
                                             {buttons: MessageBoxButtons.YES_NO_CANCEL});
        switch (reply) {
            case MessageBoxResult.YES: {
                const dwgData = kresmer.saveDrawing();
                if (!await window.electronAPI.saveDrawing(dwgData))
                    return;
                break;
            }
            case MessageBoxResult.CANCEL:
                return;
        }//switch
    }//if

    kresmer.eraseContent();
    updateWindowTitle();
});//create-new-drawing

appCommandExecutor.on("load-drawing", async (drawingData: string, options?: LoadDrawingOptions) =>
{
    try {
        let dialogResult: DrawingMergeDialogResult|undefined;
        if (!options?.completionSignal && !kresmer.isEmpty) {
            dialogResult = (await vueDrawingMergeDialog.show()) ?? undefined;
            if (!dialogResult) {
                return;
            }//if
        }//if

        if (dialogResult?.saveChanges) {
            await window.electronAPI.saveDrawing(kresmer.saveDrawing());
        }//if

        if (! await kresmer.loadDrawing(drawingData, dialogResult?.drawingMergeOption ?? undefined)) {
            alert("There were errors during drawing load (see the log)");
        } else if (options?.drawingFileName && (!dialogResult || dialogResult.drawingMergeOption === "erase-previous-content")) {
            window.electronAPI.setDefaultDrawingFileName(options.drawingFileName);
        }//if
    } catch (exc) {
        if (exc instanceof KresmerParsingException) {
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
});//loadDrawing


appCommandExecutor.on("save-drawing", () =>
{
    const dwgData = kresmer.saveDrawing();
    window.electronAPI.completeDrawingSaving(dwgData);
});//saveDrawing

appCommandExecutor.on("export-drawing-to-SVG", () =>
{
    const svgData = kresmer.exportDrawingToSVG(kresmerCSS);
    window.electronAPI.completeDrawingExportToSVG(svgData);
});//saveDrawing

appCommandExecutor.on("edit-drawing-properties", () => {
    vueDrawingPropsSidebar.show();
});

appCommandExecutor.on("edit-app-settings", (appSettings: AppSettings) => {
    vueAppSettingsSidebar.show(appSettings);
});

export function updateAppSettings(newAppSettings: AppSettings)
{
    kresmer.snapToGrid = newAppSettings.snapToGrid;
    kresmer.snappingGranularity = newAppSettings.snappingGranularity;
    kresmer.saveDynamicPropValuesWithDrawing = newAppSettings.saveDynamicPropValuesWithDrawing;
    kresmer.autoAlignVertices = statusBarData.autoAlignVertices = newAppSettings.autoAlignVertices;
    kresmer.animateComponentDragging = newAppSettings.animateComponentDragging;
    kresmer.animateLinkBundleDragging = newAppSettings.animateLinkBundleDragging;
    window.electronAPI.updateAppSettings(toRaw(newAppSettings));
}//updateAppSettings

appCommandExecutor.on("add-component", async (position?: Position) =>
{
    const componentClass = await vueComponentClassSelectionDialog.show();
    console.debug(`component-class = ${componentClass?.name}`);

    if (componentClass) {
        kresmer.edAPI.createComponent(componentClass, position, "screen");
    }//if
});//addComponent

appCommandExecutor.on("delete-selected-element", () =>
{
    if (kresmer.selectedElement instanceof NetworkComponent) {
        kresmer.edAPI.deleteComponent(kresmer.selectedElement.id);
    } else if (kresmer.selectedElement instanceof NetworkLink) {
        kresmer.edAPI.deleteLink(kresmer.selectedElement.id);
    }//if
});//deleteSelectedElement

appCommandExecutor.on("delete-component", (componentID?: number) =>
{
    kresmer.edAPI.deleteComponent(componentID ?? kresmer.selectedElement!.id);
});//deleteComponent

appCommandExecutor.on("duplicate-component", (componentID?: number) =>
{
    const controller = kresmer.getComponentControllerById(componentID ?? kresmer.selectedElement!.id)!;
    kresmer.edAPI.duplicateComponent(controller);
});//duplicateComponent

appCommandExecutor.on("move-component-down", (componentID?: number) => {
    const controller = kresmer.getComponentControllerById(componentID ?? kresmer.selectedElement!.id)!;
    kresmer.edAPI.moveComponentDown(controller);
    window.electronAPI.enableMoveComponentUpMenuItems(!kresmer.networkComponents.isOnTop(controller));
    window.electronAPI.enableMoveComponentDownMenuItems(!kresmer.networkComponents.isOnBottom(controller));
});//moveComponentDown

appCommandExecutor.on("move-component-to-bottom", (componentID?: number) => {
    const controller = kresmer.getComponentControllerById(componentID ?? kresmer.selectedElement!.id)!;
    kresmer.edAPI.moveComponentToBottom(controller);
    window.electronAPI.enableMoveComponentUpMenuItems(!kresmer.networkComponents.isOnTop(controller));
    window.electronAPI.enableMoveComponentDownMenuItems(!kresmer.networkComponents.isOnBottom(controller));
});//moveComponentToBottom

appCommandExecutor.on("move-component-up", (componentID?: number) => {
    const controller = kresmer.getComponentControllerById(componentID ?? kresmer.selectedElement!.id)!;
    kresmer.edAPI.moveComponentUp(controller);
    window.electronAPI.enableMoveComponentUpMenuItems(!kresmer.networkComponents.isOnTop(controller));
    window.electronAPI.enableMoveComponentDownMenuItems(!kresmer.networkComponents.isOnBottom(controller));
});//moveComponentDown

appCommandExecutor.on("move-component-to-top", (componentID?: number) => {
    const controller = kresmer.getComponentControllerById(componentID ?? kresmer.selectedElement!.id)!;
    kresmer.edAPI.moveComponentToTop(controller);
    window.electronAPI.enableMoveComponentUpMenuItems(!kresmer.networkComponents.isOnTop(controller));
    window.electronAPI.enableMoveComponentDownMenuItems(!kresmer.networkComponents.isOnBottom(controller));
});//moveComponentToTop

appCommandExecutor.on("edit-component-properties", (componentID?: number) =>
{
    const component = componentID ? kresmer.getComponentById(componentID) : kresmer.selectedElement;
    if (!component) {
        console.error(`No such component (id=${componentID})`);
        return;
    }//if
    vueComponentPropsSidebar.show(component);
});//editComponentProperties

appCommandExecutor.on("transform-component", (componentID?: number) =>
{
    const controller = kresmer.getComponentControllerById(componentID ?? kresmer.selectedElement!.id);
    if (controller) {
        controller.transformMode = "scaling";
    }//if
});//transformComponent

appCommandExecutor.on("delete-link", (linkID?: number) =>
{
    kresmer.edAPI.deleteLink(linkID ?? kresmer.selectedElement!.id);
});//deleteLink

appCommandExecutor.on("edit-link-properties", (linkID?: number) =>
{
    const link = kresmer.getLinkById(linkID ?? kresmer.selectedElement!.id);
    if (!link) {
        console.error(`No such link (id=${linkID})`);
        return;
    }//if
    vueComponentPropsSidebar.show(link);
});//editLinkProperties

appCommandExecutor.on("add-vertex", (linkID?: number, segmentNumber?: number, mousePos?: Position) =>
{
    kresmer.edAPI.addLinkVertex(linkID!, segmentNumber!, mousePos!);
});//addLinkVertex

appCommandExecutor.on("delete-vertex", (linkID: number, vertexNumber: number) =>
{
    kresmer.edAPI.deleteLinkVertex({linkID, vertexNumber});
});//deleteLinkVertex

appCommandExecutor.on("align-vertex", (linkID: number, vertexNumber: number) =>
{
    kresmer.edAPI.alignLinkVertex({linkID, vertexNumber});
});//alignLinkVertex

appCommandExecutor.on("align-vertices", (linkID?: number) =>
{
    kresmer.edAPI.alignLinkVertices({linkID: linkID!});
});//alignLinkVertices

appCommandExecutor.on("connect-connection-point", async (fromElementID: number, fromConnectionPointName: string|number) =>
{
    const linkClass = await vueLinkClassSelectionDialog.show(false);
    console.debug(`link-class = ${linkClass?.name}`);

    if (linkClass) {
        const hostElement = kresmer.getElementById(fromElementID)!;
        const conn = hostElement.getConnectionPoint(fromConnectionPointName)!;
        kresmer.edAPI.startLinkCreation(linkClass, {conn});
    }//if
});//startLinkCreation

appCommandExecutor.on("create-link", async (mousePos?: Position) =>
{
    const linkClass = await vueLinkClassSelectionDialog.show(false);
    if (linkClass) {
        const pos = mousePos ? kresmer.applyScreenCTM(mousePos) : {x: kresmer.logicalWidth/2, y: kresmer.logicalHeight/2}
        kresmer.edAPI.startLinkCreation(linkClass, {pos});
    }//if
});//startLinkCreation

appCommandExecutor.on("create-link-bundle", async (mousePos?: Position) =>
{
    const linkClass = await vueLinkClassSelectionDialog.show(true);
    if (linkClass) {
        const pos = mousePos ? kresmer.applyScreenCTM(mousePos) : {x: kresmer.logicalWidth/2, y: kresmer.logicalHeight/2}
        kresmer.edAPI.startLinkCreation(linkClass, {pos});
    }//if
});//startLinkCreation

appCommandExecutor.on("scale-drawing", direction => {
    switch (direction) {
        case "-": kresmer.zoomFactor *= Math.SQRT1_2; break;
        case "+": kresmer.zoomFactor *= Math.SQRT2; break;
        case "0": kresmer.zoomFactor = 1; break;
        case "1": kresmer.zoomFactor = 1 / kresmer.baseScale; break;
    }//switch
});

appCommandExecutor.on("toggle-rulers", () => {
    kresmer.showRulers = !kresmer.showRulers;
    window.electronAPI.rulersShownOrHidden(kresmer.showRulers);
});

appCommandExecutor.on("toggle-grid", () => {
    kresmer.showGrid = !kresmer.showGrid;
    window.electronAPI.gridShownOrHidden(kresmer.showGrid);
});

appCommandExecutor.on("toggle-vertex-auto-alignment", () => {
    kresmer.autoAlignVertices = statusBarData.autoAlignVertices = !kresmer.autoAlignVertices;
    window.electronAPI.autoAlignmentToggled(kresmer.autoAlignVertices);
});

export type BackendConnectionParams = {
    serverURL: string,
    password: string,
    autoConnect: boolean,
    savePassword: boolean,
}//BackendConnectionParams


appCommandExecutor.on("connect-to-server", 
    async (serverURL, password, forceUI, completionSignal?: AppInitStage) => {
    let connectionParams: BackendConnectionParams | null = {
        serverURL,
        password,
        autoConnect: true,
        savePassword: Boolean(password)
    }

    let message: string|undefined;
    if (!forceUI) {
        const testResult = await kresmer.testBackendConnection(connectionParams.serverURL, 
                                                               connectionParams.password);
        if (!testResult.success) {
            forceUI = true;
            message = testResult.message;
        }//if
    }//if

    if (forceUI) {
        connectionParams = await vueBackendConnectionDialog.show(connectionParams, message);
        if (!connectionParams) {
            if (completionSignal) {
                window.electronAPI.signalReadiness(completionSignal);
            }//if
            return;
        }//if
    }//if
    
    kresmer.connectToBackend(connectionParams.serverURL, connectionParams.password);
    window.electronAPI.backendServerConnected(connectionParams.serverURL, 
                                              connectionParams.password, 
                                              connectionParams.autoConnect);
    statusBarData.serverURL = connectionParams.serverURL;
    if (completionSignal) {
        window.electronAPI.signalReadiness(completionSignal);
    }//if
});


appCommandExecutor.on("disconnect-from-server", async () => {
    kresmer.disconnectFromBackend();
    window.electronAPI.backendServerDisconnected();
    statusBarData.serverURL = "";
});


appCommandExecutor.on("escape", () => {
    console.debug("Escape pressed");
    kresmer.deselectAllElements();
    kresmer.resetAllComponentMode();
});


appCommandExecutor.on("show-about-dialog", appVersion => {
    vueAboutDialog.show(appVersion);
});

// -------------------------------------------------------------------------------------------------
// Let's go forward and do our work...
window.electronAPI.signalReadiness(AppInitStage.HANDLERS_INITIALIZED);
