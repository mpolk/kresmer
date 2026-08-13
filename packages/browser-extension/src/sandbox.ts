/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Browser extension sandbox script
 ***************************************************************************/

import Kresmer from 'kresmer';

export const kresmer = new Kresmer("#kresmer", {
    ...calcKresmerSize(),
    isEditable: false,
    eventHandlers: {
        "mounted": () => {
            window.parent.postMessage({ status: 'kresmer-mounted' }, '*');
        },
    },
});

function calcKresmerSize()
{
    const mountingBox = document.body.getBoundingClientRect();
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

window.addEventListener("message", (event) => {
    if (event.data.command === 'load-drawing') {
        const drawingData = event.data.drawingData;
        if (drawingData) {
            kresmer.loadDrawing(drawingData);
        } else {
            console.warn('No drawing data received.');
        }
    }
});
