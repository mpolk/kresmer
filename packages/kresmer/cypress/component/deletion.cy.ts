/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing drawing merge and renaming on loading
 ***************************************************************************/

import Kresmer from "Kresmer";
import { assertNoExceptions } from "../support/component";

describe('Deletion test', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    });
    afterEach(assertNoExceptions);

    let drawingData: string;
    it('Load a test drawing', () => {
        cy.fixture("deletion.kre").then(dwgData => {
            drawingData = dwgData;
            kresmer.loadDrawing(dwgData);
        });
    });

    it("Delete the first switch", () => {
        kresmer.deleteComponent(kresmer.getComponentByName("Switch1")!.controller!);
    });

    specify("...and there is not 'Switch1' no more", () => {
        expect(kresmer.getComponentByName("Switch1")).to.be.undefined;
    })

    it("Delete the second switch using the edAPI command", () => {
        kresmer.edAPI.deleteComponent(kresmer.getComponentByName("Switch2")!.id);
        expect(kresmer.getComponentByName("Switch1")).to.be.undefined;
    });

    specify("...and there is not 'Switch2' no more", () => {
        expect(kresmer.getComponentByName("Switch2")).to.be.undefined;
    })

    it("...then undelete it", () => {
        kresmer.undo();
    });

    specify("...and 'Switch2' is here again", () => {
        expect(kresmer.getComponentByName("Switch2")).to.not.be.undefined;
    })

});