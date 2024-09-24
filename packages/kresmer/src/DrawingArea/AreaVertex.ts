/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area Vertex
 ***************************************************************************/

import Vertex from "../Vertex/Vertex";
import { VertexInitParams } from "../Vertex/Vertex";
import { Position, Shift } from "../Transform/Transform";
import DrawingArea from "./DrawingArea";
import MouseEventCapture from "../MouseEventCapture";
import { EditorOperation } from "../UndoStack";
import XMLFormatter, { XMLTag } from "../XMLFormatter";
import { KresmerException } from "../Kresmer";

/** Drawing Area Vertex */

export default class AreaVertex extends Vertex {

    /**
     * Constructs a new vertex
     * @param parentElement The element this vertex belongs to
     * @param vertexNumber An index of the vertex within the parent element
     * @param initParams A set of the initialization params used in the delayed initialization
     */
    constructor(parentElement: DrawingArea, vertexNumber: number, initParams?: AreaVertexInitParams) 
    {
        super(parentElement, vertexNumber, initParams);
        this._geometry = new AreaVertexGeometry(initParams?.geometry);
    }//ctor

    get parentElement() {return super.parentElement as DrawingArea}
    private _isSelected = false;
    get isSelected() { return this._isSelected }
    set isSelected(newValue: boolean)
    {
        if (newValue) {
            for (const v of this.parentElement.vertices) {
                if (v !== this)
                    v._isSelected = false;
            }//for
        }//if
        this._isSelected = newValue;
    }//isSelected

    override get nextNeighbour(): AreaVertex {return this.parentElement.vertices[(this.vertexNumber + 1) % this.parentElement.vertices.length]}
    override get prevNeighbour(): AreaVertex {
        let i = this.vertexNumber - 1;
        if (i < 0)
            i += this.parentElement.vertices.length;
        return this.parentElement.vertices[i];
    }//prevNeighbor

    private _geometry: AreaVertexGeometry;
    get geometry(): AreaVertexGeometry {return this._geometry}
    set geometry(newValue: AreaVertexGeometryRaw|AreaVertexGeometry) {this._geometry = new AreaVertexGeometry(newValue)}

    changeType(newType: AreaVertexType)
    {
        if (newType === this.geometry.type)
            return;
        const prevVertex = this.prevNeighbour!;
        switch (newType) {
            case "C":
                this.geometry = {
                    type: newType, 
                    cp1: {x: this.coords.x/3 + prevVertex.coords.x*2/3, y: this.coords.y/3 + prevVertex.coords.y*2/3}, 
                    cp2: this.geometry.controlPoints[0] ?? 
                        {x: this.coords.x*2/3 + prevVertex.coords.x/3, y: this.coords.y*2/3 + prevVertex.coords.y/3}, 
                };
                break;
            case "S":
                this.geometry = {
                    type: newType, 
                    cp2: this.geometry.controlPoints[1] ?? this.geometry.controlPoints[0] ?? 
                        {x: this.coords.x*2/3 + prevVertex.coords.x/3, y: this.coords.y*2/3 + prevVertex.coords.y/3}, 
                };
                break;
            case "Q":
                this.geometry = {
                    type: newType, 
                    cp: this.geometry.controlPoints[1] ?? this.geometry.controlPoints[0] ?? 
                        {x: (this.coords.x + prevVertex.coords.x) / 2, y: (this.coords.y + prevVertex.coords.y) / 2}
                };
                break;
            case "L":
                this.geometry = {type: newType};
                break;
            case "T":
                this.geometry = {type: newType};
        }//switch
    }//changeType

    readonly handleCaptureTargets: SVGElement[] = [];
    isGoingToDragHandle?: 1|2;
    handleDragged?: 1|2;

    override init() {return super.init() as AreaVertex}

    override startDrag(event: MouseEvent): void 
    {
        super.startDrag(event);
        this.isSelected = true;
    }//startDrag


    public startHandleDrag(event: MouseEvent, handleNumber: 1|2)
    {
        this.dragStartPos = {...this._geometry.controlPoints[handleNumber-1]!};
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToDragHandle= handleNumber;
        if (event.shiftKey)
            this.dragConstraint = "unknown";
        MouseEventCapture.start(this.handleCaptureTargets[handleNumber]);
        this.parentElement.kresmer.emit("area-vertex-handle-move-started", this, handleNumber);
        this.parentElement.kresmer.undoStack.startOperation(new VertexGeomChangeOp(this));
    }//startHandleDrag


    public dragHandle(event: MouseEvent, handleNumber: 1|2)
    {
        if (!this.handleDragged && !this.isGoingToDragHandle)
            return false;

        const mousePos = this.getMousePosition(event);
        if (this.isGoingToDragHandle) {
            this.isGoingToDragHandle = undefined;
            this.handleDragged = handleNumber;
        }//if

        if (this.dragConstraint === "unknown") {
            const r = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};
            if (Math.hypot(r.x, r.y) > 3) {
                if (Math.abs(r.x) >= Math.abs(r.y))
                    this.dragConstraint = "x";
                else
                    this.dragConstraint = "y";
            }//if
        }//if

        switch (this.dragConstraint) {
            case "x":
                this._geometry.controlPoints[handleNumber-1] = {
                    x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
                    y: this.dragStartPos!.y,
                }
                break;
            case "y":
                this._geometry.controlPoints[handleNumber-1] = {
                    x: this.dragStartPos!.x,
                    y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
                }
                break;
            default:
                this._geometry.controlPoints[handleNumber-1] = {
                    x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
                    y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
                }
        }//switch
        this.parentElement.kresmer.emit("area-vertex-handle-being-moved", this, handleNumber);
        return true;
    }//dragHandle


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endHandleDrag(_event: MouseEvent, handleNumber: 1|2)
    {
        this.isGoingToDragHandle = undefined;
        if (!this.handleDragged) {
            return false;
        }//if

        this.handleDragged = undefined;
        MouseEventCapture.release();

        if (this.snapToGrid) {
            this._geometry.controlPoints[handleNumber-1] = {
                x: Math.round(this._geometry.controlPoints[handleNumber-1]!.x / this.parentElement.kresmer.snappingGranularity) * this.parentElement.kresmer.snappingGranularity,
                y: Math.round(this._geometry.controlPoints[handleNumber-1]!.y / this.parentElement.kresmer.snappingGranularity) * this.parentElement.kresmer.snappingGranularity
            };
        }//if

        this.parentElement.kresmer.undoStack.commitOperation();
        this.parentElement.kresmer.emit("area-vertex-handle-moved", this, handleNumber);

        this.dragConstraint = undefined;
        return true;
    }//endHandleDrag


    move(delta: Shift)
    {
        this.pinUp({x: this.coords.x + delta.x, y: this.coords.y + delta.y});
        this._geometry.move(delta);
    }//move

    override onClick(): void 
    {
        super.onClick();
        this.isSelected = true;
    }//onClick

    override notifyOnVertexMoveStart(): void
    {
        this.parentElement.kresmer.emit("area-vertex-move-started", this);
    }//notifyOnVertexMoveStart

    override notifyOnVertexBeingMoved(): void
    {
        this.parentElement.kresmer.emit("area-vertex-being-moved", this);
    }//notifyOnVertexBeingMoved

    override notifyOnVertexMove(): void
    {
        this.parentElement.kresmer.emit("area-vertex-moved", this);
    }//notifyOnVertexMove

    override onRightClick(event: MouseEvent)
    {
        this.parentElement.kresmer.emit("area-vertex-right-click", this, event);
    }//onRightClick

    override toXML(formatter: XMLFormatter)
    {
        const tag = new XMLTag("vertex");
        if (this._anchor.pos) {
            tag.addAttrib("x", this._anchor.pos.x)
               .addAttrib("y", this._anchor.pos.y);
        }//if
        this.geometry.toXML(tag);
        formatter.addTag(tag);
    }//toXML

    toPath(prevVertex?: AreaVertex)
    {
        let g = this._geometry;
        if (prevVertex?._geometry.controlPoints.length) {
            const cp0 = prevVertex._geometry.controlPoints[prevVertex._geometry.controlPoints.length - 1];
            const cp1 = {x: 2 * prevVertex.coords.x - cp0.x, y: 2 * prevVertex.coords.y - cp0.y};
            switch (this._geometry.type) {
                case "S": 
                    g = new AreaVertexGeometry({type:"C", cp1, cp2: this._geometry.controlPoints[0]!});
                    break;
                case "T": 
                    g = new AreaVertexGeometry({type:"Q", cp: cp1});
                    break;
            }//switch
        }//if

        return g.toPath(this.coords);
    }//toPath

}//AreaVertex

export type AreaVertexGeometryRaw =
    | {type: "L"}
    | {type: "C", cp1: Position, cp2: Position}
    | {type: "S", cp2: Position}
    | {type: "Q", cp: Position}
    | {type: "T"}
    ;

export type AreaVertexType = AreaVertexGeometryRaw["type"];
export type AreaSegmentType = AreaVertexType;

export class AreaVertexGeometry {
    constructor();
    constructor(init: AreaVertexGeometryRaw|AreaVertexGeometry|undefined);
    constructor(type: string, ...controlPoints: Position[]);
    constructor(init?: AreaVertexGeometryRaw|AreaVertexGeometry|string|undefined, ...controlPoints: Position[])
    {
        if (init instanceof AreaVertexGeometry) {
            this.type = init.type;
            init.controlPoints.forEach(cp => {this.controlPoints.push({...cp})});
        } else if (typeof init === "string") {
            switch (init) {
                case "L": case "C": case "S": case "Q": case "T":
                    this.type = init;
                    controlPoints.forEach(cp => {this.controlPoints.push({...cp})});
                    break;
                default:
                    throw new KresmerException(`Invalid area vertex type: ${init}`);
            }//switch
            if ((this.type === "L" && this.controlPoints.length !== 0) ||
                (this.type === "C" && this.controlPoints.length !== 2) ||
                (this.type === "S" && this.controlPoints.length !== 1) ||
                (this.type === "Q" && this.controlPoints.length !== 1) ||
                (this.type === "T" && this.controlPoints.length !== 0))
                throw new KresmerException(`Invalid area vertex geometry: ${this.type}(${this.controlPoints.length})`);
        } else if (init) {
            this.type = init.type;
            if ("cp" in init)
                this.controlPoints.push({...init.cp});
            if ("cp1" in init)
                this.controlPoints.push({...init.cp1});
            if ("cp2" in init)
                this.controlPoints.push({...init.cp2});
        } else {
            this.type = "L";
        }//if
    }//ctor

    readonly type: AreaVertexGeometryRaw["type"];
    readonly controlPoints: Position[] = [];

    toPath(pos: Position)
    {
        const chunks: string[] = [this.type];
        for (const cp of this.controlPoints) {
            chunks.push(`${cp.x},${cp.y}`);
        }//for
        chunks.push(`${pos.x},${pos.y}`);
        return chunks.join(" ");
    }//toPath

    toXML(tag: XMLTag)
    {
        let v = this.type;
        this.controlPoints.forEach(cp => { v += ` ${cp.x},${cp.y}` });
        tag.addAttrib("geometry", v);
    }//toXML

    copy() {return new AreaVertexGeometry(this)}

    move(delta: Shift)
    {
        for (let i = 0; i < this.controlPoints.length; i++) {
            this.controlPoints[i] = {x: this.controlPoints[i].x + delta.x, y: this.controlPoints[i].y + delta.y};
        }//for
        return this;
    }//move
}//AreaVertexGeometry

export type AreaVertexInitParams = VertexInitParams & {geometry?: AreaVertexGeometryRaw|AreaVertexGeometry};
export type AreaVertexSpec = {vertex: AreaVertex}|{areaID: number, vertexNumber: number};

// Editor operations
export class VertexGeomChangeOp extends EditorOperation {
    constructor(private vertex: AreaVertex)
    {
        super();
        this.oldGeometry = vertex.geometry.copy();
    }//ctor

    private oldGeometry: AreaVertexGeometry;
    private newGeometry?: AreaVertexGeometry;

    override onCommit()
    {
        this.newGeometry = this.vertex.geometry.copy();
    }//onCommit

    override undo(): void {
        this.vertex.geometry = this.oldGeometry;
    }//undo

    override exec(): void {
        this.vertex.geometry = this.newGeometry!;
    }//exec
}//VertexGeomChangeOp
