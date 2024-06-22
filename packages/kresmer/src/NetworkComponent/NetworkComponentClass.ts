/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network component class
 * (the word "class" here means a Kresmer class, not a Typescript one)
 ***************************************************************************/

import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import { ComputedProps, Functions, DrawingElementClassProps } from "../DrawingElement/DrawingElementClass";
import DrawingElementClass from "../DrawingElement/DrawingElementClass";
import { DrawingElementProps } from "../loaders/DrawingParser";

/**
 * Network Component Class - a generic network component class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkComponentClass extends DrawingElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        version?: number,
        baseClass?: NetworkComponentClass,
        propsBaseClasses?: NetworkComponentClass[],
        computedPropsBaseClasses?: NetworkComponentClass[],
        styleBaseClasses?: NetworkComponentClass[],
        template: Template,
        props?: DrawingElementClassProps,
        exceptProps?: string[],
        baseClassChildNodes?: NodeList,
        baseClassPropBindings?: DrawingElementProps,
        computedProps?: ComputedProps,
        functions?: Functions,
        defs?: Template,
        style?: PostCSSRoot,
        category?: string,
        defaultContent?: string,
        sourceCode?: string,
    })
    {
        super(name, params);
        this.template = params.template;
        this.baseClassChildNodes = params.baseClassChildNodes;

        if (this.baseClass  && this.template instanceof Element) {
            const baseClass = this.baseClass as NetworkComponentClass;
            const baseInstanceNode = this.template.ownerDocument.createElement(baseClass.adapterVueName);
            if (params.baseClassChildNodes) {
                const n = params.baseClassChildNodes.length;
                for (let i = 0; i < n; i++) {
                    baseInstanceNode.append(params.baseClassChildNodes[i].cloneNode(true));
                }//for
            }//if
            baseInstanceNode.setAttribute("v-bind:name", "name");
            for (const propName in this.props) {
                if (!params.baseClassPropBindings || !(propName in params.baseClassPropBindings))
                    baseInstanceNode.setAttribute(`v-bind:${propName}`, propName);
            }//for
            for (const propName in params.baseClassPropBindings) {
                baseInstanceNode.setAttribute(propName, String(params.baseClassPropBindings[propName]));
            }//for

            this.originalTemplate = this.template.cloneNode(true) as Element;
            this.template.prepend(baseInstanceNode);
        }//if

        this.defaultContent = params.defaultContent;
        const existingClass = NetworkComponentClass.allClasses[name];
        if (!existingClass || existingClass.version < this.version)
            NetworkComponentClass.allClasses[name] = this;
    }//ctor

    private readonly baseClassChildNodes?: NodeList;
    override readonly usesEmbedding = true;
    
    private static allClasses: Record<string, NetworkComponentClass> = {};
    /**
     *  Returns the class with the given name (if exists)
     *  @param name The name of the class to find
     */
    public static getClass(name: string) {return this.allClasses[name]}

    /**
     * Template for the Vue-component for this class
     */
    public template: Template;
    // its copy untouched
    private readonly originalTemplate?: Element;
    /** The default content for the component (i.e. its slot) */
    readonly defaultContent?: string;

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "_Kre:" + this.name}

    /**
     * Returns the name of the adapter vue-component for this class
     * @returns The adapter vue-component name
     */
    get adapterVueName() {return "Kre:" + this.name}

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
     get defsVueName() {return "_Kre:" + this.name + ".defs"}

}//NetworkComponentClass
