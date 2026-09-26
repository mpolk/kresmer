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
const drawingUrl = urlParams.get('file');
const isFirefox = typeof browser.runtime.getBrowserInfo === 'function';
// Firefox never allows an extension page (moz-extension://...) to fetch() a
// file:// URL directly - not even with "Access local files" granted
const isLocalFileInFirefox = isFirefox && drawingUrl?.startsWith('file:');

let drawingData: string | undefined;
if (drawingUrl && !isLocalFileInFirefox) {
    try {
        const response = await fetch(drawingUrl);
        drawingData = await response.text();
    } catch (error) {
        console.error('Could not load the drawing:', error);
    }
}//if

if (!drawingUrl) {
    document.title = 'KresMer Viewer';
} else {
    const fileName = drawingUrl.split('/').pop() || drawingUrl;
    document.title = fileName;
}//if


const sandboxIframe = document.getElementById('sandbox') as HTMLIFrameElement;
window.addEventListener('message', (event) => {
    switch (event.data.message) {
        case 'kresmer-mounted':
            if (drawingData !== undefined || !isLocalFileInFirefox) 
                sendDrawingDataToSandbox();
            resizeSandboxToWindow();
            break;
        case "drawing-dims":
            resizeSandboxToDrawingDims(event.data.newDims);
            break;
        case "library-import-requested":
            importLibrary(event.data.libraryName, event.data.fileName);
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


async function importLibrary(libraryName: string, fileName?: string|undefined)
{
    if (!fileName) {
        fileName = `${libraryName}.krel`;
    }//if
    const filePath = `lib/${fileName}`;

    const libraryUrl = new URL(drawingUrl!);
    libraryUrl.pathname = libraryUrl.pathname.replace(/[^/]*$/, filePath);
    let libraryData: string | undefined;
    try {
        const response = await fetch(libraryUrl);
        libraryData = await response.text();
    } catch (error) {
        console.error('Could not load library:', error);
    }//catch
    
    sandboxIframe.contentWindow!.postMessage({
        message: "library-import-response",
        libraryData,
    }, '*');
}//importLibrary


function resizeSandboxToWindow() 
{
    const clientRect = {width: document.body.clientWidth, height: document.body.clientHeight};
    sandboxIframe.style.width = `${clientRect.width}px`;
    sandboxIframe.style.height = `${clientRect.height}px`;
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