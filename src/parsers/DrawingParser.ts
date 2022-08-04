/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                          Drawing file parser
\**************************************************************************/

import NetworkComponent from "../NetworkComponent";
import NetworkComponentLocation from "../NetworkComponentLocation";
import ParsingException from "./ParsingException";

export default class DrawingParser {

    public *parseXML(rawData: string)
    {
        console.debug('Parsing drawing XML...');
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(rawData, "text/xml") as XMLDocument;
        const root = dom.firstChild;

        if (root?.nodeName !== "kresmer-drawing")
            throw `Invalid drawing root element: ${root?.nodeName}`;

        for (let i = 0; i < root.childNodes.length; i++) {
            const node = root.childNodes[i];
            switch (node.nodeName) {
                case "component":
                    yield this.parseComponentNode(node);
                    break;
                case "#text":
                    break;
                default:
                    throw `Invalid top-level node in drawing: "${node.nodeName}"`;
            }//switch
        }//for
    }//parseXML


    private parseComponentNode(node: Node)
    {
        const className = node.getAttribute("class");
        if (!className) 
            throw "Component class without class";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let props: Record<string, any> = {};
        let content: string | undefined;
        const origin: {x?: number, y?: number} = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === node.ELEMENT_NODE) {
                switch (child.nodeName) {
                    case "props":
                        props = this.parseProps(child);
                        break;
                    case "content":
                        content = child.innerHTML.trim();
                        break;
                    case "origin":
                        origin.x = parseInt(child.getAttribute('x'));
                        origin.y = parseInt(child.getAttribute('y'));
                        break;
                }//switch
            }//if
        }//for

        if (typeof origin.x !== "number" || typeof origin.y !== "number")
            throw `Invalid component origin: ${origin}`;

        const component = new NetworkComponent(className, {props, content});
        return new NetworkComponentLocation(component, 
            {origin: {x: origin.x, y: origin.y}});
    }//parseComponentNode


    private parseProps(node: Node)
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const props: Record<string, any> = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === node.ELEMENT_NODE) {
                switch (child.nodeName) {
                    case "prop": {
                        const propName = child.getAttribute("name");
                        const value = child.innerHTML.trim();
                        props[propName] = value;
                        break;
                    }
                }//switch
            }//if
        }//for

        return props;
    }//parseProps

}//DrawingParser



export class DrawingParsingException extends ParsingException {
    constructor(message: string, source?: string)
    {
        super("Drawing loading: " + message, source);
    }//ctor
}//DrawingParsingException
