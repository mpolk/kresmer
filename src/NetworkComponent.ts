/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 * (either an equipment unit or a link)
 ***************************************************************************/

import NetworkComponentClass from "./NetworkComponentClass";

export default class NetworkComponent {
    
    public constructor(_class: NetworkComponentClass | string)
    {
        if (_class instanceof NetworkComponentClass)
            this._class = _class;
        else 
            this._class = NetworkComponentClass.registeredClasses[_class];
    }//ctor

    protected _class: NetworkComponentClass;
    getClass() {return this._class}
    getVueName() {return this._class.getVueName()}
}//NetworkComponent