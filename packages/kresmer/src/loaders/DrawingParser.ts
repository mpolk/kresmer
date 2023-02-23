/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                          Drawing file parser
\**************************************************************************/

import Kresmer from "../Kresmer";
import NetworkElementClass from "../NetworkElementClass";
import NetworkComponent from "../NetworkComponent/NetworkComponent";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkComponentController from "../NetworkComponent/NetworkComponentController";
import NetworkLink from "../NetworkLink/NetworkLink";
import NetworkLinkClass from "../NetworkLink/NetworkLinkClass";
import { LinkVertexInitParams } from "../NetworkLink/LinkVertex";
import { Transform } from "../Transform/Transform";
import ParsingException from "./ParsingException";
import KresmerException, { KresmerExceptionSeverity } from "../KresmerException";
import {toCamelCase} from "../Utils";

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
            throw new DrawingParsingException(`Invalid drawing root element: ${root?.nodeName}`);
        if (!root.hasAttribute("name")) {
            throw new DrawingParsingException("The root element does not define drawing name");
        }//if

        yield new DrawingHeaderData(root.getAttribute("name")!, 
                                    root.getAttribute("width"),
                                    root.getAttribute("height")
                                    );

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
        const dbID = node.getAttribute("db-id");
        if (!className) 
            throw new DrawingParsingException("Component without the class");
        const componentClass = NetworkComponentClass.getClass(className);
        if (!componentClass) 
            throw new DrawingParsingException(`Unknown component class "${className}"`);

        const propsFromAttributes: RawProps = {};
        for (const attrName of node.getAttributeNames()) {
            if (attrName !== "class" && attrName !== "db-id") {
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
        const component = new NetworkComponent(this.kresmer, className, {name: componentName, dbID, props, content});
        return new NetworkComponentController(this.kresmer, component, 
            {origin: {x: origin.x, y: origin.y}, transform});
    }//parseComponentNode


    private parseLinkNode(node: Element): NetworkLink
    {
        const className = node.getAttribute("class");
        const dbID = node.getAttribute("db-id");
        if (!className) 
            throw new DrawingParsingException("Link without the class");
        const linkClass = NetworkLinkClass.getClass(className);
        if (!linkClass) 
            throw new DrawingParsingException(`Unknown link class "${className}"`);

        const propsFromAttributes: RawProps = {};
        for (const attrName of node.getAttributeNames()) {
            switch (attrName) {
                case "class": case "db-id": case "from": case "to":
                    break;
                default:
                    propsFromAttributes[attrName] = node.getAttribute(attrName)!;
            }//switch
        }//for

        let propsFromChildNodes: RawProps = {};
        const vertices: LinkVertexInitParams[] = [];
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "props":
                    propsFromChildNodes = this.parseProps(child);
                    break;
                case "vertex":
                    vertices.push(this.parseLinkVertex(child));
                    break;
            }//switch
        }//for

        const props = this.normalizeProps({...propsFromAttributes, ...propsFromChildNodes}, node, linkClass);
        let linkName: string|undefined|null = node.getAttribute("name");
        if ("name" in props) {
            linkName = props["name"].toString();
        } else if (!linkName) {
            linkName = undefined;
        }//if
        const from = this.parseLinkEndpoint(node.getAttribute("from"));
        const to = this.parseLinkEndpoint(node.getAttribute("to"));
        const link = new NetworkLink(this.kresmer, className, {name: linkName, dbID, props, from, to, vertices});
        return link;
    }//parseLinkNode


    private parseLinkEndpoint(strData: string|null): LinkVertexInitParams
    {
        if (!strData)
            return {};

        let matches = strData.match(/^\s*(\d+),\s*(\d+)\s*$/);
        if (matches) {
            return {pos: {x: parseFloat(matches[1]), y: parseFloat(matches[2])}};
        } else {
            matches = strData.match(/^([-A-Za-z0-9_]+):([-A-Za-z0-9_]+)$/);
            if (matches) {
                return {conn: {component: matches[1], connectionPoint: matches[2]}};
            } else {
                throw new KresmerException(
                    `Invalid link vertex specification: "${strData}"`);
            }//if
        }//if
    }//parseLinkEndpoint


    private parseLinkVertex(node: Element): LinkVertexInitParams
    {
        const x = node.getAttribute("x");
        const y = node.getAttribute("y");
        const connect = node.getAttribute("connect");
        if ((x === null && y) || (y === null && x)) {
            throw new ParsingException(`"x" and "y" attributes should present together \
                                        in Vertex: ${node.parentElement?.toString()}`);
        }//if
        if (x !== null && connect) {
            throw new ParsingException(`Position and connection attributes cannot present together \
                                        in Vertex: ${node.parentElement?.toString()}`);
        }//if
        if (x === null && !connect) {
            throw new ParsingException(`Either position or connection attributes should present \
                                        in Vertex: ${node.parentElement?.toString()}`);
        }//if
        if (x !== null) {
            return {pos: {x: parseFloat(x), y: parseFloat(y!)}};
        }//if
        const [component, connectionPoint] = connect!.split(':');
        if (!connectionPoint) {
            throw new ParsingException(`Invalid connection point specification: "${connect}"`);
        }//if
        return {conn: {component, connectionPoint}};
    }//parseLinkVertex


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
                    propName = toCamelCase(propName);
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

export class DrawingHeaderData {
    constructor(public readonly name: string,
                width: string|null,
                height: string|null,
                ) 
    {
        width && (this.width = parseFloat(width));
        height && (this.height = parseFloat(height));
    }//ctor

    readonly width?: number;
    readonly height?: number;
}//DrawingHeaderData

export type ParsedNode = 
    DrawingHeaderData |
    NetworkComponentController |
    NetworkLink |
    ParsingException
    ;

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