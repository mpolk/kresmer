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

const sandboxIframe = document.getElementById('sandbox') as HTMLIFrameElement;
window.addEventListener('message', (event) => {
    if (event.data.status === 'kresmer-mounted') {
        console.debug('KresMer in sandbox is mounted. Sending drawing data...');
        sendDrawingDataToSandbox();
        // setSandboxHeight();
    }//if
});//window.addEventListener

function sendDrawingDataToSandbox() {
    sandboxIframe.contentWindow!.postMessage({
        command: 'load-drawing',
        drawingData,
    }, '*');
}//sendDrawingDataToSandbox

// function setSandboxHeight() {
//     if (sandboxIframe.contentDocument) {
//         const iframeHeight = sandboxIframe.contentDocument.body.scrollHeight;
//         sandboxIframe.style.height = `${iframeHeight}px`;
//     }
// }//setSandboxHeight

// if (sandboxIframe.contentDocument?.readyState === 'complete') {
//     sendDrawingDataToSandbox();
//     // setSandboxHeight();
// } else {
//     // Wait for the iframe to load before sending the drawing data
//     sandboxIframe.addEventListener('load', () => {
//         sendDrawingDataToSandbox();
//         // setSandboxHeight();
//     });
// }//if

// window.addEventListener('resize', setSandboxHeight);
