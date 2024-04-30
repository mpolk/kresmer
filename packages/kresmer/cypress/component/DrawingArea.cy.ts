/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

describe('DrawingArea.cy.ts', () => {
    it('playground', () => {
        cy.mount().then((kresmer) => {
            console.debug(kresmer.drawingName);
        });
    });
});