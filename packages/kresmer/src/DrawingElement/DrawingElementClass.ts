/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * DrawingElement Class - a generic drawing element class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import { Prop, PropType } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import { clone } from "../Utils";
import { DrawingElementProps } from "../loaders/DrawingParser";
import { toCamelCase } from "../Utils";

/**
 * DrawingElement Class - a generic drawing element class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default abstract class DrawingElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params?: {
        version?: number,
        baseClass?: DrawingElementClass,
        styleBaseClasses?: DrawingElementClass[],
        computedPropsBaseClasses?: DrawingElementClass[],
        propsBaseClasses?: DrawingElementClass[],
        props?: DrawingElementClassProps,
        exceptProps?: string[],
        baseClassPropBindings?: DrawingElementProps,
        computedProps?: ComputedProps,
        functions?: Functions,
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
    })
    {
        this.name = name;
        this.version = params?.version ?? 1;
        this.baseClass = params?.baseClass;
        this.styleBaseClasses = params?.styleBaseClasses;
        this.propsBaseClasses = params?.propsBaseClasses;
        this.props = params?.props ?? {};

        if (params?.baseClass) {
            this.props = clone(Object.fromEntries(
                    Object.entries(params.baseClass.props)
                        .filter(entry => {return !params.exceptProps?.includes(entry[0])})
                ));
            const ownProps = params.props ?? {};
            for (const propName in ownProps) {
                if (this.props[propName] === undefined) {
                    this.props[propName] = clone(ownProps[propName]);
                } else {
                    for (const k in ownProps[propName]) {
                        const key = k as keyof DrawingElementClassProp;
                        if (ownProps[propName][key] === null)
                            this.props[propName][key] = undefined;
                        else
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            this.props[propName][key] = clone(ownProps[propName][key]) as any;
                    }//for
                }//if
            }//for

            // this.propsBaseClasses = [params.baseClass, ...(this.propsBaseClasses ?? [])];
            this.styleBaseClasses = [params.baseClass, ...(this.styleBaseClasses ?? [])];
        }//if

        this.baseClassPropBindings = params?.baseClassPropBindings;
        this.computedProps = params?.computedProps;
        this.functions = params?.functions;
        this.defs = params?.defs;
        this.style = params?.style;
        this.category = params?.category;

        for (const propName in params?.baseClassPropBindings) {
            const prop = this.props[toCamelCase(propName)] as {default: unknown}|undefined;
            if (prop)
                prop.default = params.baseClassPropBindings[propName];
        }//for
    }//ctor

    /** Class name */
    readonly name: string;
    /** Class code version */
    readonly version: number;
    /** Base class (for the element as a whole) */
    readonly baseClass?: DrawingElementClass;
    /** Base class prop values set from the "extends" clause */
    readonly baseClassPropBindings?: DrawingElementProps;
    /** A list of the base classes for this class CSS */
    readonly styleBaseClasses?: DrawingElementClass[];
    /** A list of the base classes for this class props set */
    readonly propsBaseClasses?: DrawingElementClass[];
    /** Indicates whether this class instances use template embedding for extending other classes */
    abstract readonly usesEmbedding: boolean;
    /** Props definition of the Vue-component for this class */
    readonly props: DrawingElementClassProps;
    /** Computed props (aka just "computed") definition of the Vue-component for this class */
    readonly computedProps?: ComputedProps;
    /** Functions associated with this class (also sometimes called "methods") */
    readonly functions?: Functions;
    /** SVG Defs for this class */
    readonly defs?: Template;
    /** CSS styles defined in this class */
    readonly style?: PostCSSRoot;
    /** Class category (for ordering and usability) */
    readonly category?: string;

    /** Limits this class usage for embedding or inheritance */
    get isAbstract(): boolean {return Boolean(this.category?.startsWith('.'))}

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    abstract get vueName(): string;

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
    abstract get defsVueName(): string;

    /** Makes XML-representation  of the class */
    toXML(indent: number, alreadySerialized: Set<DrawingElementClass>): string
    {
        if (alreadySerialized.has(this))
            return "";
        
        let xml = "";
        if (this.baseClass)
            xml += this.baseClass.toXML(indent, alreadySerialized);
        if (this.styleBaseClasses) {
            for (const base of this.styleBaseClasses) {
                xml += base.toXML(indent, alreadySerialized);
            }//for
        }//if
        if (this.propsBaseClasses) {
            for (const base of this.propsBaseClasses) {
                xml += base.toXML(indent, alreadySerialized);
            }//for
        }//if

        xml += this.selfToXML(indent);
        alreadySerialized.add(this);
        return xml;
    }//toXML

    abstract selfToXML(indent: number): string;

    protected baseToXML(indent: number): string
    {
        if (!this.baseClass)
            return "";
        let propBindAttrs = "";
        for (const prop in this.baseClassPropBindings) {
            propBindAttrs += ` ${prop}="${this.baseClassPropBindings[prop]}"`;
        }//for

        const baseTemplatesXML = this.baseTemplatesToXML(indent+1)
        if (!baseTemplatesXML)
            return `${"\t".repeat(indent)}<extends base="${this.baseClass.name}" ${propBindAttrs}/>\n`;

        let xml = `${"\t".repeat(indent)}<extends base="${this.baseClass.name}" ${propBindAttrs}>\n`;
        xml += baseTemplatesXML;
        xml += `${"\t".repeat(indent)}</extends>\n`;
        return xml;
    }//baseToXML

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected baseTemplatesToXML(indent: number) {return ""}

}//DrawingElementClass

/** Drawing Element computed prop - translate to the common Vue computed property */
export interface ComputedProp {
    name: string,
    body: string,
}//ComputedProp

/** Network Component computed props - translate to the common Vue computed properties */
export type ComputedProps = Record<string, ComputedProp>;

export type FunctionDescriptor = {
    name: string,
    params: string[],
    body: string
}//FunctionDescriptor

export type Functions = Record<string, FunctionDescriptor>;

export enum DrawingElementPropCategory {
    Hidden=1,
    Hardware, 
    Location, 
    Construction, 
    Optics,
    Network, 
    Geometry,  
    Presentation, 
}//DrawingElementPropCategory

export type DrawingElementClassProp<T=unknown> = Prop<T> & 
    {
        category?: DrawingElementPropCategory,
        description?: string,
        subtype?: string,
    };
export type DrawingElementClassPropDef<T=unknown> = Exclude<Prop<T>, PropType<T>>;
export type DrawingElementClassProps = Record<string, DrawingElementClassProp>;
