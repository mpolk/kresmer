/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer from "../../src/Kresmer";
import DrawingArea from "../../src/DrawingArea/DrawingArea";
// import DrawingAreaClass from "../../src/DrawingArea/DrawingAreaClass";
import chaiColors from 'chai-colors';
chai.use(chaiColors);

describe('DrawingArea object test', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    })//before

    // let swampClass: DrawingAreaClass;
    // it("creates a Swamp area class", () => {
    //     swampClass = new DrawingAreaClass("Swamp");
    //     kresmer.registerAreaClass(swampClass);
    //     expect(kresmer.errorCount).to.be.eq(0);
    // })//it

    specify("First we should make sure that there are not any triangular Swamp areas in our world.", () => {
        expect(kresmer.getAreaByName("Triangular Swamp")).to.be.undefined;
    })

    let triangularSwamp: DrawingArea;
    it("Then we create a triangular Swamp area", () => {
        triangularSwamp = new DrawingArea(kresmer, "Swamp", {
            name: "Triangular Swamp",
            vertices: [
                {pos: {x: 100, y: 100}},
                {pos: {x: 900, y: 100}},
                {pos: {x: 500, y: 900}},
            ]
        });
        
        kresmer.addArea(triangularSwamp);
    })//it

    specify("...and now we have one triangular swamp", () => {
        expect(kresmer.getAreaByName("Triangular Swamp")).to.be.not.undefined;
    })
    specify("...and it's light-blue with a blue border", () => {
        cy.get("path.Swamp.area").should("have.css", "fill").and("be.colored", "lightblue");
        cy.get("path.Swamp.area").should("have.css", "stroke").and("be.colored", "blue");
    })
    specify("...and naturally a triangular swamp has exactly 3 vertices", () => {
        cy.get(".vertex").should("have.length", 3);
    })
    specify("...but they are invisible yet", () => {
        cy.get(".vertex").should("not.be.visible");
    })

})//describe