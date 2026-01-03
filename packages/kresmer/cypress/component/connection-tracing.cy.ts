/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                      Testing connection tracing
 ***************************************************************************/

import Kresmer from "Kresmer";
import { assertNoExceptions } from "../support/component";

describe('Connection tracing', () => {
    let kresmer: Kresmer;
    before(() => {
        cy.mount().then((_kresmer) => {
            kresmer = _kresmer;
        });
    });
    afterEach(assertNoExceptions);

    it('Load a test drawing', () => {
        cy.fixture("connection-tracing.kre").then((dwgData) => {
            kresmer.loadDrawing(dwgData);
        })
    });

    it("Select the first patch-cord", () => {
        cy.get(".sm-patch-cord[name=patch-1] line.padding").click();
    });

    it('All three multi-fiber cables are now selected', () => {
        cy.get(".multifiber-cable[name=cable-1]").should("have.class", "highlighted");
        cy.get(".multifiber-cable[name=cable-2]").should("have.class", "highlighted");
        cy.get(".multifiber-cable[name=cable-3]").should("have.class", "highlighted");
    });

    it('The 1st and the 10th patch-cord are now selected', () => {
        cy.get(".sm-patch-cord[name=patch-1]").should("have.class", "highlighted");
        cy.get(".sm-patch-cord[name=patch-10]").should("have.class", "highlighted");
    });

    it('Exactly one patch-panel label (the 1st one) is now selected', () => {
        cy.get(".PatchPanel[name=PatchPanel-1] .ConnectionIndicator[data-connection-id=1]").should("have.class", "highlighted");
        for (let i = 2; i <= 10; i++) {
            cy.get(`.PatchPanel[name=PatchPanel-1] .ConnectionIndicator[data-connection-id=${i}]`).should("not.have.class", "highlighted");
        }//for
    });

    it("Deselect all", () => {
        cy.get("svg.kresmer").click();
    });

    it('No links are now selected', () => {
        cy.get(".multifiber-cable[name=cable-1]").should("not.have.class", "highlighted");
        cy.get(".multifiber-cable[name=cable-2]").should("not.have.class", "highlighted");
        cy.get(".multifiber-cable[name=cable-3]").should("not.have.class", "highlighted");
        cy.get(".sm-patch-cord[name=patch-1]").should("not.have.class", "highlighted");
        cy.get(".sm-patch-cord[name=patch-10]").should("not.have.class", "highlighted");
        cy.get(".PatchPanel[name=PatchPanel-1] .ConnectionIndicator[data-connection-id=1]").should("not.have.class", "highlighted");
    });
})//describe
