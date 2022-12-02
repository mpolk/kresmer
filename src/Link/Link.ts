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
        super();
        
        if (_class instanceof LinkClass)
            this._class = _class;
        else 
            this._class = LinkClass.getClass(_class);
        this.props = args?.props;
        this.id = Link.nextID++;
        this._name = args?.name;
    }//ctor

    /** Component class */
    readonly _class: LinkClass;
    getClass() {return this._class}
    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Link>;
    /** Return the vue-component name corresponding to this link */
    get vueName() {return this._class.vueName}

    /** Data passed to the vue-component props */
    readonly props?: Record<string, unknown>;

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
            return `Link${this.id}`;
    }//name

}//Link