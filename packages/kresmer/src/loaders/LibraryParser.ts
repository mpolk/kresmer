/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                     Component library parser
\**************************************************************************/

import postcss, {Root as PostCSSRoot, Rule as PostCSSRule, Declaration as PostCSSDeclaration} from 'postcss';
import NetworkElementClass, { NetworkElementPropCategory, NetworkElementClassProp, NetworkElementClassProps, Functions } from "../NetworkElementClass";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkLinkClass, { LinkBundleClass } from "../NetworkLink/NetworkLinkClass";
import {ComputedProps} from "../NetworkElementClass";
import ParsingException from "./ParsingException";
import { KresmerExceptionSeverity, UndefinedComponentClassException, UndefinedLinkClassException } from "../KresmerException";
import Kresmer from "../Kresmer";
import DrawingParser, { NetworkElementProps, NetworkElementRawProps } from "./DrawingParser";
import { clone, toCamelCase } from "../Utils";

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
        // console.debug('Parsing library XML...');
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(rawData, "text/xml") as XMLDocument;
        const root = dom.firstElementChild;

        if (root?.nodeName !== "kresmer-library")
            throw new LibraryParsingException(
                `Invalid library root element: ${root?.nodeName}`);

        const libName = root.getAttribute("name");
        if (libName === null) 
            this.kresmer.raiseError(new LibraryParsingException("Library has no name!"));
        else
            yield new LibParams(libName);

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
                case "link-class": case "link-bundle-class":
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
                case "style": {
                        const style = this.parseCSS(node.innerHTML);
                        if (style)
                            yield new StyleLibNode(style);
                    }
                    break;
                case "import":
                    if (node.hasAttribute("library"))
                        yield new ImportStatement(node.getAttribute("library")!, node.getAttribute("file-name") ?? undefined);
                    else
                        yield new LibraryParsingException(
                            `Import statement without a "library" attribute`);
                    break;
                case "parsererror":
                    yield new LibraryParsingException(
                        `Syntax error: "${(node as HTMLElement).innerText}"`);
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
        const category = node.getAttribute("category") ?? undefined;
        if (!className) 
            throw new LibraryParsingException("Component class without the name");

        let baseClass: NetworkComponentClass | undefined;
        let baseClassPropBindings: NetworkElementProps | undefined;
        let baseClassChildNodes: NodeListOf<ChildNode> | undefined;
        let template: Element | undefined;
        let props: NetworkElementClassProps = {};
        let exceptProps: string[] | undefined;
        let computedProps: ComputedProps|undefined;
        let exceptCProps: string[] | undefined;
        let functions: Functions | undefined;
        let exceptFunctions: string[] | undefined;
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let propsBaseClasses: NetworkComponentClass[] | undefined;
        let cPropsBaseClasses: NetworkComponentClass[] | undefined;
        let functionsBaseClasses: NetworkComponentClass[] | undefined;
        let styleBaseClasses: NetworkComponentClass[] | undefined;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "extends":
                    ({baseClass, baseClassPropBindings, childNodes: baseClassChildNodes} = 
                        this.parseClassInheritance(child, NetworkComponentClass) ?? {});
                    break
                case "template":
                    template = child;
                    break;
                case "props":
                    exceptProps = child.getAttribute("except")?.split(/ *, */).map(exc => toCamelCase(exc));
                    propsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkComponentClass);
                    props = this.parseProps(child, propsBaseClasses, exceptProps);
                    break;
                case "computed-props":
                    cPropsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkComponentClass);
                    exceptCProps = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !cPropsBaseClasses?.includes(baseClass)) {
                        cPropsBaseClasses = cPropsBaseClasses ? [baseClass, ...cPropsBaseClasses] : [baseClass];
                    }//if
                    computedProps = this.parseComputedProps(child, cPropsBaseClasses, exceptCProps);
                    break;
                case "functions":
                    functionsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkComponentClass);
                    exceptFunctions = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !functionsBaseClasses?.includes(baseClass)) {
                        functionsBaseClasses = functionsBaseClasses ? [baseClass, ...functionsBaseClasses] : [baseClass];
                    }//if
                    functions = this.parseFunctions(child, functionsBaseClasses, exceptFunctions);
                    break;
                case "defs":
                    defs = child;
                    break;
                case "style":
                    styleBaseClasses = this.parseClassList(child.getAttribute("extends"), NetworkComponentClass);
                    if (baseClass && !styleBaseClasses?.includes(baseClass)) {
                        styleBaseClasses = styleBaseClasses ? [baseClass, ...styleBaseClasses] : [baseClass];
                    }//if
                    style = this.parseCSS(child.innerHTML, styleBaseClasses);
                    break;
            }//switch
        }//for

        if (!template) {
            template = node.ownerDocument.createElement("template");
        }//if

        if (!computedProps && baseClass) {
            computedProps = this.parseComputedProps(undefined, [baseClass]);
        }//if

        if (!functions && baseClass) {
            functions = this.parseFunctions(undefined, [baseClass]);
        }//if

        if (!style && baseClass) {
            style = this.parseCSS("", [baseClass]);
        }//if

        let defaultContent: string | undefined;
        const slot = template.querySelector("slot");
        if (slot?.textContent) {
            defaultContent = slot.textContent;
        }//if


        return new NetworkComponentClass(className, {baseClass, baseClassPropBindings, baseClassChildNodes, 
                                                     styleBaseClasses, propsBaseClasses, template, 
                                                     props, exceptProps, computedProps, functions, defs, 
                                                     style, defaultContent, category});
    }//parseComponentClassNode


    private parseLinkClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        const category = node.getAttribute("category") ?? undefined;
        if (!className) 
            throw new LibraryParsingException("Link class without the name");

        let props: NetworkElementClassProps = {};
        let exceptProps: string[] | undefined;
        let exceptCProps: string[] | undefined;
        let computedProps: ComputedProps | undefined;
        let functions: Functions | undefined;
        let exceptFunctions: string[] | undefined;
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let baseClass: NetworkLinkClass | undefined;
        let baseClassPropBindings: NetworkElementProps | undefined;
        let propsBaseClasses: NetworkLinkClass[] | undefined;
        let cPropsBaseClasses: NetworkLinkClass[] | undefined;
        let functionsBaseClasses: NetworkLinkClass[] | undefined;
        let styleBaseClasses: NetworkLinkClass[] | undefined;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "extends":
                    ({baseClass, baseClassPropBindings} = this.parseClassInheritance(child, NetworkLinkClass) ?? {});
                    break
                case "props":
                    propsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkLinkClass);
                    exceptProps = child.getAttribute("except")?.split(/ *, */).map(exc => toCamelCase(exc));
                    props = this.parseProps(child, propsBaseClasses, exceptProps);
                    break;
                case "computed-props":
                    cPropsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkLinkClass);
                    exceptCProps = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !cPropsBaseClasses?.includes(baseClass)) {
                        cPropsBaseClasses = cPropsBaseClasses ? [baseClass, ...cPropsBaseClasses] : [baseClass];
                    }//if
                    computedProps = this.parseComputedProps(child, cPropsBaseClasses, exceptCProps);
                    break;
                case "functions":
                    functionsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkLinkClass);
                    exceptFunctions = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !functionsBaseClasses?.includes(baseClass)) {
                        functionsBaseClasses = functionsBaseClasses ? [baseClass, ...functionsBaseClasses] : [baseClass];
                    }//if
                    functions = this.parseFunctions(child, functionsBaseClasses, exceptFunctions);
                    break;
                case "defs":
                    defs = child;
                    break;
                case "style":
                    styleBaseClasses = this.parseClassList(child.getAttribute("extends"), NetworkLinkClass);
                    if (baseClass && !styleBaseClasses?.includes(baseClass)) {
                        styleBaseClasses = styleBaseClasses ? [baseClass, ...styleBaseClasses] : [baseClass];
                    }//if
                    style = this.parseCSS(child.innerHTML, styleBaseClasses);
                    break;
            }//switch
        }//for

        if (!computedProps && baseClass) {
            computedProps = this.parseComputedProps(undefined, [baseClass]);
        }//if

        if (!functions && baseClass) {
            functions = this.parseFunctions(undefined, [baseClass]);
        }//if

        if (!style && baseClass) {
            style = this.parseCSS("", [baseClass]);
        }//if

        const ctor = node.nodeName === "link-bundle-class" ? LinkBundleClass : NetworkLinkClass;
        const linkClass = new ctor(className, {baseClass, styleBaseClasses, propsBaseClasses, props, exceptProps,
                                               baseClassPropBindings, computedProps, functions, defs, style, category});
        return linkClass;
    }//parseLinkClassNode


    private parseClassList<T extends typeof NetworkComponentClass|typeof NetworkLinkClass>(
        rawList: string|null, listElemClass: T): InstanceType<T>[]|undefined
    {
        return rawList?.split(/ *, */)
            .map(className => {
                const clazz =  listElemClass.getClass(className);
                if (!clazz) {
                    const exceptionClass = listElemClass === NetworkComponentClass ?
                        UndefinedComponentClassException :
                        UndefinedLinkClassException;
                    this.kresmer.raiseError(new exceptionClass({className}));
                }//if
                return clazz as InstanceType<T>;
            }).filter(clazz => Boolean(clazz));
    }//parseClassList


    private parseClassInheritance<T extends typeof NetworkComponentClass|typeof NetworkLinkClass>(node: Element, baseClassCtor: T)
    {
        const baseClassName = node.getAttribute("base");
        if (!baseClassName) {
            this.kresmer.raiseError(new LibraryParsingException("Base class name is not specified", 
                                    {source: `Link ${node.parentElement!.getAttribute("name")}`}));
            return undefined;
        }//if

        const baseClass = baseClassCtor.getClass(baseClassName) as InstanceType<T>;
        if (!baseClass) {
            this.kresmer.raiseError(new LibraryParsingException(`Base class ${baseClassName} does not exist`, 
                                    {source: `Link ${node.parentElement!.getAttribute("name")}`}));
            return undefined;
        }//if

        const baseClassRawProps: NetworkElementRawProps = {};
        for (const attrName of node.getAttributeNames()) {
            if (attrName !== "base") {
                baseClassRawProps[attrName] = node.getAttribute(attrName)!;
            }//if
        }//for
        const baseClassPropBindings = DrawingParser.normalizeProps(baseClassRawProps, baseClass, this.kresmer);

        return {baseClass, baseClassPropBindings, childNodes: node.childNodes};
    }//parseClassInheritance


    private parseProps(node: Element, propsBaseClasses?: NetworkElementClass[], exceptProps?: string[])
    {
        const allowedTypes: Record<string, {propType: {(): unknown}, makeDefault: (d: string) => unknown, subtype?: string}> = {
            "string": {propType: String, makeDefault: d => d}, 
            "color": {propType: String, makeDefault: d => d, subtype: "color"}, 
            "imageurl": {propType: String, makeDefault: d => d, subtype: "image-url"}, 
            "number": {propType: Number, makeDefault: d => d === "none" ? null : Number(d)},
            "boolean": {propType: Boolean, makeDefault: d => d === "true"}, 
            "object": {propType: Object, makeDefault: d => d === "none" ? null : JSON.parse(d)}, 
            "array": {propType: Array, makeDefault: d => d === "none" ? null : JSON.parse(d)},
        };

        const props: NetworkElementClassProps = {};
        propsBaseClasses?.forEach(baseClass => {
            for (const propName in baseClass.props) {
                if (!exceptProps || exceptProps.findIndex(exc => exc === propName) < 0)
                    props[propName] = clone(baseClass.props[propName]);
            }//for
        });
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "prop": {
                    const propName = toCamelCase(child.getAttribute("name"));
                    const prop: NetworkElementClassProp = {};
                    const type = child.getAttribute("type");
                    const required = child.getAttribute("required"),
                        _default = child.getAttribute("default"),
                        choices = child.getAttribute("choices"),
                        pattern = child.getAttribute("pattern"),
                        range = child.getAttribute("range"),
                        category = child.getAttribute("category"),
                        description = child.getAttribute("description");
                    if (!propName) {
                        this.kresmer.raiseError(new LibraryParsingException("Prop without a name",
                            {source: `Component class "${node.parentElement?.getAttribute("name")}"`}));
                        continue;
                    }//if

                    Object.getOwnPropertyNames(allowedTypes).forEach(typeName => {
                        if (type?.replaceAll('-', '').toLowerCase() === typeName) {
                            prop.type = allowedTypes[typeName].propType;
                            if (_default != null)
                                prop.default = allowedTypes[typeName].makeDefault(_default);
                            prop.subtype = allowedTypes[typeName].subtype;
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
                            prop.required = (required === "true")&& (_default === null);
                            break;
                        case null: case undefined:
                            break;
                        default:
                            throw `Invalid prop "required" attribute: ${prop.required}`;
                    }//switch

                    if (choices) {
                        const validValues = choices.split(/ *, */);
                        const validator = (value: unknown) => {
                            return validValues.includes(String(value));
                        }//validator
                        validator.validValues = validValues;
                        prop.validator = validator;
                    }//if

                    if (range) {
                        const [min, max] = range.split("..").map(s => Number(s));
                        const validator = (value: unknown) => {
                            const n = Number(value);
                            return n >= min && n <= max;
                        }//validator
                        validator.min = min;
                        validator.max = max;
                        prop.validator = validator;
                    }//if

                    if (pattern) {
                        const rePattern = new RegExp(pattern);
                        const validator = (value: unknown) => {
                            return typeof value == "string" && (
                                    Boolean(value.match(rePattern)) || (value === "" && !required)
                                );
                        }//validator
                        validator.pattern = pattern;
                        prop.validator = validator;
                    }//if

                    switch (category) {
                        case "Hidden":
                        case "Geometry":
                        case "Presentation":
                        case "Construction":
                        case "Location":
                        case "Network":
                        case "Hardware":
                        case "Optics":
                            prop.category = NetworkElementPropCategory[category];
                        // eslint-disable-next-line no-fallthrough
                        case null:
                            break;
                        default: 
                            this.kresmer.raiseError(new LibraryParsingException(`Invalid prop category: "${category}"`));
                    }//switch

                    if (description)
                        prop.description = description;

                    props[propName] = prop;
                    break;
                }
            }//switch
        }//for

        return props;
    }//parseProps


    private parseComputedProps(node: Element|undefined, baseClasses: NetworkElementClass[]|undefined, except?: string[])
    {
        const computedProps: ComputedProps = {};
        baseClasses?.forEach(baseClass => {
            if (baseClass.computedProps) {
                Object.entries(baseClass.computedProps).filter(cprop => !except?.includes(cprop[0]))
                    .forEach(cprop => computedProps[cprop[0]] = cprop[1]);
            }//if
        });

        for (let i = 0; i < (node?.children.length ?? 0); i++) {
            const child = node!.children[i];
            switch (child.nodeName) {
                case "computed-prop": {
                    const name = child.getAttribute("name");
                    if (!name) {
                        throw new LibraryParsingException("ComputedProp without the name",
                            {source: `Component class ${node!.parentElement?.getAttribute("name")}`});
                    }//if
                    const body = child.textContent?.trim();
                    if (!body) {
                        throw new LibraryParsingException("ComputedProp without the body",
                            {source: `Component class ${node!.parentElement?.getAttribute("name")}`});
                    }//if
                    const computedProp = {name, body};
                    computedProps[name] = computedProp;
                    break;
                }
            }//switch
        }//for

        return computedProps;
    }//parseComputedProps


    private parseFunctions(node: Element|undefined, baseClasses: NetworkElementClass[]|undefined, except?: string[])
    {
        const functions: Functions = {};
        baseClasses?.forEach(baseClass => {
            if (baseClass.functions) {
                Object.entries(baseClass.functions).filter(func => !except?.includes(func[0]))
                    .forEach(func => functions[func[0]] = func[1]);
            }//if
        });

        for (let i = 0; i < (node?.children.length ?? 0); i++) {
            const child = node!.children[i];
            switch (child.nodeName) {
                case "function": {
                    const name = child.getAttribute("name");
                    if (!name) {
                        throw new LibraryParsingException("Function without the name",
                            {source: `Component class ${node!.parentElement?.getAttribute("name")}`});
                    }//if
                    const body = child.textContent?.trim();
                    if (!body) {
                        throw new LibraryParsingException("Function without the body",
                            {source: `Component class ${node!.parentElement?.getAttribute("name")}`});
                    }//if
                    const params = (child.getAttribute("params") ?? "").split(/, */);
                    const func = {name, params, body};
                    functions[name] = func;
                    break;
                }
            }//switch
        }//for

        return functions;
    }//parseFunctions


    private parseCSS(css: string, baseClasses?: NetworkElementClass[])
    {
        let ast: postcss.Root|undefined;
        try {
            ast = postcss.parse(css, {from: undefined});
        } catch (exc) {
            if (exc instanceof postcss.CssSyntaxError)
                this.kresmer.raiseError(new ParsingException(exc.message, {source: exc.source}));
            else
                throw exc;
        }//catch

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


    private mergeCSS(ast0: PostCSSRoot, ast1: PostCSSRoot|undefined)
    {
        if (!ast1)
            return ast0;

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

export class LibParams {
    constructor(readonly name: string) {}
}//LibParams

export class ImportStatement {
    constructor(readonly libName: string, readonly fileName?: string) {}
}//importStatement

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


type ParsedNode = LibParams |
                  ImportStatement |
                  NetworkComponentClass | 
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