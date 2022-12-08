/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                          Drawing file parser
\**************************************************************************/

import Kresmer from "../Kresmer";
import NetworkElementClass from "../NetworkElementClass";
import NetworkComponent from "../NetworkComponent/NetworkComponent";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkComponentController from "../NetworkComponent/NetworkComponentController";
import Link from "../NetworkLink/NetworkLink";
import LinkClass from "../NetworkLink/LinkClass";
import { Transform } from "../Transform/Transform";
import ParsingException from "./ParsingException";
import { KresmerExceptionSeverity } from "../KresmerException";

/**
 * Drawing file parser
 */
export default class DrawingParser {

    readonly kresmer: Kresmer;
    
    constructor(kresmer: Kresmer)
    {
        this.kresmer = kresmer;
    }//ctor

    /**
     * Parses a drawing file contents and yields the sequence 
     * of the parsed drawing elements
     * @param rawData XML-data to parse
     */
    public *parseXML(rawData: string): Generator<ParsedNode>
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
                case "link":
                    try {
                        yield this.parseLinkNode(node);
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


    private parseComponentNode(node: Element): NetworkComponentController
    {
        const className = node.getAttribute("class");
        if (!className) 
            throw new DrawingParsingException("Component without the class");
        const componentClass = NetworkComponentClass.getClass(className);
        if (!componentClass) 
            throw new DrawingParsingException(`Unknown component class "${componentClass}"`);

        const propsFromAttributes: RawProps = {};
        for (const attrName of node.getAttributeNames()) {
            if (attrName !== "class") {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                propsFromAttributes[attrName] = node.getAttribute(attrName)!;
            }//if
        }//for

        let propsFromChildNodes: RawProps = {};
        let content: string | undefined;
        let transform = new Transform;
        const origin: {x?: number, y?: number} = {};
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "props":
                    propsFromChildNodes = this.parseProps(child);
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
                case "transform" : {
                    transform = this.parseTransform(child);
                    break;
                }
            }//switch
        }//for

        if (typeof origin.x !== "number" || typeof origin.y !== "number")
            throw new DrawingParsingException(`Invalid component origin: ${origin}`,
                {source: `Component class=${className}`});

        if (content === undefined) {
            content = "";
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child.nodeType === node.TEXT_NODE)
                    content += child.textContent;
            }//for
        }//if

        const props = this.normalizeProps({...propsFromAttributes, ...propsFromChildNodes}, node, componentClass);
        let componentName: string|undefined|null = node.getAttribute("name");
        if ("name" in props) {
            componentName = props["name"].toString();
        } else if (!componentName) {
            componentName = undefined;
        }//if
        const component = new NetworkComponent(this.kresmer, className, {name: componentName, props, content});
        return new NetworkComponentController(this.kresmer, component, 
            {origin: {x: origin.x, y: origin.y}, transform});
    }//parseComponentNode


    private parseLinkNode(node: Element): Link
    {
        const className = node.getAttribute("class");
        if (!className) 
            throw new DrawingParsingException("Link without the class");
        const linkClass = LinkClass.getClass(className);
        if (!linkClass) 
            throw new DrawingParsingException(`Unknown link class "${linkClass}"`);

        const propsFromAttributes: RawProps = {};
        for (const attrName of node.getAttributeNames()) {
            switch (attrName) {
                case "class": case "from": case "to":
                    break;
                default:
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    propsFromAttributes[attrName] = node.getAttribute(attrName)!;
            }//switch
        }//for

        let propsFromChildNodes: RawProps = {};
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "props":
                    propsFromChildNodes = this.parseProps(child);
                    break;
            }//switch
        }//for

        const props = this.normalizeProps({...propsFromAttributes, ...propsFromChildNodes}, node, linkClass);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const from = node.hasAttribute("from") ? node.getAttribute("from")! : undefined;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const to = node.hasAttribute("to") ? node.getAttribute("to")! : undefined;
        const link = new Link(this.kresmer, className, {props, from, to});
        return link;
    }//parseLinkNode


    private parseProps(node: Element): RawProps
    {
        const rawProps: RawProps = {};
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "prop": {
                    const propName = child.getAttribute("name");
                    if (!propName) {
                        throw new DrawingParsingException("Prop without the name",
                            {source: `Component ${node.parentElement?.getAttribute("name")}`});
                    }//if
                    const value = child.innerHTML.trim();
                    rawProps[propName] = value;
                    break;
                }
                default: 
                    throw new DrawingParsingException(`Unexpected content (${child.nodeName}) in <props>`,
                        {source: `Component ${node.parentElement?.getAttribute("name")}`});
            }//switch
        }//for
        return rawProps;
    }//parseProps


    private normalizeProps(rawProps: RawProps, node: Element, elementClass: NetworkElementClass): Props
    {
        const props: Props = {};
        if (Object.keys(rawProps).length  === 0) {
            return props;
        }//if

        const classProps = elementClass.props;
        if (!classProps) {
            throw new DrawingParsingException(
                `Class ${elementClass} has no props, but the instance supplies some`);
        }//if

        for (let propName in rawProps) {
            const value = rawProps[propName];
            // eslint-disable-next-line @typescript-eslint/ban-types
            let propType: Function;
            if (propName === "name") {
                propType = String;
            } else {
                let classProp = classProps[propName];
                if (!classProp) {
                    propName = this.toCamelCase(propName);
                    classProp = classProps[propName];
                    if (!classProp) {
                        throw new DrawingParsingException(
                            `Class "${elementClass.name}" has no prop "${propName}", but the instance supplies some`,
                            {source: `Component ${node.getAttribute("name")}`});
                    }//if
                }//if
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                propType = (classProp as any).type;
            }//if

            switch (propType) {
                case String:
                    props[propName] = value;
                    break;
                case Number:
                    props[propName] = parseFloat(value);
                    break;
                case Boolean:
                    props[propName] = Boolean(value);
                    break;
                case Object: case Array:
                    props[propName] = JSON.parse(value);
                    break;
            }//switch
        }//for

        return props;
    }//normalizeProps


    private toCamelCase(s: string): string
    {
        return s.replaceAll(/-([a-z])/g, (_, p1) => p1.toUpperCase());
    }//toCamelCase


    private parseTransform(node: Element)
    {
        const transform = new Transform();

        for (let i = 0; i < node.childElementCount; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "rotate": {
                    const angle = child.getAttribute("angle");
                    const x = child.getAttribute("x");
                    const y = child.getAttribute("y");
                    if (angle === null)
                        throw new DrawingParsingException(
                            '"rotate" element must have an "angle" attribute',
                            {source: `Component ${node.parentElement?.getAttribute("class")}`}
                            );
                    transform.rotation = {angle: parseFloat(angle), x: 0, y: 0};
                    if (x !== null && y !== null) {
                        transform.rotation.x = parseFloat(x);
                        transform.rotation.y = parseFloat(y);
                    }//if
                    break;
                }

                case "scale": {
                    const x = child.getAttribute("x");
                    const y = child.getAttribute("y");
                    if (x === null)
                        throw new DrawingParsingException(
                            '"scale" element must have an "x" attribute',
                            {source: `Component ${node.parentElement?.getAttribute("class")}`}
                            );
                    const xf = parseFloat(x);
                    if (xf === undefined)
                        throw new DrawingParsingException(
                            'invalid format of the "scale.x" attribute',
                            {source: `Component ${node.parentElement?.getAttribute("class")}`}
                            );
                    if (y === null) {
                        transform.scale = {x: xf, y: xf};
                    } else {
                        const yf = parseFloat(y);
                        if (yf === undefined)
                            throw new DrawingParsingException(
                                'invalid format of the "scale.y" attribute',
                                {source: `Component ${node.parentElement?.getAttribute("class")}`}
                                );
                        transform.scale = {x: xf, y: yf};
                    }//if
                    break;
                }
            }//switch
        }//for

        return transform;
    }//parseTransform

}//DrawingParser

export type ParsedNode = NetworkComponentController|Link|ParsingException;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, string|number|object|boolean|any[]>;
type RawProps = Record<string, string>;

export class DrawingParsingException extends ParsingException {
    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        super("Drawing loading: " + message, options);
    }//ctor
}//DrawingParsingException