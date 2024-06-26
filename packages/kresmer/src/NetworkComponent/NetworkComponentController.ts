/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * NetworkComponentController - a network component instance 
 * controller, responsible for its placement on the drawing, moving, 
 * transformations etc
 ***************************************************************************/

import Kresmer from "../Kresmer";
import NetworkComponent from "./NetworkComponent";
import { Position, Transform, ITransform } from "../Transform/Transform";
import { TransformBoxZone } from "../Transform/TransformBox";
import { EditorOperation } from "../UndoStack";
import { indent } from "../Utils";
import MouseEventCapture from "../MouseEventCapture";
import LinkVertex from "../NetworkLink/LinkVertex";
import { nextTick } from "vue";
import { withZOrder  } from "../ZOrdering";
import NetworkLink from "../NetworkLink/NetworkLink";

export type TransformMode = undefined | "scaling" | "rotation";


export default class NetworkComponentController extends withZOrder(class {}) {
    constructor(
        kresmer: Kresmer,
        component: NetworkComponent,
        params: {
            origin: Position,
            transform?: Transform,
        }
    ) {
        super();
        this._kresmer = new WeakRef(kresmer);
        this.component = component;
        this.component.controller = this;
        this.origin = params.origin;
        this.transform = params.transform ? params.transform : new Transform;
    }//ctor

    private readonly _kresmer: WeakRef<Kresmer>;
    get kresmer() { return this._kresmer.deref()! }
    public component: NetworkComponent;
    origin: Position;
    transform: Transform;
    public isGoingToBeDragged = false;
    public isDragged = false;
    public dragConstraint: DragConstraint|undefined;
    public isBeingTransformed = false;
    public transformMode?: TransformMode;
    public isInAdjustmentMode = false;

    private dragStartPos?: Position;
    private savedMousePos?: Position;

    get id() {return this.component.id}

    private mouseCaptureTarget?: SVGElement;
    _setMouseCaptureTarget(el: SVGElement)
    {
        this.mouseCaptureTarget = el;
    }//_setMouseCaptureTarget

    private getMousePosition(event: MouseEvent) {
        return this.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    get isSelected() {return this.component.isSelected}
    set isSelected(newValue: boolean) {this.component.isSelected = newValue}

    public selectComponent(this: NetworkComponentController, deselectTheRest: boolean): void
    {
        if (!this.component.isSelected) {
            if (deselectTheRest)
                this.kresmer.deselectAllElements(this);
            if (this.kresmer.isEditable)
                this.component.isSelected = true;
        } else if (!deselectTheRest) {
            this.component.isSelected = false;
        }//if
        this.transformMode = undefined;
        this.isInAdjustmentMode = false;
    }//selectComponent

    public startDrag(this: NetworkComponentController, event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        if (event.shiftKey)
            this.dragConstraint = "unknown";
        this._startDrag();
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        this.bringToTop();
        if (this.component.isSelected && this.kresmer.muiltipleComponentsSelected) {
            const op = new SelectionMoveOp(this.kresmer);
            this.kresmer.undoStack.startOperation(op);
            this.kresmer._startSelectionDragging(this, op);
        } else {
            this.kresmer.undoStack.startOperation(new ComponentMoveOp(this));
        }//if
        MouseEventCapture.start(this.mouseCaptureTarget!);
    }//startDrag

    public _startDrag(this: NetworkComponentController)
    {
        this.dragStartPos = {...this.origin};
        this.kresmer.emit("component-move-started", this);
    }//_startDrag

    public drag(this: NetworkComponentController, event: MouseEvent)
    {
        const mousePos = this.getMousePosition(event);
        const effectiveMove = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};

        if (this.isGoingToBeDragged) {
            if (Math.hypot(effectiveMove.x, effectiveMove.y) < 2)
                return false;
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this.kresmer._allLinksFreezed = true;
        } else if (!this.isDragged) {
            return false;
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
            case 'x': effectiveMove.y = 0; break;
            case 'y': effectiveMove.x = 0; break;
        }//switch
            
        this.moveFromStartPos(effectiveMove);
        if (this.component.isSelected && this.kresmer.muiltipleComponentsSelected) {
            this.kresmer._dragSelection(effectiveMove, this);
        }//if
        return true;
    }//drag

    public moveFromStartPos(this: NetworkComponentController, delta: Position)
    {
        this.origin.x = this.dragStartPos!.x + delta.x;
        this.origin.y = this.dragStartPos!.y + delta.y;
        if (this.kresmer.animateComponentDragging)
            this.updateConnectionPoints();
        this.kresmer.emit("component-being-moved", this);
    }//moveFromStartPos

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(this: NetworkComponentController, _event: MouseEvent)
    {
        if (this.isDragged) {
            this.isDragged = false;
            this.dragConstraint = undefined;
            MouseEventCapture.release();
            if (this.kresmer.snapToGrid) {
                this.origin = {
                    x: Math.round(this.origin.x / this.kresmer.snappingGranularity) * this.kresmer.snappingGranularity,
                    y: Math.round(this.origin.y / this.kresmer.snappingGranularity) * this.kresmer.snappingGranularity,
                };
            }//if
            this.updateConnectionPoints();
            if (this.component.isSelected && this.kresmer.muiltipleComponentsSelected) {
                this.kresmer._endSelectionDragging(this);
            }//if
            this.kresmer.undoStack.commitOperation();
            this.kresmer._allLinksFreezed = false;
            this.kresmer.emit("component-moved", this);
            this.alignConnectedLinks();
            return true;
        }//if

        return false;
    }//endDrag

    
    public startRotate(this: NetworkComponentController, event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.savedMousePos = this.getMousePosition(event);
        this.transform.makeSnapshot();
        this.isBeingTransformed = true;
        this.transformMode = "rotation";
        this.bringToTop();
        MouseEventCapture.start(this.mouseCaptureTarget!);
        this.kresmer.emit("component-transform-started", this);
        this.kresmer.undoStack.startOperation(new ComponentTransformOp(this));
    }//startRotate

    public rotate(this: NetworkComponentController, event: MouseEvent, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const {r1, r0} = this.makeRaduisVectors(event, center);
        this.transform.rotate(r1, r0);
        this.updateConnectionPoints();
        this.kresmer.emit("component-being-transformed", this);
        return true;
    }//rotate

    private makeRaduisVectors(event: MouseEvent, center: Position)
    {
        const mousePos = this.getMousePosition(event);
        const c = {x: center.x + this.origin.x, y: center.y + this.origin.y};
        const r1 = {x: mousePos.x - c.x, y: mousePos.y - c.y};
        const r0 = {x: this.savedMousePos!.x - c.x, y: this.savedMousePos!.y - c.y};
        return {r1, r0};
    }//makeRaduisVectors


    public startScale(this: NetworkComponentController, event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.transform.makeSnapshot();
        this.savedMousePos = this.getMousePosition(event);
        this.isBeingTransformed = true;
        this.transformMode = "scaling";
        this.bringToTop();
        MouseEventCapture.start(this.mouseCaptureTarget!);
        this.kresmer.emit("component-transform-started", this);
        this.kresmer.undoStack.startOperation(new ComponentTransformOp(this));
    }//startScale

    public scale(this: NetworkComponentController, event: MouseEvent, zone: TransformBoxZone, 
                 bBox: SVGRect, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const {r1, r0} = this.makeRaduisVectors(event, center);
        let direction = zone.replace('-handle', '');
        if (direction.length > 1 && !event.shiftKey) {
            direction = '*';
        }//if
        this.transform.changeScale(r1, r0, direction, bBox);
        this.updateConnectionPoints();
        this.kresmer.emit("component-being-transformed", this);
        return true;
    }//scale

    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endTransform(this: NetworkComponentController, _event: MouseEvent)
    {
        if (!this.isBeingTransformed) {
            return false;
        }//if

        this.isBeingTransformed = false;
        MouseEventCapture.release();
        this.updateConnectionPoints();
        this.kresmer.undoStack.commitOperation();
        this.kresmer.emit("component-transformed", this);
        this.alignConnectedLinks();
        return true;
    }//endTransform

    public updateConnectionPoints()
    {
        this.component.updateConnectionPoints();
    }//updateConnectionPoints


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public enterTransformMode(this: NetworkComponentController, _event:  MouseEvent)
    {
        // this.isBeingTransformed = true;
        this.kresmer.resetAllComponentMode(this);
        this.kresmer.deselectAllElements();
        this.isInAdjustmentMode = false;
        this.transformMode = "scaling";
        this.kresmer.emit("component-entered-transform-mode", this, this.transformMode);
        this.bringToTop();
    }//enterTransformMode

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public enterAdjustmentMode(this: NetworkComponentController, _event:  MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.kresmer.deselectAllElements();
        this.transformMode = undefined;
        this.isInAdjustmentMode = true;
        this.kresmer.emit("component-entered-adjustment-mode", this);
        this.bringToTop();
    }//enterAdjustmentMode

    public resetMode(this: NetworkComponentController)
    {
        // this.component.isSelected = false;
        // this.isBeingTransformed = false;
        if (this.transformMode) {
            this.transformMode = undefined;
            this.kresmer.emit("component-exited-transform-mode", this);
        }//if
        if (this.isInAdjustmentMode) {
            this.isInAdjustmentMode = false;
            this.kresmer.emit("component-exited-transform-mode", this);
        }//if
        this.returnFromTop();
    }//resetMode

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTransformBoxClick(this: NetworkComponentController, _event: MouseEvent)
    {
        if (this.transformMode) {
            this.kresmer.emit("component-exited-transform-mode", this);
        }//if
        this.transformMode = this.transformMode == "rotation" ? "scaling" : "rotation";
        this.kresmer.emit("component-entered-transform-mode", this, this.transformMode);
    }//onTransformBoxClick


    public toXML(indentLevel: number): string 
    {
        const attrs = new Map<string, string>();
        attrs.set("class", this.component.getClass().name);
        attrs.set("name", this.component.name);
        this.component.dbID && attrs.set("db-id", this.component.dbID.toString());

        const attrStr = Array.from(attrs, attr => `${attr[0]}="${attr[1]}"`).join(' ');
        const xml = [`${indent(indentLevel)}<component ${attrStr}>`];

        xml.push(`${indent(indentLevel+1)}<origin x="${this.origin.x}" y="${this.origin.y}"/>`);

        if (this.component.propCount)
            xml.push(...this.component.propsToXML(indentLevel));

        if (this.component.content)
            xml.push(`${indent(indentLevel+1)}<content>${this.component.content}</content>`)

        if (this.transform.nonEmpty)
            xml.push(this.transform.toXML(indentLevel+1));

        xml.push(`${indent(indentLevel)}</component>`);

        return xml.join("\n");
    }//toXML


    public async alignConnectedLinks()
    {
        if (this.kresmer.autoAlignVertices) {
            await nextTick();
            await nextTick();
            for (const link of this.component.connectedLinks) {
                this.kresmer.edAPI.alignLinkVertices({link});
            }//for
        }//if
    }//alignConnectedLinks
}//NetworkComponentController

type DragConstraint = "x" | "y" | "unknown";


// Editor operations
class ComponentMoveOp extends EditorOperation {

    constructor(controller: NetworkComponentController)
    {
        super();
        this.controller = controller;
        this.oldPos = {...controller.origin};
    }//ctor

    private controller: NetworkComponentController;
    private oldPos: Position;
    private newPos?: Position;

    override onCommit(): void {
        this.newPos = {...this.controller.origin};
    }//onCommit

    override exec(): void {
        this.controller.origin = {...this.newPos!};
        this.controller.updateConnectionPoints();
    }//exec

    override undo(): void {
        this.controller.origin = {...this.oldPos};
        this.controller.updateConnectionPoints();
    }//undo
}//ComponentMoveOp

export class SelectionMoveOp extends EditorOperation {

    constructor(kresmer: Kresmer)
    {
        super();
        for (const [, controller] of kresmer.networkComponents) {
            if (controller.component.isSelected) {
                this.controllers.push(controller);
                this.oldPos[controller.component.id] = {...controller.origin};
            }//if
        }//for
        for (const [, link] of kresmer.links) {
            if (link.isLoopback)
                continue;
            const fromComponent = link.vertices[0].anchor.conn?.hostElement ?? undefined;
            if (!fromComponent?.isSelected)
                continue;
            const toComponent = link.vertices[link.vertices.length-1].anchor.conn?.hostElement ?? undefined;
            if (!toComponent?.isSelected)
                continue;
            this.links.push(link);
            this.oldVertexPos[link.id] = link.vertices.map(v => ({...v.coords}));
        }//for
    }//ctor

    public controllers: NetworkComponentController[] = [];
    public links: NetworkLink[] = [];
    public oldPos: Record<number, Position> = {};
    private oldVertexPos: Record<number, Position[]> = {};
    public newPos: Record<number, Position> = {};
    private newVertexPos: Record<number, Position[]> = {};

    override onCommit(): void {
        for (const controller of this.controllers) {
            this.newPos[controller.component.id] = {...controller.origin};
        }//for
        for (const link of this.links) {
            this.newVertexPos[link.id] = link.vertices.map(v => ({...v.coords}));
        }//for
    }//onCommit

    override exec(): void {
        for (const controller of this.controllers) {
            controller.origin = {...this.newPos[controller.component.id]};
            controller.updateConnectionPoints();
        }//for
        for (const link of this.links) {
            for (let i = 0; i < link.vertices.length; ++i) {
                if (!link.vertices[i].isConnected) {
                    link.vertices[i].pinUp(this.newVertexPos[link.id][i]);
                }//if
            }//for
            link.updateConnectionPoints();
        }//for
    }//exec

    override undo(): void {
        for (const controller of this.controllers) {
            controller.origin = {...this.oldPos[controller.component.id]};
            controller.updateConnectionPoints();
        }//for
        for (const link of this.links) {
            for (let i = 0; i < link.vertices.length; ++i) {
                if (!link.vertices[i].isConnected) {
                    link.vertices[i].pinUp(this.oldVertexPos[link.id][i]);
                }//if
            }//for
            link.updateConnectionPoints();
        }//for
    }//undo
}//SelectionMoveOp

class ComponentTransformOp extends EditorOperation {

    constructor(controller: NetworkComponentController)
    {
        super();
        this.controller = controller;
        this.oldTransform = controller.transform.data;
    }//ctor

    private controller: NetworkComponentController;
    private oldTransform: ITransform;
    private newTransform?: ITransform;

    override onCommit(): void {
        this.newTransform = this.controller.transform.data;
    }//onCommit

    override exec(): void {
        this.controller.transform.data = this.newTransform!;
        this.controller.updateConnectionPoints();
    }//exec

    override undo(): void {
        this.controller.transform.data = this.oldTransform;
        this.controller.updateConnectionPoints();
    }//undo
}//ComponentTransformOp


export class ComponentAddOp extends EditorOperation {

    constructor(private controller: NetworkComponentController) 
    {
        super();
    }//ctor

    override exec(): void {
        this.controller.kresmer.addPositionedNetworkComponent(this.controller);
    }//exec

    override undo(): void {
        this.controller.kresmer.deleteComponent(this.controller);
    }//undo
}//ComponentAddOp


export class ComponentDeleteOp extends EditorOperation {

    constructor(private controller: NetworkComponentController) 
    {
        super();
    }//ctor

    private detachedVertices = new Map<LinkVertex, string|number>();

    override exec(): void {
        this.controller.kresmer.links.forEach(link => {
            link.vertices.forEach(vertex => {
                if (vertex.isConnected && vertex.anchor.conn!.hostElement === this.controller.component) {
                    this.detachedVertices.set(vertex, vertex.anchor.conn!.name);
                    vertex.detach();
                }//if
            })//vertices
        })//links

        this.controller.kresmer.deleteComponent(this.controller);
    }//exec

    override undo(): void {
        this.controller.kresmer.addPositionedNetworkComponent(this.controller);
        nextTick(() => {
            this.controller.updateConnectionPoints();
            this.detachedVertices.forEach((connectionPointName, vertex) => {
                vertex.connect(this.controller.component.getConnectionPoint(connectionPointName)!);
            });
        });
    }//undo

}//ComponentDeleteOp


export class ComponentMoveUpOp extends EditorOperation {

    constructor(private controller: NetworkComponentController) 
    {
        super();
    }//ctor

    override exec(): void {
        this.controller.returnFromTop();
        this.controller.kresmer.networkComponents.moveItemUp(this.controller);
    }//exec

    override undo(): void {
        this.controller.returnFromTop();
        this.controller.kresmer.networkComponents.moveItemDown(this.controller);
    }//undo

}//ComponentMoveUpOp


export class ComponentMoveToTopOp extends EditorOperation {

    constructor(private controller: NetworkComponentController) 
    {
        super();
    }//ctor

    private savedZIndex = 0;

    override exec(): void {
        this.controller.returnFromTop();
        this.savedZIndex = this.controller.zIndex;
        this.controller.kresmer.networkComponents.moveItemToTop(this.controller);
    }//exec

    override undo(): void {
        this.controller.returnFromTop();
        this.controller.kresmer.networkComponents.moveItemTo(this.controller, this.savedZIndex);
    }//undo

}//ComponentMoveToTopOp

export class ComponentMoveDownOp extends EditorOperation {

    constructor(private controller: NetworkComponentController) 
    {
        super();
    }//ctor

    override exec(): void {
        this.controller.returnFromTop();
        this.controller.kresmer.networkComponents.moveItemDown(this.controller);
    }//exec

    override undo(): void {
        this.controller.returnFromTop();
        this.controller.kresmer.networkComponents.moveItemUp(this.controller);
    }//undo

}//ComponentMoveDownOp


export class ComponentMoveToBottomOp extends EditorOperation {

    constructor(private controller: NetworkComponentController) 
    {
        super();
    }//ctor

    private savedZIndex = 0;

    override exec(): void {
        this.controller.returnFromTop();
        this.savedZIndex = this.controller.zIndex;
        this.controller.kresmer.networkComponents.moveItemToBottom(this.controller);
    }//exec

    override undo(): void {
        this.controller.returnFromTop();
        this.controller.kresmer.networkComponents.moveItemTo(this.controller, this.savedZIndex);
    }//undo

}//ComponentMoveToBottomOp
