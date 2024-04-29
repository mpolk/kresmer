import Kresmer from "../../src/Kresmer";

describe('DrawingArea.cy.ts', () => {
  it('playground', () => {
    const kresmer = new Kresmer("[data-cy-root]", {});
    cy.mount(kresmer).then((componentInstance) => {
      cy.exec("ls -1 ../../lib/*.krel").then(({stdout: libFilePaths}) => {
        console.debug(kresmer.drawingName);
        console.debug(libFilePaths);

        libFilePaths.split("\n").forEach((libFilePath) => {
          const libFileName = libFilePath.split('/').slice(-1)[0];
          console.debug(libFileName);
          const libName = libFileName.split('.')[0];
          console.debug(libName);
        })
      })
    });
  })
})