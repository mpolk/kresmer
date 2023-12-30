/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Link Vertex (either connected or free)
 ***************************************************************************/

import { nextTick } from "vue";
import { Position } from "../Transform/Transform";
import KresmerException, { UndefinedBundleException, UndefinedVertexException, UnrealizableVertexAlignmentException } from "../KresmerException";
import NetworkLink from "./NetworkLink";
import ConnectionPointProxy, { parseConnectionPointData } from "../ConnectionPoint/ConnectionPointProxy";
import { EditorOperation } from "../UndoStack";
import { type RequireAtLeastOne } from "../Utils";
import MouseEventCapture from "../MouseEventCapture";
import type LinkBundle from "./LinkBundle";

/** Link Vertex (either connected or free) */

export default class LinkVertex {

    /**
     * Constructs a new vertex
     * @param link The link this vertex belongs to
     * @param vertexNumber An index of the vertex within the link
     * @param initParams A set of the initialization params used in the delayed initialization
     */
    constructor(public link: NetworkLink, vertexNumber: number, public initParams?: LinkVertexInitParams) {
        this.ownConnectionPoint = new ConnectionPointProxy(this.link, this.vertexNumber, 0);
        this._vertexNumber = vertexNumber;
        this.ownConnectionPoint.name = String(vertexNumber);
        this._key = link.nextVertexKey++;
    }//ctor


    /** Postponned part of the initialization delayed until all components are mounted.
     *  It takes internally saved "initParams" and converts it to the "real" anchor data.
    */
    init(): LinkVertex
    {
        if (this.initParams?.pos) {
            this.pinUp(this.initParams.pos);
        } else if (this.initParams?.cpData) {
            const cpHostElement = this.link.kresmer.getElementByName(this.initParams.cpData.cpHostElement);
            if (!cpHostElement) {
                this.link.kresmer.raiseError(new KresmerException(
                    `Attempt to connect to the non-existing component "${this.initParams.cpData.cpHostElement}"`,
                    {source: `Link "${this.link.name}"`}));
                return this;
            }//if
            const connectionPoint = cpHostElement.getConnectionPoint(this.initParams.cpData.connectionPoint);
            if (!connectionPoint) {
                this.link.kresmer.raiseError(new KresmerException(
                    `Attempt to connect to non-existing connection point \
                    "${this.initParams.cpData.cpHostElement}:${this.initParams.cpData.connectionPoint}"`,
                    {source: `Link "${this.link.name}"`}))
                return this;
            }//if
            this.connect(connectionPoint);
        } else if (this.initParams?.bundleData) {
            const bundle = this.link.kresmer.getLinkByName(this.initParams.bundleData.bundleName);
            if (!bundle) {
                this.link.kresmer.raiseError(new UndefinedBundleException({
                    message:`Attempt to connect to the non-existing bundle "${this.initParams.bundleData.bundleName}"`,
                    source: `Link "${this.link.name}"`}));
                return this;
            }//if
            const afterVertex = bundle.vertices[this.initParams.bundleData.baseVertex];
            if (!afterVertex) {
                this.link.kresmer.raiseError(new UndefinedVertexException(
                    {message: `Attempt to connect to non-existing connection point \
                    "${this.initParams.bundleData.bundleName}:${this.initParams.bundleData.baseVertex}"`,
                    source: `Link "${this.link.name}"`}))
                return this;
            }//if
            this.attachToBundle({baseVertex: afterVertex, distance: this.initParams.bundleData.distance});
        } else if (this.initParams?.conn) {
            this.connect(this.initParams.conn);
        // } else {
        //     throw new KresmerException(`Invalid connection point initialization params: ${this.initParams}`);
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
    private _vertexNumber: number;

    /** An object representing the logical position of the vertex. 
     * It may contain either a position as such (.pos), a reference to some connection point (.conn) or 
     * to the point within some link bundle (.bundle). */
    get anchor() {return this._anchor;}
    set anchor(newPos: LinkVertexAnchor)
    {
        this._anchor.pos = newPos.pos;
        this.setConn(newPos.conn);
        this.setBundle(newPos.bundle);
    }//set anchor
    private _anchor: LinkVertexAnchor = {pos: {x: 0, y: 0}};
    anchorCopy() {return {...this._anchor};}

    pinUp(pos: Position)
    {
        this._anchor.pos = {...pos};
        this.setConn(undefined);
        this.setBundle(undefined);
    }//pinUp

    connect(connectionPoint: ConnectionPointProxy)
    {
        this.setConn(connectionPoint);
        this._anchor.pos = undefined;
        this.setBundle(undefined);
    }//connect

    attachToBundle(bundle: BundleAttachmentDescriptor)
    {
        this.setBundle({...bundle});
        this.setConn(undefined);
        this._anchor.pos = undefined;
    }//attachToBundle

    public detach()
    {
        if (this.isConnected || this.isAttachedToBundle) {
            this.pinUp({...this.coords});
        }//if
        return this;
    }//detach

    // This "manual" setter is used to adjust other vertices positioning mode accordingly 
    // to the link's loopback mode
    private setConn(newValue: ConnectionPointProxy|undefined) {
        if (this._anchor.conn !== newValue) {
            const oldConn = this._anchor.conn;
            if (!this.isHead && !this.isTail || this.initParams) {
                this._anchor.conn = newValue;
            } else {
                const wasLoopback = this.link.isLoopback;
                this._anchor.conn = newValue;
                if (wasLoopback !== this.link.isLoopback) {
                    this.link.toggleVertexPositioningMode(this);
                }//if
            }//if
            if (this._anchor.conn) {
                this._anchor.conn.hostElement.registerConnectedLink(this.link);
                this._anchor.conn.connectedVertices.add(this);
            } else if (oldConn) {
                oldConn.hostElement.unregisterConnectedLink(this.link);
                oldConn.connectedVertices.delete(this);
            }//if
            this.ownConnectionPoint.isActive = !this._anchor.conn && !this._anchor.bundle;
        }//if
    }//setConn

    // A similar setter for the bundle attachments
    private setBundle(newValue: BundleAttachmentDescriptor|undefined) {
        if (this._anchor.bundle !== newValue) {
            const oldBundle = this._anchor.bundle;
            this._anchor.bundle = newValue;
            if (this._anchor.bundle) {
                (this._anchor.bundle.baseVertex.link as LinkBundle).registerAttachedLink(this.link);
                this._anchor.bundle.baseVertex.attachedVertices.add(this);
            } else if (oldBundle) {
                (oldBundle.baseVertex.link as LinkBundle).unregisterAttachedLink(this.link);
                oldBundle.baseVertex.attachedVertices.delete(this);
            }//if
            this.ownConnectionPoint.isActive = !this._anchor.conn && !this._anchor.bundle;
            nextTick(() => this.revision++);
        }//if
    }//setBundle


    /** 
     * Entering the "suspended" mode when the connection point we are connected to is temporarily deleted
     * because of some drastic change in its host component.
    */
    suspend()
    {
        if (!this.isConnected)
            throw new KresmerException("Attempt to suspend an unconnected vertex", {source: this.toString()});
        this.initParams = {
            cpData: {
                cpHostElement: this._anchor.conn!.hostElement.name, 
                connectionPoint: this._anchor.conn!.name.toString()
            }};
        this._anchor.conn = undefined;
    }//suspend
    /**
     * Exits the "suspended" mode
     */
    restore()
    {
        this.init();
    }//restore


    /** Calculates "physical" coordinates of the vertex, based on its connection to the connection point, 
     *  attachment to the bundle or a plain {x,y} position */
    get coords(): Position
    {
        this.revision;
        if (this._anchor.conn) {
            return this._anchor.conn.coords;
        } else if (this._anchor.bundle) {
            const afterVertex = this._anchor.bundle.baseVertex;
            let d = this._anchor.bundle.distance;
            if (d == 0)
                return afterVertex.coords;
            const n = afterVertex.vertexNumber;
            const beforeVertex = afterVertex.link.vertices[n+1];
            if (!afterVertex.isInitialized || !beforeVertex.isInitialized)
                return this.link.kresmer.drawingCenter;
            const {x0, y0, length: h, sinFi, cosFi} = afterVertex.segmentVector!;
            if (d > h)
                d = h;
            const x = x0 + d * cosFi;
            const y = y0 + d * sinFi;
            return {x, y};
        } else if (this._anchor.pos && this.link.isLoopback) {
            const headCoords = this.link.head.coords;
            return {x: headCoords.x + this._anchor.pos.x, y: headCoords.y + this._anchor.pos.y};
        } else if (this._anchor.pos) {
            return this._anchor.pos;
        } else {
            return this.link.kresmer.drawingCenter;
        }//if
    }//coords

    /** Used for caching the adjacent segment geometry data to ease the later position calculations for the attached vertices */
    segmentVector?: SegmentVector;

    // The current (not cached) adjacent segment data
    private get _segmentVector(): SegmentVector|undefined
    {
        const nextNeighbour = this.nextNeighbour;
        if (!nextNeighbour)
            return undefined;
        const p1 = this.coords;
        const p2 = nextNeighbour.coords;
        const length = Math.hypot(p2.y-p1.y, p2.x-p1.x);
        const cosFi = (p2.x-p1.x) / length;
        const sinFi = (p2.y-p1.y) / length;
        return {x0: p1.x, y0: p1.y, length, cosFi, sinFi};
    }//_segmentVector

    _updateSegmentVector()
    {
        if (this.link.isBundle) {
            const vector = this._segmentVector;
            if (vector)
                this.segmentVector = vector;
        }//if
    }//_updateSegmentVector

    updateSegmentVector()
    {
        this._updateSegmentVector();
        this.prevNeighbour?._updateSegmentVector();
    }//updateSegmentVector
    
    /** A collection of the vertices attached to the adjacent segment*/
    attachedVertices = new Set<LinkVertex>();

    private readonly _key: number;
    private revision = 0;
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
    private savedConn?: ConnectionPointProxy;
    private dragStartPos?: Position;
    private savedMousePos?: Position;
    private dragGuide?: {radiusVector: Position, length: number, originalDistance: number};

    get isConnected() {return Boolean(this._anchor.conn);}
    get isAttachedToBundle() {return Boolean(this._anchor.bundle);}
    get bundleAttachedTo() {return this._anchor.bundle?.baseVertex.link as LinkBundle;}
    get bundleDefinitelyAttachedTo() {return this._anchor.bundle!.baseVertex.link as LinkBundle;}
    get isPinnedUp() {return Boolean(this._anchor.pos);}
    get isHead() {return this.vertexNumber === 0;}
    get isTail() {return this.vertexNumber === this.link.vertices.length - 1;}
    get isEndpoint() {return this.vertexNumber === 0 || this.vertexNumber >= this.link.vertices.length - 1;}
    get isInitialized() {return !this.initParams;}
    get prevNeighbour(): LinkVertex|undefined {return this._vertexNumber ? this.link.vertices[this._vertexNumber-1] : undefined}
    get nextNeighbour(): LinkVertex|undefined {return this._vertexNumber < this.link.vertices.length ? this.link.vertices[this._vertexNumber+1] : undefined}
    get isEnteringBundle() {return Boolean(this.isAttachedToBundle && (!this.prevNeighbour?.isAttachedToBundle || 
                                           this.prevNeighbour.bundleAttachedTo !== this.bundleDefinitelyAttachedTo));}
    get isLeavingBundle() {return Boolean(this.isAttachedToBundle && (!this.nextNeighbour?.isAttachedToBundle ||
                                          this.nextNeighbour.bundleAttachedTo !== this.bundleDefinitelyAttachedTo));}

    private mouseCaptureTarget?: SVGElement;
    _setMouseCaptureTarget(el: SVGElement)
    {
        this.mouseCaptureTarget = el;
    }//_setMouseCaptureTarget

    toString()
    {
        if (this._anchor.conn) {
            return this._anchor.conn.toString();
        } else if (this._anchor.bundle) {
            return `@${this._anchor.bundle.baseVertex.link.name}:${this._anchor.bundle.baseVertex.vertexNumber}:${this._anchor.bundle.distance.toFixed()}`
        } else if (this._anchor.pos) {
            return `(${this._anchor.pos.x.toFixed()}, ${this._anchor.pos.y.toFixed()})`
        } else {
            return "()";
        }//if
    }//toString

    get displayString()
    {
        return this._anchor.conn?.displayString ?? this.toString();
    }//displayString

    public toXML()
    {
        if (this._anchor.conn) {
            const elementName =  this._anchor.conn.hostElement instanceof NetworkLink ? 
                `-${this._anchor.conn.hostElement.name}`: this._anchor.conn.hostElement.name;
            return `<vertex connect="${elementName}:${this._anchor.conn.name}"/>`;
        } else if (this._anchor.bundle) {
            return `<vertex bundle="${this._anchor.bundle.baseVertex.link.name}" after="${this._anchor.bundle.baseVertex.vertexNumber}" distance="${this._anchor.bundle.distance}"/>`;
        } else if (this._anchor.pos) {
            return `<vertex x="${this._anchor.pos.x}" y="${this._anchor.pos.y}"/>`;
        } else {
            return `<vertex/>`;
        }//if
    }//toXML

    private getMousePosition(event: MouseEvent) {
        return this.link.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition


    public startDrag(event: MouseEvent)
    {
        this.dragStartPos = {...this.coords};
        if (this.link.isLoopback && !this.isConnected) {
            this.dragStartPos = this.link.absPosToRel(this.dragStartPos);
        }//if
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        if (event.shiftKey)
            this.dragConstraint = this._anchor.bundle?.baseVertex.nextNeighbour ? "bundle" : "unknown";
        this.link.kresmer.deselectAllElements(this.link);
        this.link.selectLink();
        MouseEventCapture.start(this.mouseCaptureTarget!);
        this.link.kresmer._showAllConnectionPoints.value = true;
        this.link.kresmer.emit("link-vertex-move-started", this);
        this.link.kresmer.undoStack.startOperation(new VertexMoveOp(this));
    }//startDrag


    public drag(event: MouseEvent)
    {
        if (!this.isDragged && !this.isGoingToBeDragged)
            return false;

        const mousePos = this.getMousePosition(event);
        if (this.isGoingToBeDragged) {
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this.savedConn = this._anchor.conn;
            if (this.dragConstraint === "bundle") {
                const baseVertex = this._anchor.bundle!.baseVertex;
                const originalDistance = this._anchor.bundle!.distance;
                const nextAfterBase = baseVertex.nextNeighbour!;
                const radiusVector = {x: nextAfterBase.coords.x - baseVertex.coords.x, y: nextAfterBase.coords.y - baseVertex.coords.y};
                const length = Math.hypot(radiusVector.x, radiusVector.y);
                this.dragGuide = {radiusVector, length, originalDistance};
            } else {
                this.pinUp(this.coords);
            }//if
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
            case "bundle": {
                    const r1 = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};
                    const {radiusVector: r2, length: l2, originalDistance: d0} = this.dragGuide!;
                    let shift = (r1.x*r2.x + r1.y*r2.y) / l2;
                    if (shift < -d0)
                        shift = -d0;
                    else if (shift > l2 - d0)
                        shift = l2 - d0;
                    this._anchor.bundle!.distance = d0 + shift;
                    break;
                }
            default:
                this._anchor.pos = {
                    x: mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x,
                    y: mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y,
                }
        }//switch
        this.link.kresmer.emit("link-vertex-being-moved", this);
        this.ownConnectionPoint.updatePos();
        return true;
    }//drag


    public endDrag(event: MouseEvent)
    {
        this.link.kresmer._showAllConnectionPoints.value = false;
        this.isGoingToBeDragged = false;
        if (!this.isDragged) {
            return false;
        }//if

        this.isDragged = false;
        MouseEventCapture.release();

        if (this.dragConstraint !== "bundle") {
            const elementsUnderCursor = document.elementsFromPoint(event.x, event.y);
            const stickToConnectionPoints = (this.isEndpoint && !event.ctrlKey) || (!this.isEndpoint && event.ctrlKey);
            const stickToBundles = !this.link.isBundle;

            for (const element of elementsUnderCursor) {
                if (stickToConnectionPoints) {
                    const connectionPointData = element.getAttribute("data-connection-point");
                    if (connectionPointData) {
                        if (this.tryToConnectToConnectionPoint(connectionPointData))
                            break;
                        else
                            continue;
                    }//if
                }//if
                if (stickToBundles) {
                    const bundleData = element.getAttribute("data-link-bundle");
                    if (bundleData) {
                        if (this.tryToAttachToBundle(bundleData, event))
                            break;
                        else
                            continue;
                    }//if
                    const bundleVertexData = element.getAttribute("data-link-bundle-vertex");
                    if (bundleVertexData) {
                        if (this.tryToAttachToBundle(bundleVertexData))
                            break;
                        else
                            continue;
                    }//if
                }//if
            }//for
        }//if

        if (this.link.kresmer.snapToGrid && this.isPinnedUp) {
            this._anchor.pos = {
                x: Math.round(this._anchor.pos!.x / this.link.kresmer.snappingGranularity) * this.link.kresmer.snappingGranularity,
                y: Math.round(this._anchor.pos!.y / this.link.kresmer.snappingGranularity) * this.link.kresmer.snappingGranularity
            };
        }//if

        this.link.kresmer.undoStack.commitOperation();
        if (this.savedConn && this._anchor.conn !== this.savedConn) 
            this.link.kresmer.emit("link-vertex-disconnected", this, this._anchor.conn!);
        this.link.kresmer.emit("link-vertex-moved", this);
        if (this.isConnected && this._anchor.conn !== this.savedConn) 
            this.link.kresmer.emit("link-vertex-connected", this);

        const postActionMode: VertexAlignmentMode = this.dragConstraint === "bundle" ? "post-align" : "post-move";
        this.dragConstraint = undefined;
        this.dragGuide = undefined;
        this.savedConn = undefined;
        this.ownConnectionPoint.updatePos();
        if (this.link.kresmer.autoAlignVertices)
            this.performPostMoveActions(postActionMode);
        return true;
    }//endDrag


    private tryToConnectToConnectionPoint(connectionPointData: string): boolean
    {
        const {elementName, elementType, connectionPointName} = parseConnectionPointData(connectionPointData);
        let connectionPoint: ConnectionPointProxy | undefined;
        switch (elementType) {
            case "component": {
                const component = this.link.kresmer.getComponentByName(elementName);
                connectionPoint = component?.getConnectionPoint(connectionPointName);
            } break;
            case "link": {
                const linkToConnectTo = this.link.kresmer.getLinkByName(elementName);
                const vertexToConnectTo = linkToConnectTo?.vertices[connectionPointName as number];
                if (vertexToConnectTo === this)
                    return false;
                if (vertexToConnectTo?.isConnected && vertexToConnectTo?._anchor.conn === this.ownConnectionPoint)
                    return false;
                connectionPoint = vertexToConnectTo?.ownConnectionPoint;
            } break;
        }//switch
        if (connectionPoint) {
            if (!connectionPoint.isActive)
                return false;
            this.connect(connectionPoint);
        } else {
            this.link.kresmer.raiseError(new KresmerException(
                `Reference to undefined connection point "${connectionPointData}"`));
        }//if
        return true;
    }//tryToConnectToConnectionPoint


    private tryToAttachToBundle(bundleData: string, event?: MouseEvent): boolean
    {
        const [bundleName, vertexNumber] = bundleData.split(":", 2);
        const bundle = this.link.kresmer.getLinkByName(bundleName);
        if (!bundle) {
            this.link.kresmer.raiseError(new UndefinedBundleException({message: `Attempt to connect to the undefined bundle "${bundleName}"`}));
            return true;
        }//if
        if (!bundle.isBundle) {
            this.link.kresmer.raiseError(new UndefinedBundleException({message: `Attempt to connect to the non-bundle link "${bundleName}"`}));
            return true;
        }//if

        if (this.isEndpoint && !bundle.head.isConnected && !bundle.tail.isConnected)
            return false;

        const vertex = bundle.vertices[Number(vertexNumber)];
        if (!vertex) {
            this.link.kresmer.raiseError(new UndefinedVertexException({message: `Attempt to connect to the undefined vertex "${bundleData}"`}));
            return true;
        }//if

        const v = vertex.coords;
        let d: number;
        if (!event) {
            d = 0;
        } else {
            const p = this.link.kresmer.applyScreenCTM(event);
            d = Math.hypot(p.x-v.x, p.y-v.y);
        }//if
        this.attachToBundle({baseVertex: vertex, distance: d});
        return true;
    }//tryToAttachToBundle


    public onRightClick(event: MouseEvent)
    {
        this.link.kresmer.emit("link-vertex-right-click", this, event);
    }//onRightClick


    public onDoubleClick()
    {
        this.link.kresmer._showAllConnectionPoints.value = false;
        this.link.kresmer.edAPI.alignLinkVertex({vertex: this});
    }//onDoubleClick


    public align(mode: VertexAlignmentMode = "normal")
    {
        const {x: x0, y: y0} = this.coords;
        const predecessor = this.prevNeighbour;
        const prePos = predecessor?.coords;
        const successor = this.nextNeighbour;
        const sucPos = successor?.coords;

        let newAnchor: LinkVertexAnchor|null = null;
        if (this.isConnected) {
            if (mode === "normal")
                this.link.kresmer.raiseError(new UnrealizableVertexAlignmentException(
                    {message: `Cannot align the connected vertex (${this.link.name}:${this.vertexNumber})`, severity: "warning"}));
            newAnchor = null;
        } else if (!predecessor && !successor) {
            newAnchor = null;
        } else if (!predecessor) {
            newAnchor = this.alignEndpoint(successor!, mode);
        } else if (!successor) {
            newAnchor = this.alignEndpoint(predecessor, mode);
        } else if (this.isAttachedToBundle && 
                   predecessor.bundleAttachedTo !== this.bundleAttachedTo && 
                   successor.bundleAttachedTo === this.bundleAttachedTo) {
            newAnchor = this.alignOnBundle(predecessor);
        } else if (this.isAttachedToBundle && 
                   predecessor.bundleAttachedTo === this.bundleAttachedTo && 
                   successor.bundleAttachedTo !== this.bundleAttachedTo) {
            newAnchor = this.alignOnBundle(successor);
        } else if (this.isAttachedToBundle) {
            newAnchor = null;
        } else if (predecessor.isConnected && predecessor.isEndpoint && (!successor.isConnected || !successor.isEndpoint)) {
            newAnchor = this.alignBetweenConnectionAndPosition(predecessor, successor);
        } else if (successor.isConnected && successor.isEndpoint && (!predecessor.isConnected || !predecessor.isEndpoint)) {
            newAnchor = this.alignBetweenConnectionAndPosition(successor, predecessor);
        } else {
            newAnchor = this.alignBetweenTwoPositions(predecessor, successor);
        }//if

        let shouldMove = Boolean(newAnchor);
        const outOfLimits = newAnchor?.pos && (
            newAnchor.pos.x <= 0 || newAnchor.pos.x >= this.link.kresmer.logicalWidth ||
            newAnchor.pos.y <= 0 || newAnchor.pos.y >= this.link.kresmer.logicalHeight);
        if (outOfLimits) {
            if (mode === "normal") 
                this.link.kresmer.raiseError(new UnrealizableVertexAlignmentException(
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
            if (this.link.isLoopback && newAnchor?.pos)
                newAnchor = {pos: this.link.absPosToRel(newAnchor.pos)};
            this.anchor = newAnchor!;
            this.ownConnectionPoint.updatePos();
            if (this.link.kresmer.autoAlignVertices && mode == "normal")
                this.performPostMoveActions("post-align");
        }//if

        return shouldMove;
    }//align

    private performPostMoveActions(mode: VertexAlignmentMode)
    {
        nextTick(() => {
            if (this.prevNeighbour)
                this.link.kresmer.edAPI.alignLinkVertex({vertex: this.prevNeighbour}, mode);

            if (this.nextNeighbour)
                this.link.kresmer.edAPI.alignLinkVertex({vertex: this.nextNeighbour}, mode);

            if (this.link.isBundle && !this.isTail) {
                for (const attachedLink of (this.link as LinkBundle).getAttachedLinks()) {
                    for (const attachedVertex of attachedLink.vertices) {
                        if (attachedVertex._anchor.bundle?.baseVertex === this)
                            this.link.kresmer.edAPI.alignLinkVertex({vertex: attachedVertex}, mode);
                    }//for
                }//for
            }//if

            if (mode !== "post-align") {
                this.link.kresmer.edAPI.alignLinkVertex({vertex: this}, mode);
            }//if
        });
    }//performPostMoveActions

    private alignEndpoint(neighbor: LinkVertex, mode: VertexAlignmentMode): LinkVertexAnchor|null
    {
        if (this.isAttachedToBundle)
            return null;

        if (this.link.isBundle) {
            const newAnchor = this.alignBundleEndpoint(mode);
            if (newAnchor)
                return newAnchor;
        }//if

        const threshold = 0.2;
        const {x: x0, y: y0} = this.coords;
        const {x: x1, y: y1} = neighbor.coords;
        if (Math.abs(x1 - x0) < Math.abs(y1 - y0)*threshold)
            return {pos: {x: x1, y: y0}};
        else if (Math.abs(y1 - y0) < Math.abs(x1 - x0)*threshold)
            return {pos: {x: x0, y: y1}};
        else
            return null;
    }//alignEndpoint

    private alignBundleEndpoint(mode: VertexAlignmentMode): LinkVertexAnchor|null
    {
        const bundle = this.link as LinkBundle;
        let haveAttachedLinks = false;
        const verticesAttachedHere: LinkVertex[] = [];
        for (const attachedLink of bundle.getAttachedLinks()) {
            for (const vertex of attachedLink.vertices) {
                haveAttachedLinks = true;
                if (vertex._anchor.bundle?.baseVertex === this && vertex._anchor.bundle?.distance === 0) {
                    verticesAttachedHere.push(vertex);
                }//if
            }//for
        }//for

        if (!haveAttachedLinks || verticesAttachedHere.length > 1) 
            return null;

        if (verticesAttachedHere.length === 0 && this.isTail) {
            let nearest: LinkVertex|undefined;
            for (const attachedLink of bundle.getAttachedLinks()) {
                for (const vertex of attachedLink.vertices) {
                    const isCloser = 
                        !this.isHead && vertex._anchor.bundle?.baseVertex === this.prevNeighbour && 
                                        vertex._anchor.bundle?.distance && 
                                        (!nearest || vertex._anchor.bundle.distance > nearest._anchor.bundle!.distance);
                    if (isCloser)
                        nearest = vertex;
                 }//for
            }//for
            if (nearest) {
                return {pos: nearest.coords};
            }//if
        }//if

        if (verticesAttachedHere.length === 1 && mode !== "post-align") {
            const attachedVertex = verticesAttachedHere[0];
            if (attachedVertex._anchor.bundle!.distance === 0) {
                const lastBeforeAttached = attachedVertex.prevNeighbour;
                const nextAfterAttached = attachedVertex.nextNeighbour;
                const vertexToAlignTo = 
                    (lastBeforeAttached && !lastBeforeAttached.isAttachedToBundle && nextAfterAttached?.isAttachedToBundle) ? lastBeforeAttached :
                    (nextAfterAttached && !nextAfterAttached.isAttachedToBundle && lastBeforeAttached?.isAttachedToBundle) ? nextAfterAttached : 
                    undefined;
                if (vertexToAlignTo) {
                    const nearestNeighbour = this.isHead ? this.nextNeighbour! : this.prevNeighbour!;
                    if (vertexToAlignTo.isConnected)
                        return this.alignBetweenConnectionAndPosition(vertexToAlignTo, nearestNeighbour);
                    else
                        return this.alignBetweenTwoPositions(vertexToAlignTo, nearestNeighbour);
                }//if
            }//if
        }//if

        return null;
    }//alignBundleEndpoint

    private alignOnBundle(outOfBundleNeighbour: LinkVertex): LinkVertexAnchor|null
    {
        const {baseVertex, distance: d0} = this._anchor.bundle!;
        if (d0 === 0)
            return null;
        if (baseVertex.isTail) {
            if ((baseVertex.link as LinkBundle).getAttachedLinks().length == 1)
                nextTick(() => this.link.kresmer.edAPI.alignLinkVertex({vertex: baseVertex}));
            return null;
        }//if

        const nextAfterBase = baseVertex.nextNeighbour!;
        const {x: x0, y: y0} = this.coords;
        const {x: x1, y: y1} = outOfBundleNeighbour.coords;
        const {x: bx1, y: by1} = baseVertex.coords;
        const {x: bx2, y: by2} = nextAfterBase.coords;
        let deltaX, deltaY, d1: number|undefined;
        if ((x1 >= bx1 && x1 <= bx2) || (x1 <= bx1 && x1 >= bx2))
            deltaX = x1 - x0;
        if ((y1 >= by1 && y1 <= by2) || (y1 <= by1 && y1 >= by2))
            deltaY = y1 - y0;
        if (deltaX == 0 || deltaY == 0)
            return null;
        if (deltaX && (deltaY == undefined || Math.abs(deltaX ?? Number.POSITIVE_INFINITY) <= deltaY)) {
            if (d0)
                d1 = d0 * (1 + deltaX / (x0 - bx1));
            else
                d1 = deltaX;
        }//if
        else if (deltaY && (deltaX == undefined || Math.abs(deltaY ?? Number.POSITIVE_INFINITY) <= deltaX)) {
            if (d0)
                d1 = d0 * (1 + deltaY / (y0 - by1));
            else
                d1 = deltaY;
        }//if

        if (d1 !== undefined)
            return {bundle: {baseVertex, distance: d1}};
        else
            return null;
    }//alignOnBundle

    private alignBetweenTwoPositions(predecessor: LinkVertex, successor: LinkVertex): LinkVertexAnchor|null
    {
        const l1 = Math.hypot(this.coords.x - predecessor.coords.x, this.coords.y - successor.coords.y);
        const l2 = Math.hypot(this.coords.y - predecessor.coords.y, this.coords.x - successor.coords.x);
        let x: number; let y: number;
        if (l1 < l2) {
            x = predecessor.coords.x; y = successor.coords.y;
        } else {
            x = successor.coords.x; y = predecessor.coords.y;
        }//if
        return {pos: {x, y}};
    }//alignBetweenTwoPositions

    private alignBetweenConnectionAndPosition(connected: LinkVertex, positioned: LinkVertex): LinkVertexAnchor|null
    {
        const c = connected.coords;
        const p = positioned.coords;
        const dir = connected._anchor.conn!.dir % 360;
        let newPos: Position | null;
        switch (dir) {
            case 0:
                newPos = (p.x > c.x) ? {x: p.x, y: c.y} : null;
                break;
            case 90:
                newPos = (p.y > c.y) ? {x: c.x, y: p.y} : null;
                break;
            case 180:
                newPos = (p.x < c.x) ? {x: p.x, y: c.y} : null;
                break;
            case 270:
                newPos = (p.y < c.y) ? {x: c.x, y: p.y} : null;
                break;
            default: {
                const k = Math.tan(dir/180 * Math.PI);
                let sx: number; let sy: number;
                if (dir < 90) {
                    sx = 1; sy = 1;
                } else if (dir < 180) {
                    sx = -1; sy = 1;
                } else if (dir < 270) {
                    sx = -1; sy = -1;
                } else {
                    sx = 1; sy = -1;
                }//if
                let dx = Number.POSITIVE_INFINITY;
                let dy = Number.POSITIVE_INFINITY;
                let newPosX: Position;
                let newPosY: Position;
                if (Math.sign(p.x - c.x) === sx) {
                    dx = p.x - c.x;
                    newPosX = {x: p.x, y: c.y + k * dx};
                }//if
                if (Math.sign(p.y - c.y) === sy) {
                    dy = p.y - c.y;
                    newPosY = {x: c.x + dy / k, y: p.y};
                }//if
                if (Math.abs(dx) < Math.abs(dy)) {
                    newPos = newPosX!;
                } else if (Number.isFinite(dy)) {
                    newPos = newPosY!;
                } else {
                    newPos =  null;
                }//if
            }//default
        }//switch

        if (!newPos) {
            connected.blink();
            positioned.blink();
        }//if
        return newPos ? {pos: newPos} : null;
    }//alignBetweenConnectionAndPosition

    public blink()
    {
        this.isBlinking = true;
        setTimeout(() => {this.isBlinking = false}, 500);
    }//blink
}//LinkVertex


// Auxiliary interfaces for initialization and position saving

export type LinkVertexInitParams = RequireAtLeastOne<LinkVertexAnchor & {
    cpData?: {
        cpHostElement: string, 
        connectionPoint: string
    },
    bundleData?: {
        bundleName: string,
        baseVertex: number,
        distance: number
    },
}> | Record<string, never>;

/** Extended Link Vertex position (includes its connection if it is connected) */
export type LinkVertexAnchor = RequireAtLeastOne<{
    pos?: Position,
    conn?: ConnectionPointProxy,
    bundle?: BundleAttachmentDescriptor,
}>//LinkVertexExtAnchor

export type BundleAttachmentDescriptor = {
    baseVertex: LinkVertex,
    distance: number,
}//BundleAttachmentDescriptor

export type LinkVertexSpec = {vertex: LinkVertex}|{linkID: number, vertexNumber: number};
export type VertexAlignmentMode = "normal" | "post-align" | "post-move";
type SegmentVector = {x0: number, y0: number, length: number, cosFi: number, sinFi: number};
type DragConstraint = "x" | "y" | "bundle" | "unknown";

// Editor operations
export class VertexMoveOp extends EditorOperation {
    constructor(private vertex: LinkVertex)
    {
        super();
        this.oldAnchor = vertex.anchorCopy();
    }//ctor

    private oldAnchor: LinkVertexAnchor;
    private newAnchor?: LinkVertexAnchor;

    override onCommit()
    {
        this.newAnchor = this.vertex.anchorCopy();
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
    constructor(readonly vertices: Set<LinkVertex>)
    {
        super();
        for (const vertex of this.vertices) {
            this.oldAnchors.set(vertex, vertex.anchorCopy());
        }//for
    }//ctor

    private oldAnchors = new Map<LinkVertex, LinkVertexAnchor>();
    private newAnchors = new Map<LinkVertex, LinkVertexAnchor>();

    override onCommit()
    {
        for (const vertex of this.vertices) {
            this.newAnchors.set(vertex, vertex.anchorCopy());
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
