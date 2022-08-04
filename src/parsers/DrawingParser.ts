/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                          Drawing file parser
\**************************************************************************/

import Kresmer from "../Kresmer";
import NetworkComponent from "../NetworkComponent";
import NetworkComponentClass from "../NetworkComponentClass";
import NetworkComponentLocation from "../NetworkComponentLocation";
import ParsingException from "./ParsingException";
import { KresmerExceptionSeverity } from "../KresmerException";

/**
 * Drawing file parser
 */
export default class DrawingParser {

    /**
     * Parses a drawing file contents and yields the sequence 
     * of the parsed drawing elements
     * @param rawData XML-data to parse
     */
    public *parseXML(rawData: string): Generator<NetworkComponentLocation|ParsingException>
    {
        console.debug('Parsing drawing XML...');
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(rawData, "text/xml") as XMLDocument;
        const root = dom.firstElementChild;

        if (root?.nodeName !== "kresmer-drawing")
            throw new DrawingParsingException(
                `Invalid drawing root element: ${root?.nodeName}`);

        for (let i = 0; i < root.children.length; i++) {
            const node = root.children[i];
            switch (node.nodeName) {
                case "component":
                    try {
                        yield this.parseComponentNode(node);
                    } catch (exc) {
                        if (exc instanceof ParsingException)
                            yield exc;
                        else
                            throw exc;
                    }//catch
                    break;
                default:
                    yield new DrawingParsingException(
                        `Invalid top-level node in drawing: "${node.nodeName}"`);
            }//switch
        }//for
    }//parseXML


    private parseComponentNode(node: Element)
    {
        const className = node.getAttribute("class");
        if (!className) 
            throw new DrawingParsingException("Component class without class");
        const componentClass = Kresmer.getNetworkComponentClass(className);
        if (!componentClass) 
            throw new DrawingParsingException(`Unknown component class "${componentClass}"`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let props: Record<string, any> = {};
        let content: string | undefined;
        const origin: {x?: number, y?: number} = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child instanceof Element) {
                switch (child.nodeName) {
                    case "props":
                        props = this.parseProps(child, componentClass);
                        break;
                    case "content":
                        content = child.innerHTML.trim();
                        break;
                    case "origin": {
                        const x = child.getAttribute('x');
                        if (x === null)
                            throw new DrawingParsingException("No origin-x specified",
                            {source: `Component class=${className}`});
                        const y = child.getAttribute('y');
                        if (y === null)
                            throw new DrawingParsingException("No origin-y specified",
                            {source: `Component class=${className}`});
                        origin.x = parseInt(x);
                        origin.y = parseInt(y);
                        break;
                    }
                }//switch
            }//if
        }//for

        if (typeof origin.x !== "number" || typeof origin.y !== "number")
            throw new DrawingParsingException(`Invalid component origin: ${origin}`,
            {source: `Component class=${className}`});

        const component = new NetworkComponent(className, {props, content});
        return new NetworkComponentLocation(component, 
            {origin: {x: origin.x, y: origin.y}});
    }//parseComponentNode


    private parseProps(node: Element, componentClass: NetworkComponentClass)
    {
        const classProps = componentClass.getProps();
        if (!classProps)
            throw new DrawingParsingException(
                `Class ${componentClass} has no props, but the component supplies some`);
                
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const props: Record<string, string|number|object|any[]> = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child instanceof Element) {
                switch (child.nodeName) {
                    case "prop": {
                        const propName = child.getAttribute("name");
                        if (!propName)
                            throw new DrawingParsingException("Prop without a name",
                            {source: `Component ${node.parentElement?.getAttribute("name")}`});
                        const value = child.innerHTML.trim();
                        const classProp = classProps[propName];
                        if (!classProp)
                            throw new DrawingParsingException(
                                `Class "${componentClass.getName()}" has no prop "${propName}", but the component supplies some`,
                                {source: `Component ${node.parentElement?.getAttribute("name")}`});
            
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        switch ((classProp as any).type) {
                            case String:
                                props[propName] = value;
                                break;
                            case Number:
                                props[propName] = parseFloat(value);
                                break;
                            case Object: case Array:
                                props[propName] = JSON.parse(value);
                                break;
                            }//switch
                        break;
                    }
                }//switch
            }//if
        }//for

        return props;
    }//parseProps

}//DrawingParser


export class DrawingParsingException extends ParsingException {
    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        super("Drawing loading: " + message, options);
    }//ctor
}//DrawingParsingException