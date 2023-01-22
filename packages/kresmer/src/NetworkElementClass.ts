/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 ***************************************************************************/

import { ComponentObjectPropsOptions } from "vue";
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
        props?: ComponentObjectPropsOptions,
        computedProps?: ComputedProps,
        defs?: Template,
        style?: PostCSSRoot,
    })
    {
        this.name = name;
        this.props = params.props ?? {};
        this.computedProps = params.computedProps;
        this.defs = params.defs;
        this.style = params.style;
    }//ctor

    /**
     * Class name
     */
    readonly name: string;
    /**
     * Props definition of the Vue-component for this class
     */
    readonly props: ComponentObjectPropsOptions;
    /**
     * Computed props (aka just computed) definition of the Vue-component for this class
     */
    readonly computedProps?: ComputedProps;
    /**
     * SVG Defs for this class
     */
    readonly defs?: Template;
    /**
     * CSS styles defined in this class
     */
    readonly style?: PostCSSRoot;

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
