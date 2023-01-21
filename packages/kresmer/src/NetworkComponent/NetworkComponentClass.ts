/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network component class
 * (the word "class" here means a runtime class, not a Typescript one)
 ***************************************************************************/

import { ComponentObjectPropsOptions } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import { Template } from "../Kresmer";
import { ComputedProps } from "../NetworkElementClass";
import NetworkElementClass from "../NetworkElementClass";

/**
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkComponentClass extends NetworkElementClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        template: Template,
        props?: ComponentObjectPropsOptions,
        computedProps?: ComputedProps,
        defs?: Template,
        style?: PostCSSRoot,
        autoInstanciate?: boolean,
    })
    {
        super(name, params);
        this.template = params.template;
        this.autoInstanciate = Boolean(params.autoInstanciate);
        NetworkComponentClass.allClasses[name] = this;
    }//ctor

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
    /** Specifies that a single class instance should be created after the class is registered */
    readonly autoInstanciate: boolean;

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "_Kre:" + this.name}

    /**
     * Returns the name of the adapter vue-component for this class
     * @returns The holder vue-component name
     */
    get adapterVueName() {return "Kre:" + this.name}

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
     get defsVueName() {return "_Kre:" + this.name + ".defs"}
}//NetworkComponentClass