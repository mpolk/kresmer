/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element class
 * (either an equipment unit or a link)
 ***************************************************************************/

import { ComponentPropsOptions } from "vue";

export default class NetworkComponentClass {
    private name: string;
    getName() {return this.name}
    private template: string;
    getTemplate() {return this.template}
    private props?: ComponentPropsOptions;
    getProps() {return this.props}

    public constructor(name: string, params: {
        template: string,
        props?: ComponentPropsOptions,
    })
    {
        this.name = name;
        this.template = params.template;
        this.props = params.props;
    }//ctor

    static readonly registeredClasses: Record<string, NetworkComponentClass> = {};
    getVueName() {return "NetworkComponent_" + this.name}
}//NetworkComponentClass