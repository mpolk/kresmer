/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import LinkClass from "./LinkClass";
import { NetworkElement } from '../NetworkElement';
// import ConnectionPoint from '../ConnectionPoint/ConnectionPoint';

/**
 * Network Component - a generic network element instance 
 */
export default class Link extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Lonk class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        _class: LinkClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
        }
    ) {
        super(_class instanceof LinkClass ? _class : LinkClass.getClass(_class), args);
    }//ctor

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Link>;
    
    getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

}//Link