/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link - data object 
 ***************************************************************************/

import { InjectionKey, nextTick } from "vue";
import Kresmer, { ConnectionPointProxy } from "../Kresmer";
import KresmerException from "../KresmerException";
import NetworkLinkClass from "./NetworkLinkClass";
import LinkVertex, { LinkVertexInitParams } from "./LinkVertex";
import NetworkElement from '../NetworkElement';
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";
import { indent } from "../Utils";
import { withZOrder } from "../ZOrdering";

/**
 * Network Link 
 */
class _NetworkLink extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Link class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        kresmer: Kresmer,
        _class: NetworkLinkClass | string,
        args?: {
            name?: string,
            dbID?: number|string|null,
            props?: Record<string, unknown>,
            from?: LinkVertexInitParams,
            to?: LinkVertexInitParams,
            vertices?: LinkVertexInitParams[],
        }
    ) {
        super(kresmer, _class instanceof NetworkLinkClass ? _class : NetworkLinkClass.getClass(_class), args);
        const _this = this as unknown as NetworkLink;
        let i = 0;
        this.vertices.push(new LinkVertex(_this, i++, args?.from));
        args?.vertices?.forEach(initParams => this.vertices.push(new LinkVertex(_this, i++, initParams)));
        this.vertices.push(new LinkVertex(_this, i++, args?.to));
    }//ctor

    declare protected _class: NetworkLinkClass;
    override getClass(): NetworkLinkClass {
        return this._class;
    }//getClass

    private _isHighlighted = false
    private _highlightDownlinks = false;
    get isHighlighted() {return this._isHighlighted || this.hasHighlightedUplinks}
    set isHighlighted(newValue: boolean) {
        this._highlightDownlinks = this._isHighlighted = newValue;
        this.propagateHighlightingUp(newValue, false);
    }//set isHighlighted

    private propagateHighlightingUp(newValue: boolean, updateSelf = true)
    {
        if (updateSelf) {
            if (this._isHighlighted == newValue)
                return;
            this._isHighlighted = newValue;
        }//if

        if (this.head.isConnected && this.head.anchor.conn!.hostElement instanceof NetworkLink)
            this.head.anchor.conn!.hostElement.propagateHighlightingUp(newValue);
        if (this.tail.isConnected && this.tail.anchor.conn!.hostElement instanceof NetworkLink)
            this.tail.anchor.conn!.hostElement.propagateHighlightingUp(newValue);
    }//propagateHighlightingUp

    get hasHighlightedUplinks()
    {
        for (const vertex of this.vertices) {
            if (vertex.anchor.conn?.hostElement instanceof NetworkLink && 
                (vertex.anchor.conn.hostElement._highlightDownlinks || vertex.anchor.conn.hostElement.hasHighlightedUplinks)) 
                return true;
        }//for
        return false;
    }//hasHighlightedUplinks

    private verticesInitialized = false;
    vertices: LinkVertex[] = [];

    override addConnectionPoint(name: string | number, connectionPoint: ConnectionPointProxy): void {
        super.addConnectionPoint(name, connectionPoint);
        const vertex = this.vertices[name as number];
        connectionPoint.isActive = !vertex.isConnected;
        vertex.ownConnectionPoint = connectionPoint;
    }//setConnectionPoint

    readonly initVertices = () => {
        if (!this.verticesInitialized) {
            this.vertices.forEach(vertex => vertex.init());
            this.verticesInitialized = true;
        }//if
    }//initVertices

    get head() {
        return this.vertices[0];
    }//head

    get tail() {
        return this.vertices[this.vertices.length-1];
    }//tail

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
    static readonly injectionKey = Symbol() as InjectionKey<NetworkLink>;

    override getNamePrefix()
    {
        return "Link";
    }//getNamePrefix

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

    public toXML(indentLevel: number): string 
    {
        const attrs = new Map<string, string>();
        attrs.set("class", this.getClass().name);
        attrs.set("name", this.name);
        this.dbID && attrs.set("db-id", this.dbID.toString());
        (this.vertices[0].isConnected || this.vertices[0].anchor.pos) && 
            attrs.set("from", this.vertices[0].toString());
        const n = this.vertices.length - 1;
        (this.vertices[n].isConnected || this.vertices[n].anchor.pos) && 
            attrs.set("to", this.vertices[n].toString());

        const attrStr = Array.from(attrs, attr => `${attr[0]}="${attr[1]}"`).join(' ');
        if (this.vertices.length <= 2 && this.propCount == 0) {
            return `${indent(indentLevel)}<link ${attrStr}/>`;
        } else {
            const xml = [`${indent(indentLevel)}<link ${attrStr}>`];

            xml.push(...this.propsToXML(indentLevel));
    
            for (let i = 1; i <= n - 1; i++) {
                xml.push(`${indent(indentLevel+1)}${this.vertices[i].toXML()}`);
            }//for

            xml.push(`${indent(indentLevel)}</link>`);
            return xml.join("\n");
        }//if
    }//toXML

    public get isLoopback() {
        const n = this.vertices.length - 1;
        return this.vertices[0].isConnected && this.vertices[n].isConnected && 
            this.vertices[0].anchor.conn!.hostElement === this.vertices[n].anchor.conn!.hostElement;
    }//isLoopback

    public selectLink(this: NetworkLink)
    {
        if (!this.isSelected) {
            this.kresmer.deselectAllElements(this);
            this.isSelected = true;
            this.bringToTop();
        }//if
    }//selectComponent

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

    public addVertex(this: NetworkLink, segmentNumber: number, mousePos: Position)
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


    public deleteVertex(vertexNumber: number) {
        if (this.vertices.length <= vertexNumber) {
            throw new KresmerException(`Attempt to delete a non-existent vertex (${this.id}, ${vertexNumber})`);
        }//if
        if (this.vertices.length <= 2) {
            console.info(`Attempt to delete the next-to-last vertex (${this.id}, ${vertexNumber})`);
            return null;
        }//if
        const vertex = this.vertices[vertexNumber];
        this.kresmer.undoStack.execAndCommit(new DeleteVertexOp(vertex));
        return vertex;
    }//deleteVertex


    public alignVertex(vertexNumber: number)
    {
        return this.vertices[vertexNumber].align();
    }//alignVertex

    public onMouseEnter()
    {
        this.isHighlighted = true;
        (this as unknown as NetworkLink).bringToTop();
    }//onMouseEnter

    public onMouseLeave()
    {
        if (this.isHighlighted) {
            (this as unknown as NetworkLink).restoreZPosition();
            this.isHighlighted = false;
        }//if
    }//onMouseLeave

    public onClick(this: NetworkLink, segmentNumber: number, event: MouseEvent)
    {
        if (event.ctrlKey) {
            this.kresmer.edAPI.addLinkVertex(this.id, segmentNumber, event);
        } else {
            this.selectLink();
        }//if
    }//onClick


    public onRightClick(this: NetworkLink, segmentNumber: number, event: MouseEvent)
    {
        this.selectLink();
        this.kresmer.emit("link-right-click", this, segmentNumber, event);
    }//onRightClick


    public onDoubleClick(this: NetworkLink, segmentNumber: number, event: MouseEvent)
    {
        this.selectLink();
        this.kresmer.emit("link-double-click", this, segmentNumber, event);
    }//onDoubleClick

}//_NetworkLink

export default class NetworkLink extends withZOrder(_NetworkLink) {}


// Editor operations

export class AddLinkOp extends EditorOperation {

    constructor (protected link: NetworkLink)
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

    constructor (protected link: NetworkLink)
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
                vertex.connect(this.link.getConnectionPoint(connectionPointName));
            });
        });
    }//undo
}//DeleteLinkOp

export class ChangeLinkClassOp extends EditorOperation {

    constructor(private link: NetworkLink, private newClass: NetworkLinkClass)
    {
        super();
        this.oldClass = link.getClass();
    }//ctor

    private readonly oldClass: NetworkLinkClass;

    override exec(): void {
        this.link.changeClass(this.newClass);
    }//exec

    override undo(): void {
        this.link.changeClass(this.oldClass);
    }//undo
}//ChangeLinkClassOp

class AddVertexOp extends EditorOperation {

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

class DeleteVertexOp extends AddVertexOp {
    exec() {
        super.undo();
    }//exec

    undo() {
        super.exec();
    }//undo
}//DeleteVertexOp
