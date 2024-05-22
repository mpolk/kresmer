/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area Vertex
 ***************************************************************************/

import Vertex from "../Vertex/Vertex";
import { VertexInitParams } from "../Vertex/Vertex";
import { Position } from "../Transform/Transform";
import DrawingArea from "./DrawingArea";
import MouseEventCapture from "../MouseEventCapture";
import { EditorOperation } from "../UndoStack";

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
        this._geometry = new Geometry(initParams?.geometry);
    }//ctor

    declare parentElement: DrawingArea;
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

    private _geometry: Geometry;
    get geometry(): Geometry {return this._geometry}
    set geometry(newValue: AreaVertexGeometry|Geometry) {this._geometry = new Geometry(newValue)}

    readonly handleCaptureTargets: SVGElement[] = [];
    private isGoingToDragHandle = false;
    private isHandleDragged = false;

    override init() {return super.init() as AreaVertex}

    override startDrag(event: MouseEvent): void 
    {
        super.startDrag(event);
        this.isSelected = true;
    }//startDrag


    public startHandleDrag(event: MouseEvent, handleNumber: 1|2)
    {
        this.dragStartPos = {...this._geometry.controlPoints[handleNumber]!};
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToDragHandle= true;
        if (event.shiftKey)
            this.dragConstraint = "unknown";
        MouseEventCapture.start(this.handleCaptureTargets[handleNumber]);
        this.parentElement.kresmer.emit("area-vertex-handle-move-started", this, handleNumber);
        this.parentElement.kresmer.undoStack.startOperation(new VertexGeomChangeOp(this));
    }//startHandleDrag


    public dragHandle(event: MouseEvent, handleNumber: 1|2)
    {
        if (!this.isHandleDragged && !this.isGoingToDragHandle)
            return false;

        const mousePos = this.getMousePosition(event);
        if (this.isGoingToDragHandle) {
            this.isGoingToDragHandle = false;
            this.isHandleDragged = true;
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
                this._geometry.controlPoints[handleNumber] = {
                    x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
                    y: this.dragStartPos!.y,
                }
                break;
            case "y":
                this._geometry.controlPoints[handleNumber] = {
                    x: this.dragStartPos!.x,
                    y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
                }
                break;
            default:
                this._geometry.controlPoints[handleNumber] = {
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
        this.isGoingToDragHandle = false;
        if (!this.isHandleDragged) {
            return false;
        }//if

        this.isHandleDragged = false;
        MouseEventCapture.release();

        if (this.snapToGrid) {
            this._geometry.controlPoints[handleNumber] = {
                x: Math.round(this._geometry.controlPoints[handleNumber]!.x / this.parentElement.kresmer.snappingGranularity) * this.parentElement.kresmer.snappingGranularity,
                y: Math.round(this._geometry.controlPoints[handleNumber]!.y / this.parentElement.kresmer.snappingGranularity) * this.parentElement.kresmer.snappingGranularity
            };
        }//if

        this.parentElement.kresmer.undoStack.commitOperation();
        this.parentElement.kresmer.emit("area-vertex-handle-moved", this, handleNumber);

        this.dragConstraint = undefined;
        return true;
    }//endHandleDrag

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

    toPath()
    {
        return this._geometry.toPath(this.coords);
    }//toPath
}//AreaVertex

export type AreaVertexGeometry =
    | {type: "L"}
    | {type: "C", cp1: Position, cp2: Position}
    | {type: "S", cp2: Position}
    | {type: "Q", cp: Position}
    | {type: "T"}
    ;
class Geometry {
    constructor(init?: AreaVertexGeometry|Geometry)
    {
        if (init instanceof Geometry) {
            this.type = init.type;
            this.controlPoints = [...init.controlPoints];
        } else if (init) {
            this.type = init.type;
            this.controlPoints[1] = "cp1" in init ? init.cp1 : "cp" in init ? init.cp : undefined;
            this.controlPoints[2] = "cp2" in init ? init.cp2 : undefined;
        } else {
            this.type = "L";
        }//if
    }//ctor

    readonly type: AreaVertexGeometry["type"];
    readonly controlPoints: (Position|undefined)[] = [];

    toPath(pos: Position)
    {
        const chunks: string[] = [this.type];
        if (this.controlPoints[1])
            chunks.push(`${this.controlPoints[1].x},${this.controlPoints[1].y}`);
        if (this.controlPoints[2])
            chunks.push(`${this.controlPoints[2].x},${this.controlPoints[2].y}`);
        chunks.push(`${pos.x},${pos.y}`);
        return chunks.join(" ");
    }//toPath

    copy() {return new Geometry(this)}
}//Geometry

export type AreaVertexInitParams = VertexInitParams & {geometry?: AreaVertexGeometry};

// Editor operations
export class VertexGeomChangeOp extends EditorOperation {
    constructor(private vertex: AreaVertex)
    {
        super();
        this.oldGeometry = vertex.geometry.copy();
    }//ctor

    private oldGeometry: Geometry;
    private newGeometry?: Geometry;

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
