/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Class - a network link class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import NetworkElementClass, { ComputedProps, NetworkElementClassProps } from "../NetworkElementClass";
import { NetworkElementProps } from "../loaders/DrawingParser";
 
/**
 * Network Link Class - a generic network link class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkLinkClass extends NetworkElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        baseClass?: NetworkLinkClass,
        propsBaseClasses?: NetworkLinkClass[],
        styleBaseClasses?: NetworkLinkClass[],
        props?: NetworkElementClassProps,
        baseClassPropBindings?: NetworkElementProps,
        computedProps?: ComputedProps,
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
    })
    {
        if (params.baseClass) {
            params.props = {...params.baseClass.props, ...params.props};
        }//if
        super(name, params);
        NetworkLinkClass.allClasses[name] = this;
    }//ctor

    override readonly usesEmbedding = false;

    private static allClasses: Record<string, NetworkLinkClass> = {};
    /**
     *  Returns the class with the given name (if exists)
     *  @param name The name of the class to find
     */
    public static getClass(name: string) {return this.allClasses[name]}

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "_Kre:link:" + this.name}

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
     get defsVueName() {return "_Kre:link:" + this.name + ".defs"}
}//LinkClass
