/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                     Component library parser
\**************************************************************************/

import { ComponentObjectPropsOptions, Prop } from "vue";
import postcss, {Root as PostCSSRoot, Rule as PostCSSRule, Declaration as PostCSSDeclaration} from 'postcss';
import NetworkElementClass from "../NetworkElementClass";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkLinkClass from "../NetworkLink/NetworkLinkClass";
import {ComputedProps} from "../NetworkElementClass";
import ParsingException from "./ParsingException";
import { KresmerExceptionSeverity } from "../KresmerException";
import Kresmer from "../Kresmer";

/**
 * Component library parser
 */
export default class LibraryParser {

    constructor(private kresmer: Kresmer) {}

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

        for (let i = 0; i < root.children.length; i++) {
            const node = root.children[i];
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
                case "link-class":
                    try {
                        yield this.parseLinkClassNode(node);
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
        }//for
    }//parseXML


    private parseComponentClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        if (!className) 
            throw new LibraryParsingException("Component class without the name");

        const autoInstanciate = node.getAttribute("instantiate") === "auto";
        const forEmbeddingOnly = node.getAttribute("instantiate") === "embed";

        let template: Element | undefined;
        let props: ComponentObjectPropsOptions = {};
        let computedProps: ComputedProps = {};
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let baseClasses: NetworkComponentClass[] | undefined;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "template":
                    template = child;
                    break;
                case "props":
                    props = this.parseProps(child);
                    break;
                case "computed-props":
                    computedProps = this.parseComputedProps(child);
                    break;
                case "defs":
                    defs = child;
                    break;
                case "style":
                    baseClasses = child.getAttribute("extends")?.split(/ *, */)
                        .map(className => NetworkComponentClass.getClass(className));
                    style = this.parseCSS(child.innerHTML, baseClasses);
                    break;
            }//switch
        }//for

        if (!template) {
            throw new LibraryParsingException(
                `Component class without template`,
                {source: `Component class ${className}`});
        }//if

        let defaultContent: string | undefined;
        const slot = template.querySelector("slot");
        if (slot?.textContent) {
            defaultContent = slot.textContent;
        }//if


        return new NetworkComponentClass(className, {baseClasses, template, props, computedProps, defs, 
                                                     style, autoInstanciate, defaultContent, forEmbeddingOnly});
    }//parseComponentClassNode


    private parseLinkClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        if (!className) 
            throw new LibraryParsingException("Link class without the name");

        let props: ComponentObjectPropsOptions = {};
        let computedProps: ComputedProps = {};
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let baseClasses: NetworkLinkClass[] | undefined;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "props":
                    props = this.parseProps(child);
                    break;
                case "computed-props":
                    computedProps = this.parseComputedProps(child);
                    break;
                case "defs":
                    defs = child;
                    break;
                case "style":
                    baseClasses = child.getAttribute("extends")?.split(/ *, */)
                        .map(className => NetworkLinkClass.getClass(className));
                    style = this.parseCSS(child.innerHTML, baseClasses);
                    break;
            }//switch
        }//for

        return new NetworkLinkClass(className, {baseClasses, props, computedProps, defs, style})
    }//parseLinkClassNode


    private parseProps(node: Element)
    {
        const allowedTypes: Record<string, {propType: {(): unknown}, makeDefault: (d: string) => unknown}> = {
            "string": {propType: String, makeDefault: d => d}, 
            "number": {propType: Number, makeDefault: Number},
            "boolean": {propType: Boolean, makeDefault: d => d === "true"}, 
            "object": {propType: Object, makeDefault: JSON.parse}, 
            "array": {propType: Array, makeDefault: JSON.parse},
        };

        const props: ComponentObjectPropsOptions = {};
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "prop": {
                    const propName = child.getAttribute("name");
                    const prop: Prop<unknown, unknown> = {};
                    const type = child.getAttribute("type");
                    const required = child.getAttribute("required"),
                        _default = child.getAttribute("default"),
                        choices = child.getAttribute("choices");
                    if (!propName) {
                        this.kresmer.raiseError(new LibraryParsingException("Prop without a name",
                            {source: `Component class "${node.parentElement?.getAttribute("name")}"`}));
                        continue;
                    }//if
                    // if (!_default) {
                    //     this.kresmer.raiseError(new LibraryParsingException(`Prop "${propName}" without a default value`,
                    //         {source: `Component class "${node.parentElement?.getAttribute("name")}"`}));
                    // }//if

                    Object.getOwnPropertyNames(allowedTypes).forEach(typeName => {
                        if (type?.toLowerCase() === typeName) {
                            prop.type = allowedTypes[typeName].propType;
                            if (_default != null)
                                prop.default = allowedTypes[typeName].makeDefault(_default);
                        }//if
                    });

                    if (!prop.type) {
                        const tnames = Object.getOwnPropertyNames(allowedTypes).join("|");
                        const matches = type?.match(new RegExp(`(?:(${tnames}) *\\| *)+(${tnames})`, "i")) ??
                            type?.match(new RegExp(`\\[ *(?:(${tnames}), *)+(${tnames})\\ *]`, "i"));
                        if (matches) {
                            prop.type = matches.slice(1).map(type => allowedTypes[type.toLowerCase()].propType);
                            if (_default != null)
                                prop.default = _default;
                        } else {
                            this.kresmer.raiseError(new LibraryParsingException(`Invalid prop type: ${type}`,
                                {source: `Component class "${node.parentElement?.getAttribute("name")}"`}));
                            continue;
                        }//if
                    }//if

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
        }//for

        return props;
    }//parseProps


    private parseComputedProps(node: Element)
    {
        const computedProps: ComputedProps = {};
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "computed-prop": {
                    const name = child.getAttribute("name");
                    if (!name) {
                        throw new LibraryParsingException("ComputedProp without the name",
                            {source: `Component class ${node.parentElement?.getAttribute("name")}`});
                    }//if
                    const body = child.textContent?.trim();
                    if (!body) {
                        throw new LibraryParsingException("ComputedProp without the body",
                            {source: `Component class ${node.parentElement?.getAttribute("name")}`});
                    }//if
                    const computedProp = {name, body};
                    computedProps[name] = computedProp;
                    break;
                }
            }//switch
        }//for

        return computedProps;
    }//parseComputedProps


    private parseCSS(css: string, baseClasses?: NetworkElementClass[])
    {
        const ast = postcss.parse(css, {from: undefined});
        if (!baseClasses) {
            return ast;
        }//if

        const ast0 = new PostCSSRoot();
        for (const baseClass of baseClasses) {
            const ast1 = baseClass?.style;
            if (ast1) {
                this.mergeCSS(ast0, ast1);
            }//if
        }//for
        this.mergeCSS(ast0, ast);
        return ast0;
    }//parseCSS


    private mergeCSS(ast0: PostCSSRoot, ast1: PostCSSRoot)
    {
        ast1.walkRules((rule1: PostCSSRule) => {
            let haveSuchRule = false;
            ast0.walkRules(rule1.selector, rule0 => {
                this.mergeCSSRules(rule0, rule1);
                haveSuchRule = true;
                return false;
            });
            if (!haveSuchRule) {
                ast0.append(rule1.clone());
            }//if
        });
    }//mergeCSS


    private mergeCSSRules(rule0: PostCSSRule, rule1: PostCSSRule)
    {
        rule1.walkDecls((decl1: PostCSSDeclaration) => {
            let haveSuchDecl = false;
            rule0.walkDecls(decl1.prop, decl0 => {
                decl0.value = decl1.value;
                haveSuchDecl = true;
                return false;
            });
            if (!haveSuchDecl) {
                rule0.append(decl1.clone());
            }//if
        });
    }//mergeCSSRules

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
    data: PostCSSRoot;
    constructor(data: PostCSSRoot)
    {
        this.data = data;
    }//ctor
}//StyleLibNode

type ParsedNode = NetworkComponentClass | 
                  NetworkLinkClass |
                  DefsLibNode | 
                  StyleLibNode | 
                  ParsingException;

export class LibraryParsingException extends ParsingException {
    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        super("Library loading: " + message, options);
    }//ctor
}//LibraryParsingException