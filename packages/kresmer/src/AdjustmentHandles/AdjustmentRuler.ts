/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A proxy objectt for Adjustment Rulers 
 * (ruler-like handles for component numeric props adjustment)
\***************************************************************************/

import AdjustmentHandle from "./AdjustmentHandle";
import { Position } from "../Transform/Transform";
import MouseEventCapture from "../MouseEventCapture";
import NetworkComponent from "../NetworkComponent/NetworkComponent";

export default class AdjustmentRuler extends AdjustmentHandle {

    constructor(hostComponent: NetworkComponent, targetProp: string) {
        super(hostComponent, targetProp);
    }//ctor

    private isGoingToBeDragged = false;
    private isDragged = false;
    private savedMousePos?: Position;
    private savedPropValue?: number;
    private savedEnds?: [Position, Position];

    private getMousePosition(event: MouseEvent) {
        return this.hostComponent.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent, mouseCaptureTarget: SVGElement, ends: [Position, Position])
    {
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        this.savedPropValue = this.hostComponent.props[this.targetProp] as number;
        this.savedEnds = ends;
        MouseEventCapture.start(mouseCaptureTarget);
    }//startDrag

    public drag(event: MouseEvent)
    {
        const mousePos = this.getMousePosition(event);
        const effectiveMove = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};

        if (this.isGoingToBeDragged) {
            if (Math.hypot(effectiveMove.x, effectiveMove.y) < 2)
                return false;
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this.hostComponent.kresmer._allLinksFreezed = true;
        } else if (!this.isDragged) {
            return false;
        }//if
            
        // this.moveFromStartPos(effectiveMove);
        return true;
    }//drag

}//AdjustmentRuler