/****************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - a proxy object used to access
 * the Connection Point from outside of the Vue component hierarchy
\****************************************************************************/

import { reactive, ref } from "vue";
import { Position } from "../Transform/Transform";

export default class ConnectionPointProxy {
    constructor(dir: number)
    {
        this.dir = dir;
    }//ctor

    /** Preferable direction for connection (angle from x-axis) */
    readonly dir: number;

    /** Absolute coordinates of the connection point */
    readonly coords = reactive<Position>({x: 0, y: 0});

    /** The setter for the coords property - 
     * the vue-component calls it when the connection point position is updated */
    setCoords(coords: Position)
    {
        ({x: this.coords.x, y: this.coords.y} = coords);
    }//setCoords

    /** A trigger variable that signals the vue-component that it should refresh coords */
    readonly posUpdateTrigger = ref(0);
    /** A method to activate the coord update trigger. We have to use lambda-function to have
     *  access to the proper "this". */
    readonly updatePos = () =>
    {
        this.posUpdateTrigger.value++;
    }//updatePos
}//ConnectionPointProxy