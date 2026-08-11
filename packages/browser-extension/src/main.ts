/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Browser extension main script
 ***************************************************************************/

import Kresmer from 'kresmer';

const urlParams = new URLSearchParams(window.location.search);
console.debug("URL Parameters:", Object.fromEntries(urlParams.entries())); // Log all URL parameters
const fileUrl = urlParams.get('file');
let drawingData = undefined;
if (fileUrl) {
    try {
        const response = await fetch(fileUrl);
        drawingData = await response.text();
    } catch (error) {
        console.error('Could not load the drawing:', error);
    }
}//if


export const kresmer = new Kresmer("#kresmer", {
    ...calcKresmerSize(),
    isEditable: false,
    drawingData,
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
