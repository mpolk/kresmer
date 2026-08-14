/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Browser extension sandbox script
 ***************************************************************************/

import Kresmer from 'kresmer';

export const kresmer = new Kresmer("#kresmer", {
    isEditable: false,
    on: {
        "mounted": onMount,
        "drawing-scale": onDrawingScale,
    },
});

function onMount(kresmer: Kresmer) {
    window.parent.postMessage({ message: 'kresmer-mounted', kresmer: kresmer.driedClone }, '*'); 
}//onMount

function onDrawingScale(newScaleFactor: number) { 
    window.parent.postMessage({ message: "drawing-scale", newScaleFactor, drawingRect: kresmer.drawingRect }, '*');
}//onDrawingScale

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
