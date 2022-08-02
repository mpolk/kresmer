/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Location - a generic network element instance 
 * location data
 ***************************************************************************/

import NetworkComponent from "./NetworkComponent";

export default  class NetworkComponentLocation {
    component: NetworkComponent;
    origin: {x: number, y: number};

    constructor(
        component: NetworkComponent,
        params: {
            origin: {x: number, y: number};
        }
    ) {
        this.component = component;
        this.origin = params.origin;
    }//ctor
}//NetworkComponentLocation
