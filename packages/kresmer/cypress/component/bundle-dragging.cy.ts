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

    it('Load a test drawing and turn the bundle dragging animation on', () => {
        cy.fixture("bundle.kre").then((dwgData) => {
            kresmer.loadDrawing(dwgData);
            kresmer.autoAlignVertices = false;
            kresmer.showGrid = true;
            kresmer.showRulers = true;
            kresmer.animateLinkBundleDragging = true;
        })
    })

    it("Select the bundle", () => {
        cy.get(".link-bundle line.padding").click();
    })

    const [deltaX, deltaY] = [0, 50];
    it("Start to drag the end of the link bundle a little lower", function() {
        cy.get(".link-bundle .link.vertex").eq(1).startDrag(deltaX, deltaY);
    })

    specify("...and both the second and the third twisted-pair vertices still lie on the bundle", () => {
        cy.get(".link-bundle .link.vertex").then(bundleVertices => {
            cy.get(".link circle.vertex-connection-point").then(linkVertices => {
                [0, 1].forEach(i => {checkVertexOnBundlePosition(linkVertices.eq(i), bundleVertices, true);});
            })
        })
    })

    it("...complete the dragging", function() {
        cy.get(".link-bundle .link.vertex").eq(1).endDrag();
    })

    specify("...and both the second and the third twisted-pair vertices still lie on the bundle", () => {
        cy.get(".link-bundle .link.vertex").then(bundleVertices => {
            cy.get(".link circle.vertex-connection-point").then(linkVertices => {
                [0, 1].forEach(i => {checkVertexOnBundlePosition(linkVertices.eq(i), bundleVertices, true);});
            })
        })
    })

    it('Turn the bundle dragging animation off', () => {
        kresmer.animateLinkBundleDragging = false;
    })

    it("Start to drag the start of the link bundle a little lower", function() {
        cy.get(".link-bundle .link.vertex").eq(0).startDrag(deltaX, deltaY);
    })

    specify("...and now the second and the third twisted-pair vertices don't lie on the bundle yet", () => {
        cy.get(".link-bundle .link.vertex").then(bundleVertices => {
            cy.get(".link circle.vertex-connection-point").then(linkVertices => {
                [0, 1].forEach(i => {checkVertexOnBundlePosition(linkVertices.eq(i), bundleVertices, false);});
            })
        })
    })

    it("...complete the dragging", function() {
        cy.get(".link-bundle .link.vertex").eq(0).endDrag();
    })

    specify("...and now they do lie", () => {
        cy.get(".link-bundle .link.vertex").then(bundleVertices => {
            cy.get(".link circle.vertex-connection-point").then(linkVertices => {
                [0, 1].forEach(i => {checkVertexOnBundlePosition(linkVertices.eq(i), bundleVertices, true);});
            })
        })
    })
})//describe


function checkVertexOnBundlePosition(vertex: JQuery<HTMLElement>, bundleVertices: JQuery<HTMLElement>, shouldBelong: boolean)
{
    let bsX: number, bsY: number, beX: number, beY: number;
    let vx: number, vy: number;

    cy.wrap(bundleVertices).eq(0).should("have.attr", "cx").then(cx => {bsX = Number(cx);});
    cy.wrap(bundleVertices).eq(0).should("have.attr", "cy").then(cy => {bsY = Number(cy);});
    cy.wrap(bundleVertices).eq(1).should("have.attr", "cx").then(cx => {beX = Number(cx);});
    cy.wrap(bundleVertices).eq(1).should("have.attr", "cy").then(cy => {beY = Number(cy);});

    cy.wrap(vertex).should("have.attr", "cx").then(cx => {vx = Number(cx);});
    cy.wrap(vertex).should("have.attr", "cy").then(cy => {vy = Number(cy);});

    cy.then(() => {
        const expectedY = bsY + (beY - bsY)/(beX - bsX)*(vx - bsX);
        if (shouldBelong)
            expect(vy).to.be.closeTo(expectedY, 1);
        else
            expect(vy).to.be.not.closeTo(expectedY, 1);
    });
}//checkVertexOnBundlePosition
