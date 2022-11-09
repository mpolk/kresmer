/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                     Component library parser
\**************************************************************************/

import { ComponentObjectPropsOptions, Prop } from "vue";
import postcss, {Result as PostCSSResult, Rule as PostCSSRule} from 'postcss';
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
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
    public *parseXML(rawData: string): Generator<ParsedNode>
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
                    case "defs":
                        yield new DefsLibNode(node);
                        break;
                    case "style":
                        yield new StyleLibNode(this.parseCSS(node.innerHTML));
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
        let props: ComponentObjectPropsOptions = {};
        let defs: Element | undefined;
        let style: PostCSSResult | undefined;
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child instanceof Element) {
                switch (child.nodeName) {
                    case "template":
                        template = child;
                        break;
                    case "props":
                        props = this.parseProps(child);
                        break;
                    case "defs":
                        defs = child;
                        break;
                    case "style":
                        style = this.parseCSS(child.innerHTML, className);
                        break;
                    }//switch
            }//if
        }//for

        if (!template) 
            throw new LibraryParsingException(
                `Component class without template`,
                {source: `Component class ${className}`});

        return new NetworkComponentClass(className, {template, props, defs, style})
    }//parseComponentClassNode


    private parseProps(node: Element)
    {
        const props: ComponentObjectPropsOptions = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child instanceof Element) {
                switch (child.nodeName) {
                    case "prop": {
                        const propName = child.getAttribute("name");
                        const prop: Prop<unknown, unknown> = {};
                        const type = child.getAttribute("type");
                        const required = child.getAttribute("required"),
                            _default = child.getAttribute("default"),
                            choices = child.getAttribute("choices");
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

                        if (choices) {
                            const validValues = choices.split(/ *, */);
                            const validator = (value: unknown) => {
                                return typeof value == "string" && validValues.includes(value);
                            }//validator
                            validator.validValues = validValues;
                            prop.validator = validator;
                        }//if

                        props[propName] = prop;
                        break;
                    }
                }//switch
            }//if
        }//for

        return props;
    }//parseProps


    private parseCSS(css: string, additionalScope = "")
    {
        const ast = postcss.parse(css, {from: undefined});
        ast.walkRules((rule: PostCSSRule) => {
            // Scope all rules within the ".kresmer" class and optionally with a component class
            let scope = ".kresmer";
            if (additionalScope)
                scope += ` .${additionalScope}`;
            rule.selectors = rule.selectors.map(sel => `${scope} ${sel}`);
        })

        return ast.toResult();
    }//parseCSS

}//LibraryParser


// Wrappers for the top-level library elements

export class DefsLibNode {
    data: Element;
    constructor(data: Element)
    {
        this.data = data;
    }//ctor
}//DefsLibNode

export class StyleLibNode {
    data: PostCSSResult;
    constructor(data: PostCSSResult)
    {
        this.data = data;
    }//ctor
}//StyleLibNode

type ParsedNode = NetworkComponentClass | DefsLibNode | StyleLibNode | ParsingException;

export class LibraryParsingException extends ParsingException {
    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        super("Library loading: " + message, options);
    }//ctor
}//LibraryParsingException