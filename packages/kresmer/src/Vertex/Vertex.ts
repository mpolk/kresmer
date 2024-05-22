/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *   Generic Vertex - the base class for vertices used in Links and Areas
 ***************************************************************************/

import { nextTick } from "vue";
import DrawingElementWithVertices from "../DrawingElement/DrawingElementWithVertices";
import { Position } from "../Transform/Transform";
import { UnrealizableVertexAlignmentException } from "../KresmerException";
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPoint";
import { EditorOperation } from "../UndoStack";
import MouseEventCapture from "../MouseEventCapture";

/** Generic Vertex - the base class for vertices used in Links and Areas */

export default abstract class Vertex {

    /**
     * Constructs a new vertex
     * @param parentElement The element this vertex belongs to
     * @param vertexNumber An index of the vertex within the parent element
     * @param initParams A set of the initialization params used in the delayed initialization
     */
    constructor(public parentElement: DrawingElementWithVertices, vertexNumber: number, protected initParams?: VertexInitParams) 
    {
        this.ownConnectionPoint = new ConnectionPointProxy(this.parentElement, this.vertexNumber, 0);
        this._vertexNumber = vertexNumber;
        this.ownConnectionPoint.name = String(vertexNumber);
        this._key = parentElement.nextVertexKey++;
    }//ctor


    /** Postponned part of the initialization delayed until all components are mounted.
     *  It takes internally saved "initParams" and converts it to the "real" anchor data.
     */
    init(): Vertex
    {
        if (this.initParams?.pos) {
            this.pinUp(this.initParams.pos);
        }//if
        this.initParams = undefined;
        return this;
    }//init

    /** An index of the vertex within the link */
    get vertexNumber() {return this._vertexNumber}
    set vertexNumber(n: number)
    {
        this._vertexNumber = n;
        this.ownConnectionPoint.name = String(n);
    }//set vertexNumber
    protected _vertexNumber: number;

    /** An object representing the logical position of the vertex. */
    get anchor() {return this._anchor;}
    set anchor(newPos: VertexAnchor)
    {
        this._anchor.pos = newPos.pos;
    }//set anchor
    protected _anchor = new VertexAnchor();

    pinUp(pos: Position)
    {
        this._anchor.pos = {...pos};
    }//pinUp


    /** Calculates "physical" coordinates */
    get coords(): Position
    {
        this.revision;
        if (this._anchor.pos) {
            return this._anchor.pos;
        } else {
            return this.parentElement.kresmer.drawingCenter;
        }//if
    }//coords

    protected readonly _key: number;
    protected revision = 0;
    get key() {return `${this._key}.${this.revision}`}
    public updateVue()
    {
        this.revision++;
    }//updateVue

    public ownConnectionPoint: ConnectionPointProxy;

    isGoingToBeDragged = false;
    isDragged = false;
    dragConstraint: DragConstraint|undefined;
    isBlinking = false;
    protected savedAnchor?: VertexAnchor;
    protected dragStartPos?: Position;
    protected savedMousePos?: Position;

    get isHead() {return !this.parentElement.isClosed && this.vertexNumber === 0;}
    get isTail() {return !this.parentElement.isClosed && this.vertexNumber === this.parentElement.vertices.length - 1;}
    get isEndpoint() {return !this.parentElement.isClosed && (this.vertexNumber === 0 || this.vertexNumber >= this.parentElement.vertices.length - 1);}
    get isInitialized() {return !this.initParams;}
    get prevNeighbour(): Vertex|undefined {
        const neighbours = this.parentElement.vertices;
        return this._vertexNumber ? neighbours[this._vertexNumber-1] : this.parentElement.isClosed ? neighbours[neighbours.length-1] : undefined;
    }
    get nextNeighbour(): Vertex|undefined {
        const neighbours = this.parentElement.vertices;
        return this._vertexNumber < neighbours.length ? neighbours[this._vertexNumber+1] : this.parentElement.isClosed ? neighbours[0] : undefined;
    }
    protected get snapToGrid() {return this.parentElement.kresmer.snapToGrid}

    protected mouseCaptureTarget?: SVGElement;
    _setMouseCaptureTarget(el: SVGElement)
    {
        this.mouseCaptureTarget = el;
    }//_setMouseCaptureTarget

    toString()
    {
        if (this._anchor.pos) {
            return `(${this._anchor.pos.x.toFixed()}, ${this._anchor.pos.y.toFixed()})`
        } else {
            return "()";
        }//if
    }//toString

    get displayString()
    {
        return this.toString();
    }//displayString

    public toXML()
    {
        if (this._anchor.pos) {
            return `<vertex x="${this._anchor.pos.x}" y="${this._anchor.pos.y}"/>`;
        } else {
            return `<vertex/>`;
        }//if
    }//toXML

    protected getMousePosition(event: MouseEvent) {
        return this.parentElement.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition


    public startDrag(event: MouseEvent)
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
    }//startDrag


    public drag(event: MouseEvent)
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
    }//drag


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(_event: MouseEvent)
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

        const postActionMode: VertexAlignmentMode = this.dragConstraint === "bundle" ? "post-align" : "post-move";
        this.dragConstraint = undefined;
        this.savedAnchor = undefined;
        this.ownConnectionPoint.updatePos();
        if (this.parentElement.kresmer.autoAlignVertices)
            this.performPostMoveActions(postActionMode);
        return true;
    }//endDrag


    protected abstract notifyOnVertexMoveStart(): void;
    abstract notifyOnVertexBeingMoved(): void;
    abstract notifyOnVertexMove(): void;
    abstract onRightClick(event: MouseEvent): void;

    public onClick()
    {
        this.parentElement.selectThis();
    }//onClick

    public onDoubleClick()
    {
        this.parentElement.kresmer.edAPI.alignVertex({vertex: this});
    }//onDoubleClick

    public align(mode: VertexAlignmentMode = "normal")
    {
        const {x: x0, y: y0} = this.coords;
        const predecessor = this.prevNeighbour;
        const prePos = predecessor?.coords;
        const successor = this.nextNeighbour;
        const sucPos = successor?.coords;

        let newAnchor: VertexAnchor|null = null;
        if (!predecessor && !successor) {
            newAnchor = null;
        } else if (!predecessor) {
            newAnchor = this.alignEndpoint(successor!, mode);
        } else if (!successor) {
            newAnchor = this.alignEndpoint(predecessor, mode);
        } else {
            newAnchor = this.alignBetweenTwoPositions(predecessor, successor);
        }//if

        let shouldMove = Boolean(newAnchor);
        const outOfLimits = newAnchor?.pos && (
            newAnchor.pos.x <= 0 || newAnchor.pos.x >= this.parentElement.kresmer.logicalWidth ||
            newAnchor.pos.y <= 0 || newAnchor.pos.y >= this.parentElement.kresmer.logicalHeight);
        if (outOfLimits) {
            if (mode === "normal") 
                this.parentElement.kresmer.raiseError(new UnrealizableVertexAlignmentException(
                    {message: "Aligned position is out of the drawing boundaries", severity: "warning"}));
            shouldMove = false;
            this.blink();
        }//if
        const hitToNeighbour = newAnchor?.pos && ((newAnchor.pos.x == prePos?.x && newAnchor.pos.y == prePos.y) || 
                                                  (newAnchor.pos.x == sucPos?.x && newAnchor.pos.y == sucPos.y));
        if (hitToNeighbour) {
            if (Math.abs(newAnchor!.pos!.x - x0) <= Math.abs(newAnchor!.pos!.y - y0))
                newAnchor!.pos!.y = y0;
            else
                newAnchor!.pos!.x = x0;
        }//if

        if (shouldMove) {
            this.anchor = newAnchor!;
            this.ownConnectionPoint.updatePos();
            if (this.parentElement.kresmer.autoAlignVertices && mode == "normal")
                this.performPostMoveActions("post-align");
        }//if

        return shouldMove;
    }//align

    protected performPostMoveActions(mode: VertexAlignmentMode)
    {
        nextTick(() => {
            if (this.prevNeighbour)
                this.parentElement.kresmer.edAPI.alignVertex({vertex: this.prevNeighbour}, mode);

            if (this.nextNeighbour)
                this.parentElement.kresmer.edAPI.alignVertex({vertex: this.nextNeighbour}, mode);

            if (mode !== "post-align") {
                this.parentElement.kresmer.edAPI.alignVertex({vertex: this}, mode);
            }//if
        });
    }//performPostMoveActions

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected alignEndpoint(neighbor: Vertex, mode: VertexAlignmentMode): VertexAnchor|null
    {
        const threshold = 0.2;
        const {x: x0, y: y0} = this.coords;
        const {x: x1, y: y1} = neighbor.coords;
        if (Math.abs(x1 - x0) < Math.abs(y1 - y0)*threshold)
            return new VertexAnchor({pos: {x: x1, y: y0}});
        else if (Math.abs(y1 - y0) < Math.abs(x1 - x0)*threshold)
            return new VertexAnchor({pos: {x: x0, y: y1}});
        else
            return null;
    }//alignEndpoint

    protected alignBetweenTwoPositions(predecessor: Vertex, successor: Vertex): VertexAnchor|null
    {
        const l1 = Math.hypot(this.coords.x - predecessor.coords.x, this.coords.y - successor.coords.y);
        const l2 = Math.hypot(this.coords.y - predecessor.coords.y, this.coords.x - successor.coords.x);
        let x: number; let y: number;
        if (l1 < l2) {
            x = predecessor.coords.x; y = successor.coords.y;
        } else {
            x = successor.coords.x; y = predecessor.coords.y;
        }//if
        return new VertexAnchor({pos: {x, y}});
    }//alignBetweenTwoPositions

    public blink()
    {
        this.isBlinking = true;
        setTimeout(() => {this.isBlinking = false}, 500);
    }//blink
}//Vertex


// Auxiliary interfaces for initialization and position saving

export type VertexInitParams = {
    pos?: Position
}

/** Vertex position holder. 
 * The base class is nothing more than a simple position, but its descendants may implement smarter positioning logic. 
 * */
export class VertexAnchor {
    protected _pos?: Position;
    get pos(): Position {return this._pos ?? {x: 0, y: 0}}
    set pos(newPos: Position|undefined) {this._pos = newPos}

    constructor(init?: {pos?: Position})
    {
        this._pos = init?.pos ? {...init.pos} : undefined;
    }//ctor

    copy() {return new VertexAnchor({pos: this._pos})}

}//VertexAnchor

export type VertexSpec = {vertex: Vertex}|{parentID: number, vertexNumber: number};
export type VertexAlignmentMode = "normal" | "post-align" | "post-move";
type DragConstraint = "x" | "y" | "bundle" | "unknown";

// Editor operations
export class VertexMoveOp extends EditorOperation {
    constructor(private vertex: Vertex)
    {
        super();
        this.oldAnchor = vertex.anchor.copy();
    }//ctor

    private oldAnchor: VertexAnchor;
    private newAnchor?: VertexAnchor;

    override onCommit()
    {
        this.newAnchor = this.vertex.anchor.copy();
    }//onCommit

    override undo(): void {
        this.vertex.anchor = this.oldAnchor;
        this.vertex.ownConnectionPoint?.updatePos();
    }//undo

    override exec(): void {
        this.vertex.anchor = this.newAnchor!;
        this.vertex.ownConnectionPoint?.updatePos();
    }//exec
}//VertexMoveOp


export class VerticesMoveOp extends EditorOperation {
    constructor(readonly vertices: Set<Vertex>)
    {
        super();
        for (const vertex of this.vertices) {
            this.oldAnchors.set(vertex, vertex.anchor.copy());
        }//for
    }//ctor

    private oldAnchors = new Map<Vertex, VertexAnchor>();
    private newAnchors = new Map<Vertex, VertexAnchor>();

    override onCommit()
    {
        for (const vertex of this.vertices) {
            this.newAnchors.set(vertex, vertex.anchor.copy());
        }//for
    }//onCommit

    override undo(): void {
        for (const vertex of this.vertices) {
            vertex.anchor = this.oldAnchors.get(vertex)!;
            vertex.ownConnectionPoint?.updatePos();
        }//for
    }//undo

    override exec(): void {
        for (const vertex of this.vertices) {
            vertex.anchor = this.newAnchors.get(vertex)!;
            vertex.ownConnectionPoint?.updatePos();
        }//for
    }//exec
}//VerticesMoveOp
