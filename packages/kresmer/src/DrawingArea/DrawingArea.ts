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
import AreaVertex, { AreaVertexGeometry, AreaVertexInitParams } from "./AreaVertex";
import LinkVertex from "../NetworkLink/LinkVertex";
import { EditorOperation } from "../UndoStack";
import { Position } from "../Transform/Transform";
import { MapWithZOrder, withZOrder } from "../ZOrdering";
import { draggable } from "../Draggable";
import DrawingElementWithVertices from "../DrawingElement/DrawingElementWithVertices";
import XMLFormatter, { XMLTag } from "../XMLFormatter";

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

    setBorder(border: AreaBorder)
    {
        this.borders.push(border);
    }//setBorder

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

    public toXML(indentLevel: number): string 
    {
        const formatter = new XMLFormatter(indentLevel);

        const outerTag = new XMLTag("area", ["class", this.getClass().name], ["name", this.name]);
        this.dbID && outerTag.addAttrib("db-id", this.dbID.toString());

        formatter
            .pushTag(outerTag)
                .addLines(...this.propsXML(indentLevel))
                .pushTag("vertices")
                    .addLines(...this.vertices.map(v => v.toXML()))
                .popTag()
            .popTag();
        return formatter.xml;
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

    override addVertex(segmentNumber: number, pos: Position, geometry?: AreaVertexGeometry)
    {
        console.debug(`Add vertex: ${this.name}:${segmentNumber} (${pos.x}, ${pos.y})`);
        const vertexNumber = segmentNumber + 1;
        const vertex: AreaVertex = new AreaVertex(this, vertexNumber, {pos, geometry}).init();
        this.kresmer.undoStack.execAndCommit(new AddVertexOp(vertex));
        return vertex;
    }//addVertex

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


// export class AreaDeleteOp extends EditorOperation {

//     constructor(private controller: NetworkComponentController) 
//     {
//         super();
//     }//ctor

//     private detachedVertices = new Map<LinkVertex, string|number>();

//     override exec(): void {
//         this.controller.kresmer.links.forEach(link => {
//             link.vertices.forEach(vertex => {
//                 if (vertex.isConnected && vertex.anchor.conn!.hostElement === this.controller.component) {
//                     this.detachedVertices.set(vertex, vertex.anchor.conn!.name);
//                     vertex.detach();
//                 }//if
//             })//vertices
//         })//links

//         this.controller.kresmer.deleteArea(this.controller);
//     }//exec

//     override undo(): void {
//         this.controller.kresmer.addPositionedNetworkComponent(this.controller);
//         nextTick(() => {
//             this.controller.updateConnectionPoints();
//             this.detachedVertices.forEach((connectionPointName, vertex) => {
//                 vertex.connect(this.controller.component.getConnectionPoint(connectionPointName)!);
//             });
//         });
//     }//undo

// }//AreaDeleteOp


// export class AreaMoveUpOp extends EditorOperation {

//     constructor(private controller: NetworkComponentController) 
//     {
//         super();
//     }//ctor

//     override exec(): void {
//         this.controller.returnFromTop();
//         this.controller.kresmer.networkComponents.moveItemUp(this.controller);
//     }//exec

//     override undo(): void {
//         this.controller.returnFromTop();
//         this.controller.kresmer.networkComponents.moveItemDown(this.controller);
//     }//undo

// }//AreaMoveUpOp


// export class AreaMoveToTopOp extends EditorOperation {

//     constructor(private controller: NetworkComponentController) 
//     {
//         super();
//     }//ctor

//     private savedZIndex = 0;

//     override exec(): void {
//         this.controller.returnFromTop();
//         this.savedZIndex = this.controller.zIndex;
//         this.controller.kresmer.networkComponents.moveItemToTop(this.controller);
//     }//exec

//     override undo(): void {
//         this.controller.returnFromTop();
//         this.controller.kresmer.networkComponents.moveItemTo(this.controller, this.savedZIndex);
//     }//undo

// }//AreaMoveToTopOp

// export class AreaMoveDownOp extends EditorOperation {

//     constructor(private controller: NetworkComponentController) 
//     {
//         super();
//     }//ctor

//     override exec(): void {
//         this.controller.returnFromTop();
//         this.controller.kresmer.networkComponents.moveItemDown(this.controller);
//     }//exec

//     override undo(): void {
//         this.controller.returnFromTop();
//         this.controller.kresmer.networkAreas.moveItemUp(this.controller);
//     }//undo

// }//AreaMoveDownOp


// export class AreaMoveToBottomOp extends EditorOperation {

//     constructor(private controller: NetworkAreaController) 
//     {
//         super();
//     }//ctor

//     private savedZIndex = 0;

//     override exec(): void {
//         this.controller.returnFromTop();
//         this.savedZIndex = this.controller.zIndex;
//         this.controller.kresmer.networkAreas.moveItemToBottom(this.controller);
//     }//exec

//     override undo(): void {
//         this.controller.returnFromTop();
//         this.controller.kresmer.networkComponents.moveItemTo(this.controller, this.savedZIndex);
//     }//undo

// }//AreaMoveToBottomOp
