/****************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - data model layer
\****************************************************************************/

import { reactive, ref } from "vue";
import { Position } from "../Transform/Transform";

export interface ConnectionPointProps  {
    name: string|number,
    x?: number,
    y?: number,
    d?: number,
    dir?: number,
}//ConnectionPointProps

export default class ConnectionPoint {
    readonly coords = reactive<Position>({x: 0, y: 0});
    readonly posUpdateTrigger = ref(0);

    setCoords(coords: Position)
    {
        ({x: this.coords.x, y: this.coords.y} = coords);
    }//setCoords

    readonly updatePos = () =>
    {
        this.posUpdateTrigger.value++;
    }//updatePos
}//ConnectionPoint