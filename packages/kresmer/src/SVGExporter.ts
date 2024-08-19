/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *      A helper class for exporting the current drawing to SVG
 ***************************************************************************/

import Kresmer from "Kresmer";

export default class SVGExporter {
    constructor(private kresmer: Kresmer) {}

    public export(styles: string): string
    {
        const svg = this.kresmer.rootSVG.cloneNode(true) as SVGElement;
        const defsElement = document.createElement("defs");
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        defsElement.appendChild(styleElement);
        svg.insertBefore(defsElement, svg.firstChild);
        for (let i = 0; i < svg.childElementCount; i++) {
            this.removeXMLNSes(svg.children[i]);
        }//for
        return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE inline_dtd[<!ENTITY nbsp "&#160;">]>
${svg.outerHTML}
`//.replaceAll(/xmlns="[-a-zA-Z0-9_/:]+"/g, "");
}//export


    private removeXMLNSes(element: Element)
    {
        element.removeAttribute("xmlns");
        for (let i = 0; i < element.childElementCount; i++) {
            this.removeXMLNSes(element.children[i]);
        }//for
    }//removeXMLNSes

}//SVGExporter