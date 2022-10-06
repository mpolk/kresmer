/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Controller - a generic network element instance 
 * controller, responsible for its placement, transformations etc
 ***************************************************************************/

import { PropType } from "vue";
import Kresmer from "../Kresmer";
import NetworkComponent from "./NetworkComponent";
import { Position, Transform } from "../Transform/Transform";

export const NetworkComponentHolderProps = {
    origin: {type: Object as PropType<Position>, required: true},
    transform: {type: Object as PropType<Transform>},
    svg: {type: Object as PropType<SVGGraphicsElement>},
    isHighlighted: {type: Boolean, default: false},
    isDragged: {type: Boolean, default: false},
    isBeingTransformed: {type: Boolean, default: false},
    transformMode: {type: String as PropType<TransformMode>},
}//NetworkComponentHolderProps

export type TransformMode = undefined | "scaling" | "x-scaling" | "y-scaling" | "rotation";

export default class NetworkComponentController {
    readonly kresmer: Kresmer;
    readonly component: NetworkComponent;
    origin: Position;
    transform?: Transform;
    public isDragged = false;
    public isBeingTransformed = false;
    public transformMode?: TransformMode;

    private dragStartPos?: Position;
    private savedMousePos?: Position;
    private rotationStartAngle?: number;
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
        this.transform = params.transform;
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
        this.transform || (this.transform = new Transform);
        this.transform.rotate || (this.transform.rotate = {angle: 0});
        this.savedMousePos = this.getMousePosition(event);
        this.transform.setPivot(center);
        this.rotationStartAngle = this.transform.rotate.angle;
        this.isBeingTransformed = true;
        this.bringComponentToTop();
    }//startRotate

    public rotate(event: MouseEvent, center: Position)
    {
        if (!this.isBeingTransformed)
            return false;
            
        const mousePos = this.getMousePosition(event);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const offset = this.transform!.translate ? this.transform!.translate : {x: 0, y: 0};
        const r1 = {
            x: mousePos.x - center.x - this.origin.x - offset.x, 
            y: mousePos.y - center.y - this.origin.y - offset.y
        };
        const r0 = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            x: this.savedMousePos!.x - center.x - this.origin.x - offset.x, 
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            y: this.savedMousePos!.y - center.y - this.origin.y - offset.y
        };
        const angleDelta = Math.atan2(r0.x * r1.y - r0.y * r1.x, r0.x * r1.x + r0.y * r1.y) / Math.PI * 180;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.transform!.rotate!.angle = this.rotationStartAngle! + angleDelta;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (this.transform!.rotate!.angle! < 0) && (this.transform!.rotate!.angle += 360);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (this.transform!.rotate!.angle! > 360) && (this.transform!.rotate!.angle -= 360);
        return true;
    }//rotate

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endTransform(event: MouseEvent)
    {
        this.isDragged = false;
        if (!this.isBeingTransformed) {
            return false;
        }//if

        this.isBeingTransformed = false;
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
