/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import NetworkComponentClass from "./NetworkComponentClass";
import NetworkElement, {NetworkElementData} from '../NetworkElement';
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
            dbID?: number|string|null,
            props?: Record<string, unknown>,
            content?: unknown, 
            isAutoInstantiated?: boolean,
        }
    ) {
        const componentClass = _class instanceof NetworkComponentClass ? _class : NetworkComponentClass.getClass(_class);
        super(kresmer, componentClass, args);
        this.content = args?.content ?? componentClass.defaultContent;
        this.isAutoInstantiated = Boolean(args?.isAutoInstantiated);
    }//ctor

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkComponent>;

    /** Data passed to the vue-component content (unnamed slot) */
    readonly content: unknown;

    /** Indicates where the component was auto instanctiated when its class was registered */
    readonly isAutoInstantiated: boolean;

    /** Underlying SVG element */
    svg?: SVGSVGElement;

    toString()
    {
        return `${this.name}: ${this.getClass().name}`;
    }//toString

    override getNamePrefix()
    {
        return "Component";
    }//getNamePrefix

    override checkNameUniqueness(name: string): boolean {
        return name == this.name || !this.kresmer.componentsByName.has(name);
    }//checkNameUniqueness

    propsUpdateIndicator = 0;

    override setData(data: NetworkElementData)
    {
        super.setData(data);
        this.propsUpdateIndicator++;
        this.updateConnectionPoints();
    }//setData
}//NetworkComponent