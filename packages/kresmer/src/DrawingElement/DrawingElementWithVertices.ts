/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * DrawingElementWithVertices - a generic element, which host vertices
 ***************************************************************************/

import { nextTick } from "vue";
import DrawingElement from "./DrawingElement";
import Vertex from "../Vertex/Vertex";
import withVertices from "../Vertex/withVertices";
import ConnectionPoint from "../ConnectionPoint/ConnectionPoint";
import { EditorOperation } from "../UndoStack";

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

export class AddVertexOp<V extends Vertex> extends EditorOperation {

    constructor(protected vertex: V)
    {
        super();
    }//ctor

    exec() {
        this.vertex.parentElement.addVertex(this.vertex);
        nextTick(() => {
            this.vertex.ownConnectionPoint.updatePos();
        });
    }//exec

    undo() {
        this.vertex.parentElement.deleteVertex(this.vertex);
    }//undo
}//AddVertexOp

export class DeleteVertexOp<V extends Vertex> extends AddVertexOp<V> {
    exec() {
        super.undo();
    }//exec

    undo() {
        super.exec();
    }//undo
}//DeleteVertexOp

