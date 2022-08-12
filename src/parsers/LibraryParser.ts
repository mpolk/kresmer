/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                     Component library parser
\**************************************************************************/

import { ComponentPropsOptions, Prop } from "vue";
import NetworkComponentClass from "../NetworkComponentClass";
import ParsingException from "./ParsingException";
import { KresmerExceptionSeverity } from "../KresmerException";

/**
 * Component library parser
 */
export default class LibraryParser {

    /**
     * Parses a library file contents and yields the sequence 
     * of the parsed library elements
     * @param rawData XML-data to parse
     */
    public *parseXML(rawData: string): Generator<NetworkComponentClass|ParsingException>
    {
        console.debug('Parsing library XML...');
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(rawData, "text/xml") as XMLDocument;
        const root = dom.firstElementChild;

        if (root?.nodeName !== "kresmer-library")
            throw new LibraryParsingException(
                `Invalid library root element: ${root?.nodeName}`);

        for (let i = 0; i < root.childNodes.length; i++) {
            const node = root.childNodes[i];
            if (node instanceof Element) {
                switch (node.nodeName) {
                    case "component-class":
                        try {
                            yield this.parseComponentClassNode(node);
                        } catch (exc) {
                            if (exc instanceof ParsingException)
                                yield exc;
                            else
                                throw exc;
                        }//catch
                        break;
                    default:
                        yield new LibraryParsingException(
                            `Invalid top-level node in library: "${node.nodeName}"`);
                }//switch
            }//if
        }//for
    }//parseXML


    private parseComponentClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        if (!className) 
            throw new LibraryParsingException("Component class without name");

        let template: Element | undefined;
        let props: ComponentPropsOptions = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child instanceof Element) {
                switch (child.nodeName) {
                    case "template":
                        template = child;
                        break;
                    case "props":
                        props = this.parseProps(child);
                }//switch
            }//if
        }//for

        if (!template) 
            throw new LibraryParsingException(
                `Component class without template`,
                {source: `Component class ${className}`});

        return new NetworkComponentClass(className, {template, props})
    }//parseComponentClassNode


    private parseProps(node: Element)
    {
        const props: ComponentPropsOptions = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child instanceof Element) {
                switch (child.nodeName) {
                    case "prop": {
                        const propName = child.getAttribute("name");
                        const prop: Prop<unknown, unknown> = {};
                        const type = child.getAttribute("type");
                        const required = child.getAttribute("required"),
                            _default = child.getAttribute("default");
                        if (!propName)
                            throw new LibraryParsingException("Prop without a name",
                                {source: `Component class ${node.parentElement?.getAttribute("name")}`});

                        switch (type) {
                            case "String":
                                prop.type = String;
                                if (_default != null)
                                    prop.default = _default;
                                break;
                            case "Number":
                                prop.type = Number;
                                if (_default != null)
                                    prop.default = parseFloat(_default);
                                break;
                            case "Boolean":
                                prop.type = Boolean;
                                if (_default != null)
                                    prop.default = _default == "true";
                                break;
                            case "Object":
                                prop.type = Object;
                                if (_default != null)
                                    prop.default = JSON.parse(_default);
                                break;
                            case "Array":
                                prop.type = Array;
                                if (_default != null)
                                    prop.default = JSON.parse(_default);
                                break;
                            default:
                                throw new LibraryParsingException(`Invalid prop type: ${prop.type}`,
                                    {source: `Component class ${node.parentElement?.getAttribute("name")}`});
                        }//switch

                        switch (required) {
                            case "true": case "false":
                                prop.required = (required === "true");
                                break;
                            case null: case undefined:
                                break;
                            default:
                                throw `Invalid prop "required" attribute: ${prop.required}`;
                        }//switch

                        props[propName] = prop;
                        break;
                    }
                }//switch
            }//if
        }//for

        return props;
    }//parseProps

}//LibraryParser

export class LibraryParsingException extends ParsingException {
    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        super("Library loading: " + message, options);
    }//ctor
}//LibraryParsingException