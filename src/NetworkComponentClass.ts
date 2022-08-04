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
    })
    {
        this.name = name;
        this.template = params.template;
        this.props = params.props;
    }//ctor

    /**
     * Class name
     */
    private name: string;
    getName() {return this.name}
    /**
     * Template for the Vue-component for this class
     */
    private template: string | Element;
    getTemplate() {return this.template}
    /**
     * Props definition of the Vue-component for this class
     */
    private props?: ComponentObjectPropsOptions;
    getProps() {return this.props}

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    getVueName() {return "NetworkComponent_" + this.name}
}//NetworkComponentClass