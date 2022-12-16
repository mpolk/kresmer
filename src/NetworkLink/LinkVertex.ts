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
    vertexNumber: number;
    private initParams?: LinkVertexInitParams;
    private _isPinnedUp = false;
    get isPinnedUp() {return this._isPinnedUp}
    private _isConnected = false;
    private wasConnected = false;
    get isConnected() {return this._isConnected}
    pos?: Position;
    conn?: ConnectionPointProxy; 
    link: NetworkLink;

    public isGoingToBeDragged = false;
    public isDragged = false;
    private dragStartPos?: Position;
    private savedMousePos?: Position;

    constructor(link: NetworkLink, vertexNumber: number, initParams?: LinkVertexInitParams) 
    {
        this.link = link;
        this.vertexNumber = vertexNumber;
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
        this.link.kresmer.emit("link-vertex-move-started", this);
    }//startDrag


    public drag(event: MouseEvent)
    {
        if (this.isGoingToBeDragged) {
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this._isPinnedUp = true;
            this.wasConnected = this._isConnected;
            this._isConnected = false;
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
        this.link.kresmer.emit("link-vertex-being-moved", this);
        return true;
    }//drag


    public endDrag(event: MouseEvent)
    {
        if (!this.isDragged) {
            return false;
        }//if

        this.isDragged = false;
        const elementsUnderCursor = document.elementsFromPoint(event.x, event.y);
        for (const element of elementsUnderCursor) {
            const connectionPointData = element.getAttribute("data-connection-point");
            if (connectionPointData) {
                const [componentName, connectionPointName] = connectionPointData.split(':');
                const component = this.link.kresmer.getComponentByName(componentName);
                const connectionPoint = component?.connectionPoints[connectionPointName];
                if (connectionPoint) {
                    this._isConnected = true;
                    this._isPinnedUp = false;
                    if (connectionPoint !== this.conn) {
                        this.conn = connectionPoint;
                        this.link.kresmer.emit("link-vertex-connected", this);
                    }//if
                } else {
                    console.error('Reference to undefined connection point "%s"', connectionPointData);
                }//if
                return true;
            }//if
        }//for

        if (this.wasConnected) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.link.kresmer.emit("link-vertex-disconnected", this, this.conn!);
            this.conn = undefined;
        }//if
        this.link.kresmer.emit("link-vertex-moved", this);
        return true;
    }//endDrag


    public onRightClick(event: MouseEvent)
    {
        this.link.kresmer.emit("link-vertex-right-click", this, event);
    }//onRightClick

}//LinkVertex


export type LinkVertexInitParams = {
    pos?: Position, 
    conn?: {
        component: string, 
        connectionPoint: string
    }
}//LinkVertexInitParams
