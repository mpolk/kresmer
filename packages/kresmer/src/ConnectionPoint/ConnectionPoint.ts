/****************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - a proxy object used to access
 * the Connection Point from outside of the Vue component hierarchy
\****************************************************************************/

import { reactive } from "vue";
import DrawingElement from "../DrawingElement/DrawingElement";
import NetworkLink from "../NetworkLink/NetworkLink";
import { Position } from "../Transform/Transform";
import LinkVertex from "../NetworkLink/LinkVertex";
import { NetworkComponent } from "../Kresmer";

export default class ConnectionPoint {
    /**
     * Constructs a connection point
     * @param hostElement The drawing element this connection point belongs to
     * @param name The name of the connection point
     * @param dir Preferred direction for the link connected here (angle from x-axis, initial value)
     */
    constructor(hostElement: DrawingElement, public name: string|number, dir0: number|string, connectionIDs?: string|undefined)
    {
        this._hostElement = new WeakRef(hostElement);
        switch (dir0) {
            case 'right': this.dir0 = 0; break;
            case 'bottom': case 'down': this.dir0 = 90; break;
            case 'left': this.dir0 = 180; break;
            case 'top': case 'up': this.dir0 = 270; break;
            default:
                this.dir0 = Number(dir0);
        }//switch
        this.dir = this.dir0;

        connectionIDs?.split(/ *, */).map(cid => cid.trim()).forEach(cid => {
            cid = cid.trim();
            if (cid.startsWith("in:"))
                this.connectionIDs.in = cid.slice(3);
            else if (cid.startsWith("out:"))
                this.connectionIDs.out.push(cid.slice(4));
            else
                this.connectionIDs.inout = cid;
        })

    }//ctor

    private readonly _hostElement: WeakRef<DrawingElement>;
    get hostElement() { return this._hostElement.deref()! }

    readonly connectionIDs: {in: string|undefined, out: string[], inout: string|undefined} = 
        {in: undefined, out: [], inout: undefined};

    toString() { 
        const prefix = this.hostElement instanceof NetworkLink ? "-" : "";
        return `${prefix}${this.hostElement.name}:${this.name}`; 
    }//toString

    get displayString() { return this.toString().replace(/@[a-z0-9]+$/, ""); }

    /** The current value of the preferred direction */
    public dir: number;
    /** The initial value of the preferred direction */
    readonly dir0: number;

    /** Absolute coordinates of the connection point */
    readonly coords = reactive<Position>({x: 0, y: 0});

    /** Indicates if the connection point accepts connections */
    isActive = true;

    /** The setter for the coords property - 
     * the vue-component calls it when the connection point position is updated */
    _setPos(coords: Position, dir: number)
    {
        ({x: this.coords.x, y: this.coords.y} = coords);
        this.dir = dir;
    }//_setPos

    /** A trigger variable that signals the vue-component that it should refresh coords */
    readonly posUpdateTrigger = reactive({value: 0});
    /** A method to activate the coord update trigger. We have to use lambda-function to have
     *  access to the proper "this". */
    readonly updatePos = (newPos?: Position) =>
    {
        if (newPos) {
            ({x: this.coords.x, y: this.coords.y} = newPos);
        } else {
            this.posUpdateTrigger.value++;
        }//if
    }//updatePos

    /** A collection of link vertices currently connected to this connection point */
    readonly connectedVertices = new Set<LinkVertex>();
    /** Saves connected vertices, which are going to be temporarily disconnected (suspended), inside the host component */
    saveConnectedVertices()
    {
        if (this.hostElement instanceof NetworkComponent) {
            this.hostElement.saveDisconnectedVertices(...this.connectedVertices.values());
        }//if
    }//saveConnectedVertices
    /** Restores vertices that was temporarily disconnected (suspended) */
    restoreConnectedVertices()
    {
        if (this.hostElement instanceof NetworkComponent) {
            this.hostElement.restoreDisconnectedVertices(this);
        }//if
    }//restoreConnectedVertices


    propagateLinkHighlightingIn(isHighlighted: boolean)
    {

        const cid = this.connectionIDs.in ?? this.connectionIDs.inout;
        if (cid)
            this.hostElement.propagateLinkHighlighting(cid, isHighlighted);
    }//propagateLinkHighlightingIn


    propagateLinkHighlightingOut(connToPropagate: string, isHighlighted: boolean)
    {
        const ourCIDs = [...this.connectionIDs.out];
        if (this.connectionIDs.inout)
            ourCIDs.push(this.connectionIDs.inout);
        if (ourCIDs.includes("*") || ourCIDs.includes(connToPropagate)) {
            this.connectedVertices.forEach(v => {v.parentElement.isHighlighted = isHighlighted});
        }//if
    }//propagateLinkHighlightingOut
}//ConnectionPoint


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