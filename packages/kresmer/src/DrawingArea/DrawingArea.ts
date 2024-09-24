/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Area - data object 
 ***************************************************************************/

import { InjectionKey, nextTick, reactive } from "vue";
import Kresmer from "../Kresmer";
import { UndefinedAreaClassException } from "../KresmerException";
import DrawingAreaClass from "./DrawingAreaClass";
import AreaVertex, { AreaVertexGeometryRaw, AreaVertexInitParams } from "./AreaVertex";
import LinkVertex from "../NetworkLink/LinkVertex";
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";
import { MapWithZOrder, withZOrder } from "../ZOrdering";
import { draggable } from "../Draggable";
import DrawingElementWithVertices from "../DrawingElement/DrawingElementWithVertices";
import XMLFormatter, { XMLTag } from "../XMLFormatter";
import { Rule } from "postcss";

/**
 * Drawing Area 
 */
export default class DrawingArea extends draggable(withZOrder(DrawingElementWithVertices)) {
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
            vertices?: AreaVertexInitParams[],
            borders?: AreaBorder[],
        }
    ) {
        const clazz = _class instanceof DrawingAreaClass ? _class : DrawingAreaClass.getClass(_class);
        if (!clazz) {
            throw new UndefinedAreaClassException({className: _class as string});
        }//if
        super(kresmer, clazz, args);
        let i = 0;
        args?.vertices?.forEach(initParams => this.vertices.push(new AreaVertex(this, i++, initParams)));
        args?.borders?.forEach(this.setBorder);
    }//ctor

    declare protected _class: DrawingAreaClass;
    override getClass(): DrawingAreaClass {
        return this._class;
    }//getClass
    override isClosed = true;
    declare vertices: AreaVertex[];

    get origin(): Position {return this.vertices[0].coords}
    set origin(newValue: Position) {
        const delta = {x: newValue.x - this.origin.x, y: newValue.y - this.origin.y};
        for (const v of this.vertices) {
            v.move(delta);
        }//for
    }//set origin

    readonly borders: AreaBorder[] = [];
    readonly borderBeingCreated: {value: AreaBorder|undefined} = reactive({value: undefined});

    setBorder(border: AreaBorder)
    {
        this.borders.push(border);
        return this;
    }//setBorder

    getBorder(segmentNumber: number): AreaBorder|undefined
    {
        const n = this.vertices.length;
        return this.borders.findLast(border => {
            return segmentNumber >= border.from && segmentNumber < border.to ||
                segmentNumber + n >= border.from && segmentNumber < border.to + n;
        });
    }//getBorder

    removeBorder(border: AreaBorder)
    {
        const i = this.borders.findIndex(b => b === border);
        if (i >= 0)
            this.borders.splice(i);
    }//removeBorder

    get borderStyles(): string[]
    {
        if (!this._class.style)
            return [];

        const styles: string[] = [];
        for (const decl of this._class.style.nodes) {
            if (decl.type === "rule") {
                const selector = (decl as Rule).selectors[0];
                if (selector.startsWith(".border"))
                    styles.push(selector.split(".")[1]);
            }//if
        }//for

        return styles;
    }//borderStyles

    startSettingBorder(segmentNumber: number, borderClass: string)
    {
        this.borderBeingCreated.value = {clazz: borderClass, from: segmentNumber, to: segmentNumber};
    }//startSettingBorder

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<DrawingArea>;

    override checkNameUniqueness(name: string): boolean {
        return name == this.name || !this.kresmer.areasByName.has(name);
    }//checkNameUniqueness

    override get isSelected() {return super.isSelected}
    override set isSelected(newValue: boolean)
    {
        super.isSelected = newValue;
        if (!newValue) {
            for (const v of this.vertices) {
                v.isSelected = false;
            }//for
        }//if
    }//isSelected

    public get isThisSelected(): boolean {return this.isSelected;}

    toString()
    {
        return `${this.name}: ${this.getClass().name}`;
    }//toString

    get displayString()
    {
        return this.toString();
    }//displayString

    public toXML(formatter: XMLFormatter)
    {
        const outerTag = new XMLTag("area", ["class", this.getClass().name], ["name", this.name]);
        this.dbID && outerTag.addAttrib("db-id", this.dbID.toString());

        formatter
            .pushTag(outerTag);
                this.propsToXML(formatter);
                formatter.pushTag("vertices")
                this.vertices.forEach(v => v.toXML(formatter));
                formatter.popTag()
            .popTag();
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

    override createVertex(segmentNumber: number, pos: Position, geometry?: AreaVertexGeometryRaw)
    {
        console.debug(`Add vertex: ${this.name}:${segmentNumber} (${pos.x}, ${pos.y})`);
        const vertexNumber = segmentNumber + 1;
        const vertex: AreaVertex = new AreaVertex(this, vertexNumber, {pos, geometry}).init();
        return vertex;
    }//createVertex

    public get wouldAlignVertices() {return new Set(this.vertices);}


    public async alignConnectedLinks()
    {
        if (this.kresmer.autoAlignVertices) {
            await nextTick();
            await nextTick();
            for (const link of this.connectedLinks) {
                this.kresmer.edAPI.alignLinkVertices({link});
            }//for
        }//if
    }//alignConnectedLinks


    public onClick(event: MouseEvent, segmentNumber?: number)
    {
        if (event.ctrlKey && segmentNumber) {
            this.kresmer.edAPI.addAreaVertex(this.id, segmentNumber, event);
        } else {
            this.selectThis();
        }//if
    }//onClick

    public onRightClick(event: MouseEvent, segmentNumber?: number)
    {
        this.selectThis();
        this.kresmer.emit("area-right-click", this, event, segmentNumber);
    }//onRightClick

    public onDoubleClick(event: MouseEvent, segmentNumber?: number)
    {
        this.selectThis();
        this.kresmer.emit("area-double-click", this, event, segmentNumber);
    }//onDoubleClick

    notifyOnDragStart(): void {
        this.kresmer.emit("area-move-started", this);
    }//notifyOnDragStart

    notifyOnDrag(): void {
        this.kresmer.emit("area-being-moved", this);
    }//notifyOnDrag

    notifyOnDragEnd(): void {
        this.kresmer.emit("area-moved", this);
    }//notifyOnDragEnd

    createMoveOp() {
        return new AreaMoveOp(this);
    }//createMoveOp

}//DrawingArea

export class DrawingAreaMap extends MapWithZOrder<number, DrawingArea> {}
export type AreaSpec = {area: DrawingArea}|{areaID: number};

export interface AreaBorder {
    from: number,
    to: number,
    clazz: string,
}//AreaBorder


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


class AreaMoveOp extends EditorOperation {

    constructor(private area: DrawingArea)
    {
        super();
        this.oldPos = {...area.origin};
    }//ctor

    private oldPos: Position;
    private newPos?: Position;

    override onCommit(): void {
        this.newPos = {...this.area.origin};
    }//onCommit

    override exec(): void {
        this.area.origin = {...this.newPos!};
        this.area.updateConnectionPoints();
    }//exec

    override undo(): void {
        this.area.origin = {...this.oldPos};
        this.area.updateConnectionPoints();
    }//undo
}//AreaMoveOp


export class AreaMoveUpOp extends EditorOperation {

    constructor(private area: DrawingArea) 
    {
        super();
    }//ctor

    override exec(): void {
        this.area.returnFromTop();
        this.area.kresmer.areas.moveItemUp(this.area);
    }//exec

    override undo(): void {
        this.area.returnFromTop();
        this.area.kresmer.areas.moveItemDown(this.area);
    }//undo

}//AreaMoveUpOp


export class AreaMoveToTopOp extends EditorOperation {

    constructor(private area: DrawingArea) 
    {
        super();
    }//ctor

    private savedZIndex = 0;

    override exec(): void {
        this.area.returnFromTop();
        this.savedZIndex = this.area.zIndex;
        this.area.kresmer.areas.moveItemToTop(this.area);
    }//exec

    override undo(): void {
        this.area.returnFromTop();
        this.area.kresmer.areas.moveItemTo(this.area, this.savedZIndex);
    }//undo

}//AreaMoveToTopOp

export class AreaMoveDownOp extends EditorOperation {

    constructor(private area: DrawingArea) 
    {
        super();
    }//ctor

    override exec(): void {
        this.area.returnFromTop();
        this.area.kresmer.areas.moveItemDown(this.area);
    }//exec

    override undo(): void {
        this.area.returnFromTop();
        this.area.kresmer.areas.moveItemUp(this.area);
    }//undo

}//AreaMoveDownOp


export class AreaMoveToBottomOp extends EditorOperation {

    constructor(private area: DrawingArea) 
    {
        super();
    }//ctor

    private savedZIndex = 0;

    override exec(): void {
        this.area.returnFromTop();
        this.savedZIndex = this.area.zIndex;
        this.area.kresmer.areas.moveItemToBottom(this.area);
    }//exec

    override undo(): void {
        this.area.returnFromTop();
        this.area.kresmer.areas.moveItemTo(this.area, this.savedZIndex);
    }//undo

}//AreaMoveToBottomOp


export class SetAreaBorderOp extends EditorOperation {

    constructor(protected area: DrawingArea, protected border: AreaBorder) 
    {
        super();
    }//ctor

    override exec(): void {
        this.area.setBorder(this.border);
    }//exec

    override undo(): void {
        this.area.removeBorder(this.border);
    }//undo

}//SetAreaBorderOp

export class RemoveAreaBorderOp extends SetAreaBorderOp {

    constructor(protected area: DrawingArea, protected border: AreaBorder) 
    {
        super(area, border);
    }//ctor

    override exec(): void {
        super.undo();
    }//exec

    override undo(): void {
        super.exec();
    }//undo

}//RemoveAreaBorderOp
