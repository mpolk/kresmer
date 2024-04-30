/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer from "Kresmer";

describe('Kresmer Art', () => {
    let kresmer: Kresmer;
    before('is mounted', () => {
        cy.mount().then((_kresmer) => {
            console.debug(_kresmer.drawingName);
            kresmer = _kresmer;
        });
    });

    it('shows a grid', function() {
        kresmer.showGrid = true;
    });

    it('shows rulers', function() {
        kresmer.showRulers = true;
    });
});