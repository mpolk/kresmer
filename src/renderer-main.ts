/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { IpcRendererEvent } from 'electron';
import initApp from './init';
import Kresmer from './Kresmer';

export const kresmer = new Kresmer('#kresmer');

window.electronAPI.onLoadLibrary((_event: IpcRendererEvent, libData: string) => 
{ 
    kresmer.loadLibrary(libData);
});

console.debug("Main window renderer: I am ready")
window.electronAPI.signalReadiness();

initApp();
