/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer from "../../src/Kresmer";

describe('DrawingArea.cy.ts', () => {
    it('playground', () => {
        const kresmer = new Kresmer("[data-cy-root]", {});
        cy.mount(kresmer).then((kresmer) => {
            console.debug(kresmer.drawingName);
        });
    });
});