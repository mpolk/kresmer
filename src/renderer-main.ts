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

export const kresmer = new Kresmer('#kresmer');

window.electronAPI.onLoadLibrary((_event: IpcRendererEvent, libData: string) => 
{ 
    kresmer.loadLibrary(libData);
    window.electronAPI.signalReadiness(1);
});

window.electronAPI.onLoadDrawing((_event: IpcRendererEvent, drawingData: string) => 
{ 
    kresmer.loadDrawing(drawingData);
    window.electronAPI.signalReadiness(2);
    // initApp();
});

window.electronAPI.signalReadiness(0);

