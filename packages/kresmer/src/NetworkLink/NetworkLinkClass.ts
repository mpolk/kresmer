/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Class - a network link class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import NetworkElementClass, { ComputedProps, Functions, NetworkElementClassProps } from "../NetworkElement/NetworkElementClass";
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
        computedPropsBaseClasses?: NetworkLinkClass[],
        styleBaseClasses?: NetworkLinkClass[],
        props?: NetworkElementClassProps,
        exceptProps?: string[],
        baseClassPropBindings?: NetworkElementProps,
        computedProps?: ComputedProps,
        functions?: Functions,
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
    })
    {
        super(name, params);

        NetworkLinkClass.allClasses[name] = this;
    }//ctor

    override readonly usesEmbedding = false;

    protected static allClasses: Record<string, NetworkLinkClass> = {};
    /**
     *  Returns the class with the given name (if exists)
     *  @param name The name of the class to find
     */
    public static getClass(name: string): NetworkLinkClass|undefined {return this.allClasses[name]}

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

/** Class specialized for the link bundles */
export class LinkBundleClass extends NetworkLinkClass {
    public static getClass(name: string): LinkBundleClass|undefined 
    {
        const clazz = this.allClasses[name];
        return clazz instanceof LinkBundleClass ? clazz : undefined;
    }//getClass
}//LinkBundleClass