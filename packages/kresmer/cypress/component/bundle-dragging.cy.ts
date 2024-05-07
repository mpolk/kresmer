/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                   Testing link bundle dragging
 ***************************************************************************/

import Kresmer from "Kresmer";

describe('Kresmer Art', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    });

    it('Load a test drawing', () => {
        cy.fixture("bundle.kre").then((dwgData) => {
            kresmer.loadDrawing(dwgData);
            kresmer.autoAlignVertices = false;
            kresmer.showGrid = true;
            kresmer.showRulers = true;
            kresmer.animateLinkBundleDragging = false;
        })
    })

    const [deltaX, deltaY] = [0, 50];
    let bsX: number, bsY: number;
    let beX: number, beY: number;
    let v1x: number, v1y: number;
    let v2x: number, v2y: number;
    it("Drag the end of the link bundle a little lower", function() {
        cy.get(".link-bundle line.padding").click();
        cy.get(".link-bundle .link.vertex").eq(1).as("bundleEnd")
            .trigger("mousedown", {buttons: 1, clientX: 0, clientY: 0})
            .trigger("mousemove", {buttons: 1, clientX: deltaX, clientY: deltaY})
            .trigger("mouseup", {buttons: 1, force: true})
            ;

        cy.get(".link-bundle .link.vertex").eq(0).as("bundleStart").should("have.attr", "cx").then(cx => {
            bsX = Number(cx);
        });
        cy.get("@bundleStart").should("have.attr", "cy").then(cy => {
            bsY = Number(cy);
        });
        cy.get("@bundleEnd").should("have.attr", "cx").then(cx => {
            beX = Number(cx);
        });
        cy.get("@bundleEnd").should("have.attr", "cy").then(cy => {
            beY = Number(cy);
        });

        cy.get(".link circle.vertex-connection-point").eq(0).as("v1").should("have.attr", "cx").then(cx => {
            v1x = Number(cx);
        });
        cy.get("@v1").should("have.attr", "cy").then(cy => {
            v1y = Number(cy);
        });
        cy.get(".link circle.vertex-connection-point").eq(1).as("v2").should("have.attr", "cx").then(cx => {
            v2x = Number(cx);
        });
        cy.get("@v2").should("have.attr", "cy").then(cy => {
            v2y = Number(cy);
        });
    })

    specify("...and both the second and the third twisted-pair vertices still lie on the bundle", () => {
        cy.then(()  => {
            debugger;
            expect(v1y).to.be.closeTo(bsY + (beY - bsY)/(beX - bsX)*(v1x - bsX), 1);
            expect(v2y).to.be.closeTo(bsY + (beY - bsY)/(beX - bsX)*(v2x - bsX), 1);
        })
    })
});