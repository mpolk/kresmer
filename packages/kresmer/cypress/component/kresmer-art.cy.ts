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

    it('contains a root SVG', () => {
        cy.get("svg.kresmer").should("exist");
    });

    it('loads a "Kresmer Art" drawing', () => {
        cy.readFile("../../kresmer-art.kre").then(drawingData => {
            kresmer.loadDrawing(drawingData);
        })
    });

    it('shows a grid', function() {
        kresmer.showGrid = true;
        cy.get("line.grid").should("exist");
    });

    it('shows rulers', function() {
        kresmer.showRulers = true;
        cy.get("rect.axis").should("exist");
        cy.get("line.marking").should("exist");
    });
});