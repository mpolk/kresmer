/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Link Vertex (either connected or free)
 ***************************************************************************/

import { Position } from "../Transform/Transform";
import KresmerException, { UndefinedBundleException, UndefinedVertexException } from "../KresmerException";
import NetworkLink from "./NetworkLink";
import ConnectionPointProxy, { parseConnectionPointData } from "../ConnectionPoint/ConnectionPointProxy";
import { EditorOperation } from "../UndoStack";
import type { RequireAtLeastOne } from "../Utils";

/** Link Vertex (either connected or free) */

export default class LinkVertex {

    constructor(public link: NetworkLink, vertexNumber: number, public initParams?: LinkVertexInitParams) {
        this.ownConnectionPoint = new ConnectionPointProxy(this.link, this.vertexNumber, 0);
        this._vertexNumber = vertexNumber;
        this.ownConnectionPoint.name = String(vertexNumber);
        this.key = link.nextVertexKey++;
    }//ctor

    private _vertexNumber: number;
    get vertexNumber() {return this._vertexNumber}
    set vertexNumber(n: number)
    {
        this._vertexNumber = n;
        this.ownConnectionPoint.name = String(n);
    }//set vertexNumber

    readonly key: number;
    private pos?: Position;
    private conn?: ConnectionPointProxy;
    private bundle?: BundleJoinDescriptor;
    public ownConnectionPoint: ConnectionPointProxy;

    // This "manual" setter is used to adjust other vertices positioning mode accordingly 
    // to the link's loopback mode
    private setConn(newValue: ConnectionPointProxy|undefined) {
        if (this.conn !== newValue) {
            const oldConn = this.conn;
            if (!this.isHead && !this.isTail || this.initParams) {
                this.conn = newValue;
            } else {
                const wasLoopback = this.link.isLoopback;
                this.conn = newValue;
                if (wasLoopback !== this.link.isLoopback) {
                    this.link.toggleVertexPositioningMode(this);
                }//if
            }//if
            if (this.conn) {
                this.conn.hostElement.registerConnectedLink(this.link);
            } else if (oldConn) {
                oldConn.hostElement.unregisterConnectedLink(this.link);
            }//if
            this.ownConnectionPoint.isActive = !this.conn && !this.bundle;
        }//if
    }//setConn
    
    private savedConn?: ConnectionPointProxy;
    get isConnected() {return Boolean(this.conn);}

    public isGoingToBeDragged = false;
    public isDragged = false;
    private dragStartPos?: Position;
    private savedMousePos?: Position;

    isBlinking = false;

    get isHead() {return this.vertexNumber === 0;}
    get isTail() {return this.vertexNumber === this.link.vertices.length - 1;}
    get isEndpoint() {return this.vertexNumber === 0 || this.vertexNumber >= this.link.vertices.length - 1;}
    get isInitialized() {return !this.initParams;}

    toString()
    {
        if (this.conn) {
            return this.conn.toString();
        } else if (this.pos) {
            return `(${this.pos.x.toFixed()}, ${this.pos.y.toFixed()})`
        } else {
            return "()";
        }//if
    }//toString

    get displayString()
    {
        if (this.conn) {
            return this.conn.displayString;
        } else if (this.pos) {
            return `(${this.pos.x.toFixed()}, ${this.pos.y.toFixed()})`
        } else {
            return "()";
        }//if
    }//displayString

    public toXML()
    {
        if (this.conn) {
            const elementName =  this.conn.hostElement instanceof NetworkLink ? 
                `-${this.conn.hostElement.name}`: this.conn.hostElement.name;
            return `<vertex connect="${elementName}:${this.conn.name}"/>`;
        } else if (this.bundle) {
            return `<vertex bundle="${this.bundle.afterVertex.link.name}" after="${this.bundle.afterVertex.vertexNumber}" distance="${this.bundle.distance}"/>`;
        } else if (this.pos) {
            return `<vertex x="${this.pos.x}" y="${this.pos.y}"/>`;
        } else {
            return `<vertex/>`;
        }//if
    }//toXML


    /** Postponned part of the initialization delayed until after all components are mounted */
    init(): LinkVertex
    {
        if (this.initParams?.pos) {
            this.pinUp(this.initParams.pos);
        } else if (this.initParams?.cpData) {
            const cpHostElement = this.link.kresmer.getElementByName(this.initParams.cpData.cpHostElement);
            if (!cpHostElement) {
                this.link.kresmer.raiseError(new KresmerException(
                    `Attempt to connect to the non-existing component "${this.initParams.cpData.cpHostElement}"`,
                    {source: `Link "${this.link.name}"`}));
                return this;
            }//if
            const connectionPoint = cpHostElement.getConnectionPoint(this.initParams.cpData.connectionPoint);
            if (!connectionPoint) {
                this.link.kresmer.raiseError(new KresmerException(
                    `Attempt to connect to non-existing connection point \
                    "${this.initParams.cpData.cpHostElement}:${this.initParams.cpData.connectionPoint}"`,
                    {source: `Link "${this.link.name}"`}))
                return this;
            }//if
            this.connect(connectionPoint);
        } else if (this.initParams?.bundleData) {
            const bundle = this.link.kresmer.getLinkByName(this.initParams.bundleData.bundleName);
            if (!bundle) {
                this.link.kresmer.raiseError(new UndefinedBundleException({
                    message:`Attempt to connect to the non-existing bundle "${this.initParams.bundleData.bundleName}"`,
                    source: `Link "${this.link.name}"`}));
                return this;
            }//if
            const afterVertex = bundle.vertices[this.initParams.bundleData.afterVertex];
            if (!afterVertex) {
                this.link.kresmer.raiseError(new UndefinedVertexException(
                    {message: `Attempt to connect to non-existing connection point \
                    "${this.initParams.bundleData.bundleName}:${this.initParams.bundleData.afterVertex}"`,
                    source: `Link "${this.link.name}"`}))
                return this;
            }//if
            this.connectToBundle({afterVertex, distance: this.initParams.bundleData.distance});
        } else if (this.initParams?.conn) {
            this.connect(this.initParams.conn);
        // } else {
        //     throw new KresmerException(`Invalid connection point initialization params: ${this.initParams}`);
        }//if
        this.initParams = undefined;
        return this;
    }//init

    pinUp(pos: Position)
    {
        this.pos = {...pos};
        this.setConn(undefined);
        this.bundle = undefined;
    }//pinUp

    connect(connectionPoint: ConnectionPointProxy)
    {
        this.setConn(connectionPoint);
        this.pos = undefined;
        this.bundle = undefined;
    }//connect

    connectToBundle(bundle: BundleJoinDescriptor)
    {
        this.bundle = {...bundle};
        this.setConn(undefined);
        this.pos = undefined;
    }//connectToBundle

    get coords(): Position
    {
        if (this.conn) {
            return this.conn.coords;
        } else if (this.bundle) {
            const afterVertex = this.bundle.afterVertex;
            const n = afterVertex.vertexNumber;
            const beforeVertex = afterVertex.link.vertices[n+1];
            if (!afterVertex.isInitialized || !beforeVertex.isInitialized)
                return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
            const p1 = afterVertex.coords;
            const p2 = beforeVertex.coords;
            let d = this.bundle.distance;
            const h = Math.sqrt((p2.y-p1.y)*(p2.y-p1.y) + (p2.x-p1.x)*(p2.x-p1.x));
            if (d > h)
                d = h;
            const x = p1.x + d * (p2.x-p1.x) / h;
            const y = p1.y + d * (p2.y-p1.y) / h;
            return {x, y};
        } else if (this.pos && this.link.isLoopback) {
            const headCoords = this.link.head.coords;
            return {x: headCoords.x + this.pos.x, y: headCoords.y + this.pos.y};
        } else if (this.pos) {
            return this.pos;
        } else {
            return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
        }//if
    }//coords

    get anchor(): LinkVertexAnchor
    {
        return {
            pos: this.pos,
            conn: this.conn,
            bundle: this.bundle,
        } as LinkVertexAnchor
    }//get anchor

    set anchor(newPos: LinkVertexAnchor)
    {
        this.pos = newPos.pos;
        this.setConn(newPos.conn);
        this.bundle = newPos.bundle;
    }//set anchor


    private getMousePosition(event: MouseEvent) {
        return this.link.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition


    public startDrag(event: MouseEvent)
    {
        this.dragStartPos = {...this.coords};
        if (this.link.isLoopback && !this.isConnected) {
            this.dragStartPos = this.link.absPosToRel(this.dragStartPos);
        }//if
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
            this.pinUp(this.coords);
        } else if (!this.isDragged) {
            return false;
        }//if
            
        const mousePos = this.getMousePosition(event);
        this.pos = {
            x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
            y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
        }
        this.link.kresmer.emit("link-vertex-being-moved", this);
        this.ownConnectionPoint.updatePos();
        return true;
    }//drag


    public endDrag(event: MouseEvent)
    {
        if (!this.isDragged) {
            return false;
        }//if

        this.isDragged = false;
        const elementsUnderCursor = document.elementsFromPoint(event.x, event.y);
        const stickToConnectionPoints = !this.link.isBundle && ((this.isEndpoint && !event.ctrlKey) || (!this.isEndpoint && event.ctrlKey));
        const stickToBundles = !this.link.isBundle && !this.isEndpoint;

            for (const element of elementsUnderCursor) {
                if (stickToConnectionPoints) {
                    const connectionPointData = element.getAttribute("data-connection-point");
                    if (connectionPointData) {
                        if (this.tryToConnectToConnectionPoint(connectionPointData))
                            return true;
                        else
                            continue;
                    }//if
                }//if
                if (stickToBundles) {
                    const bundleData = element.getAttribute("data-link-bundle");
                    if (bundleData) {
                        if (this.tryToConnectToBundle(bundleData, event))
                            return true;
                        else
                            continue;
                    }//if
                }//if
            }//for

        if (this.link.kresmer.snapToGrid) {
            this.pos = {
                x: Math.round(this.pos!.x / this.link.kresmer.snappingToGridStep) * this.link.kresmer.snappingToGridStep,
                y: Math.round(this.pos!.y / this.link.kresmer.snappingToGridStep) * this.link.kresmer.snappingToGridStep
            };
        }//if
        this.link.kresmer.undoStack.commitOperation();
        if (this.savedConn) {
            if (this.conn !== this. savedConn) {
                this.link.kresmer.emit("link-vertex-disconnected", this, this.conn!);
            }//if
            this.savedConn = undefined;
        }//if
        this.link.kresmer.emit("link-vertex-moved", this);
        this.ownConnectionPoint?.updatePos();
        return true;
    }//endDrag


    private tryToConnectToConnectionPoint(connectionPointData: string): boolean
    {
        const {elementName, elementType, connectionPointName} = parseConnectionPointData(connectionPointData);
        let connectionPoint: ConnectionPointProxy | undefined;
        switch (elementType) {
            case "component": {
                const component = this.link.kresmer.getComponentByName(elementName);
                connectionPoint = component?.getConnectionPoint(connectionPointName);
            } break;
            case "link": {
                const linkToConnectTo = this.link.kresmer.getLinkByName(elementName);
                const vertexToConnectTo = linkToConnectTo?.vertices[connectionPointName as number];
                if (vertexToConnectTo === this)
                    return false;
                if (vertexToConnectTo?.isConnected && vertexToConnectTo?.conn === this.ownConnectionPoint)
                    return false;
                connectionPoint = vertexToConnectTo?.ownConnectionPoint;
            } break;
        }//switch
        if (connectionPoint) {
            if (!connectionPoint.isActive)
                return false;
            this.connect(connectionPoint);
        } else {
            this.link.kresmer.raiseError(new KresmerException(
                `Reference to undefined connection point "${connectionPointData}"`));
        }//if
        this.link.kresmer.undoStack.commitOperation();
        this.link.kresmer.emit("link-vertex-connected", this);
        this.ownConnectionPoint?.updatePos();
        return true;
    }//tryToConnectToConnectionPoint


    private tryToConnectToBundle(bundleData: string, event: MouseEvent): boolean
    {
        const [bundleName, vertexNumber] = bundleData.split(":", 2);
        const bundle = this.link.kresmer.getLinkByName(bundleName);
        if (!bundle) {
            this.link.kresmer.raiseError(new UndefinedBundleException({message: `Attempt to connect to the undefined bundle "${bundleName}"`}));
            return true;
        }//if
        if (!bundle.isBundle) {
            this.link.kresmer.raiseError(new UndefinedBundleException({message: `Attempt to connect to the non-bundle link "${bundleName}"`}));
            return true;
        }//if
        const vertex = bundle.vertices[Number(vertexNumber)];
        if (!vertex) {
            this.link.kresmer.raiseError(new UndefinedVertexException({message: `Attempt to connect to the undefined vertex "${bundleData}"`}));
            return true;
        }//if

        const v = vertex.coords;
        const p = this.link.kresmer.applyScreenCTM(event);
        const d = Math.sqrt((p.x-v.x)*(p.x-v.x) + (p.y-v.y)*(p.y-v.y));
        this.connectToBundle({afterVertex: vertex, distance: d});
        this.link.kresmer.undoStack.commitOperation();
        this.link.kresmer.emit("link-vertex-connected", this);
        this.ownConnectionPoint?.updatePos();
        return true;
    }//tryToConnectToBundle


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
        let newPos = 
            (predecessor.isConnected && predecessor.isEndpoint && (!successor.isConnected || !successor.isEndpoint)) ?
            this.alignBetweenConnectionAndPosition(predecessor, successor) :
            (successor.isConnected && successor.isEndpoint && (!predecessor.isConnected || !predecessor.isEndpoint)) ?
                this.alignBetweenConnectionAndPosition(successor, predecessor) :
                this.alignBetweenTwoPositions(predecessor, successor);

        let shouldMove = Boolean(newPos);
        const outOfLimits = newPos && (
            newPos.x <= 0 || newPos.x >= this.link.kresmer.logicalWidth ||
            newPos.y <= 0 || newPos.y >= this.link.kresmer.logicalHeight);
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
            if (this.link.isLoopback) {
                newPos = this.link.absPosToRel(newPos!);
            }//if
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
        this.isBlinking = true;
        setTimeout(() => {this.isBlinking = false}, 500);
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

export type LinkVertexInitParams = RequireAtLeastOne<LinkVertexAnchor & {
    cpData?: {
        cpHostElement: string, 
        connectionPoint: string
    },
    bundleData?: {
        bundleName: string,
        afterVertex: number,
        distance: number
    },
}> | Record<string, never>;

/** Extended Link Vertex position (includes its connection if it is connected) */
export type LinkVertexAnchor = RequireAtLeastOne<{
    pos?: Position,
    conn?: ConnectionPointProxy,
    bundle?: BundleJoinDescriptor,
}>//LinkVertexExtAnchor

export type BundleJoinDescriptor = {
    afterVertex: LinkVertex,
    distance: number,
}//BundleJoinDescriptor

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
        this.vertex.ownConnectionPoint?.updatePos();
    }//undo

    override exec(): void {
        this.vertex.anchor = this.newAnchor!;
        this.vertex.ownConnectionPoint?.updatePos();
    }//exec
}//VertexMoveOp
