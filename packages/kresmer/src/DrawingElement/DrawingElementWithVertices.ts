/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * DrawingElementWithVertices - a generic element, which host vertices
 ***************************************************************************/

import DrawingElement from "./DrawingElement";
import withVertices from "../Vertex/withVertices";
import ConnectionPoint from "../ConnectionPoint/ConnectionPoint";
import { IDraggable, DragConstraint } from "../Draggable";
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";

export default abstract class DrawingElementWithVertices extends withVertices(DrawingElement) {

    override getConnectionPoints(): Array<ConnectionPoint> {
        return this.vertices.map(v => v.ownConnectionPoint);
    }//getConnectionPoints

    override getConnectionPoint(name: string | number): ConnectionPoint | undefined {
        const i = Number(name);
        if (i >= 0 && i < this.vertices.length)
            return this.vertices[i].ownConnectionPoint;
        else
            return undefined;
    }//getConnectionPoint

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override addConnectionPoint(name: string | number, connectionPoint: ConnectionPoint): void {
        console.error(`"addConnectionPoint(${connectionPoint.name})" can not be called for an element of type ${this.constructor.name}`, this);
    }//addConnectionPoint

    override updateConnectionPoints(): void {
        this.vertices.forEach(vertex => vertex.ownConnectionPoint.updatePos(vertex.coords));
    }//updateConnectionPoints()

}//DrawingElementWithVertices


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

