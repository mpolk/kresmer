/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * NetworkComponentController - a network component instance 
 * controller, responsible for its placement on the drawing, moving, 
 * transformations etc
 ***************************************************************************/

import Kresmer from "../Kresmer";
import NetworkComponent from "./NetworkComponent";
import { Position, Transform } from "../Transform/Transform";
import { TransformBoxZone } from "../Transform/TransformBox";

export type TransformMode = undefined | "scaling" | "rotation";

export default class NetworkComponentController {
    readonly kresmer: Kresmer;
    readonly component: NetworkComponent;
    origin: Position;
    transform: Transform;
    public isDragged = false;
    public isBeingTransformed = false;
    public transformMode?: TransformMode;

    private dragStartPos?: Position;
    private savedMousePos?: Position;
    public zIndex = -1;
    private savedZIndex = -1;

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


    private getMousePosition(event: MouseEvent) {
        return this.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.component.isHighlighted = true;
        this.dragStartPos = {...this.origin};
        this.savedMousePos = this.getMousePosition(event);
        this.isDragged = true;
        this.bringComponentToTop();
        this.kresmer.onComponentMoveStart(this);
    }//startDrag

    public drag(event: MouseEvent)
    {
        if (!this.isDragged)
            return false;
            
        const mousePos = this.getMousePosition(event);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.origin.x = mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.origin.y = mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y;
        this.kresmer.onComponentBeingMoved(this);
        return true;
    }//drag

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(event: MouseEvent)
    {
        if (this.isDragged) {
            this.component.isHighlighted = false;
            this.isDragged = false;
            this.kresmer.onComponentMoved(this);
            return true;
        }//if

        return false;
    }//endDrag

    
    public startRotate(event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.savedMousePos = this.getMousePosition(event);
        this.transform.makeSnapshot();
        this.isBeingTransformed = true;
        this.transformMode = "rotation";
        this.bringComponentToTop();
        this.kresmer.onComponentTransformStart(this);
    }//startRotate

    public rotate(event: MouseEvent, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const {r1, r0} = this.makeRaduisVectors(event, center);
        this.transform.rotate(r1, r0);
        this.kresmer.onComponentBeingTransformed(this);
        return true;
    }//rotate

    private makeRaduisVectors(event: MouseEvent, center: Position)
    {
        const mousePos = this.getMousePosition(event);
        const c = {x: center.x + this.origin.x, y: center.y + this.origin.y};
        const r1 = {x: mousePos.x - c.x, y: mousePos.y - c.y};
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const r0 = {x: this.savedMousePos!.x - c.x, y: this.savedMousePos!.y - c.y};
        return {r1, r0};
    }//makeRaduisVectors


    public startScale(event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.transform.makeSnapshot();
        this.savedMousePos = this.getMousePosition(event);
        this.isBeingTransformed = true;
        this.transformMode = "scaling";
        this.kresmer.onComponentTransformStart(this);
        this.bringComponentToTop();
    }//startScale

    public scale(event: MouseEvent, zone: TransformBoxZone, bBox: SVGRect, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const {r1, r0} = this.makeRaduisVectors(event, center);
        let direction = zone.replace('-handle', '');
        if (direction.length > 1 && !event.shiftKey) {
            direction = '*';
        }//if
        this.transform.changeScale(r1, r0, direction, bBox);
        this.kresmer.onComponentBeingTransformed(this);
        return true;
    }//scale

    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endTransform(event: MouseEvent)
    {
        if (!this.isBeingTransformed) {
            return false;
        }//if

        this.isBeingTransformed = false;
        this.kresmer.onComponentTransformed(this);
        return true;
    }//endTransform


    public bringComponentToTop()
    {
        if (this.zIndex < Number.MAX_SAFE_INTEGER) {
            this.savedZIndex = this.zIndex;
            this.zIndex = Number.MAX_SAFE_INTEGER;
        }//if
    }//bringComponentToTop

    public restoreComponentZPosition()
    {
        this.zIndex = this.savedZIndex;
    }//bringComponentToTop


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public enterTransformMode(_event:  MouseEvent)
    {
        // this.isBeingTransformed = true;
        this.kresmer.resetAllComponentMode(this);
        this.transformMode = "scaling";
        this.kresmer.onComponentEnteringTransformMode(this, this.transformMode);
        this.bringComponentToTop();
    }//enterTransformMode

    public resetMode()
    {
        // this.isBeingTransformed = false;
        this.transformMode = undefined;
        //this.kresmer.onComponentExitingTransformMode(this);
        this.restoreComponentZPosition();
    }//resetMode

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTransformBoxClick(_event: MouseEvent)
    {
        if (this.transformMode)
            this.kresmer.onComponentExitingTransformMode(this);
        this.transformMode = this.transformMode == "rotation" ? "scaling" : "rotation";
        this.kresmer.onComponentEnteringTransformMode(this, this.transformMode);
    }//onTransformBoxClick

}//NetworkComponentController
