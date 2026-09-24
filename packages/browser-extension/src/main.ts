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
const isFirefox = typeof browser.runtime.getBrowserInfo === 'function';
// Firefox never allows an extension page (moz-extension://...) to fetch() a
// file:// URL directly - not even with "Access local files" granted. For local
// files there, content/injector.ts reads the already-rendered raw text itself
// (same-origin) and pushes it to us via postMessage (command: 'load-drawing')
// instead. So we must not attempt fetch() ourselves in that case.
const isLocalFileInFirefox = isFirefox && fileUrl?.startsWith('file:');

let drawingData: string | undefined;
if (fileUrl && !isLocalFileInFirefox) {
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
let sandboxIsMounted = false;

const sandboxIframe = document.getElementById('sandbox') as HTMLIFrameElement;
window.addEventListener('message', (event) => {
    switch (event.data.message) {
        case 'kresmer-mounted':
            zoomFactor = event.data.zoomFactor;
            sandboxIsMounted = true;
            // If we're waiting on injector.ts, drawingData may not have arrived
            // yet - sendDrawingDataToSandbox() will be called from the
            // 'load-drawing' branch above once it does.
            if (drawingData !== undefined || !isLocalFileInFirefox) sendDrawingDataToSandbox();
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