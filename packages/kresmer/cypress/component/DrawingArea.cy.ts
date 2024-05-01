/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer from "../../src/Kresmer";
import DrawingArea from "../../src/DrawingArea/DrawingArea";
import DrawingAreaClass from "../../src/DrawingArea/DrawingAreaClass";

describe('DrawingArea object test', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    })//before

    let swampClass: DrawingAreaClass;
    it("creates a Swamp area class", () => {
        swampClass = new DrawingAreaClass("Swamp");
        debugger;
        expect(kresmer.errorCount).to.be.eq(0);
    })//it

    let triangularSwamp: DrawingArea;
    it("creates a triangular Swamp area", () => {
        triangularSwamp = new DrawingArea(kresmer, swampClass, {
            name: "Triangular Swamp",
            vertices: [
                {pos: {x: 100, y: 100}},
                {pos: {x: 900, y: 100}},
                {pos: {x: 500, y: 900}},
            ]
        });
        
        expect(kresmer.getAreaByName("Triangular Swamp")).to.be.undefined;
        kresmer.addArea(triangularSwamp);
        expect(kresmer.getAreaByName("Triangular Swamp")).to.be.not.undefined;
    })//it
})//describe