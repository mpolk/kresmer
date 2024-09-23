/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *         Data types for element dragging support on the drawing 
 ***************************************************************************/

import Kresmer, { SelectionMoveOp } from "./Kresmer";
import { Position } from "./Transform/Transform";
import MouseEventCapture from "./MouseEventCapture";
import { EditorOperation } from "./UndoStack";

export type DragConstraint = "x" | "y" | "unknown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GConstructor<T = object> = abstract new (...args: any[]) => T;

/**
 * Adds a mixin implementing dragging with mouse
 * @param Base A base class to be augmented
 * @returns An augmented class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export function draggable<TBase extends GConstructor>(Base: TBase)
{
    abstract class DraggableBase extends Base {

        abstract get kresmer(): Kresmer;
        abstract get origin(): Position;
        abstract set origin(newValue: Position);
        abstract get isThisSelected(): boolean; //ugly workaround for Typescript accessor inheritance quirk
        
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
    
        getMousePosition(event: MouseEvent) {
            return this.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
        }//getMousePosition
    
        public startDrag(event: MouseEvent)
        {
            this.kresmer.resetAllComponentModes(this);
            if (event.shiftKey)
                this.dragConstraint = "unknown";
            this._startDrag();
            this.savedMousePos = this.getMousePosition(event);
            this.isGoingToBeDragged = true;
            this.bringToTop();
            if (this.isThisSelected && this.kresmer.multipleComponentsSelected) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const op = new SelectionMoveOp(this.kresmer, this as any);
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
            if (!this.savedMousePos) {
                return;
            }//if

            const mousePos = this.getMousePosition(event);
            const effectiveMove = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};
    
            if (this.isGoingToBeDragged) {
                if (Math.hypot(effectiveMove.x, effectiveMove.y) < 2) {
                    MouseEventCapture.release();
                    return false;
                }//if
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
            if (this.isThisSelected && this.kresmer.multipleComponentsSelected) {
                this.kresmer._dragSelection(effectiveMove, this);
            }//if
            return true;
        }//drag
    
        public moveFromStartPos(delta: Position)
        {
            this.origin = {
                x: this.dragStartPos!.x + delta.x,
                y: this.dragStartPos!.y + delta.y
            }
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
                if (this.isThisSelected && this.kresmer.multipleComponentsSelected) {
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
