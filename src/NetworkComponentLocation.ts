/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Location - a generic network element instance 
 * location data
 ***************************************************************************/

import NetworkComponent from "./NetworkComponent";

export type Origin = {x: number, y: number};
export type Transform = {
    rotate?: {angle: number, x?: number, y?: number},
}//Transform
export default  class NetworkComponentLocation {
    component: NetworkComponent;
    origin: Origin;
    transform?: Transform;

    constructor(
        component: NetworkComponent,
        params: {
            origin: Origin,
            transform?: Transform,
        }
    ) {
        this.component = component;
        this.origin = params.origin;
    }//ctor
}//NetworkComponentLocation
