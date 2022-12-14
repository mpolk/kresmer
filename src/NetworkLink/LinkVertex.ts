/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Link Vertex (either connected or free)
 ***************************************************************************/

import { Position } from "../Transform/Transform";
import KresmerException from "../KresmerException";
import NetworkLink from "./NetworkLink";
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPointProxy";

/** Link Vertex (either connected or free) */

export default class LinkVertex {
    private initParams?: LinkVertexInitParams;
    private _isPinnedUp = false;
    get isPinnedUp() {return this._isPinnedUp}
    private _isConnected = false;
    get isConnected() {return this._isConnected}
    pos?: Position;
    conn?: ConnectionPointProxy; 
    link: NetworkLink;

    public isGoingToBeDragged = false;
    public isDragged = false;
    private dragStartPos?: Position;
    private savedMousePos?: Position;

    constructor(link: NetworkLink, initParams?: LinkVertexInitParams) 
    {
        this.link = link;
        this.initParams = initParams;
    }//ctor

    /** Postponned part of the initialization delayed until after all components are mounted */
    init()
    {
        if (this.initParams?.pos) {
            this.pinUp(this.initParams.pos);
        } else if (this.initParams?.conn) {
            const component = this.link.kresmer.getComponentByName(this.initParams.conn.component);
            if (!component) {
                throw new KresmerException(
                    `Attempt to connect a link "${this.link.name}" \
                    to the non-existing component ${this.initParams.conn.component}`);
            }//if
            const connectionPoint = component.connectionPoints[this.initParams.conn.connectionPoint];
            if (!connectionPoint) {
                throw new KresmerException(
                    `Attempt to connect a link "${this.link.name}" \
                    to the non-existing connection point \
                    ${this.initParams.conn.component}:${this.initParams.conn.connectionPoint}`);
            }//if
            this.connect(connectionPoint);
        }//if
    }//init

    pinUp(pos: Position)
    {
        this.pos = {...pos};
        this._isPinnedUp = true;
        this._isConnected = false;
    }//pinUp

    connect(connectionPoint: ConnectionPointProxy)
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

    private getMousePosition(event: MouseEvent) {
        return this.link.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent)
    {
        this.dragStartPos = {...this.coords};
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        this.link.bringToTop();
        this.link.kresmer.onLinkVertexMoveStart(this);
    }//startDrag

    public drag(event: MouseEvent)
    {
        if (this.isGoingToBeDragged) {
            this.isGoingToBeDragged = false;
            this.isDragged = true;
        } else if (!this.isDragged) {
            return false;
        }//if
            
        const mousePos = this.getMousePosition(event);
        this.pos = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
        }
        this.link.kresmer.onLinkVertexBeingMoved(this);
        return true;
    }//drag

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(event: MouseEvent)
    {
        if (this.isDragged) {
            this.isDragged = false;
            this.link.kresmer.onLinkVertexMoved(this);
            return true;
        }//if

        return false;
    }//endDrag
}//LinkVertex


export type LinkVertexInitParams = {
    pos?: Position, 
    conn?: {
        component: string, 
        connectionPoint: string
    }
}//LinkVertexInitParams
