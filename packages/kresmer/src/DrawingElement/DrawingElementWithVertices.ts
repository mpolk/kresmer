/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * DrawingElementWithVertices - a generic element, which host vertices
 ***************************************************************************/

import DrawingElement from "./DrawingElement";
import withVertices from "../Vertex/withVertices";
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPoint";

export default abstract class DrawingElementWithVertices extends withVertices(DrawingElement) {

    override getConnectionPoint(name: string | number): ConnectionPointProxy | undefined {
        const i = Number(name);
        if (i >= 0 && i < this.vertices.length)
            return this.vertices[i].ownConnectionPoint;
        else
            return undefined;
    }//getConnectionPoint

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override addConnectionPoint(name: string | number, connectionPoint: ConnectionPointProxy): void {
        console.error(`"addConnectionPoint(${connectionPoint.name})" can not be called for an element of type ${this.constructor.name}`, this);
    }//addConnectionPoint

    override updateConnectionPoints(): void {
        this.vertices.forEach(vertex => vertex.ownConnectionPoint.updatePos());
    }//updateConnectionPoints()

}//DrawingElementWithVertices

