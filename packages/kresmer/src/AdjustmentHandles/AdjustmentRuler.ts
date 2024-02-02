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

export default class AdjustmentRuler extends AdjustmentHandle {

    private isGoingToBeDragged = false;
    private isDragged = false;
    private savedMousePos?: Position;

    private getMousePosition(event: MouseEvent) {
        return this.hostComponent.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent, mouseCaptureTarget: SVGElement)
    {
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        MouseEventCapture.start(mouseCaptureTarget);
    }//startDrag

}//AdjustmentRuler