/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import NetworkComponentClass from "./NetworkComponentClass";
import NetworkElement from '../NetworkElement';
import ConnectionPointProxy from '../ConnectionPoint/ConnectionPointProxy';
import Kresmer from "../Kresmer";

/**
 * Network Component - a generic network element instance 
 */
export default class NetworkComponent extends NetworkElement {
    /**
     * 
     * @param _class The class this component should belong 
     *               (either NetworkComponent class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     *             content: translates to the vue-component content (unnamed slot)
     */
    public constructor(
        kresmer: Kresmer,
        _class: NetworkComponentClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
            content?: unknown, 
        }
    ) {
        super(kresmer, _class instanceof NetworkComponentClass ? _class : NetworkComponentClass.getClass(_class), args);
        this.content = args?.content;
    }//ctor

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkComponent>;

    /** Data passed to the vue-component content (unnamed slot) */
    readonly content: unknown;

    override getDefaultName()
    {
        return `Component${this.id}`;
    }//getDefaultName

    /** A collection of this component connection points indexed by their names */
    readonly connectionPoints: Record<string, ConnectionPointProxy> = {};
}//NetworkComponent