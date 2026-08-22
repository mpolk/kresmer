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
    },
});

function onMount(kresmer: Kresmer) {
    window.parent.postMessage({ message: 'kresmer-mounted', zoomFactor: kresmer.zoomFactor }, '*'); 
}//onMount

function onDrawingDims(newDims: CSSDims) { 
    window.parent.postMessage({ message: "drawing-dims", newDims, zoomFactor: kresmer.zoomFactor }, '*');
}//onDrawingDims

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
            kresmer.snappingGranularity = 5;
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
            kresmer.snappingGranularity = 5;
            kresmer.showGrid = !kresmer.showGrid;
            break;
        case "r": case "R":
            kresmer.showRulers = !kresmer.showRulers;
            break;
    }//switch
});
