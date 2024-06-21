/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *             Testing embedded library saving accuracy
 ***************************************************************************/

import { diffAsXml } from "diff-js-xml";
import Kresmer, { NetworkComponentClass } from "../../src/Kresmer";
import { $libs, assertNoExceptions } from "../support/component";
import { toCamelCase } from "../../src/Utils";

type Diff = {path: string, resultType: string, message: string};

describe('Drawing saving test', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount({loadLibraries: false}).then((_kresmer) => {
            kresmer = _kresmer;
        });
    });
    afterEach(assertNoExceptions);


    const origComponentClassSources = new Map<string, string>();
    it("Load libraries collecting all lib element sources", async() => {
        kresmer.on("library-element-loaded", (libName, element, sourceCode) => {
            if (element instanceof NetworkComponentClass) {
                origComponentClassSources.set(element.name, sourceCode);
            }
        });
        await kresmer.loadLibraries($libs);
        kresmer.off("library-element-loaded");
    });


    let drawingData: string;
    it('Load "Example" drawing', () => {
        cy.fixture("example.kre").then((dwgData) => {
            drawingData = dwgData;
            kresmer.loadDrawing(dwgData);
        })
    })


    specify("Its immediately saved copy is identical to the source drawing", () => {
        kresmer.embedLibDataInDrawing = false;
        const savedDrawing = kresmer.saveDrawing();
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


    specify("And the the saved embedded library content is equivalent to that of the source libraries", async() => {
        kresmer.embedLibDataInDrawing = true;
        const savedDrawing = kresmer.saveDrawing();
        assert(savedDrawing.match(/.*(<library>.+<\/library>).*/s));

        const embeddedComponentClassSources = new Map<string, string>();
        // kresmer.eraseContent();
        kresmer.on("library-element-loaded", (libName, element, sourceCode) => {
            console.debug(element);
            if (element instanceof NetworkComponentClass) {
                embeddedComponentClassSources.set(element.name, sourceCode);
            }
        });

        await kresmer.loadDrawing(savedDrawing, "erase-previous-content");

        for (const [name, embeddedSource] of embeddedComponentClassSources) {
            const originalSource = origComponentClassSources.get(name);
            assert(originalSource, `No original source found for the component "${name}"`);
            
            let diffs: Diff[] = [];
            diffAsXml(originalSource!, embeddedSource, {}, 
                    {xml2jsOptions: {ignoreDoctype: false, ignoreDeclaration: false, ignoreAttributes: false}}, 
                    (result: Diff[]) => {
                        diffs = result.filter(diff => {
                            if (diff.path.endsWith("\._attributes.version") && 
                                diff.resultType === "missing element")
                                return false;

                            let matches: RegExpMatchArray|null;
                            if (diff.resultType === "difference in element value" &&
                                diff.path.match(/-class\.props\.prop\[[\d+]\]\._attributes\.name$/) &&
                                (matches = diff.message.match(/value "([-_a-zA-Z0-9]+)".*value "([-_a-zA-Z0-9]+)"/)))
                            {
                                const origName = matches[1], embeddedName = matches[2];
                                if (toCamelCase(origName) === toCamelCase(embeddedName))
                                    return false;
                            }//if
            
                            return true;
                        });
            });
            expect(diffs.length).to.be.equal(0);
        }//for

    })
});