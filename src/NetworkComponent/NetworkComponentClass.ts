/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 ***************************************************************************/

import { ComponentObjectPropsOptions } from "vue";

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
        template: string | Element,
        props?: ComponentObjectPropsOptions,
        defs?: string | Element,
    })
    {
        this.name = name;
        this.template = params.template;
        this.props = params.props;
        this.defs = params.defs;
    }//ctor

    /**
     * Class name
     */
    readonly name: string;
    /**
     * Template for the Vue-component for this class
     */
    readonly template: string | Element;
    /**
     * Props definition of the Vue-component for this class
     */
    readonly props?: ComponentObjectPropsOptions;
    /**
     * Template for the Vue-component for this class
     */
    readonly defs?: string | Element;

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "_Kre:" + this.name}

    /**
     * Returns the name of the holder vue-component for this class
     * @returns The holder vue-component name
     */
    get holderVueName() {return "Kre:" + this.name}

    /**
     * Returns the name of the vue-component for this class defs
     * @returns The vue-component name defs
     */
     get defsVueName() {return "Kre:" + this.name + ".defs"}
    }//NetworkComponentClass
