/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Browser extension sandbox script
 ***************************************************************************/

import Kresmer, { CSSDims } from 'kresmer';

export const kresmer = new Kresmer("#kresmer", {
    isEditable: false,
    snappingGranularity: 5,
    on: {
        "mounted": onMount,
        "drawing-dims": onDrawingDims,
        "library-import-requested": onLibraryImportRequested,
    },
});

function onMount(kresmer: Kresmer) {
    window.parent.postMessage({ message: 'kresmer-mounted' }, '*'); 
}//onMount

function onDrawingDims(newDims: CSSDims) { 
    window.parent.postMessage({ message: "drawing-dims", newDims }, '*');
}//onDrawingDims

async function onLibraryImportRequested(libraryName: string, fileName?: string|undefined): Promise<string | undefined> {
    window.parent.postMessage({ message: "library-import-requested", libraryName, fileName }, '*');
    return new Promise<string | undefined>((resolve) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.message === "library-import-response") {
                window.removeEventListener("message", handleMessage);
                resolve(event.data.libraryData);
            }//if
        };
        window.addEventListener("message", handleMessage);
    });
}//onLibraryImportRequested

window.addEventListener("message", (event) => {
    switch (event.data.command) {
        case 'load-drawing':
            const drawingData = event.data.drawingData;
            if (drawingData) {
                kresmer.loadDrawing(drawingData);
            } else {
                console.warn('No drawing data received.');
            }
            break;
        case 'resize':
            const mountingBox = event.data.mountingBox as DOMRect;
            kresmer.mountingWidth = mountingBox.width;
            kresmer.mountingHeight = mountingBox.height;
            break;
        case "toggle-grid":
            kresmer.showGrid = !kresmer.showGrid;
            break;
        case "toggle-rulers":
            kresmer.showRulers = !kresmer.showRulers;
            break;
    }//switch
});


window.addEventListener("keypress", (event) => {
    switch (event.key) {
        case "g": case "G":
            kresmer.showGrid = !kresmer.showGrid;
            break;
        case "r": case "R":
            kresmer.showRulers = !kresmer.showRulers;
            break;
    }//switch
});
