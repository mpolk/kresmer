/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { IpcRendererEvent } from 'electron';
// import initApp from './init';
import Kresmer from './Kresmer';
import ParsingException from './parsers/ParsingException';

export const kresmer = new Kresmer('#kresmer');

window.electronAPI.onLoadLibrary((_event: IpcRendererEvent, libData: string) => 
{ 
    try {
        kresmer.loadLibrary(libData);
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
        kresmer.loadDrawing(drawingData);
    } catch (exc) {
        if (exc instanceof ParsingException) {
            alert(exc.message);
            console.error(`${exc.message}\nSource: ${exc.source}`);
        } else {
            throw exc;
        }//if
    }//catch
    window.electronAPI.signalReadiness(2);
    // initApp();
});

window.electronAPI.signalReadiness(0);

