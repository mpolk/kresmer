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
import DrawingElementClass, { ComputedProps, Functions, DrawingElementClassProps } from "../DrawingElement/DrawingElementClass";
import { DrawingElementProps } from "../loaders/DrawingParser";
 
/**
 * Network Link Class - a generic network link class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkLinkClass extends DrawingElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        version?: number,
        baseClass?: NetworkLinkClass,
        referencedClasses?: DrawingElementClass[],
        propsBaseClasses?: NetworkLinkClass[],
        computedPropsBaseClasses?: NetworkLinkClass[],
        styleBaseClasses?: NetworkLinkClass[],
        props?: DrawingElementClassProps,
        exceptProps?: string[],
        baseClassPropBindings?: DrawingElementProps,
        computedProps?: ComputedProps,
        functions?: Functions,
        functionsBaseClasses?: NetworkLinkClass[],
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
        sourceCode?: string,
    })
    {
        super(name, params);

        const existingClass = NetworkLinkClass.allClasses[name];
        if (!existingClass || existingClass.version < this.version)
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