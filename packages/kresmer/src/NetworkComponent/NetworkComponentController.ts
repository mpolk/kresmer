/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
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
import LinkVertex from "../NetworkLink/LinkVertex";
import { nextTick } from "vue";
import { withZOrder  } from "../ZOrdering";

export type TransformMode = undefined | "scaling" | "rotation";

class _NetworkComponentController {
    readonly kresmer: Kresmer;
    public component: NetworkComponent;
    origin: Position;
    transform: Transform;
    public isGoingToBeDragged = false;
    public isDragged = false;
    public isBeingTransformed = false;
    public transformMode?: TransformMode;

    private dragStartPos?: Position;
    private savedMousePos?: Position;

    constructor(
        kresmer: Kresmer,
        component: NetworkComponent,
        params: {
            origin: Position,
            transform?: Transform,
        }
    ) {
        this.kresmer = kresmer;
        this.component = component;
        this.origin = params.origin;
        this.transform = params.transform ? params.transform : new Transform;
    }//ctor

    get id() {return this.component.id}

    private getMousePosition(event: MouseEvent) {
        return this.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public selectComponent(this: NetworkComponentController, deselectTheRest: boolean): void
    {
        if (!this.component.isSelected) {
            if (deselectTheRest)
                this.kresmer.deselectAllElements(this);
            this.component.isSelected = true;
        } else if (!deselectTheRest) {
            this.component.isSelected = false;
        }//if
    }//selectComponent

    public startDrag(this: NetworkComponentController, event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.dragStartPos = {...this.origin};
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        this.bringToTop();
        this.kresmer.emit("component-move-started", this);
        this.kresmer.undoStack.startOperation(new ComponentMoveOp(this));
    }//startDrag

    public drag(this: NetworkComponentController, event: MouseEvent)
    {
        if (this.isGoingToBeDragged) {
            this.isGoingToBeDragged = false;
            this.isDragged = true;
        } else if (!this.isDragged) {
            return false;
        }//if
            
        const mousePos = this.getMousePosition(event);
        this.origin.x = mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x;
        this.origin.y = mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y;
        this.updateConnectionPoints();
        this.kresmer.emit("component-being-moved", this);
        return true;
    }//drag

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(this: NetworkComponentController, _event: MouseEvent)
    {
        if (this.isDragged) {
            this.isDragged = false;
            this.updateConnectionPoints();
            this.kresmer.undoStack.commitOperation();
            this.kresmer.emit("component-moved", this);
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
        this.kresmer.emit("component-transform-started", this);
        this.bringToTop();
        this.kresmer.undoStack.startOperation(new ComponentTransformOp(this));
    }//startScale

    public scale(this: NetworkComponentController, event: MouseEvent, zone: TransformBoxZone, bBox: SVGRect, center: Position)
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
        this.updateConnectionPoints();
        this.kresmer.undoStack.commitOperation();
        this.kresmer.emit("component-transformed", this);
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
        this.transformMode = "scaling";
        this.kresmer.emit("component-entered-transform-mode", this, this.transformMode);
        this.bringToTop();
    }//enterTransformMode

    public resetMode(this: NetworkComponentController)
    {
        // this.component.isSelected = false;
        // this.isBeingTransformed = false;
        this.transformMode = undefined;
        //this.kresmer.onComponentExitingTransformMode(this);
        this.restoreZPosition();
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
        attrs.set("class", this.component._class.name);
        this.component.isNamed && attrs.set("name", this.component.name);
        this.component.dbID && attrs.set("db-id", this.component.dbID.toString());

        const attrStr = Array.from(attrs, attr => `${attr[0]}="${attr[1]}"`).join(' ');
        const xml = [`${indent(indentLevel)}<component ${attrStr}>`];
        xml.push(`${indent(indentLevel+1)}<origin x="${this.origin.x}" y="${this.origin.y}"/>`);

        if (this.transform.nonEmpty) {
            xml.push(this.transform.toXML(indentLevel+1));
        }//if

        xml.push(...this.component.propsToXML(indentLevel));

        xml.push(`${indent(indentLevel)}</component>`);

        return xml.join("\n");
    }//toXML
}//_NetworkComponentController

export default class NetworkComponentController extends withZOrder(_NetworkComponentController) {}


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
                if (vertex.isConnected && vertex.anchor.conn!.component === this.controller.component) {
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
                vertex.connect(this.controller.component.connectionPoints[connectionPointName]);
            });
        });
    }//undo

}//ComponentDeleteOp

