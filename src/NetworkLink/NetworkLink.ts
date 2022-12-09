/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import LinkClass from "./NetworkLinkClass";
import { NetworkElement } from '../NetworkElement';
import { Position } from "../Transform/Transform";
import ConnectionPoint from "../ConnectionPoint/ConnectionPoint";
import Kresmer from "../Kresmer";
import KresmerException from "../KresmerException";

/**
 * Network Component - a generic network element instance 
 */
export default class Link extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Lonk class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        kresmer: Kresmer,
        _class: LinkClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
            from?: string,
            to?: string,
        }
    ) {
        super(kresmer, _class instanceof LinkClass ? _class : LinkClass.getClass(_class), args);
        this.from = args?.from;
        this.to = args?.to;
    }//ctor

    readonly from?: string;
    readonly to?: string;

    // Endpoints (either connected or hanging)
    startPoint = new LinkEndPoint(this);
    endPoint = new LinkEndPoint(this);

    readonly initEndPoints = () => {
        this.from && this.parseEndpoint(this.from, this.startPoint);
        this.to && this.parseEndpoint(this.to, this.endPoint);
    }//initEndPoints

    private parseEndpoint(strEndpoint: string, endPoint: LinkEndPoint)
    {
        let matches = strEndpoint.match(/^\s*(\d+),\s*(\d+)\s*$/);
        if (matches) {
            endPoint.pinUp({x: parseFloat(matches[1]), y: parseFloat(matches[2])});
        } else {
            matches = strEndpoint.match(/^([-A-Za-z0-9_]+):([-A-Za-z0-9_]+)$/);
            if (matches) {
                const component = this.kresmer.getComponentByName(matches[1]);
                if (!component) {
                    throw new KresmerException(
                        `Attempt to connect a link "${this.name}" to the non-existing component ${matches[1]}`);
                }//if
                const connectionPoint = component.connectionPoints[matches[2]];
                if (!connectionPoint) {
                    throw new KresmerException(
                        `Attempt to connect a link "${this.name}" to the non-existing connection point ${strEndpoint}`);
                }//if
                endPoint.connect(connectionPoint);
            } else {
                throw new KresmerException(
                    `Invalid link endpoint specification for the link "${this.name}": "${strEndpoint}"`);
            }//if
        }//if
    }//parseEndpoint


    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Link>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

}//Link

/** Link EndPoint (either connected or free) */

export class LinkEndPoint {
    private _isPinnedUp = false;
    private _isConnected = false;
    pos?: Position;
    conn?: ConnectionPoint; 
    link: Link;

    constructor(link: Link)
    {
        this.link = link;
    }//ctor

    pinUp(pos: Position)
    {
        this.pos = {...pos};
        this._isPinnedUp = true;
        this._isConnected = false;
    }//pinUp

    connect(connectionPoint: ConnectionPoint)
    {
        this.conn = connectionPoint;
        this._isPinnedUp = false;
        this._isConnected = true;
    }//connect

    get coords(): Position
    {
        if (this._isPinnedUp) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.pos!;
        } else if (this._isConnected) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.conn!.coords;
        } else {
            return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
        }//if
    }//endPointCoords
}//LinkEndPoint