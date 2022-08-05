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
export class Transform {
    rotate?: {angle: number, x?: number, y?: number};

    public toCSS() 
    {
        const chunks: string[] = [];

        if (this.rotate) {
            if (this.rotate.x !== undefined)
                chunks.push(`rotate(${this.rotate.angle} ${this.rotate.x} ${this.rotate.y})`);
            else
                chunks.push(`rotate(${this.rotate.angle}`);
        }//if

        return chunks.join(' ');
    }//toCSS
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
        this.transform = params.transform;
    }//ctor
}//NetworkComponentLocation
