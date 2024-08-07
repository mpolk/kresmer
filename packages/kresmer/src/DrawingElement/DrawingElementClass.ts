/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * DrawingElement Class - a generic drawing element class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import { PropType } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import { clone } from "../Utils";
import { DrawingElementProps } from "../loaders/DrawingParser";
import { toCamelCase } from "../Utils";
import { DrawingElementClassTranslation, PropTranslation } from "loaders/LibraryParser";

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
        referencedClasses?: DrawingElementClass[],
        styleBaseClasses?: DrawingElementClass[],
        computedPropsBaseClasses?: DrawingElementClass[],
        propsBaseClasses?: DrawingElementClass[],
        props?: DrawingElementClassProps,
        exceptProps?: string[],
        baseClassPropBindings?: DrawingElementProps,
        computedProps?: ComputedProps,
        functions?: Functions,
        functionsBaseClasses?: DrawingElementClass[],
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
        sourceCode?: string,
        localizedName?: string,
        localizedCategory?: string,
    })
    {
        this.name = name;
        this.localizedName = params?.localizedName;
        this.version = params?.version ?? 1;
        this.baseClass = params?.baseClass;
        this.referencedClasses = new Set(params?.referencedClasses);
        this.styleBaseClasses = params?.styleBaseClasses;
        this.propsBaseClasses = params?.propsBaseClasses;
        this.computedPropsBaseClasses = params?.computedPropsBaseClasses;
        this.functionsBaseClasses = params?.functionsBaseClasses;
        this.exceptProps = params?.exceptProps;

        this.props = {};

        if (params?.baseClass) {
            this.mergeProps(params.baseClass.props, true);
            this.styleBaseClasses = [params.baseClass, ...(this.styleBaseClasses ?? [])];
        }//if

        this.propsBaseClasses?.forEach(baseClass => {
            this.mergeProps(baseClass.props, true);
        });

        this.mergeProps(params?.props, false);

        this.baseClassPropBindings = params?.baseClassPropBindings;
        this.computedProps = params?.computedProps;
        this.functions = params?.functions;
        this.defs = params?.defs;
        this.style = params?.style;
        this.category = params?.category;
        this.localizedCategory = params?.localizedCategory;
        this.sourceCode = params?.sourceCode?.replaceAll(/ *xmlns:[-a-zA-Z0-9]+="[-a-zA-Z0-9]+" */g, " ");

        for (const propName in params?.baseClassPropBindings) {
            const prop = this.props[toCamelCase(propName)] as {default: unknown}|undefined;
            if (prop)
                prop.default = params.baseClassPropBindings[propName];
        }//for
    }//ctor

    private mergeProps(additionalProps: Record<string, DrawingElementClassProp>|undefined, withExceptions: boolean)
    {
        for (const name in additionalProps) {
            if (withExceptions && this.exceptProps?.includes(name))
                continue;
            const additionalProp = additionalProps[name];
            if (!(name in this.props))
                this.props[name] = clone(additionalProp);
            else {
                for (const key in additionalProp) {
                    const k = key as keyof DrawingElementClassProp;
                    if (additionalProp[k] === null)
                        this.props[name][k] = undefined;
                    else
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        this.props[name][k] = clone(additionalProp[k]) as any;
                }//for
            }//if
        }//for
    }//mergeProps

    /** Class name */
    readonly name: string;
    /** Class name (localized) */
    localizedName?: string;
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
    /** The names of the props that should be excluded from prop inheritance */
    readonly exceptProps?: string[];
    /** Indicates whether this class instances use template embedding for extending other classes */
    abstract readonly usesEmbedding: boolean;
    /** Props definition of the Vue-component for this class */
    readonly props: Record<string, DrawingElementClassProp>;
    /** Computed props (aka just "computed") definition of the Vue-component for this class */
    readonly computedProps?: ComputedProps;
    /** A list of the base classes for this class computed props set */
    readonly computedPropsBaseClasses?: DrawingElementClass[];
    /** Functions associated with this class (also sometimes called "methods") */
    readonly functions?: Functions;
    /** A list of the base classes for this class functions set */
    readonly functionsBaseClasses?: DrawingElementClass[];
    /** SVG Defs for this class */
    readonly defs?: Template;
    /** CSS styles defined in this class */
    readonly style?: PostCSSRoot;
    /** Class category (for ordering and usability) */
    readonly category?: string;
    /** Class category (localized) */
    localizedCategory?: string;
    /** Source XML-code of this class */
    readonly sourceCode?: string;
    /** A list of the referenced element classes */
    readonly referencedClasses: Set<DrawingElementClass>;

    /** Limits this class usage for embedding or inheritance */
    get isAbstract(): boolean {return Boolean(this.category?.startsWith('.'))}

    /** Returns all classes of this type */
    abstract getAllClasses(): Record<string, DrawingElementClass>;

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
        if (alreadySerialized.has(this) || !this.sourceCode)
            return "";

        let xml = "";
        for (const embedded of this.referencedClasses) {
            xml += embedded.toXML(indent, alreadySerialized);
        }//for
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
        if (this.computedPropsBaseClasses) {
            for (const base of this.computedPropsBaseClasses) {
                xml += base.toXML(indent, alreadySerialized);
            }//for
        }//if
        if (this.functionsBaseClasses) {
            for (const base of this.functionsBaseClasses) {
                xml += base.toXML(indent, alreadySerialized);
            }//for
        }//if

        xml += "\t" + this.sourceCode.split("\n").map(line => `\t${line}`).join("\n") + "\n";
        alreadySerialized.add(this);
        return xml;
    }//toXML


    public applyTranslation(translation: DrawingElementClassTranslation)
    {
        if (translation.name)
            this.localizedName = translation.name;
        if (translation.category)
            this.localizedCategory = translation.category;

        this.applyPropTranslations(translation.props, true);
    }//applyTranslation

    private applyPropTranslations(propTranslations: PropTranslation[], overrideExisting: boolean)
    {
        for (const prop of propTranslations) {
            if (prop.originalName in this.props) {
                const propToPatch = this.props[prop.originalName];
                if (prop.name && (overrideExisting || !("localizedName" in propToPatch)))
                    propToPatch.localizedName = prop.name;
                if (prop.description && (overrideExisting || !("localizedDescription" in propToPatch)))
                    propToPatch.localizedDescription = prop.description;
                if (prop.choices.length && propToPatch.validator && (overrideExisting || !("localizedValidValues" in propToPatch.validator))) {
                    propToPatch.validator!.localizedValidValues = prop.choices;
                }//if
            }//if
        }//for

        for (const className in this.getAllClasses()) {
            const clazz = this.getAllClasses()[className];
            const thisClassName = this.name;
            if (clazz.baseClass?.name === thisClassName || clazz.propsBaseClasses?.some(baseClass => baseClass.name === thisClassName))
                clazz.applyPropTranslations(propTranslations, false);
        }//for
    }//applyPropTranslations
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

type Validator = ((value: unknown, props: Record<string, unknown>) => boolean) & {
    min?: number,
    max?: number,
    pattern?: string,
    validValues?: string[],
    localizedValidValues?: string[],
};

export type PropTypeDescriptor = 
    {subprops: DrawingElementClassProps} | 
    {elements: DrawingElementClassProp}
    ;

export type DrawingElementClassProp = 
{
    localizedName?: string,
    type?: PropType<unknown>,
    typeDescriptor?: PropTypeDescriptor,
    required?: boolean,
    default?: unknown,
    validator?: Validator,
    category?: DrawingElementPropCategory,
    description?: string,
    localizedDescription?: string,
    subtype?: DrawingElementClassPropSubtype,
};
export type DrawingElementClassPropSubtype = "image-url" | "color";

export type DrawingElementClassProps = Record<string, DrawingElementClassProp>;
