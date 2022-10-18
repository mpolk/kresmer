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
    private savedTransform?: Transform;
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
        return true;
    }//drag

    
    public startRotate(event: MouseEvent, center: Position)
    {
        this.kresmer.resetAllComponentMode(this);
        this.savedMousePos = this.getMousePosition(event);
        this.transform.setPivot({x: center.x * this.transform.scale.x, y: center.y * this.transform.scale.y});
        this.savedTransform = new Transform(this.transform);
        this.isBeingTransformed = true;
        this.transformMode = "rotation";
        this.bringComponentToTop();
    }//startRotate

    public rotate(event: MouseEvent, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const mousePos = this.getMousePosition(event);
        const c = {
            x: center.x * this.transform.scale.x + this.origin.x + this.transform.translation.x, 
            y: center.y * this.transform.scale.y + this.origin.y + this.transform.translation.y
        };
        const r1 = {x: mousePos.x - c.x, y: mousePos.y - c.y};
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const r0 = {x: this.savedMousePos!.x - c.x, y: this.savedMousePos!.y - c.y};
        const angleDelta = Math.atan2(r0.x * r1.y - r0.y * r1.x, r0.x * r1.x + r0.y * r1.y) / 
                           Math.PI * 180;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.transform.rotate.angle = this.savedTransform!.rotate.angle + angleDelta;
        (this.transform.rotate.angle < 0) && (this.transform.rotate.angle += 360);
        (this.transform.rotate.angle > 360) && (this.transform.rotate.angle -= 360);
        return true;
    }//rotate


    public startScale(event: MouseEvent)
    {
        this.kresmer.resetAllComponentMode(this);
        this.savedTransform = new Transform(this.transform);
        this.savedMousePos = this.getMousePosition(event);
        this.isBeingTransformed = true;
        this.transformMode = "scaling";
        this.bringComponentToTop();
    }//startScale

    public scale(event: MouseEvent, zone: TransformBoxZone, bBox: SVGRect)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const zonePrefix = zone.replace('-handle', '');
        const mousePos = this.getMousePosition(event);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const savedMousePos = this.savedMousePos!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const savedTransform = this.savedTransform!;

        const dx0 = mousePos.x - savedMousePos.x;
        const dy0 = mousePos.y - savedMousePos.y;
        const fi = this.transform.rotate.angle * Math.PI / 180;
        const sinFi = Math.sin(fi); const cosFi = Math.cos(fi);

        let dx1 = 0; 
        let dy1 = 0;
        switch (zonePrefix) {
            case "se":
                dx1 =  dx0 * cosFi + dy0 * sinFi;
                dy1 = -dx0 * sinFi + dy0 * cosFi;
                break;
            case "s":
                dy1 = -dx0 * sinFi + dy0 * cosFi;
                break;
            case "e":
                dx1 =  dx0 * cosFi + dy0 * sinFi;
                break;
            case "nw":
                dx1 = -dx0 * cosFi - dy0 * sinFi;
                dy1 =  dx0 * sinFi - dy0 * cosFi;
                break;
            case "n":
                dy1 =  dx0 * sinFi - dy0 * cosFi;
                break;
            case "w":
                dx1 = -dx0 * cosFi - dy0 * sinFi;
                break;
            case "ne":
                dx1 =  dx0 * cosFi + dy0 * sinFi;
                dy1 =  dx0 * sinFi - dy0 * cosFi;
                break;
            case "sw":
                dx1 = -dx0 * cosFi - dy0 * sinFi;
                dy1 = -dx0 * sinFi + dy0 * cosFi;
                break;
        }//switch

        this.transform.scale.x = savedTransform.scale.x + dx1 / bBox.width;
        this.transform.scale.y = savedTransform.scale.y + dy1 / bBox.height;

        let dx2 = 0;
        let dy2 = 0;
        switch (zonePrefix) {
            case "nw":
            case "n":
            case "w":
                dx2 = dx1 * cosFi - dy1 * sinFi;
                dy2 = dx1 * sinFi + dy1 * cosFi;
                break;
            case "ne":
                dx2 =              -dy1 * sinFi;
                dy2 = dx1 * sinFi + dy1 * cosFi;
                break;
            case "sw":
                dx2 = dx1 * cosFi - dy1 * sinFi;
                dy2 = -dx1 * sinFi;
                break;
        }//switch

        this.transform.translation.x = savedTransform.translation.x - dx2;
        this.transform.translation.y = savedTransform.translation.y - dy2;

        return true;
    }//scale

    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endTransform(event: MouseEvent)
    {
        this.isDragged = false;
        if (!this.isBeingTransformed) {
            return false;
        }//if

        this.isBeingTransformed = false;
        // this.transformMode = undefined;
        this.kresmer.onNetworkComponentTransformed(this);
        return true;
    }//endTransform

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(event: MouseEvent)
    {
        if (this.isDragged) {
            this.component.isHighlighted = false;
            this.isDragged = false;
            this.kresmer.onNetworkComponentMoved(this);
            return true;
        }//if

        return false;
    }//endDrag


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
        this.bringComponentToTop();
    }//enterTransformMode

    public resetMode()
    {
        // this.isBeingTransformed = false;
        this.transformMode = undefined;
        this.restoreComponentZPosition();
    }//resetMode

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTransformBoxClick(_event: MouseEvent)
    {
        this.transformMode = this.transformMode == "rotation" ? "scaling" : "rotation";
    }//onTransformBoxClick

}//NetworkComponentController
