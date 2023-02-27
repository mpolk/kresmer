/****************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - a proxy object used to access
 * the Connection Point from outside of the Vue component hierarchy
\****************************************************************************/

import { reactive, ref } from "vue";
import NetworkComponent from "../NetworkComponent/NetworkComponent";
import { Position } from "../Transform/Transform";

export default class ConnectionPointProxy {
    /**
     * Constructs a connection point
     * @param component The component this connection point belongs to
     * @param name The name of the connection point
     * @param dir Prefered direction for the link connected here (angle from x-axis, initial value)
     */
    constructor(readonly component: NetworkComponent, readonly name: string|number, dir0: number|string)
    {
        this.dir0 = (typeof dir0 === 'string') ? parseFloat(dir0) : dir0;
        this.dir = this.dir0;
    }//ctor

    /** The current value of the prefered direction */
    public dir: number;
    /** The initial value of the prefered direction */
    readonly dir0: number;

    /** Absolute coordinates of the connection point */
    readonly coords = reactive<Position>({x: 0, y: 0});

    /** The setter for the coords property - 
     * the vue-component calls it when the connection point position is updated */
    _setPos(coords: Position, dir: number)
    {
        ({x: this.coords.x, y: this.coords.y} = coords);
        this.dir = dir;
    }//_setPos

    /** A trigger variable that signals the vue-component that it should refresh coords */
    readonly posUpdateTrigger = ref(0);
    /** A method to activate the coord update trigger. We have to use lambda-function to have
     *  access to the proper "this". */
    readonly updatePos = () =>
    {
        this.posUpdateTrigger.value++;
    }//updatePos

}//ConnectionPointProxy


export function parseConnectionPointData(connectionPointData: string)
{
    const [componentName, ...connectionPointParts] = connectionPointData.split(':');
    return {componentName, connectionPointName: connectionPointParts.join(':')};
}//parseConnectionPointData