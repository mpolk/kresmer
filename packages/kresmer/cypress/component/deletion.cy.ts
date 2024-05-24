/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing drawing merge and renaming on loading
 ***************************************************************************/

import Kresmer from "Kresmer";
import { getLastException } from "../support/component";

describe('Deletion test', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    });
    afterEach(() => {
        const exc = getLastException();
        expect(exc, exc?.message).to.be.undefined;
    });

    let drawingData: string;
    it('Load a test drawing', () => {
        cy.fixture("deletion.kre").then(dwgData => {
            drawingData = dwgData;
            kresmer.loadDrawing(dwgData);
        });
    });

    it("Delete the first switch", () => {
        kresmer.deleteComponent(kresmer.getComponentByName("Switch1")!.controller!);
        expect(kresmer.getComponentByName("Switch1")).to.be.undefined;
    });

});