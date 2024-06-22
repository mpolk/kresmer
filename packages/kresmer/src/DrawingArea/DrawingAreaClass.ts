/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area Class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import DrawingElementClass, { ComputedProps, Functions, DrawingElementClassProps } from "../DrawingElement/DrawingElementClass";
import { DrawingElementProps } from "../loaders/DrawingParser";
 
/**
 * Drawing Area Class - a generic drawing area class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class DrawingAreaClass extends DrawingElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params?: {
        version?: number,
        baseClass?: DrawingAreaClass,
        propsBaseClasses?: DrawingAreaClass[],
        computedPropsBaseClasses?: DrawingAreaClass[],
        styleBaseClasses?: DrawingAreaClass[],
        props?: DrawingElementClassProps,
        exceptProps?: string[],
        baseClassPropBindings?: DrawingElementProps,
        computedProps?: ComputedProps,
        functions?: Functions,
        functionsBaseClasses?: DrawingAreaClass[],
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
        sourceCode?: string,
    })
    {
        super(name, params);

        const existingClass = DrawingAreaClass.allClasses[name];
        if (!existingClass || existingClass.version < this.version)
            DrawingAreaClass.allClasses[name] = this;
    }//ctor

    override readonly usesEmbedding = false;

    protected static allClasses: Record<string, DrawingAreaClass> = {};
    /**
     *  Returns the class with the given name (if exists)
     *  @param name The name of the class to find
     */
    public static getClass(name: string): DrawingAreaClass|undefined {return this.allClasses[name]}

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "_Kre:area:" + this.name}

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
     get defsVueName() {return "_Kre:area:" + this.name + ".defs"}

}//DrawingAreaClass
