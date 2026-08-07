/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import Kresmer, { 
    Position, KresmerException, KresmerParsingException,
    NetworkComponentController, NetworkComponent,
    NetworkLink, DrawingElement, Vertex,
    TransformMode, ConnectionPointProxy,
    kresmerPlugin,
    DrawingArea, AreaVertex,
 } from 'kresmer';

export const kresmer = new Kresmer("#kresmer", {
    ...calcKresmerSize(),
    isEditable: true,
});

function calcKresmerSize()
{
    const mountingBox = document.body.getBoundingClientRect();
    return {
        mountingWidth: mountingBox.width,
        mountingHeight: mountingBox.height,
    }
}//calcKresmerSize

window.addEventListener("resize", () => {
    const {mountingWidth, mountingHeight} = calcKresmerSize();
    kresmer.mountingWidth = mountingWidth;
    kresmer.mountingHeight = mountingHeight;
});

export function updateWindowTitle()
{
    let title = "Kresmer";
    if (kresmer.drawingName) {
        title = `${kresmer.drawingName} - Kresmer`;
    }//if
    if (kresmer.isDirty) {
        title = `*${title}`;
    }//if
    window.document.title = title;
}//updateWindowTitle
