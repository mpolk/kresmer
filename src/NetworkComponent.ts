/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import NetworkComponentClass from "./NetworkComponentClass";

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
            props?: Record<string, any>,
            content?: any, 
        }
    ) {
        if (_class instanceof NetworkComponentClass)
            this._class = _class;
        else 
            this._class = NetworkComponentClass.registeredClasses[_class];
        this.props = args?.props;
        this.content = args?.content;
        this.id = NetworkComponent.nextID++;
    }//ctor

    protected _class: NetworkComponentClass;
    getClass() {return this._class}
    getVueName() {return this._class.getVueName()}

    protected props?: Record<string, any>;
    getProps() {return this.props}

    protected content: any;
    getContent() {return this.content}

    protected id: number;
    getID() {return this.id}
    protected static nextID = 1;
}//NetworkComponent