/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Testing DrawingArea creation and basic functionality
 ***************************************************************************/

import Kresmer, { Position } from "../../src/Kresmer";
import DrawingArea from "../../src/DrawingArea/DrawingArea";
// import DrawingAreaClass from "../../src/DrawingArea/DrawingAreaClass";
import chaiColors from 'chai-colors';
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

    // let swampClass: DrawingAreaClass;
    // it("creates a Swamp area class", () => {
    //     swampClass = new DrawingAreaClass("Swamp");
    //     kresmer.registerAreaClass(swampClass);
    //     expect(kresmer.errorCount).to.be.eq(0);
    // })//it

    specify("First we should make sure that there are not any triangular Swamp areas in our world.", () => {
        expect(kresmer.getAreaByName("Triangular Swamp")).to.be.undefined;
    })

    const vertexCoords = [
      {x: 100, y: 100},
      {x: 900, y: 100},
      {x: 500, y: 900},
    ];
    it("Then we create a triangular Swamp area", () => {
        const triangularSwamp = new DrawingArea(kresmer, "Swamp", {
            name: "Triangular Swamp",
            vertices: vertexCoords.map(pos => {return {pos}}),
        });
        
        kresmer.addArea(triangularSwamp);
    })//it

    let swamp: DrawingArea;
    specify("...and now we have one triangular swamp", () => {
        swamp = kresmer.getAreaByName("Triangular Swamp")!;
        expect(swamp).to.be.not.undefined;
    })
    specify("...and it's painted with a Swamp pattern and has a blue border", () => {
        cy.get("path.Swamp.area").should("have.css", "fill").then(fill => {expect(fill).match(/kre:std:Swamp/);});
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
    const secondVertexNewCoords = {x: vertexCoords[1].x + deltaX, y: vertexCoords[1].y + deltaY}
    it(`Now we drag the right corner from ${JSON.stringify(vertexCoords[1])} by (${deltaX},${deltaY})`, () => {
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

    const p = {x: 500, y: 120};
    function isInTheSwamp(p: Position)
    {
        return cy.get("svg.kresmer").then(rootSvg => {
            const CTM = (rootSvg[0] as unknown as SVGSVGElement).getScreenCTM()!;
            const x = p.x * CTM.a + CTM.e;
            const y = p.y * CTM.d + CTM.f;
            return document.elementsFromPoint(x, y).some(el => {
                    return el.nodeName === 'path' && el.classList.contains('area');
            })
        })//then
    }//isInTheSwamp

    specify(`The point ${JSON.stringify(p)} lies outside the swamp`, () => {
        isInTheSwamp(p).should("be.false");
    })//specify
    it("Give the second vertex a Q-type", () => {
        swamp.vertices[1].geometry = {type: "Q", cp: {x: 500, y: 50}};
    })
    specify(`...and now the same point already lies inside the swamp`, () => {
        isInTheSwamp(p).should("be.true");
    })//specify

})//describe