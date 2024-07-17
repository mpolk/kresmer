/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *            Data types for z-ordering support on the drawing 
 ***************************************************************************/

import Kresmer from "Kresmer";
import { Position } from "./Transform/Transform";
import MouseEventCapture from "./MouseEventCapture";
import { SelectionMoveOp } from "./NetworkComponent/NetworkComponentController";
import { EditorOperation } from "./UndoStack";
import DrawingElementWithVertices from "./DrawingElement/DrawingElementWithVertices";

export type DragConstraint = "x" | "y" | "unknown";

export interface IDraggable {
    kresmer: Kresmer;
    origin: Position;
    isGoingToBeDragged: boolean;
    isDragged: boolean;
    isSelected: boolean;
    dragConstraint: DragConstraint|undefined;
    dragStartPos?: Position;
    savedMousePos?: Position;
    mouseCaptureTarget: SVGElement;

    bringToTop(): void;
    notifyOnDragStart(): void;
    notifyOnDrag(): void;
    notifyOnDragEnd(): void;
    createMoveOp(): EditorOperation;
    updateConnectionPoints(): void;
    alignConnectedLinks(): void;
}//IDraggable

export abstract class AbstractDraggable implements IDraggable {
    constructor(
        kresmer: Kresmer,
        params: {
            origin: Position,
        }
    ) {
        this._kresmer = new WeakRef(kresmer);
        this.origin = params.origin;
    }//ctor

    readonly _kresmer: WeakRef<Kresmer>;
    get kresmer() { return this._kresmer.deref()! }

    origin!: Position;
    abstract get isSelected(): boolean;
    
    public isGoingToBeDragged = false;
    public isDragged = false;
    public dragConstraint: DragConstraint|undefined;
    dragStartPos?: Position;
    savedMousePos?: Position;
    mouseCaptureTarget!: SVGElement;

    abstract bringToTop(): void;
    abstract notifyOnDragStart(): void;
    abstract notifyOnDrag(): void;
    abstract notifyOnDragEnd(): void;
    abstract createMoveOp(): EditorOperation;
    abstract updateConnectionPoints(): void;
    abstract alignConnectedLinks(): void;
}//AbstractDraggable


export abstract class DraggableDrawingElementWithVertices extends DrawingElementWithVertices implements IDraggable {

    origin!: Position;
    abstract get isSelected(): boolean;
    
    public isGoingToBeDragged = false;
    public isDragged = false;
    public dragConstraint: DragConstraint|undefined;
    dragStartPos?: Position;
    savedMousePos?: Position;
    mouseCaptureTarget!: SVGElement;

    abstract bringToTop(): void;
    abstract notifyOnDragStart(): void;
    abstract notifyOnDrag(): void;
    abstract notifyOnDragEnd(): void;
    abstract createMoveOp(): EditorOperation;
    abstract updateConnectionPoints(): void;
    abstract alignConnectedLinks(): void;

}//DraggableDrawingElementWithVertices


/**
 * Adds a mixin implementing dragging with mouse
 * @param Base A base class to be augmented
 * @returns An augmented class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Draggable<TBase extends abstract new(...args: any[]) => IDraggable>(Base: TBase)
{
    abstract class DraggableBase extends Base {

        getMousePosition(event: MouseEvent) {
            return this.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
        }//getMousePosition
    
        public startDrag(event: MouseEvent)
        {
            this.kresmer.resetAllComponentMode(this);
            if (event.shiftKey)
                this.dragConstraint = "unknown";
            this._startDrag();
            this.savedMousePos = this.getMousePosition(event);
            this.isGoingToBeDragged = true;
            this.bringToTop();
            if (this.isSelected && this.kresmer.muiltipleComponentsSelected) {
                const op = new SelectionMoveOp(this.kresmer, this);
                this.kresmer.undoStack.startOperation(op);
                this.kresmer._startSelectionDragging(this, op);
            } else {
                this.kresmer.undoStack.startOperation(this.createMoveOp());
            }//if
            MouseEventCapture.start(this.mouseCaptureTarget);
        }//startDrag
    
        public _startDrag()
        {
            this.dragStartPos = {...this.origin};
            this.notifyOnDragStart();
        }//_startDrag

        public drag(event: MouseEvent)
        {
            const mousePos = this.getMousePosition(event);
            const effectiveMove = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};
    
            if (this.isGoingToBeDragged) {
                if (Math.hypot(effectiveMove.x, effectiveMove.y) < 2)
                    return false;
                this.isGoingToBeDragged = false;
                this.isDragged = true;
                this.kresmer._allLinksFreezed = true;
            } else if (!this.isDragged) {
                return false;
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
                case 'x': effectiveMove.y = 0; break;
                case 'y': effectiveMove.x = 0; break;
            }//switch
                
            this.moveFromStartPos(effectiveMove);
            if (this.isSelected && this.kresmer.muiltipleComponentsSelected) {
                this.kresmer._dragSelection(effectiveMove, this);
            }//if
            return true;
        }//drag
    
        public moveFromStartPos(delta: Position)
        {
            this.origin.x = this.dragStartPos!.x + delta.x;
            this.origin.y = this.dragStartPos!.y + delta.y;
            if (this.kresmer.animateComponentDragging)
                this.updateConnectionPoints();
            this.notifyOnDrag();
        }//moveFromStartPos

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public endDrag(_event: MouseEvent)
        {
            if (this.isDragged) {
                this.isDragged = false;
                this.dragConstraint = undefined;
                MouseEventCapture.release();
                if (this.kresmer.snapToGrid) {
                    this.origin = {
                        x: Math.round(this.origin.x / this.kresmer.snappingGranularity) * this.kresmer.snappingGranularity,
                        y: Math.round(this.origin.y / this.kresmer.snappingGranularity) * this.kresmer.snappingGranularity,
                    };
                }//if
                this.updateConnectionPoints();
                if (this.isSelected && this.kresmer.muiltipleComponentsSelected) {
                    this.kresmer._endSelectionDragging(this);
                }//if
                this.kresmer.undoStack.commitOperation();
                this.kresmer._allLinksFreezed = false;
                this.notifyOnDragEnd();
                this.alignConnectedLinks();
                return true;
            }//if

            return false;
        }//endDrag
    
    }//class

    return DraggableBase;
}//Draggable
