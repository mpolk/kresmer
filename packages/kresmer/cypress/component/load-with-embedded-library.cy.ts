/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *             Testing embedded library saving accuracy
 ***************************************************************************/

import Kresmer from "../../src/Kresmer";
import { assertNoExceptions } from "../support/component";

describe('Loading a drawing without system libraries', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount({loadLibraries: false}).then((_kresmer) => {
            kresmer = _kresmer;
        });
    });
    afterEach(assertNoExceptions);


    let drawingData: string;
    it('Load "Example" drawing', () => {
        cy.fixture("example-with-embedded-lib.kre").then((dwgData) => {
            drawingData = dwgData;
            kresmer.loadDrawing(dwgData);
        })
    })

    specify('The "core-switch" presents om the drawing', () => {
        cy.get("svg[name='core-switch']").should("exist");
    })
});