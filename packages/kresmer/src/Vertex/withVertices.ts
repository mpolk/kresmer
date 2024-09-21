/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Mixin for the generic object containing vertices
 ***************************************************************************/

import Vertex from "./Vertex";
import { Position } from "Transform/Transform";

/**
 * Mixin for the generic object containing vertices
 */
export default function withVertices
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <TBase extends abstract new(...args: any[]) => object>(Base: TBase)
{
    abstract class ObjectWithVertices extends Base {

        vertices: Vertex[] = [];
        verticesInitialized = false;
        nextVertexKey = 0;
        abstract readonly isClosed: boolean;
    
        readonly initVertices = () => {
            if (!this.verticesInitialized) {
                this.vertices.forEach(vertex => vertex.init());
                this.verticesInitialized = true;
            }//if
        }//initVertices
    
        get head() {return this.vertices[0];}
        get tail() {return this.vertices[this.vertices.length-1];}
    
        abstract createVertex(segmentNumber: number, position: Position): Vertex;

        addVertex(vertex: Vertex): ObjectWithVertices
        {
            this.vertices.splice(vertex.vertexNumber, 0, vertex);
            for (let i = vertex.vertexNumber + 1; i < this.vertices.length; i++) {
                this.vertices[i].vertexNumber = i;
            }//for
            return this;
        }//addVertex

        deleteVertex(vertex: Vertex): ObjectWithVertices
        {
            this.vertices.splice(vertex.vertexNumber, 1);
            for (let i = vertex.vertexNumber; i < this.vertices.length; i++) {
                this.vertices[i].vertexNumber = i;
            }//for
            return this;
        }//deleteVertex
    
        abstract get wouldAlignVertices(): Set<Vertex>;
    
        public alignVertices()
        {
            const verticesAligned = this.wouldAlignVertices;
            for (const vertex of verticesAligned) {
                if (!vertex.align())
                    verticesAligned.delete(vertex);
            }//for
            return verticesAligned;
        }//alignVertices
    
    }//ObjectWithVertices

    return ObjectWithVertices;
}//withVertices
