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
import { EditorOperation } from "../UndoStack";

/** Link Vertex (either connected or free) */

export default class LinkVertex {
    vertexNumber: number;
    initParams?: LinkVertexInitParams;
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
            return this.pos!;
        } else if (this._isConnected) {
            return this.conn!.coords;
        } else {
            return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
        }//if
    }//endPointCoords

    get extPos(): LinkVertexExtPos
    {
        return {
            pos: this.pos,
            conn: this.conn,
            isPinnedUp: this._isPinnedUp,
            isConnected: this._isConnected,
        }
    }//get extPos

    set extPos(extPos: LinkVertexExtPos)
    {
        this.pos = extPos.pos;
        this.conn = extPos.conn;
        this._isPinnedUp = extPos.isPinnedUp;
        this._isConnected = extPos.isConnected;
    }//set extPos


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
        this.link.kresmer.undoStack.startOperation(new VertexMoveOp(this));
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
            x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
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
                this.link.kresmer.undoStack.commitOperation();
                return true;
            }//if
        }//for

        if (this.wasConnected) {
            this.link.kresmer.emit("link-vertex-disconnected", this, this.conn!);
            this.conn = undefined;
        }//if
        this.link.kresmer.emit("link-vertex-moved", this);
        this.link.kresmer.undoStack.commitOperation();
        return true;
    }//endDrag


    public onRightClick(event: MouseEvent)
    {
        this.link.kresmer.emit("link-vertex-right-click", this, event);
    }//onRightClick

}//LinkVertex

// Auxiliary interfaces for initialization and position saving
export interface LinkVertexInitParams  {
    pos?: Position, 
    conn?: {
        component: string, 
        connectionPoint: string
    }
}//LinkVertexInitParams

/** Extended Link Vertex position (includes its connection if it is connected) */
interface LinkVertexExtPos {
    pos?: Position;
    conn?: ConnectionPointProxy; 
    isPinnedUp: boolean,
    isConnected: boolean,
}//LinkVertexExtPos

// Editor operations
class VertexMoveOp extends EditorOperation {
    constructor(vertex: LinkVertex)
    {
        super();
        this.vertex = vertex;
        this.oldPos = vertex.extPos;
    }//ctor

    private vertex: LinkVertex;
    private oldPos: LinkVertexExtPos;
    private newPos?: LinkVertexExtPos;

    override onCommit()
    {
        this.newPos = this.vertex.extPos;
    }//onCommit

    override undo(): void {
        this.vertex.extPos = this.oldPos;
    }//undo

    override exec(): void {
        this.vertex.extPos = this.newPos!;
    }//exec
}//VertexMoveOp
