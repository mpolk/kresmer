/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network element class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import { Prop } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import { Template } from "./Kresmer";

/**
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default abstract class NetworkElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        baseClass?: NetworkElementClass,
        styleBaseClasses?: NetworkElementClass[],
        propsBaseClasses?: NetworkElementClass[],
        props?: NetworkElementClassProps,
        computedProps?: ComputedProps,
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
    })
    {
        this.name = name;
        this.baseClass = params.baseClass;
        this.styleBaseClasses = params.styleBaseClasses;
        this.propsBaseClasses = params.propsBaseClasses;
        this.props = params.props ?? {};
        this.computedProps = params.computedProps;
        this.defs = params.defs;
        this.style = params.style;
        this.category = params.category;
    }//ctor

    /** Class name */
    readonly name: string;
    /** Base class (for the element as a whole) */
    readonly baseClass?: NetworkElementClass;
    /** A list of the base classes for this class CSS */
    readonly styleBaseClasses?: NetworkElementClass[];
    /** A list of the base classes for this class props set */
    readonly propsBaseClasses?: NetworkElementClass[];
    /** Indicates whether this class instances use template embedding for extending other classes */
    abstract readonly usesEmbedding: boolean;
    /** Props definition of the Vue-component for this class */
    readonly props: NetworkElementClassProps;
    /** Computed props (aka just computed) definition of the Vue-component for this class */
    readonly computedProps?: ComputedProps;
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
}//NetworkElementClass

/** Network Element computed prop - translate to the common Vue computed property */
export interface ComputedProp {
    name: string,
    body: string,
}//ComputedProp

/** Network Component computed props - translate to the common Vue computed properties */
export type ComputedProps = Record<string, ComputedProp>;

export enum NetworkElementPropCategory {
    Hardware=1, 
    Optics,
    Network, 
    Geometry,  
    Presentation, 
}//NetworkElementPropCategory

export type NetworkElementClassProp = Prop<unknown, unknown> & 
    {
        category?: NetworkElementPropCategory,
        description?: string,
    };
export type NetworkElementClassProps = Record<string, NetworkElementClassProp>;
