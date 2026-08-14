/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Browser extension main script
 ***************************************************************************/

import browser from 'webextension-polyfill';

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

let drawingZoomFactor = 1;

const sandboxIframe = document.getElementById('sandbox') as HTMLIFrameElement;
window.addEventListener('message', (event) => {
    switch (event.data.message) {
        case 'kresmer-mounted':
            console.debug('KresMer in sandbox is mounted. Sending drawing data...');
            sendDrawingDataToSandbox();
            resizeKresmer();
            drawingZoomFactor = event.data.kresmer._zoomFactor;
            // setSandboxHeight();
            break;
        case 'drawing-scale':
            scaleSandbox(event.data.newScaleFactor / drawingZoomFactor);
    }//switch
});//window.addEventListener

function sendDrawingDataToSandbox() {
    sandboxIframe.contentWindow!.postMessage({
        command: 'load-drawing',
        drawingData,
    }, '*');
}//sendDrawingDataToSandbox

function resizeKresmer()
{
    setSandboxHeight();
    const mountingBox = sandboxIframe.getBoundingClientRect();
    sandboxIframe.contentWindow!.postMessage({
        command: 'resize',
        mountingBox,
    }, '*');
}//resizeKresmer

window.addEventListener('resize', resizeKresmer);

function setSandboxHeight() 
{
    // if (sandboxIframe.contentDocument) {
        // const iframeHeight = sandboxIframe.contentDocument.body.scrollHeight;
    //     sandboxIframe.style.height = `${iframeHeight}px`;
    // }
    const clientRect = document.body.getBoundingClientRect();
    sandboxIframe.style.width = `${clientRect.width}px`;
    sandboxIframe.style.height = `${clientRect.height}px`;
}//setSandboxHeight

function scaleSandbox(zoom: number) 
{
    const iframeHeight = sandboxIframe.contentDocument!.body.scrollHeight;
    const iframeWidth = sandboxIframe.contentDocument!.body.scrollWidth;
    sandboxIframe.style.width = `${iframeWidth * zoom}px`;
    sandboxIframe.style.height = `${iframeHeight * zoom}px`;
}//scaleSandbox

// if (sandboxIframe.contentDocument?.readyState === 'complete') {
//     setSandboxHeight();
// } else {
//     // Wait for the iframe to load before sending the drawing data
//     sandboxIframe.addEventListener('load', () => {
//         setSandboxHeight();
//     });
// }//if

// window.addEventListener('resize', setSandboxHeight);
