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
    const vertexCoords = [
      {x: 100, y: 100},
      {x: 900, y: 100},
      {x: 500, y: 900},
    ];
    it("Then we create a triangular Swamp area", () => {
        triangularSwamp = new DrawingArea(kresmer, "Swamp", {
            name: "Triangular Swamp",
            vertices: vertexCoords.map(pos => {return {pos}}),
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

    it("But then we click on the swamp surface...", () => {
        cy.get("path.Swamp.area").click();
    })
    specify("...and the vertices become visible and they are still 3", () => {
        cy.get(".area.vertex").should("be.visible").and("have.length", 3);
    })

    const [deltaX, deltaY] = [-50, 100];
    const secondVertexNewCoords = { x: vertexCoords[1].x + deltaX, y: vertexCoords[1].y + deltaY}
    it("Now we drag the right corner a little", () => {
        kresmer.autoAlignVertices = false;
        cy.get(".vertex.area").eq(1)
            .trigger("mousedown", {buttons: 1, clientX: 0, clientY: 0})
            .trigger("mousemove", {buttons: 1, clientX: deltaX, clientY: deltaY})
            .trigger("mouseup", {buttons: 1})
            ;
    })

    specify(`...and now its position is close to ${JSON.stringify(secondVertexNewCoords)}`, () => {
        cy.get(".vertex.area").eq(1).as("v").should("have.attr", "cx").then(cx => {
            expect(Number(cx)).to.be.approximately(secondVertexNewCoords.x, 10);
        });
        cy.get("@v").should("have.attr", "cy").then(cy => {
            expect(Number(cy)).to.be.approximately(secondVertexNewCoords.y, 10);
        });
    })
})//describe