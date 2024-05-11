/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area Vertex
 ***************************************************************************/

import Vertex from "../Vertex/Vertex";
import DrawingElementWithVertices from "../DrawingElement/DrawingElementWithVertices";
import { VertexInitParams } from "../Vertex/Vertex";

/** Drawing Area Vertex */

export default class AreaVertex extends Vertex {

    /**
     * Constructs a new vertex
     * @param parentElement The element this vertex belongs to
     * @param vertexNumber An index of the vertex within the parent element
     * @param initParams A set of the initialization params used in the delayed initialization
     */
    constructor(parentElement: DrawingElementWithVertices, vertexNumber: number, initParams?: AreaVertexInitParams) 
    {
        super(parentElement, vertexNumber, initParams);
        this.vertexType = initParams?.type ?? "L";
    }//ctor

    vertexType: AreaVertexType;

    override init() {return super.init() as AreaVertex}

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
}//AreaVertex

export type AreaVertexType = "L" | "Q";
export type AreaVertexInitParams = VertexInitParams & {type?: AreaVertexType};
