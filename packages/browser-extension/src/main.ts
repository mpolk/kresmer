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
            resizeKresmerToSandbox();
            break;
        case 'drawing-zoom':
            zoomFactor = event.data.newZoomFactor;
            scaleSandbox(event.data.newZoomFactor / event.data.prevZoomFactor);
            break;
        case "drawing-dims":
            resizeSandboxToDrawingDims(event.data.newDims);
            break;
    }//switch
});//window.addEventListener

function sendDrawingDataToSandbox() {
    sandboxIframe.contentWindow!.postMessage({
        command: 'load-drawing',
        drawingData,
    }, '*');
}//sendDrawingDataToSandbox

function resizeKresmerToSandbox()
{
    const mountingBox = sandboxIframe.getBoundingClientRect();
    sandboxIframe.contentWindow!.postMessage({
        command: 'resize',
        mountingBox,
    }, '*');
}//resizeKresmerToSandbox

function resizeSandboxToWindow() 
{
    const clientRect = document.body.getBoundingClientRect();
    sandboxIframe.style.width = `${clientRect.width * zoomFactor}px`;
    sandboxIframe.style.height = `${clientRect.height * zoomFactor}px`;
    // resizeKresmerToSandbox();
}//resizeSandboxToWindow

function resizeSandboxToDrawingDims(newDims: CSSDims)
{
    sandboxIframe.style.width = newDims.width;
    sandboxIframe.style.height = newDims.height;
}//resizeSandboxToDrawingDims

function scaleSandbox(zoom: number) 
{
    resizeSandboxToWindow();
    // const box = sandboxIframe.getBoundingClientRect();
    // sandboxIframe.style.width = `${box.width * zoom}px`;
    // sandboxIframe.style.height = `${box.height * zoom}px`;
    // resizeKresmerToSandbox();
}//scaleSandbox

window.addEventListener('resize', () => { resizeSandboxToWindow(); resizeKresmerToSandbox(); });