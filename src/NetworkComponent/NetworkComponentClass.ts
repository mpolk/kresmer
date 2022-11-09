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
import { Template } from "../Kresmer";

/**
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkComponentClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        template: Template,
        props?: ComponentObjectPropsOptions,
        defs?: Template,
        style?: PostCSSRoot,
    })
    {
        this.name = name;
        this.template = params.template;
        this.props = params.props;
        this.defs = params.defs;
        this.style = params.style;
        NetworkComponentClass.allClasses[name] = this;
    }//ctor

    private static allClasses: Record<string, NetworkComponentClass> = {};
    /**
     *  Returns the class with the given name (if exists)
     *  @param name The name of the class to find
     */
    public static getClass(name: string) {return this.allClasses[name]}

    /**
     * Class name
     */
    readonly name: string;
    /**
     * Template for the Vue-component for this class
     */
    public template: string | Element;
    /**
     * Props definition of the Vue-component for this class
     */
    readonly props?: ComponentObjectPropsOptions;
    /**
     * SVG Defs for this class
     */
    readonly defs?: string | Element;
    /**
     * CSS styles defined in this class
     */
     readonly style?: PostCSSRoot;

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "Kre:" + this.name}

    /**
     * Returns the name of the holder vue-component for this class
     * @returns The holder vue-component name
     */
    get holderVueName() {return "_Kre:" + this.name}

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
     get defsVueName() {return "Kre:" + this.name + ".defs"}
}//NetworkComponentClass
