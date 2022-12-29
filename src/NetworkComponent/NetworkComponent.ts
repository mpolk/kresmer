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
            isAutoInstantiated?: boolean,
        }
    ) {
        super(kresmer, _class instanceof NetworkComponentClass ? _class : NetworkComponentClass.getClass(_class), args);
        this.content = args?.content;
        this.isAutoInstantiated = !!args?.isAutoInstantiated;
    }//ctor

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkComponent>;

    /** Data passed to the vue-component content (unnamed slot) */
    readonly content: unknown;

    /** Indicates where the component was auto instanctiated when its class was registered */
    readonly isAutoInstantiated: boolean;

    toString()
    {
        return `${this.name}: ${this.getClass().name}`;
    }//toString

    override getDefaultName()
    {
        return `Component${this.id}`;
    }//getDefaultName

    /** A collection of this component connection points indexed by their names */
    readonly connectionPoints: Record<string, ConnectionPointProxy> = {};

    override get isSelected() {return this._isSelected}
    override set isSelected(reallyIs: boolean) {
        const shouldNotify = reallyIs != this.isSelected;
        this._isSelected = reallyIs;
        if (shouldNotify) {
            this.kresmer.emit("component-selected", this, this.isSelected);
        }//if
    }//isSelected
}//NetworkComponent