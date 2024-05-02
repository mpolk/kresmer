/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area - data object 
 ***************************************************************************/

import { InjectionKey, nextTick } from "vue";
import Kresmer from "../Kresmer";
import { UndefinedAreaClassException } from "../KresmerException";
import DrawingAreaClass from "./DrawingAreaClass";
import AreaVertex from "./AreaVertex";
import LinkVertex from "../NetworkLink/LinkVertex";
import { VertexInitParams } from "../Vertex/Vertex";
import NetworkElementWithVertices from "../NetworkElement/NetworkElementWithVertices";
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";
import { indent } from "../Utils";
import { MapWithZOrder, withZOrder } from "../ZOrdering";

/**
 * Drawing Area 
 */

export default class DrawingArea extends withZOrder(NetworkElementWithVertices) {
    /**
     * 
     * @param _class The class this Area should belong 
     *               (either Area class instance or its name)
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
            vertices?: VertexInitParams[],
        }
    ) {
        const clazz = _class instanceof DrawingAreaClass ? _class : DrawingAreaClass.getClass(_class);
        if (!clazz) {
            throw new UndefinedAreaClassException({className: _class as string});
        }//if
        super(kresmer, clazz, args);
        let i = 0;
        args?.vertices?.forEach(initParams => this.vertices.push(new AreaVertex(this, i++, initParams)));
    }//ctor

    declare protected _class: DrawingAreaClass;
    override getClass(): DrawingAreaClass {
        return this._class;
    }//getClass
    override isClosed = true;
    declare vertices: AreaVertex[];

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<DrawingArea>;

    override checkNameUniqueness(name: string): boolean {
        return name == this.name || !this.kresmer.areasByName.has(name);
    }//checkNameUniqueness

    toString()
    {
        return `${this.name}: ${this.getClass().name}`;
    }//toString

    get displayString()
    {
        return this.toString();
    }//displayString

    public toXML(indentLevel: number): string 
    {
        const attrs = new Map<string, string>();
        attrs.set("class", this.getClass().name);
        attrs.set("name", this.name);
        this.dbID && attrs.set("db-id", this.dbID.toString());

        const attrStr = Array.from(attrs, attr => `${attr[0]}="${attr[1]}"`).join(' ');
        const xml = [`${indent(indentLevel)}<area ${attrStr}>`];

        xml.push(...this.propsToXML(indentLevel));

        for (let i = 1; i <= this.vertices.length - 1; i++) {
            xml.push(`${indent(indentLevel+1)}${this.vertices[i].toXML()}`);
        }//for

        xml.push(`${indent(indentLevel)}</area>`);
        return xml.join("\n");
    }//toXML

    override selectThis()
    {
        if (!this.isSelected) {
            this.kresmer.deselectAllElements(this);
            this.isSelected = true;
            this.bringToTop();
        }//if
    }//selectThis

    override _onSelection(willBeSelected: boolean): true {
        this.kresmer.emit("area-selected", this, willBeSelected);
        return true;
    }//onSelection

    override get _byNameIndex(): Map<string, number> {
        return this.kresmer.areasByName;
    }//_byNameIndex

    override addVertex(segmentNumber: number, mousePos: Position)
    {
        console.debug(`Add vertex: ${this.name}:${segmentNumber} (${mousePos.x}, ${mousePos.y})`);
        const vertexNumber = segmentNumber + 1;
        const pos = this.kresmer.applyScreenCTM(mousePos);
        const vertex: AreaVertex = new AreaVertex(this, vertexNumber, {pos}).init();
        this.kresmer.undoStack.execAndCommit(new AddVertexOp(vertex));
        return vertex;
    }//addVertex

    public get wouldAlignVertices() {return new Set(this.vertices);}

    public onClick(this: DrawingArea, segmentNumber: number, event: MouseEvent)
    {
        if (event.ctrlKey) {
            this.kresmer.edAPI.addAreaVertex(this.id, segmentNumber, event);
        } else {
            this.selectThis();
        }//if
    }//onClick


    public onRightClick(this: DrawingArea, segmentNumber: number, event: MouseEvent)
    {
        this.selectThis();
        this.kresmer.emit("area-right-click", this, segmentNumber, event);
    }//onRightClick


    public onDoubleClick(this: DrawingArea, segmentNumber: number, event: MouseEvent)
    {
        this.selectThis();
        this.kresmer.emit("area-double-click", this, segmentNumber, event);
    }//onDoubleClick

}//_DrawingArea

export class DrawingAreaMap extends MapWithZOrder<number, DrawingArea> {}
export type AreaSpec = {area: DrawingArea}|{areaID: number};


// Editor operations

export class AddAreaOp extends EditorOperation {

    constructor (protected area: DrawingArea)
    {
        super();
    }//ctor

    override exec(): void {
        this.area.kresmer.addArea(this.area);
    }//exec

    override undo(): void {
        this.area.kresmer.deleteArea(this.area);
    }//undo
}//AddAreaOp

export class DeleteAreaOp extends EditorOperation {

    constructor (protected area: DrawingArea)
    {
        super();
    }//ctor

    private detachedVertices = new Map<LinkVertex, string|number>();

    override exec(): void {
        this.area.kresmer.links.forEach(link => {
            link.vertices.forEach(vertex => {
                if (vertex.isConnected && vertex.anchor.conn!.hostElement === this.area) {
                    this.detachedVertices.set(vertex, vertex.anchor.conn!.name);
                    vertex.detach();
                }//if
            })//vertices
        })//areas

        this.area.kresmer.deleteArea(this.area);
    }//exec

    override undo(): void {
        this.area.kresmer.addArea(this.area);
        nextTick(() => {
            this.area.updateConnectionPoints();
            this.detachedVertices.forEach((connectionPointName, vertex) => {
                vertex.connect(this.area.getConnectionPoint(connectionPointName)!);
            });
        });
    }//undo
}//DeleteAreaOp

export class ChangeAreaClassOp extends EditorOperation {

    constructor(private area: DrawingArea, private newClass: DrawingAreaClass)
    {
        super();
        this.oldClass = area.getClass();
    }//ctor

    private readonly oldClass: DrawingAreaClass;

    override exec(): void {
        this.area.changeClass(this.newClass);
    }//exec

    override undo(): void {
        this.area.changeClass(this.oldClass);
    }//undo
}//ChangeAreaClassOp

export class AddVertexOp extends EditorOperation {

    constructor(protected vertex: AreaVertex)
    {
        super();
    }//ctor

    exec() {
        const area = this.vertex.parentElement;
        const vertexNumber = this.vertex.vertexNumber;
        area.vertices.splice(vertexNumber, 0, this.vertex);
        for (let i = vertexNumber + 1; i < area.vertices.length; i++) {
            area.vertices[i].vertexNumber = i;
        }//for
        nextTick(() => {
            this.vertex.ownConnectionPoint.updatePos();
        });
    }//exec

    undo() {
        const area = this.vertex.parentElement;
        const vertexNumber = this.vertex.vertexNumber;
        area.vertices.splice(vertexNumber, 1);
        for (let i = vertexNumber; i < area.vertices.length; i++) {
            area.vertices[i].vertexNumber = i;
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
