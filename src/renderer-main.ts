/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { IpcRendererEvent } from 'electron';
import { createApp, reactive } from 'vue';
import initApp from './init';
import Kresmer from './Kresmer';
import ParsingException from './parsers/ParsingException';
import StatusBar from './StatusBar.vue';

export const kresmer = new Kresmer('#kresmer');

const statusBarData = reactive({
    drawingScale: 1,
})//statusBarData

export const vueStatusBar = createApp(StatusBar, {
    displayData: statusBarData,
}).mount("#statusBar");

kresmer.setEventHandler("scale-changed", (newScale) => statusBarData.drawingScale = newScale);

window.electronAPI.onLoadLibrary((_event: IpcRendererEvent, libData: string) => 
{ 
    try {
        if (!kresmer.loadLibrary(libData))
            alert("There were errors during library load (see the log)");
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
    window.electronAPI.signalReadiness(1);
});

window.electronAPI.onLoadDrawing((_event: IpcRendererEvent, drawingData: string) => 
{ 
    try {
        if (!kresmer.loadDrawing(drawingData))
            alert("There were errors during drawing load (see the log)");
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
    window.electronAPI.signalReadiness(2);
    initApp();
});

window.electronAPI.signalReadiness(0);

