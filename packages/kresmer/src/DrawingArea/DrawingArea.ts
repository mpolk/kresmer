/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area - data object 
 ***************************************************************************/

import { InjectionKey, nextTick } from "vue";
import Kresmer from "../Kresmer";
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPoint";
import { UndefinedLinkClassException } from "../KresmerException";
import DrawingAreaClass from "./DrawingAreaClass";
import LinkVertex, { LinkVertexInitParams } from "./LinkVertex";
import NetworkElement from '../NetworkElement';
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";
import { indent } from "../Utils";
import { MapWithZOrder, Z_INDEX_INF, withZOrder } from "../ZOrdering";

/**
 * Drawing Area 
 */
class _DrawingArea extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Link class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        kresmer: Kresmer,
        _class: DrawingAreaClass | string,
        args?: {
            name?: string,
            dbID?: number|string|null,
            props?: Record<string, unknown>,
            vertices?: LinkVertexInitParams[],
        }
    ) {
        const clazz = _class instanceof DrawingAreaClass ? _class : DrawingAreaClass.getClass(_class);
        if (!clazz) {
            throw new UndefinedLinkClassException({className: _class as string});
        }//if
        super(kresmer, clazz, args);
        const _this = this as unknown as DrawingArea;
        let i = 0;
        args?.vertices?.forEach(initParams => this.vertices.push(new LinkVertex(_this, i++, initParams)));
    }//ctor

    declare protected _class: DrawingAreaClass;
    override getClass(): DrawingAreaClass {
        return this._class;
    }//getClass

    private verticesInitialized = false;
    vertices: LinkVertex[] = [];
    nextVertexKey = 0;

    readonly initVertices = () => {
        if (!this.verticesInitialized) {
            this.vertices.forEach(vertex => vertex.init());
            this.verticesInitialized = true;
        }//if
    }//initVertices

    get head() {return this.vertices[0];}
    get tail() {return this.vertices[this.vertices.length-1];}

    public toggleVertexPositioningMode(except: LinkVertex)
    {
        const conversion = (this.isLoopback ? this.absPosToRel : this.relPosToAbs).bind(this);
        this.vertices.forEach(vertex => {
            if (!vertex.isConnected && vertex !== except) {
                vertex.pinUp(conversion(vertex.anchor.pos!));
            }//if
        });
    }//toggleVertexPositioningMode

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<DrawingArea>;

    override checkNameUniqueness(name: string): boolean {
        return name == this.name || !this.kresmer.linksByName.has(name);
    }//checkNameUniqueness

    toString()
    {
        let str = `${this.name}: ${this.getClass().name}`;
        if (this.verticesInitialized) {
            str += ` (${this.vertices[0]} => ${this.vertices[this.vertices.length - 1]})`;
        }//if
        return str;
    }//toString

    get displayString()
    {
        let str = `${this.name}: ${this.getClass().name}`;
        if (this.verticesInitialized) {
            str += ` (${this.vertices[0].displayString} => ${this.vertices[this.vertices.length - 1].displayString})`;
        }//if
        return str;
    }//displayString

    protected readonly outerXMLTag: string = "link";

    public toXML(indentLevel: number): string 
    {
        const attrs = new Map<string, string>();
        attrs.set("class", this.getClass().name);
        attrs.set("name", this.name);
        this.dbID && attrs.set("db-id", this.dbID.toString());
        (this.head.isConnected || this.head.isAttachedToBundle || this.head.anchor.pos) && 
            attrs.set("from", this.vertices[0].toString());
        const n = this.vertices.length - 1;
        (this.tail.isConnected || this.tail.isAttachedToBundle || this.tail.anchor.pos) && 
            attrs.set("to", this.vertices[n].toString());

        const attrStr = Array.from(attrs, attr => `${attr[0]}="${attr[1]}"`).join(' ');
        if (this.vertices.length <= 2 && this.propCount == 0) {
            return `${indent(indentLevel)}<${this.outerXMLTag} ${attrStr}/>`;
        } else {
            const xml = [`${indent(indentLevel)}<${this.outerXMLTag} ${attrStr}>`];

            xml.push(...this.propsToXML(indentLevel));
    
            for (let i = 1; i <= n - 1; i++) {
                xml.push(`${indent(indentLevel+1)}${this.vertices[i].toXML()}`);
            }//for

            xml.push(`${indent(indentLevel)}</${this.outerXMLTag}>`);
            return xml.join("\n");
        }//if
    }//toXML

    public get isLoopback() {
        const n = this.vertices.length - 1;
        return this.vertices[0].isConnected && this.vertices[n].isConnected && 
            this.vertices[0].anchor.conn!.hostElement === this.vertices[n].anchor.conn!.hostElement;
    }//isLoopback

    public selectLink(this: DrawingArea)
    {
        if (!this.isSelected) {
            this.kresmer.deselectAllElements(this);
            this.isSelected = true;
            this.bringToTop();
        }//if
    }//selectComponent

    override _onSelection(willBeSelected: boolean): true {
        this.kresmer.emit("link-selected", this as unknown as DrawingArea, willBeSelected);
        return true;
    }//onSelection

    override get _byNameIndex(): Map<string, number> {
        return this.kresmer.linksByName;
    }//_byNameIndex

    public absPosToRel(absPos: Position): Position
    {
        return {
            x: absPos.x - this.head.coords.x,
            y: absPos.y - this.head.coords.y,
        }
    }//absPosToRel

    public relPosToAbs(absPos: Position): Position
    {
        return {
            x: absPos.x + this.head.coords.x,
            y: absPos.y + this.head.coords.y,
        }
    }//relPosToAbs

    public addVertex(this: DrawingArea, segmentNumber: number, mousePos: Position)
    {
        console.debug(`Add vertex: ${this.name}:${segmentNumber} (${mousePos.x}, ${mousePos.y})`);
        const vertexNumber = segmentNumber + 1;
        let pos = this.kresmer.applyScreenCTM(mousePos);
        if (this.isLoopback) {
            pos = this.absPosToRel(pos);
        }//if
        const vertex = new LinkVertex(this, vertexNumber, {pos}).init();
        this.kresmer.undoStack.execAndCommit(new AddVertexOp(vertex));
        return vertex;
    }//addVertex

    public get wouldAlignVertices()
    {
        const vs = new Set(this.vertices.filter(v => !v.isConnected));
        if (this.isBundle) {
            const thisBundle = this as unknown as LinkBundle;
            for (const attachedLink of thisBundle.getAttachedLinks()) {
                for (const vertex of attachedLink.vertices) {
                    if (vertex.bundleAttachedTo === thisBundle)
                        vs.add(vertex);
                }//for
            }//for
        }//if
        return vs;
    }//wouldAlignVertices

    public alignVertices()
    {
        const verticesAligned = this.wouldAlignVertices;
        for (const vertex of verticesAligned) {
            if (!vertex.align())
                verticesAligned.delete(vertex);
        }//for
        return verticesAligned;
    }//alignVertices

    override getConnectionPoint(name: string | number): ConnectionPointProxy | undefined {
        const i = Number(name);
        if (i >= 0 && i < this.vertices.length)
            return this.vertices[i].ownConnectionPoint;
        else
            return undefined;
    }//getConnectionPoint

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override addConnectionPoint(name: string | number, connectionPoint: ConnectionPointProxy): void {
        console.error(`"addConnectionPoint(${connectionPoint.name})" called for the link`, this);
    }//addConnectionPoint

    public override updateConnectionPoints(): void {
        this.vertices.forEach(vertex => vertex.ownConnectionPoint.updatePos());
    }//updateConnectionPoints()

    public onMouseEnter()
    {
        this.kresmer.highlightedLinks.forEach(link => link.onMouseLeave());
        this.isHighlighted = true;
        (this as unknown as DrawingArea).bringToTop();
    }//onMouseEnter

    public onMouseLeave()
    {
        if (this.isHighlighted && !this.isSelected) {
            (this as unknown as DrawingArea).returnFromTop();
            this.isHighlighted = false;
        }//if
    }//onMouseLeave

    public onClick(this: DrawingArea, segmentNumber: number, event: MouseEvent)
    {
        if (event.ctrlKey) {
            this.kresmer.edAPI.addLinkVertex(this.id, segmentNumber, event);
        } else {
            this.selectLink();
        }//if
    }//onClick


    public onRightClick(this: DrawingArea, segmentNumber: number, event: MouseEvent)
    {
        this.selectLink();
        this.kresmer.emit("link-right-click", this, segmentNumber, event);
    }//onRightClick


    public onDoubleClick(this: DrawingArea, segmentNumber: number, event: MouseEvent)
    {
        this.selectLink();
        this.kresmer.emit("link-double-click", this, segmentNumber, event);
    }//onDoubleClick

}//_DrawingArea

export default class DrawingArea extends withZOrder(_DrawingArea) {}

export class DrawingAreaMap extends MapWithZOrder<number, DrawingArea> {};
export type AreaSpec = {link: DrawingArea}|{linkID: number};


// Editor operations

export class AddLinkOp extends EditorOperation {

    constructor (protected link: DrawingArea)
    {
        super();
    }//ctor

    override exec(): void {
        this.link.kresmer.addLink(this.link);
    }//exec

    override undo(): void {
        this.link.kresmer.deleteLink(this.link);
    }//undo
}//AddLinkOp

export class DeleteLinkOp extends EditorOperation {

    constructor (protected link: DrawingArea)
    {
        super();
    }//ctor

    private detachedVertices = new Map<LinkVertex, string|number>();

    override exec(): void {
        this.link.kresmer.links.forEach(link => {
            link.vertices.forEach(vertex => {
                if (vertex.isConnected && vertex.anchor.conn!.hostElement === this.link) {
                    this.detachedVertices.set(vertex, vertex.anchor.conn!.name);
                    vertex.detach();
                }//if
            })//vertices
        })//links

        this.link.kresmer.deleteLink(this.link);
    }//exec

    override undo(): void {
        this.link.kresmer.addLink(this.link);
        nextTick(() => {
            this.link.updateConnectionPoints();
            this.detachedVertices.forEach((connectionPointName, vertex) => {
                vertex.connect(this.link.getConnectionPoint(connectionPointName)!);
            });
        });
    }//undo
}//DeleteLinkOp

export class ChangeLinkClassOp extends EditorOperation {

    constructor(private link: DrawingArea, private newClass: DrawingAreaClass)
    {
        super();
        this.oldClass = link.getClass();
    }//ctor

    private readonly oldClass: DrawingAreaClass;

    override exec(): void {
        this.link.changeClass(this.newClass);
    }//exec

    override undo(): void {
        this.link.changeClass(this.oldClass);
    }//undo
}//ChangeLinkClassOp

export class AddVertexOp extends EditorOperation {

    constructor(protected vertex: LinkVertex)
    {
        super();
    }//ctor

    exec() {
        const link = this.vertex.link;
        const vertexNumber = this.vertex.vertexNumber;
        link.vertices.splice(vertexNumber, 0, this.vertex);
        for (let i = vertexNumber + 1; i < link.vertices.length; i++) {
            link.vertices[i].vertexNumber = i;
        }//for
        nextTick(() => {
            this.vertex.ownConnectionPoint.updatePos();
        });
    }//exec

    undo() {
        const link = this.vertex.link;
        const vertexNumber = this.vertex.vertexNumber;
        link.vertices.splice(vertexNumber, 1);
        for (let i = vertexNumber; i < link.vertices.length; i++) {
            link.vertices[i].vertexNumber = i;
        }//for
    }//undo
}//AddVertexOp

export class DeleteVertexOp extends AddVertexOp {
    exec() {
        super.undo();
    }//exec

    undo() {
        super.exec();
    }//undo
}//DeleteVertexOp
