/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing drawing merge and renaming on loading
 ***************************************************************************/

import Kresmer from "Kresmer";

describe('Kresmer Art', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    });

    it('Load an additional "Kresmer Art" library', () => {
        cy.fixture("kresmer-art.krel").then(libData => {
            kresmer.loadLibrary(libData);
        })
    })

    let drawingData: string;
    it('Load a "Kresmer Art" drawing', () => {
        cy.fixture("drawing-merge.kre").then(dwgData => {
            drawingData = dwgData;
            kresmer.loadDrawing(dwgData);
        });
    });

    specify("...and now there is exactly one Silver Kresmer", () => {
        cy.get("svg.SilverKresmer").should("have.length", 1);
    })

    specify("...and exactly one Patriotic Kresmer", () => {
        cy.get("svg.PatrioticKresmer").should("have.length", 1);
    })


    it("Then load the same drawing again with merging duplicate elements", async () => {
        kresmer.loadDrawing(drawingData, "merge-duplicates");
    })

    specify("...and there is still one Patriotic Kresmer", () => {
        cy.get("svg.PatrioticKresmer").should("have.length", 1);
    })

    specify("...but two Silver Kresmers", () => {
        cy.get("svg.SilverKresmer").should("have.length", 2);
    })

    it("Then load the same drawing again with renaming duplicate elements", async () => {
        // debugger;
        kresmer.loadDrawing(drawingData, "rename-duplicates");
    })

    specify("...and now we have two Patriotic Kresmers", () => {
        cy.get("svg.PatrioticKresmer").should("have.length", 2);
    })

    specify("...and three Silver Kresmers", () => {
        cy.get("svg.SilverKresmer").should("have.length", 3);
    })
});