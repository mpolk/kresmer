/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 ***************************************************************************/

import { ComponentPropsOptions } from "vue";

/**
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkComponentClass {
    /**
     * Class name
     */
    private name: string;
    getName() {return this.name}
    /**
     * Template for the Vue-component for this class
     */
    private template: string;
    getTemplate() {return this.template}
    /**
     * Props definition of the Vue-component for this class
     */
    private props?: ComponentPropsOptions;
    getProps() {return this.props}

    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        template: string,
        props?: ComponentPropsOptions,
    })
    {
        this.name = name;
        this.template = params.template;
        this.props = params.props;
    }//ctor

    /**
     * A singleton list of all Component Classes, registerd by Kresmer
     */
    static readonly registeredClasses: Record<string, NetworkComponentClass> = {};
    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    getVueName() {return "NetworkComponent_" + this.name}
}//NetworkComponentClass