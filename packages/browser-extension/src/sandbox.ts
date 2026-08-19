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
    }//switch
});
