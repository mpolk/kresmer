import Kresmer from "../../src/Kresmer";

describe('DrawingArea.cy.ts', () => {
    it('playground', () => {
        const kresmer = new Kresmer("[data-cy-root]", {});
        cy.mount(kresmer).then((componentInstance) => {
            console.debug(kresmer.drawingName);

            cy.task("loadLibraries").then(libs => {
                console.debug(`libs = ${JSON.stringify(libs, undefined, "\n  ")}`);
                kresmer.loadLibraries(libs);
                return kresmer;
            });
        });
    });
});