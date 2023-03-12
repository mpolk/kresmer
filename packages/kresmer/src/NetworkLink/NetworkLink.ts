/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link - data object 
 ***************************************************************************/

import { InjectionKey } from "vue";
import Kresmer from "../Kresmer";
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

    private verticesInitialized = false;
    vertices: LinkVertex[] = [];

    readonly initVertices = () => {
        if (!this.verticesInitialized) {
            this.vertices.forEach(vertex => vertex.init());
            this.headPosition = this.vertices[0].coords;
            this.verticesInitialized = true;
        }//if
    }//initVertices

    private headPosition: Position = {x: 0, y: 0}; 
    private prevHeadPosition: Position = {x: 0, y: 0};
    public headMove = {x: 0, y: 0, trigger: 0};

    public _trackHead(newHeadPosition: Position) {
        this.prevHeadPosition = this.headPosition;
        this.headPosition = {...newHeadPosition};
        this.headMove.x = this.headPosition.x - this.prevHeadPosition.x;
        this.headMove.y = this.headPosition.y - this.prevHeadPosition.y;
        this.headMove.trigger++;
    }//_trackHead

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkLink>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

    toString()
    {
        let str = `${this.name}: ${this.getClass().name}`;
        if (this.verticesInitialized) {
            str += ` (${this.vertices[0]} => ${this.vertices[this.vertices.length - 1]})`;
        }//if
        return str;
    }//toString

    public get isLoopback() {
        const n = this.vertices.length - 1;
        return this.vertices[0].isConnected && this.vertices[n].isConnected && 
            this.vertices[0].anchor.conn!.component === this.vertices[n].anchor.conn!.component;
    }//isLoopback

    public selectLink(this: NetworkLink)
    {
        if (!this.isSelected) {
            this.kresmer.deselectAllElements(this);
            this.isSelected = true;
        }//if
    }//selectComponent


    public addVertex(this: NetworkLink, segmentNumber: number, mousePos: Position)
    {
        console.debug(`Add vertex: ${this.name}:${segmentNumber} (${mousePos.x}, ${mousePos.y})`);
        const vertexNumber = segmentNumber + 1;
        const pos = this.kresmer.applyScreenCTM(mousePos);
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


    public toXML(indentLevel: number): string 
    {
        const attrs = new Map<string, string>();
        attrs.set("class", this._class.name);
        this.isNamed && attrs.set("name", this.name);
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
    
            for (let i = 1; i <= n - 1; i++) {
                xml.push(`${indent(indentLevel+1)}${this.vertices[i].toXML()}`);
            }//for

            xml.push(...this.propsToXML(indentLevel));

            xml.push(`${indent(indentLevel)}</link>`);
            return xml.join("\n");
        }//if
    }//toXML

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

export class DeleteLinkOp extends AddLinkOp {
    override exec(): void {
        super.undo();
    }//exec

    override undo(): void {
        super.exec();
    }//undo
}//DeleteLinkOp

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