/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Browser extension main script
 ***************************************************************************/

import browser from 'webextension-polyfill';
import { CSSDims } from 'kresmer';

const urlParams = new URLSearchParams(window.location.search);
const fileUrl = urlParams.get('file');
let drawingData: string | undefined;
if (fileUrl) {
    try {
        const response = await fetch(fileUrl);
        drawingData = await response.text();
    } catch (error) {
        console.error('Could not load the drawing:', error);
    }
}//if

if (!fileUrl) {
    document.title = 'KresMer Viewer';
} else {
    const fileName = fileUrl.split('/').pop() || fileUrl;
    document.title = fileName;
}//if

let zoomFactor = 1;

const sandboxIframe = document.getElementById('sandbox') as HTMLIFrameElement;
window.addEventListener('message', (event) => {
    switch (event.data.message) {
        case 'kresmer-mounted':
            zoomFactor = event.data.zoomFactor;
            sendDrawingDataToSandbox();
            resizeSandboxToWindow();
            break;
        case "drawing-dims":
            zoomFactor = event.data.zoomFactor;
            resizeSandboxToDrawingDims(event.data.newDims);
            break;
    }//switch
});//window.addEventListener

function sendDrawingDataToSandbox() 
{
    sandboxIframe.contentWindow!.postMessage({
        command: 'load-drawing',
        drawingData,
    }, '*');
}//sendDrawingDataToSandbox

function resizeSandboxToWindow() 
{
    const clientRect = {width: document.body.clientWidth, height: document.body.clientHeight};
    sandboxIframe.style.width = `${clientRect.width /* * zoomFactor */}px`;
    sandboxIframe.style.height = `${clientRect.height /* * zoomFactor */}px`;
    sandboxIframe.contentWindow!.postMessage({
        command: 'resize',
        mountingBox: clientRect,
    }, '*');
}//resizeSandboxToWindow

function resizeSandboxToDrawingDims(newDims: CSSDims)
{
    sandboxIframe.style.width = newDims.width;
    sandboxIframe.style.height = newDims.height;
}//resizeSandboxToDrawingDims

window.addEventListener('resize', resizeSandboxToWindow);

window.addEventListener("keypress", (event) => {
    switch (event.key) {
        case "g": case "G":
            sandboxIframe.contentWindow?.postMessage({command: "toggle-grid"});
            break;
        case "r": case "R":
            sandboxIframe.contentWindow?.postMessage({command: "toggle-rulers"});
            break;
    }//switch
});