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

kresmer.on("mounted", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const fileUrl = urlParams.get('file');

  if (fileUrl) {
    try {
      const response = await fetch(fileUrl);
      kresmer.loadDrawing(await response.text());
    } catch (error) {
      console.error('Could not load the drawing:', error);
    }
  }
});