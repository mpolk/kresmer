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
import MouseEventCapture from "../MouseEventCapture";
import LinkVertex from "../NetworkLink/LinkVertex";
import { nextTick } from "vue";
import { withZOrder  } from "../ZOrdering";
import { draggable } from "../Draggable";
import XMLFormatter, { XMLTag } from "../XMLFormatter";

export type TransformMode = undefined | "scaling" | "rotation";

export default class NetworkComponentController extends draggable(withZOrder(class{})) {
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
        this._origin = params.origin;
        this.transform = params.transform ? params.transform : new Transform;
    }//ctor

    readonly _kresmer: WeakRef<Kresmer>;
    get kresmer() {return this._kresmer.deref()!}

    protected _origin: Position;
    get origin() {return {...this._origin}}
    set origin(newValue: Position) {this._origin = {...newValue}}

    public component: NetworkComponent;
    get isSelected() {return this.component.isSelected}
    set isSelected(newValue: boolean) {this.component.isSelected = newValue}

    transform: Transform;
    public isBeingTransformed = false;
    public transformMode?: TransformMode;
    public isInAdjustmentMode = false;

    get id() {return this.component.id}

    _setMouseCaptureTarget(el: SVGElement)
    {
        this.mouseCaptureTarget = el;
    }//_setMouseCaptureTarget

    public selectComponent(deselectTheRest: boolean): void
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

    public get isThisSelected(): boolean {return this.isSelected;}

    notifyOnDragStart() {
        this.kresmer.emit("component-move-started", this);
    }//notifyOnDragStart

    notifyOnDrag() {
        this.kresmer.emit("component-being-moved", this);
    }//notifyOnDrag

    notifyOnDragEnd() {
        this.kresmer.emit("component-moved", this);
    }//notifyOnDragEnd

    createMoveOp() {
        return new ComponentMoveOp(this);
    }//createMoveOp
    
    public startRotate(event: MouseEvent)
    {
        this.kresmer.resetAllComponentModes(this);
        this.savedMousePos = this.getMousePosition(event);
        this.transform.makeSnapshot();
        this.isBeingTransformed = true;
        this.transformMode = "rotation";
        this.bringToTop();
        MouseEventCapture.start(this.mouseCaptureTarget!);
        this.kresmer.emit("component-transform-started", this);
        this.kresmer.undoStack.startOperation(new ComponentTransformOp(this));
    }//startRotate

    public rotate(event: MouseEvent, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const {r1, r0} = this.makeRadiusVectors(event, center);
        this.transform.rotate(r1, r0);
        this.updateConnectionPoints();
        this.kresmer.emit("component-being-transformed", this);
        return true;
    }//rotate

    private makeRadiusVectors(event: MouseEvent, center: Position)
    {
        const mousePos = this.getMousePosition(event);
        const c = {x: center.x + this.origin.x, y: center.y + this.origin.y};
        const r1 = {x: mousePos.x - c.x, y: mousePos.y - c.y};
        const r0 = {x: this.savedMousePos!.x - c.x, y: this.savedMousePos!.y - c.y};
        return {r1, r0};
    }//makeRadiusVectors


    public startScale(event: MouseEvent)
    {
        this.kresmer.resetAllComponentModes(this);
        this.transform.makeSnapshot();
        this.savedMousePos = this.getMousePosition(event);
        this.isBeingTransformed = true;
        this.transformMode = "scaling";
        this.bringToTop();
        MouseEventCapture.start(this.mouseCaptureTarget!);
        this.kresmer.emit("component-transform-started", this);
        this.kresmer.undoStack.startOperation(new ComponentTransformOp(this));
    }//startScale

    public scale(event: MouseEvent, zone: TransformBoxZone, 
                 bBox: SVGRect, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const {r1, r0} = this.makeRadiusVectors(event, center);
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
    public endTransform(_event: MouseEvent)
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
    public enterTransformMode(_event:  MouseEvent)
    {
        // this.isBeingTransformed = true;
        this.kresmer.resetAllComponentModes(this);
        this.kresmer.deselectAllElements();
        this.isInAdjustmentMode = false;
        this.transformMode = "scaling";
        this.kresmer.emit("component-entered-transform-mode", this, this.transformMode);
        this.bringToTop();
    }//enterTransformMode

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public enterAdjustmentMode(_event:  MouseEvent)
    {
        this.kresmer.resetAllComponentModes(this);
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
    public onTransformBoxClick(_event: MouseEvent)
    {
        if (this.transformMode) {
            this.kresmer.emit("component-exited-transform-mode", this);
        }//if
        this.transformMode = this.transformMode == "rotation" ? "scaling" : "rotation";
        this.kresmer.emit("component-entered-transform-mode", this, this.transformMode);
    }//onTransformBoxClick


    public toXML(formatter: XMLFormatter)
    {
        const outerTag = new XMLTag("component",
            ["class", this.component.getClass().name],
            ["name", this.component.name],
        );
        this.component.dbID && outerTag.addAttrib("db-id", this.component.dbID.toString());

        formatter.pushTag(outerTag)
            .addTag(new XMLTag("origin", ["x", this.origin.x], ["y", this.origin.y]));

        if (this.component.propCount)
            this.component.propsToXML(formatter);

        if (this.component.content)
            formatter.addLine(`<content>${this.component.content}</content>`);

        if (this.transform.nonEmpty)
            this.transform.toXML(formatter);

        formatter.popTag();
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
