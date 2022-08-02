/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import Kresmer from './Kresmer';
import NetworkComponentClass from "./NetworkComponentClass";

type PropType = Record<string, any>;
type ContentType = any;

/**
 * Network Component - a generic network element instance 
 */
export default class NetworkComponent {
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
            props?: PropType,
            content?: ContentType, 
        }
    ) {
        if (_class instanceof NetworkComponentClass)
            this._class = _class;
        else 
            this._class = Kresmer.getNetworkComponentClass(_class);
        this.props = args?.props;
        this.content = args?.content;
        this.id = NetworkComponent.nextID++;
    }//ctor

    /** Component class */
    protected _class: NetworkComponentClass;
    getClass() {return this._class}
    /** Return the vue-component name corresponding to this network component */
    getVueName() {return this._class.getVueName()}

    /** Data passed to the vue-component props */
    protected props?: PropType;
    getProps() {return this.props}

    /** Data passed to the vue-component content (unnamed slot) */
    protected content: ContentType;
    getContent() {return this.content}

    /** A unique ID for this component instance */
    protected id: number;
    getID() {return this.id}
    protected static nextID = 1;
}//NetworkComponent