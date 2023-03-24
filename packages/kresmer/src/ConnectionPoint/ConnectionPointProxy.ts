/****************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - a proxy object used to access
 * the Connection Point from outside of the Vue component hierarchy
\****************************************************************************/

import { nextTick, reactive, ref } from "vue";
import NetworkElement from "../NetworkElement";
import { Position } from "../Transform/Transform";

export default class ConnectionPointProxy {
    /**
     * Constructs a connection point
     * @param hostElement The network element this connection point belongs to
     * @param name The name of the connection point
     * @param dir Prefered direction for the link connected here (angle from x-axis, initial value)
     */
    constructor(readonly hostElement: NetworkElement, readonly name: string|number, dir0: number|string)
    {
        switch (dir0) {
            case 'right': this.dir0 = 0; break;
            case 'bottom': case 'down': this.dir0 = 90; break;
            case 'left': this.dir0 = 180; break;
            case 'top': case 'up': this.dir0 = 270; break;
            default:
                this.dir0 = Number(dir0);
        }//switch
        this.dir = this.dir0;
    }//ctor

    /** The current value of the prefered direction */
    public dir: number;
    /** The initial value of the prefered direction */
    readonly dir0: number;

    /** Absolute coordinates of the connection point */
    readonly coords = reactive<Position>({x: 0, y: 0});

    private _isPositioned = false;
    /** Indicates if the connection point is already positioned on the canvas */
    get isPositioned() { return this._isPositioned; }

    /** The setter for the coords property - 
     * the vue-component calls it when the connection point position is updated */
    _setPos(coords: Position, dir: number)
    {
        ({x: this.coords.x, y: this.coords.y} = coords);
        this.dir = dir;
        nextTick(() => {this._isPositioned = true;});
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
    // eslint-disable-next-line prefer-const
    let [elementName, ...connectionPointParts] = connectionPointData.split(':');
    let elementType: "component"|"link" = "component";
    let connectionPointName: string|number = connectionPointParts.join(':');
    if (elementName[0] === "-") {
        elementType = "link";
        elementName = elementName.slice(1);
        connectionPointName = Number(connectionPointName);
    }//if
    return {elementName, elementType, connectionPointName};
}//parseConnectionPointData