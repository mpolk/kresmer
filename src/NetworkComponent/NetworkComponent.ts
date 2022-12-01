/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import NetworkComponentClass from "./NetworkComponentClass";
import { NetworkElement } from '../NetworkElement';
import ConnectionPoint from '../ConnectionPoint/ConnectionPoint';

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
        _class: NetworkComponentClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
            content?: unknown, 
        }
    ) {
        super();
        
        if (_class instanceof NetworkComponentClass)
            this._class = _class;
        else 
            this._class = NetworkComponentClass.getClass(_class);
        this.props = args?.props;
        this.content = args?.content;
        this.id = NetworkComponent.nextID++;
        this._name = args?.name;
    }//ctor

    /** Component class */
    readonly _class: NetworkComponentClass;
    getClass() {return this._class}
    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkComponent>;
    /** Return the vue-component name corresponding to this network component */
    get vueName() {return this._class.vueName}

    /** Data passed to the vue-component props */
    readonly props?: Record<string, unknown>;

    /** Data passed to the vue-component content (unnamed slot) */
    readonly content: unknown;

    /** A unique ID for this component instance */
    readonly id: number;
    protected static nextID = 1;

    /** A name for component lookup*/
    readonly _name?: string;
    get name()
    {
        if (this._name)
            return this._name;
        else
            return `Component${this.id}`;
    }//name

    /** A collection of this component connection points indexed by their names */
    readonly connectionPoints: Record<string, InstanceType<typeof ConnectionPoint>> = {};
}//NetworkComponent