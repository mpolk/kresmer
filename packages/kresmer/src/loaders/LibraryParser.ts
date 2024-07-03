/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                     Component library parser
\**************************************************************************/

import postcss, {Root as PostCSSRoot, Rule as PostCSSRule, Declaration as PostCSSDeclaration} from 'postcss';
import DrawingElementClass, { DrawingElementPropCategory, DrawingElementClassProp, DrawingElementClassProps, Functions, DrawingElementClassPropSubtype, PropTypeDescriptor } from "../DrawingElement/DrawingElementClass";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkLinkClass, { LinkBundleClass } from "../NetworkLink/NetworkLinkClass";
import {ComputedProps} from "../DrawingElement/DrawingElementClass";
import ParsingException from "./ParsingException";
import { KresmerExceptionSeverity, UndefinedAreaClassException, UndefinedComponentClassException, UndefinedLinkClassException } from "../KresmerException";
import Kresmer from "../Kresmer";
import DrawingParser, { DrawingElementProps, DrawingElementRawProps } from "./DrawingParser";
import { toCamelCase } from "../Utils";
import DrawingAreaClass from '../DrawingArea/DrawingAreaClass';

/**
 * Component library parser
 */
export default class LibraryParser {

    constructor(private kresmer: Kresmer, private propTypes: Map<string, Map<string, PropTypeDescriptor>>) {}
    private libVersion: number = 1;

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

        this.libVersion = root?.hasAttribute("version") ? Number(root.getAttribute("version")) : 1;
        const libName = root.getAttribute("name");
        if (libName === null) 
            this.kresmer.raiseError(new LibraryParsingException("Library has no name!"));
        else
            yield new LibParams(libName, this.libVersion);

        yield* this.parseLibraryNode(root, libName);
    }//parseXML

    /**
     * Parses a library XML-node and yields the sequence 
     * of the parsed library elements
     * @param root library root node to parse
     */
    public *parseLibraryNode(root: Element, libName?: string|null): Generator<ParsedNode>
    {
        for (let i = 0; i < root.children.length; i++) {
            const rawNode = root.children[i]
            const parsedNode = this.parseLibrarySubnode(rawNode);
            if (parsedNode) {
                this.kresmer.emit("library-element-loaded", libName ?? "", parsedNode, rawNode.outerHTML)
                yield parsedNode
            }//if
        }//for
    }//parseLibraryNode


    private parseLibrarySubnode(node: Element): ParsedNode
    {
        switch (node.nodeName) {
            case "component-class":
                try {
                    return this.parseComponentClassNode(node);
                } catch (exc) {
                    if (exc instanceof ParsingException)
                        return exc;
                    else
                        throw exc;
                }//catch
                break;
            case "link-class": case "link-bundle-class":
                try {
                    return this.parseLinkClassNode(node);
                } catch (exc) {
                    if (exc instanceof ParsingException)
                        return exc;
                    else
                        throw exc;
                }//catch
                break;
            case "area-class":
                try {
                    return this.parseAreaClassNode(node);
                } catch (exc) {
                    if (exc instanceof ParsingException)
                        return exc;
                    else
                        throw exc;
                }//catch
                break;
            case "defs": {
                    const name = node.getAttribute("name");
                    if (!name)
                        return new LibraryParsingException("Defs should have name");
                    return new DefsLibNode(node, name, this.getVersion(node), node.outerHTML);
                }
                break;
            case "style": {
                    const name = node.getAttribute("name");
                    if (!name)
                        return new LibraryParsingException("Defs should have name");
                    const style = this.parseCSS(node.innerHTML);
                    if (style)
                        return new StyleLibNode(style, name, this.getVersion(node), node.outerHTML);
                }
                break;
            case "import":
                if (node.hasAttribute("library"))
                    return new ImportStatement(node.getAttribute("library")!, node.getAttribute("file-name") ?? undefined);
                else
                    return new LibraryParsingException(
                        `Import statement without a "library" attribute`);
                break;
            case "parsererror":
                return new LibraryParsingException(
                    `Syntax error: "${(node as HTMLElement).innerText}"`);
                break;
        }//switch

        return new LibraryParsingException(
            `Invalid top-level node in library: "${node.nodeName}"`);
    }//parseLibraryNode


    private getVersion(node: Element)
    {
        return node.hasAttribute("version") ? Number(node.getAttribute("version")) : 1;
    }//getVersion

    private parseComponentClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        const category = node.getAttribute("category") ?? undefined;
        if (!className) 
            throw new LibraryParsingException("Component class without the name");

        const version = this.getVersion(node);
        let baseClass: NetworkComponentClass | undefined;
        let embeddedElementClasses: NetworkComponentClass[] | undefined;
        if (node.hasAttribute("embeds")) {
            embeddedElementClasses = node.getAttribute("embeds")!.split(/\s*,\s*/)
                .map(name => {
                    return NetworkComponentClass.getClass(name.trim())
                });
        }//if
        const referencedClasses: DrawingElementClass[] = [];
        let baseClassPropBindings: DrawingElementProps | undefined;
        let baseClassChildNodes: NodeListOf<ChildNode> | undefined;
        let template: Element | undefined;
        let props: DrawingElementClassProps = {};
        let exceptProps: string[] | undefined;
        let computedProps: ComputedProps|undefined;
        let exceptComputedProps: string[] | undefined;
        let functions: Functions | undefined;
        let exceptFunctions: string[] | undefined;
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let propsBaseClasses: NetworkComponentClass[] | undefined;
        let computedPropsBaseClasses: NetworkComponentClass[] | undefined;
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
                    props = this.parseProps(child, className, referencedClasses);
                    break;
                case "computed-props":
                    computedPropsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkComponentClass);
                    exceptComputedProps = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !computedPropsBaseClasses?.includes(baseClass)) {
                        computedPropsBaseClasses = computedPropsBaseClasses ? [baseClass, ...computedPropsBaseClasses] : [baseClass];
                    }//if
                    computedProps = this.parseComputedProps(child, computedPropsBaseClasses, exceptComputedProps);
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


        return new NetworkComponentClass(className, {version, baseClass, baseClassPropBindings, baseClassChildNodes, 
                                                     embeddedElementClasses, referencedClasses,
                                                     styleBaseClasses, propsBaseClasses, template, 
                                                     props, exceptProps, computedProps, computedPropsBaseClasses, 
                                                     functions, functionsBaseClasses, defs, 
                                                     style, defaultContent, category, sourceCode: node.outerHTML});
    }//parseComponentClassNode


    private parseLinkClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        const category = node.getAttribute("category") ?? undefined;
        if (!className) 
            throw new LibraryParsingException("Link class without the name");

        const version = this.getVersion(node);
        let props: DrawingElementClassProps = {};
        let exceptProps: string[] | undefined;
        let exceptComputedProps: string[] | undefined;
        let computedProps: ComputedProps | undefined;
        let functions: Functions | undefined;
        let exceptFunctions: string[] | undefined;
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let baseClass: NetworkLinkClass | undefined;
        const referencedClasses: DrawingElementClass[] = [];
        let baseClassPropBindings: DrawingElementProps | undefined;
        let propsBaseClasses: NetworkLinkClass[] | undefined;
        let computedPropsBaseClasses: NetworkLinkClass[] | undefined;
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
                    props = this.parseProps(child, className, referencedClasses);
                    break;
                case "computed-props":
                    computedPropsBaseClasses = this.parseClassList(child.getAttribute("extend"), NetworkLinkClass);
                    exceptComputedProps = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !computedPropsBaseClasses?.includes(baseClass)) {
                        computedPropsBaseClasses = computedPropsBaseClasses ? [baseClass, ...computedPropsBaseClasses] : [baseClass];
                    }//if
                    computedProps = this.parseComputedProps(child, computedPropsBaseClasses, exceptComputedProps);
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
        const linkClass = new ctor(className, {version, baseClass, styleBaseClasses, propsBaseClasses, props, exceptProps,
                                               referencedClasses, baseClassPropBindings, computedProps, computedPropsBaseClasses, 
                                               functions, functionsBaseClasses, defs, style, category, 
                                               sourceCode: node.outerHTML});
        return linkClass;
    }//parseLinkClassNode


    private parseAreaClassNode(node: Element)
    {
        const className = node.getAttribute("name");
        const category = node.getAttribute("category") ?? undefined;
        if (!className) 
            throw new LibraryParsingException("Area class without the name");

        const version = this.getVersion(node);
        let props: DrawingElementClassProps = {};
        let exceptProps: string[] | undefined;
        let exceptComputedProps: string[] | undefined;
        let computedProps: ComputedProps | undefined;
        let functions: Functions | undefined;
        let exceptFunctions: string[] | undefined;
        let defs: Element | undefined;
        let style: PostCSSRoot | undefined;
        let baseClass: DrawingAreaClass | undefined;
        const referencedClasses: DrawingElementClass[] = [];
        let baseClassPropBindings: DrawingElementProps | undefined;
        let propsBaseClasses: DrawingAreaClass[] | undefined;
        let computedPropsBaseClasses: DrawingAreaClass[] | undefined;
        let functionsBaseClasses: DrawingAreaClass[] | undefined;
        let styleBaseClasses: DrawingAreaClass[] | undefined;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "extends":
                    ({baseClass, baseClassPropBindings} = this.parseClassInheritance(child, DrawingAreaClass) ?? {});
                    break
                case "props":
                    propsBaseClasses = this.parseClassList(child.getAttribute("extend"), DrawingAreaClass);
                    exceptProps = child.getAttribute("except")?.split(/ *, */).map(exc => toCamelCase(exc));
                    props = this.parseProps(child, className, referencedClasses);
                    break;
                case "computed-props":
                    computedPropsBaseClasses = this.parseClassList(child.getAttribute("extend"), DrawingAreaClass);
                    exceptComputedProps = child.getAttribute("except")?.split(/ *, */) ?? [];
                    if (baseClass && !computedPropsBaseClasses?.includes(baseClass)) {
                        computedPropsBaseClasses = computedPropsBaseClasses ? [baseClass, ...computedPropsBaseClasses] : [baseClass];
                    }//if
                    computedProps = this.parseComputedProps(child, computedPropsBaseClasses, exceptComputedProps);
                    break;
                case "functions":
                    functionsBaseClasses = this.parseClassList(child.getAttribute("extend"), DrawingAreaClass);
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
                    styleBaseClasses = this.parseClassList(child.getAttribute("extends"), DrawingAreaClass);
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

        const areaClass = new DrawingAreaClass(className, {version, baseClass, styleBaseClasses, propsBaseClasses, props, 
                                                           exceptProps, referencedClasses,
                                                           baseClassPropBindings, computedProps, computedPropsBaseClasses,
                                                           functions, functionsBaseClasses,
                                                           defs, style, category, 
                                                           sourceCode: node.outerHTML});
        return areaClass;
    }//parseAreaClassNode


    private parseClassList<T extends DrawingElementClassType>(
        rawList: string|null, listElemClass: T): InstanceType<T>[]|undefined
    {
        return rawList?.split(/ *, */)
            .map(className => {
                const clazz =  listElemClass.getClass(className);
                if (!clazz) {
                    const exceptionClass = 
                        listElemClass === NetworkComponentClass ? UndefinedComponentClassException :
                        listElemClass === NetworkLinkClass ? UndefinedLinkClassException :
                        UndefinedAreaClassException;
                    this.kresmer.raiseError(new exceptionClass({className}));
                }//if
                return clazz as InstanceType<T>;
            }).filter(clazz => Boolean(clazz));
    }//parseClassList


    private parseClassInheritance<T extends DrawingElementClassType>(node: Element, baseClassCtor: T)
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

        const baseClassRawProps: DrawingElementRawProps = {};
        for (const attrName of node.getAttributeNames()) {
            if (attrName !== "base") {
                baseClassRawProps[attrName] = node.getAttribute(attrName)!;
            }//if
        }//for
        const baseClassPropBindings = DrawingParser.normalizeProps(baseClassRawProps, baseClass, this.kresmer);

        return {baseClass, baseClassPropBindings, childNodes: node.childNodes};
    }//parseClassInheritance


    private parseProps(node: Element, className: string, referencedClasses: DrawingElementClass[])
    {
        const props: DrawingElementClassProps = {};
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            switch (child.nodeName) {
                case "prop": {
                    const propName = toCamelCase(child.getAttribute("name"));
                    const prop = this.parseProp(child, className, referencedClasses);
                    if (prop)
                        props[propName] = prop;
                    break;
                }
            }//switch
        }//for

        return props;
    }//parseProps


    private parseProp(node: Element, className: string, referencedClasses: DrawingElementClass[]): 
        DrawingElementClassProp|undefined
    {

        const allowedTypes: Record<string, {
            propType: {(): unknown}, 
            makeDefault: (d: string) => unknown, 
            subtype?: DrawingElementClassPropSubtype
        }> = {
            "string": {propType: String, makeDefault: d => d}, 
            "color": {propType: String, makeDefault: d => d, subtype: "color"}, 
            "imageurl": {propType: String, makeDefault: d => d, subtype: "image-url"}, 
            "number": {propType: Number, makeDefault: d => d === "none" ? null : Number(d)},
            "boolean": {propType: Boolean, makeDefault: d => d === "true"}, 
            "object": {propType: Object, makeDefault: d => d === "none" ? null : JSON.parse(d)}, 
            "array": {propType: Array, makeDefault: d => d === "none" ? null : JSON.parse(d)},
        };

        const propName = toCamelCase(node.getAttribute("name"));
        const prop: DrawingElementClassProp = {};
        const type = node.getAttribute("type");
        const required = node.getAttribute("required"),
            _default = node.getAttribute("default"),
            choices = node.getAttribute("choices"),
            pattern = node.getAttribute("pattern"),
            range = node.getAttribute("range"),
            category = node.getAttribute("category"),
            description = node.getAttribute("description");
        if (!propName && node.nodeName !== "elements") {
            this.kresmer.raiseError(new LibraryParsingException("Prop without a name",
                {source: `Component class "${node.parentElement?.getAttribute("name")}"`}));
            return undefined;
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
                return undefined;
            }//if
        }//if

        if (prop.type === Object) {
            const typeRef = node.getAttribute("type-ref")?.split('.', 2);
            if (typeRef) {
                if (typeRef.length < 2)
                    typeRef.unshift(className);
                typeRef[1] = toCamelCase(typeRef[1]);
                prop.typeDescriptor = this.propTypes.get(typeRef[0])?.get(typeRef[1]);
                if (prop.typeDescriptor) {
                    const referencedClass = 
                        NetworkComponentClass.getClass(typeRef[0]) || 
                        NetworkLinkClass.getClass(typeRef[0]) ||
                        DrawingAreaClass.getClass(typeRef[0]);
                    referencedClasses.push(referencedClass);
                }//if
            }//if
            if (!prop.typeDescriptor) {
                prop.typeDescriptor = this.parseObjectPropType(node, className, referencedClasses);
                if (!prop.typeDescriptor) {
                    this.kresmer.raiseError(new LibraryParsingException(`Prop "${propName}" must have type definition`,
                        {source: `Component class "${node.parentElement?.parentElement?.getAttribute("name")}"`}));
                    // return undefined;
                }//if
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
                prop.category = DrawingElementPropCategory[category];
            // eslint-disable-next-line no-fallthrough
            case null:
                break;
            default: 
                this.kresmer.raiseError(new LibraryParsingException(`Invalid prop category: "${category}"`));
        }//switch

        if (description)
            prop.description = description;

        if (prop.typeDescriptor && node.nodeName === "prop")
            if (this.propTypes.has(className))
                this.propTypes.get(className)!.set(propName, prop.typeDescriptor);
            else
                this.propTypes.set(className, new Map([[propName, prop.typeDescriptor]]));
        return prop;
    }//parseProp


    private parseObjectPropType(node: Element, className: string, referencedClasses: DrawingElementClass[]): 
        PropTypeDescriptor|undefined
    {
        if (node.childElementCount === 0) {
            return undefined;
        }//if

        switch (node.firstElementChild?.nodeName) {
            case "elements": {
                const elementsNode = node.firstElementChild;
                const childProp = this.parseProp(elementsNode, className, referencedClasses);
                if (!childProp) {
                    this.kresmer.raiseError(new LibraryParsingException(`Invalid prop ${node.getAttribute("name")} element type definition`,
                        {source: `Class "${node.parentElement?.parentElement?.getAttribute("name")}"`}));
                    return undefined;
                }//if
            
                return {elements: childProp};
            }//case elements

            case "subprop": {
                const subprops: DrawingElementClassProps = {};
                for (let i = 0; i < node.childElementCount; i++) {
                    const child = node.children[i];
                    const subpropName = child.getAttribute("name");
                    if (!subpropName) {
                        this.kresmer.raiseError(new LibraryParsingException(`Invalid prop ${node.getAttribute("name")} subprop type definition`,
                            {source: `Class "${node.parentElement?.parentElement?.getAttribute("name")}"`}));
                    return undefined;
                    }//if
                    const subprop = this.parseProp(child, className, referencedClasses);
                    if (subprop)
                        subprops[subpropName] = subprop;
                }//for
                return {subprops};
            }//case subprop
        }//switch

        return undefined;
    }//parseObjectPropType


    private parseComputedProps(node: Element|undefined, baseClasses: DrawingElementClass[]|undefined, except?: string[])
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


    private parseFunctions(node: Element|undefined, baseClasses: DrawingElementClass[]|undefined, except?: string[])
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


    private parseCSS(css: string, baseClasses?: DrawingElementClass[])
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
    constructor(readonly name: string, readonly version: number) {}
}//LibParams

export class ImportStatement {
    constructor(readonly libName: string, readonly fileName?: string) {}
}//importStatement

export class DefsLibNode {
    constructor(readonly data: Element, readonly name: string, readonly version: number, readonly sourceCode: string) {}
}//DefsLibNode

export class StyleLibNode {
    constructor(readonly data: PostCSSRoot, readonly name: string, readonly version: number, readonly sourceCode: string) {}
}//StyleLibNode

export type ParsedNode =
    | LibParams
    | ImportStatement
    | NetworkComponentClass
    | NetworkLinkClass
    | DrawingAreaClass
    | DefsLibNode 
    | StyleLibNode
    | ParsingException
    ;

type DrawingElementClassType = 
    | typeof NetworkComponentClass
    | typeof NetworkLinkClass
    | typeof DrawingAreaClass
    ;
export class LibraryParsingException extends ParsingException {
    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        super("Library loading: " + message, options);
    }//ctor
}//LibraryParsingException