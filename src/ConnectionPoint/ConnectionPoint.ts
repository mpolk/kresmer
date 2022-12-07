/****************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - data model layer
\****************************************************************************/

import { ToRefs } from "vue";
import { Position } from "../Transform/Transform";

export interface ConnectionPointProps  {
    name: string|number,
    x?: number,
    y?: number,
    d?: number,
    dir?: number,
}//ConnectionPointProps

export default class ConnectionPoint {
    props: ToRefs<ConnectionPointProps>;
    coords: Position;

    constructor(props: ToRefs<ConnectionPointProps>)
    {
        this.props = props;
        this.coords = {x: 0, y: 0};
    }//ctor

    setCoords(coords: Position)
    {
        this.coords = coords;
    }//setCoords
}//ConnectionPoint