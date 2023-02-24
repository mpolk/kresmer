/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
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

    constructor(public link: NetworkLink, public vertexNumber: number, public initParams?: LinkVertexInitParams) {}

    get isConnected() {return Boolean(this.conn);}

    private pos?: Position;
    private conn?: ConnectionPointProxy; 
    private savedConn?: ConnectionPointProxy;

    public isGoingToBeDragged = false;
    public isDragged = false;
    private dragStartPos?: Position;
    private savedMousePos?: Position;

    showBlinker = false;

    toString()
    {
        if (this.conn) {
            return `${this.conn.component.name}:${this.conn.name}`;
        } else if (this.pos) {
            return `(${this.pos.x.toFixed()}, ${this.pos.y.toFixed()})`
        } else {
            return "()";
        }//if
    }//toString

    public toXML()
    {
        if (this.conn) {
            return `<vertex connect="${this.conn.component.name}:${this.conn.name}"/>`;
        } else if (this.pos) {
            return `<vertex x="${this.pos.x}" y="${this.pos.y}"/>`;
        } else {
            return `<vertex/>`;
        }//if
    }//toXML


    get isEndpoint()
    {
        return this.vertexNumber === 0 || this.vertexNumber >= this.link.vertices.length - 1;
    }//isEndpoint


    /** Postponned part of the initialization delayed until after all components are mounted */
    init()
    {
        if (this.initParams?.pos) {
            this.pinUp(this.initParams.pos);
        } else if (this.initParams?.conn) {
            const component = this.link.kresmer.getComponentByName(this.initParams.conn.component);
            if (!component) {
                this.link.kresmer.raiseError(new KresmerException(
                    `Attempt to connect to the non-existing component "${this.initParams.conn.component}"`,
                    {source: `Link "${this.link.name}"`}));
                return this;
            }//if
            const connectionPoint = component.connectionPoints[this.initParams.conn.connectionPoint];
            if (!connectionPoint) {
                this.link.kresmer.raiseError(new KresmerException(
                    `Attempt to connect to non-existing connection point \
                    "${this.initParams.conn.component}:${this.initParams.conn.connectionPoint}"`,
                    {source: `Link "${this.link.name}"`}))
                return this;
            }//if
            this.connect(connectionPoint);
        } else if (this.initParams?.connectionPoint) {
            this.connect(this.initParams.connectionPoint);
        // } else {
        //     throw new KresmerException(`Invalid connection point initialization params: ${this.initParams}`);
        }//if
        this.initParams = undefined;
        return this;
    }//init

    pinUp(pos: Position)
    {
        this.pos = {...pos};
        this.conn = undefined;
    }//pinUp

    connect(connectionPoint: ConnectionPointProxy)
    {
        this.conn = connectionPoint;
        this.pos = undefined;
    }//connect

    get coords(): Position
    {
        if (this.conn) {
            return this.conn.coords;
        } else if (this.pos) {
            return this.pos;
        } else {
            return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
        }//if
    }//endPointCoords

    get anchor(): LinkVertexAnchor
    {
        return {
            pos: this.pos,
            conn: this.conn,
        }
    }//get anchor

    set anchor(newPos: LinkVertexAnchor)
    {
        this.pos = newPos.pos;
        this.conn = newPos.conn;
    }//set anchor


    private getMousePosition(event: MouseEvent) {
        return this.link.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition


    public startDrag(event: MouseEvent)
    {
        this.dragStartPos = {...this.coords};
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        this.link.kresmer.deselectAllElements(this.link);
        this.link.bringToTop();
        this.link.kresmer.emit("link-vertex-move-started", this);
        this.link.kresmer.undoStack.startOperation(new VertexMoveOp(this));
    }//startDrag


    public drag(event: MouseEvent)
    {
        if (this.isGoingToBeDragged) {
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this.savedConn = this.conn;
            this.conn = undefined;
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
                    this.connect(connectionPoint);
                } else {
                    console.error('Reference to undefined connection point "%s"', connectionPointData);
                }//if
                this.link.kresmer.undoStack.commitOperation();
                this.link.kresmer.emit("link-vertex-connected", this);
                return true;
            }//if
        }//for

        this.link.kresmer.undoStack.commitOperation();
        if (this.savedConn) {
            if (this.conn !== this. savedConn) {
                this.link.kresmer.emit("link-vertex-disconnected", this, this.conn!);
            }//if
            this.savedConn = undefined;
        }//if
        this.link.kresmer.emit("link-vertex-moved", this);
        return true;
    }//endDrag


    public onRightClick(event: MouseEvent)
    {
        this.link.kresmer.emit("link-vertex-right-click", this, event);
    }//onRightClick


    public align()
    {
        if (this.isConnected) {
            console.warn(`Cannot align the connected vertex (${this.link.name}:${this.vertexNumber})`);
            return null;
        }//if
        if (this.isEndpoint) {
            console.warn(`Cannot align an endpoint (${this.link.name}:${this.vertexNumber})`);
            return null;
        }//if
        const predecessor = this.link.vertices[this.vertexNumber - 1];
        const prePos = predecessor.coords;
        const successor = this.link.vertices[this.vertexNumber + 1];
        const sucPos = successor.coords;

        this.link.kresmer.undoStack.startOperation(new VertexMoveOp(this));
        const newPos = 
            (predecessor.isConnected && predecessor.isEndpoint && (!successor.isConnected || !successor.isEndpoint)) ?
            this.alignBetweenConnectionAndPosition(predecessor, successor) :
            (successor.isConnected && successor.isEndpoint && (!predecessor.isConnected || !predecessor.isEndpoint)) ?
                this.alignBetweenConnectionAndPosition(successor, predecessor) :
                this.alignBetweenTwoPositions(predecessor, successor);

        let shouldMove = Boolean(newPos);
        const outOfLimits = newPos && (
            newPos.x <= 0 || newPos.x >= this.link.kresmer.logicalBox.width ||
            newPos.y <= 0 || newPos.y >= this.link.kresmer.logicalBox.height);
        if (outOfLimits) {
            shouldMove = false;
            this.blink();
        }//if
        const hitToPre = newPos && newPos.x == prePos.x && newPos.y == prePos.y;
        if (hitToPre) {
            shouldMove = false;
            predecessor.blink();
        }//if
        const hitToSuc = newPos && newPos.x == sucPos.x && newPos.y == sucPos.y;
        if (hitToSuc) {
            shouldMove = false;
            successor.blink();
        }//if

        if (shouldMove) {
            this.pinUp(newPos!);
            this.link.kresmer.undoStack.commitOperation();
            this.link.kresmer.emit("link-vertex-moved", this);
            return this;
        } else {
            this.link.kresmer.undoStack.cancelOperation();
            return null;
        }//if
    }//align

    private alignBetweenTwoPositions(predecessor: LinkVertex, successor: LinkVertex)
    {
        const l1 = Math.hypot(this.coords.x - predecessor.coords.x, this.coords.y - successor.coords.y);
        const l2 = Math.hypot(this.coords.y - predecessor.coords.y, this.coords.x - successor.coords.x);
        let x: number; let y: number;
        if (l1 < l2) {
            x = predecessor.coords.x; y = successor.coords.y;
        } else {
            x = successor.coords.x; y = predecessor.coords.y;
        }//if
        return {x, y};
    }//alignBetweenTwoPositions

    private alignBetweenConnectionAndPosition(connected: LinkVertex, positioned: LinkVertex)
    {
        const c = connected.coords;
        const p = positioned.coords;
        const dir = connected.conn!.dir % 360;
        let newPos: Position | null;
        switch (dir) {
            case 0:
                newPos = (p.x > c.x) ? {x: p.x, y: c.y} : null;
                break;
            case 90:
                newPos = (p.y > c.y) ? {x: c.x, y: p.y} : null;
                break;
            case 180:
                newPos = (p.x < c.x) ? {x: p.x, y: c.y} : null;
                break;
            case 270:
                newPos = (p.y < c.y) ? {x: c.x, y: p.y} : null;
                break;
            default: {
                const k = Math.tan(dir/180 * Math.PI);
                let sx: number; let sy: number;
                if (dir < 90) {
                    sx = 1; sy = 1;
                } else if (dir < 180) {
                    sx = -1; sy = 1;
                } else if (dir < 270) {
                    sx = -1; sy = -1;
                } else {
                    sx = 1; sy = -1;
                }//if
                let dx = Number.POSITIVE_INFINITY;
                let dy = Number.POSITIVE_INFINITY;
                let newPosX: Position;
                let newPosY: Position;
                if (Math.sign(p.x - c.x) === sx) {
                    dx = p.x - c.x;
                    newPosX = {x: p.x, y: c.y + k * dx};
                }//if
                if (Math.sign(p.y - c.y) === sy) {
                    dy = p.y - c.y;
                    newPosY = {x: c.x + dy / k, y: p.y};
                }//if
                if (Math.abs(dx) < Math.abs(dy)) {
                    newPos = newPosX!;
                } else if (Number.isFinite(dy)) {
                    newPos = newPosY!;
                } else {
                    newPos =  null;
                }//if
            }//default
        }//switch

        if (!newPos) {
            connected.blink();
            positioned.blink();
        }//if
        return newPos;
    }//alignBetweenConnectionAndPosition


    public blink()
    {
        this.showBlinker = true;
        setTimeout(() => {this.showBlinker = false}, 500);
    }//blink


    public detach()
    {
        if (this.isConnected) {
            this.pinUp({...this.coords});
        }//if
        return this;
    }//detach
}//LinkVertex


// Auxiliary interfaces for initialization and position saving
export interface LinkVertexInitParams  {
    pos?: Position, 
    conn?: {
        component: string, 
        connectionPoint: string
    },
    connectionPoint?: ConnectionPointProxy,
}//LinkVertexInitParams

/** Extended Link Vertex position (includes its connection if it is connected) */
interface LinkVertexAnchor {
    pos?: Position;
    conn?: ConnectionPointProxy; 
}//LinkVertexExtAnchor

// Editor operations
class VertexMoveOp extends EditorOperation {
    constructor(private vertex: LinkVertex)
    {
        super();
        this.oldAnchor = vertex.anchor;
    }//ctor

    private oldAnchor: LinkVertexAnchor;
    private newAnchor?: LinkVertexAnchor;

    override onCommit()
    {
        this.newAnchor = this.vertex.anchor;
    }//onCommit

    override undo(): void {
        this.vertex.anchor = this.oldAnchor;
    }//undo

    override exec(): void {
        this.vertex.anchor = this.newAnchor!;
    }//exec
}//VertexMoveOp
