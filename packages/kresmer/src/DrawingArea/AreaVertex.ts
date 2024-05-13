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
import { Position } from "../Transform/Transform";

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
        this._geometry = new Geometry(initParams?.geometry);
    }//ctor

    private _geometry: Geometry;
    get geometry(): Geometry {return this._geometry}
    set geometry(newValue: AreaVertexGeometry) {this._geometry = new Geometry(newValue)}

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
