/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A proxy objectt for Adjustment Rulers 
 * (ruler-like handles for component numeric props adjustment)
\***************************************************************************/

import AdjustmentHandle from "./AdjustmentHandle";
import { Position, Shift } from "../Transform/Transform";
import MouseEventCapture from "../MouseEventCapture";
import NetworkComponent from "../NetworkComponent/NetworkComponent";
import { NetworkElementClassPropDef } from "../NetworkElement/NetworkElementClass";
import { UpdateElementOp } from "../NetworkElement/NetworkElement";

export default class AdjustmentRuler extends AdjustmentHandle {

    constructor(hostComponent: NetworkComponent, targetProp: string) {
        super(hostComponent, targetProp);
    }//ctor

    private isGoingToBeDragged = false;
    public isDragged = false;
    private savedMousePos?: Position;
    private savedTargetPropValue?: number;
    private savedRulerVector?: Shift;
    private savedRulerLengthSq?: number;

    private getMousePosition(event: MouseEvent) {
        return this.hostComponent.kresmer.applyScreenCTM({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent, mouseCaptureTarget: SVGElement, ends: [Position, Position])
    {
        this.savedMousePos = this.getMousePosition(event);
        this.isGoingToBeDragged = true;
        this.savedTargetPropValue = (this.hostComponent.props[this.targetProp] as number|undefined) ?? 
            (this.hostComponent.getClass().props[this.targetProp] as NetworkElementClassPropDef).default as number;
        this.savedRulerVector = {x: ends[1].x - ends[0].x, y: ends[1].y - ends[0].y};
        this.savedRulerLengthSq = this.savedRulerVector!.x*this.savedRulerVector!.x + this.savedRulerVector!.y*this.savedRulerVector!.y;
        this.hostComponent.kresmer.undoStack.startOperation(new UpdateElementOp(this.hostComponent));
        MouseEventCapture.start(mouseCaptureTarget);
    }//startDrag

    public drag(event: MouseEvent)
    {
        const mousePos = this.getMousePosition(event);
        const move = {x: mousePos.x - this.savedMousePos!.x, y: mousePos.y - this.savedMousePos!.y};

        if (this.isGoingToBeDragged) {
            if (Math.hypot(move.x, move.y) < 2)
                return;
            this.isGoingToBeDragged = false;
            this.isDragged = true;
            this.hostComponent.kresmer._allLinksFreezed = true;
        } else if (!this.isDragged) {
            return;
        }//if
            
        const relDelta = (move.x*this.savedRulerVector!.x + move.y*this.savedRulerVector!.y) / this.savedRulerLengthSq!;
        this.hostComponent.props[this.targetProp] = this.savedTargetPropValue! * (1 + relDelta);
    }//drag

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endDrag(_event: MouseEvent)
    {
        if (this.isDragged) {
            this.isDragged = false;
            MouseEventCapture.release();
            this.hostComponent.updateConnectionPoints();
            this.hostComponent.kresmer.undoStack.commitOperation();
            this.hostComponent.kresmer._allLinksFreezed = false;
            this.hostComponent.propsUpdateIndicator++;
            this.hostComponent.controller!.alignConnectedLinks();
        }//if
    }//endDrag

}//AdjustmentRuler