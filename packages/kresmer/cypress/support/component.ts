// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands'
import * as CypressVue from 'cypress/vue'
import Kresmer, { Position } from "../../src/Kresmer";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
    namespace Cypress {
        interface Chainable {
            mount: (kresmer?: Kresmer) => Chainable<Kresmer>,
            drag: (deltaX: number, deltaY: number) => Chainable<JQuery<HTMLElement>>,
            startDrag: (deltaX: number, deltaY: number) => Chainable<JQuery<HTMLElement>>,
            endDrag: () => Chainable<JQuery<HTMLElement>>,
        }//Chainable
    }
}//global

// Expose exceptions throw from within Vue-applications to Cypress
// (without this Vue catches exceptions and hides them from Cypress)
export let $kresmer: Kresmer;
let lastException: any;

export function getLastException()
{
    const exc = lastException;
    lastException = undefined;
    return exc;
}//getLastException

export function assertNoExceptions()
{
    const exc = getLastException();
    assert(exc === undefined, exc?.message);
}//assertNoExceptions

// Mounting tested Kresmer component
Cypress.Commands.add('mount', (kresmer) => {
    $kresmer = kresmer ?? new Kresmer("[data-cy-root]", {});

    const onVueError = (error: any, vm: any, info: string) => {
        console.debug("Vue error catched!");
        lastException = error;
    };
    $kresmer.appKresmer.config.warnHandler = onVueError;
    $kresmer.appKresmer.config.errorHandler = onVueError;
    
    return CypressVue.mount($kresmer).task("loadLibraries").then(libs => {
        $kresmer.loadLibraries(libs);
        return $kresmer;
    });
});

// Dragging some HTML element
Cypress.Commands.add('drag', {prevSubject: true}, function(elem, deltaX, deltaY) {
    return cy.wrap(elem).startDrag(deltaX, deltaY).endDrag();
});
Cypress.Commands.add('startDrag', {prevSubject: true}, function(elem, deltaX, deltaY) {
    const wrappedElem = cy.wrap(elem);
    wrappedElem
        .trigger("mousedown", {buttons: 1, clientX: 0, clientY: 0})
        .trigger("mousemove", {buttons: 1, clientX: deltaX, clientY: deltaY})
        ;
    return wrappedElem;
});
Cypress.Commands.add('endDrag', {prevSubject: true}, function(elem) {
    const wrappedElem = cy.wrap(elem);
    wrappedElem
        .trigger("mouseup", {buttons: 1})
        ;
    return wrappedElem;
});

export function kresmerCoordsToGlobal(p: Position)
{
    const rootSvg = Cypress.$("svg.kresmer");
    const CTM = (rootSvg[0] as unknown as SVGSVGElement).getScreenCTM()!;
    return {
        x: p.x * CTM.a + CTM.e,
        y: p.y * CTM.d + CTM.f,
    }
}//kresmerCoordsToGlobal


