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
        cy.get("g.sm-patch-cord[name=patch-1] line.padding").click();
    });

    it('All three multi-fiber cables and the 10th patch-cord are now selected', () => {
        cy.get("g.multifiber-cable[name=cable-1]").should("have.class", "highlighted");
        cy.get("g.multifiber-cable[name=cable-2]").should("have.class", "highlighted");
        cy.get("g.multifiber-cable[name=cable-2]").should("have.class", "highlighted");
        cy.get("g.sm-patch-cord[name=patch-1]").should("have.class", "highlighted");
        cy.get("g.sm-patch-cord[name=patch-10]").should("have.class", "highlighted");
    });

    it("Deselect all", () => {
        cy.get("svg.kresmer").type('{escape}');
    });

    it('No links are now selected', () => {
        cy.get("g.multifiber-cable[name=cable-1]").should("not.have.class", "highlighted");
        cy.get("g.multifiber-cable[name=cable-2]").should("not.have.class", "highlighted");
        cy.get("g.multifiber-cable[name=cable-2]").should("not.have.class", "highlighted");
        cy.get("g.sm-patch-cord[name=patch-1]").should("not.have.class", "highlighted");
        cy.get("g.sm-patch-cord[name=patch-10]").should("not.have.class", "highlighted");
    });
})//describe
