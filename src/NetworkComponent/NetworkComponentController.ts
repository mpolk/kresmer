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
import { kresmer } from "../renderer-main";
import { Position, Transform } from "../Transform/Transform";

export const NetworkComponentHolderProps = {
    origin: {type: Object as PropType<Position>, required: true},
    transform: {type: String},
    svg: {type: Object as PropType<SVGGraphicsElement>},
    isHighlighted: {type: Boolean, default: false},
    isDragged: {type: Boolean, default: false},
    isBeingTransformed: {type: Boolean, default: false},
    transformMode: {type: String as PropType<TransformMode>},
}//NetworkComponentHolderProps

export type TransformMode = "scaling" | "x-scaling" | "y-scaling" | "rotation";

export default class NetworkComponentController {
    readonly kresmer: Kresmer;
    readonly component: NetworkComponent;
    origin: Position;
    transform?: Transform;
    public isDragged = false;
    public isBeingTransformed = false;
    public transformMode: TransformMode = "scaling";

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
        this.transform = params.transform;
    }//ctor


    public static positionCT(pos: Position) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const CTM = kresmer.rootSVG.getScreenCTM()!;
        return {
          x: (pos.x - CTM.e) / CTM.a,
          y: (pos.y - CTM.f) / CTM.d
        };
    }//positionCT


    private getMousePosition(event: MouseEvent) {
        return NetworkComponentController.positionCT({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent)
    {
        this.component.isHighlighted = true;
        this.dragStartPos = NetworkComponentController.positionCT(this.origin);
        this.savedMousePos = this.getMousePosition(event);
        this.isDragged = true;
        this.bringComponentToTop();
    }//startDrag

    public drag(event: MouseEvent)
    {
        if (this.isDragged) {
            const mousePos = this.getMousePosition(event);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.origin.x = mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.origin.y = mousePos.y - this.savedMousePos!.y + this.dragStartPos!.y;
        }//if
    }//drag

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(_event: MouseEvent)
    {
        this.component.isHighlighted = false;
        this.isDragged = false;
        this.restoreComponentZPosition();
    }//endDrag


    public bringComponentToTop()
    {
       this.savedZIndex = this.zIndex;
       this.zIndex = Number.MAX_SAFE_INTEGER;
    }//bringComponentToTop

    public restoreComponentZPosition()
    {
       this.zIndex = this.savedZIndex;
    }//bringComponentToTop


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public enterTransformMode(_event:  MouseEvent)
    {
        this.isBeingTransformed = true;
        this.bringComponentToTop();
    }//enterTransformMode

    public resetMode()
    {
        this.isBeingTransformed = false;
        this.restoreComponentZPosition();
    }//resetMode


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTransformBoxClick(_event: MouseEvent)
    {
        this.transformMode = this.transformMode == "rotation" ? "scaling" : "rotation";
    }//onTransformBoxClick

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTransformBoxRightClick(_event: MouseEvent)
    {
        this.isBeingTransformed = false;
    }//onTransformBoxRightClick
}//NetworkComponentController
