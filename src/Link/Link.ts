/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import LinkClass from "./LinkClass";
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

    private parseEndpoint(strEndpoint: string): LinkEndPoint
    {
        let matches = strEndpoint.match(/^\s*(\d+),\s*(\d+)\s*$/);
        if (matches) {
            return new LinkEndPoint(this, {pos: {x: parseFloat(matches[1]), y: parseFloat(matches[2])}, conn: null});
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
                return new LinkEndPoint(this, {pos: null, conn: connectionPoint});
            } else {
                throw new KresmerException(
                    `Invalid link endpoint specification for the link "${this.name}": "${strEndpoint}"`);
            }//if
        }//if
    }//parseEndpoint

    readonly initEndPoints = () => {
        if (this.from) {
            this.startPoint = this.parseEndpoint(this.from);
        }//if
        if (this.to) {
            this.endPoint = this.parseEndpoint(this.to);
        }//if
    }//initEndPoints


    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Link>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

    // Endpoints (either connected or hanging)
    startPoint = new LinkEndPoint(this);
    endPoint = new LinkEndPoint(this);

}//Link

/** Link EndPoint (either connected or hanging) */

export interface ILinkEndPoint {
    pos: Position|null;
    conn: ConnectionPoint|null; 
}//ILinkEndPoint

export class LinkEndPoint implements ILinkEndPoint { 
    pos: Position|null;
    conn: ConnectionPoint|null; 
    link: Link;

    constructor(link: Link, initData: ILinkEndPoint = {pos: null, conn: null})
    {
        this.link = link;
        this.pos = initData.pos;
        this.conn = initData.conn;
    }//ctor

    get coords(): Position
    {
        if (this.pos) {
            return this.pos;
        } else if (this.conn?.coords?.x && this.conn?.coords?.y) {
            return this.conn.coords;
        } else {
            return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
        }//if
    }//endPointCoords
}//LinkEndPoint