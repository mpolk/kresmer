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
import { VertexMoveOp } from "../Vertex/Vertex";

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
    set geometry(newValue: AreaVertexGeometry) {this._geometry = new Geometry(newValue)}

    override init() {return super.init() as AreaVertex}

    override startDrag(event: MouseEvent): void 
    {
        super.startDrag(event);
        this.isSelected = true;
    }//startDrag


    public startHandleDrag(event: MouseEvent, handleNumber: 1|2|undefined)
    {
        this.dragStartPos = {...this.coords};
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        if (event.shiftKey)
            this.dragConstraint = "unknown";
        this.parentElement.kresmer.deselectAllElements(this.parentElement);
        this.parentElement.selectThis();
        MouseEventCapture.start(this.mouseCaptureTarget!);
        this.notifyOnVertexMoveStart();
        this.parentElement.kresmer.undoStack.startOperation(new VertexMoveOp(this));
    }//startHandleDrag


    public dragHandle(event: MouseEvent, handleNumber: 1|2|undefined)
    {
        if (!this.isDragged && !this.isGoingToBeDragged)
            return false;

        const mousePos = this.getMousePosition(event);
        if (this.isGoingToBeDragged) {
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this.savedAnchor = this.anchor.copy();
            this.pinUp(this.coords);
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
                this._anchor.pos = {
                    x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
                    y: this.dragStartPos!.y,
                }
                break;
            case "y":
                this._anchor.pos = {
                    x: this.dragStartPos!.x,
                    y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
                }
                break;
            default:
                this._anchor.pos = {
                    x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
                    y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
                }
        }//switch
        this.notifyOnVertexBeingMoved();
        this.ownConnectionPoint.updatePos();
        return true;
    }//dragHandle


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endHandleDrag(_event: MouseEvent, handleNumber: 1|2|undefined)
    {
        this.parentElement.kresmer._showAllConnectionPoints.value = false;
        this.isGoingToBeDragged = false;
        if (!this.isDragged) {
            return false;
        }//if

        this.isDragged = false;
        MouseEventCapture.release();

        if (this.snapToGrid) {
            this._anchor.pos = {
                x: Math.round(this._anchor.pos!.x / this.parentElement.kresmer.snappingGranularity) * this.parentElement.kresmer.snappingGranularity,
                y: Math.round(this._anchor.pos!.y / this.parentElement.kresmer.snappingGranularity) * this.parentElement.kresmer.snappingGranularity
            };
        }//if

        this.parentElement.kresmer.undoStack.commitOperation();
        this.notifyOnVertexMove();

        this.dragConstraint = undefined;
        this.savedAnchor = undefined;
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
    constructor(init?: AreaVertexGeometry)
    {
        if (init) {
            this.type = init.type;
            this.cp1 = "cp1" in init ? init.cp1 : "cp" in init ? init.cp : undefined;
            this.cp2 = "cp2" in init ? init.cp2 : undefined;
        } else {
            this.type = "L";
        }//if
    }//ctor

    readonly type: AreaVertexGeometry["type"];
    cp1?: Position;
    cp2?: Position;

    toPath(pos: Position)
    {
        const chunks: string[] = [this.type];
        if (this.cp1)
            chunks.push(`${this.cp1.x},${this.cp1.y}`);
        if (this.cp2)
            chunks.push(`${this.cp2.x},${this.cp2.y}`);
        chunks.push(`${pos.x},${pos.y}`);
        return chunks.join(" ");
    }//toPath
}//Geometry

export type AreaVertexInitParams = VertexInitParams & {geometry?: AreaVertexGeometry};
