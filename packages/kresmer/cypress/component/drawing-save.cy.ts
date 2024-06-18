/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                   Testing drawing saving accuracy
 ***************************************************************************/

import { diffAsXml } from "diff-js-xml";
import Kresmer from "Kresmer";
import { assertNoExceptions } from "../support/component";

describe('Kresmer Art', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    });
    afterEach(assertNoExceptions);

    it('Load an additional "Kresmer Art" library', () => {
        cy.fixture("kresmer-art.krel").then(libData => {
            kresmer.loadLibrary(libData);
        })
    })

    let drawingData: string;
    it('Load a "Kresmer Art" drawing', () => {
        cy.fixture("kresmer-art.kre").then((dwgData) => {
            drawingData = dwgData;
            kresmer.loadDrawing(dwgData);
        })
    })

    specify("Its immediately saved copy is identical to the source drawing", () => {
        kresmer.embedLibDataInDrawing = false;
        const savedDrawing = kresmer.saveDrawing();
        type Diff = {path: string, resultType: string, message: string};
        let diffs: Diff[] = [];
        diffAsXml(drawingData, savedDrawing, {}, 
                  {xml2jsOptions: {ignoreDoctype: false, ignoreDeclaration: false, ignoreAttributes: false}}, 
                  (result: Diff[]) => {
            diffs = result.filter(diff => {
                if (diff.path === "kresmer-drawing._attributes.width" && 
                    diff.resultType === "missing element" && 
                    kresmer.logicalWidth === 1000)
                    return false;
                if (diff.path === "kresmer-drawing._attributes.height" && 
                    diff.resultType === "missing element" && 
                    kresmer.logicalHeight === 1000)
                    return false;
                if (diff.path === "kresmer-drawing._attributes.background-color" && 
                    diff.resultType === "missing element" && 
                    parseInt(kresmer.backgroundColor.replace(/^#/, "0x"), 16) === 0xFFFFFF)
                    return false;
                if (diff.path.startsWith("kresmer-drawing._attributes.xmlns:") && 
                    diff.resultType === "missing element")
                    return false;
                if (diff.path === "kresmer-drawing.library" && 
                    diff.resultType === "missing element")
                    return false;
        
                const matches = diff.path.match(/kresmer-drawing\.component\[([0-9]+)\]\.transform\.scale\._attributes\.y/);
                if (matches) {
                    const n = Number(matches[1]);
                    const xScale = Array.from(kresmer.networkComponents)[n][1].transform.scale.x;
                    const yScale = Array.from(kresmer.networkComponents)[n][1].transform.scale.y;
                    if (xScale === yScale)
                        return false;
                }//if

                return true;
            });
        });
        expect(diffs.length).to.be.equal(0);
    })
});