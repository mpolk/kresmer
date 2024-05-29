/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer, { Position } from "../../src/Kresmer";
import { kresmerCoordsToGlobal, assertNoExceptions } from "../support/component";
import DrawingArea from "../../src/DrawingArea/DrawingArea";
// import DrawingAreaClass from "../../src/DrawingArea/DrawingAreaClass";
import chaiColors from 'chai-colors';
import { AreaVertexInitParams } from "DrawingArea/AreaVertex";
chai.use(chaiColors);

describe('DrawingArea object test', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
            kresmer.showGrid = true;
            kresmer.showRulers = true;
        });
    })//before
    afterEach(assertNoExceptions);

    // let swampClass: DrawingAreaClass;
    // it("creates a Swamp area class", () => {
    //     swampClass = new DrawingAreaClass("Swamp");
    //     kresmer.registerAreaClass(swampClass);
    //     expect(kresmer.errorCount).to.be.eq(0);
    // })//it

    specify("First we should make sure that there are not any triangular Swamp areas in our world.", () => {
        expect(kresmer.getAreaByName("Triangular Swamp")).to.be.undefined;
    })

    const vertexData = [
      {pos: {x: 100, y: 100}},
      {pos: {x: 900, y: 100}},
      {pos: {x: 500, y: 900}, geometry: {type: "S" as const, cp2: {x: 550, y:980}}},
    ];
    it("Then we create a triangular Swamp area", () => {
        const triangularSwamp = new DrawingArea(kresmer, "Swamp", {
            name: "Triangular Swamp",
            vertices: vertexData,
        });
        
        kresmer.addArea(triangularSwamp);
    })//it

    let swamp: DrawingArea;
    specify("...and now we have one triangular swamp", () => {
        swamp = kresmer.getAreaByName("Triangular Swamp")!;
        expect(swamp).to.be.not.undefined;
    })
    specify("...and it's painted with a Swamp pattern", () => {
        cy.get("path.Swamp.area").should("have.css", "fill").then(fill => {expect(fill).match(/kre:std:Swamp/);});
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
    const secondVertexNewCoords = {x: vertexData[1].pos.x + deltaX, y: vertexData[1].pos.y + deltaY}
    it(`Now we drag the right corner from ${JSON.stringify(vertexData[1])} by (${deltaX},${deltaY})`, () => {
        kresmer.autoAlignVertices = false;
        cy.get(".vertex.area").eq(1).drag(deltaX, deltaY);
    })

    specify(`...and now its position is somewhere near to ${JSON.stringify(secondVertexNewCoords)}`, () => {
        cy.get(".vertex.area").eq(1).as("v").should("have.attr", "cx").then(cx => {
            expect(Number(cx)).to.be.approximately(secondVertexNewCoords.x, 10);
        });
        cy.get("@v").should("have.attr", "cy").then(cy => {
            expect(Number(cy)).to.be.approximately(secondVertexNewCoords.y, 10);
        });
    })

    it("Add one more vertex", () => {
        swamp.addVertex(1, {x: 800, y: 800});
    })
    specify("...and now the triangular swamp is actually quadrangular and has 4 vertices", () => {
        cy.get(".area.vertex").should("have.length", 4);
    })

    specify("...and even pentagular after adding yet one more vertex", () => {
        swamp.addVertex(3, {x: 150, y: 400});
        cy.get(".area.vertex").should("have.length", 5);
    })

    const p1 = {x: 500, y: 120};
    function isInTheSwamp(p: Position)
    {
        const {x, y} = kresmerCoordsToGlobal(p);
        return document.elementsFromPoint(x, y).some(el => {
                return el.nodeName === 'path' && el.classList.contains('area');
        })
    }//isInTheSwamp

    specify(`The point ${JSON.stringify(p1)} lies outside the swamp`, () => {
        expect(isInTheSwamp(p1)).to.be.false;
    })//specify
    it("Give the second vertex a Q-type", () => {
        swamp.vertices[1].geometry = {type: "Q", cp: {x: 500, y: 50}};
    })
    specify(`...and now the same point already lies inside the swamp`, () => {
        expect(isInTheSwamp(p1)).to.be.true;
    })//specify

    const p2 = {x: 820, y: 300};
    const p3 = {x: 810, y: 750};

    specify(`The point ${JSON.stringify(p2)} is in the swamp and ${JSON.stringify(p3)} is on the dry land`, () => {
        expect(isInTheSwamp(p2)).to.be.true;
        expect(isInTheSwamp(p3)).to.be.false;
    })//specify
    it("Give the third vertex a C-type", () => {
        swamp.vertices[2].geometry = {type: "C", cp1: {x: 700, y: 300}, cp2: {x: 950, y:750}};
    })
    specify(`...now point ${JSON.stringify(p2)} is outside the swamp and ${JSON.stringify(p3)} is in`, () => {
        expect(isInTheSwamp(p2)).to.be.false;
        expect(isInTheSwamp(p3)).to.be.true;
    })//specify

    // it("Give the fourth vertex a S-type", () => {
    //     swamp.vertices[3].geometry = {type: "S", cp2: {x: 550, y:980}};
    // })

    it("Give the 5th vertex a T-type", () => {
        swamp.vertices[4].geometry = {type: "T"};
    })

    it("Put a coastline between the 2nd and 4th vertices", () => {
        kresmer.deselectAllElements();
        swamp.setBorder({clazz: "coast", from: 1, to: 3});
    })
    specify("...now we have a blue coastline", () => {
        cy.get(".Swamp.area path.coast").should("have.css", "stroke").and("be.colored", "blue");
    })

})//describe