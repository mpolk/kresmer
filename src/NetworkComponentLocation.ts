/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Location - a generic network element instance 
 * location data
 ***************************************************************************/

import Kresmer from "./Kresmer";
import NetworkComponent from "./NetworkComponent";
import { kresmer } from "./renderer-main";

export type Position = {x: number, y: number};
export class Transform {
    rotate?: {angle: number, x?: number, y?: number};

    public toCSS() 
    {
        const chunks: string[] = [];

        if (this.rotate) {
            if (this.rotate.x !== undefined)
                chunks.push(`rotate(${this.rotate.angle} ${this.rotate.x} ${this.rotate.y})`);
            else
                chunks.push(`rotate(${this.rotate.angle})`);
        }//if

        return chunks.join(' ');
    }//toCSS
}//Transform

export default  class NetworkComponentLocation {
    readonly component: NetworkComponent;
    origin: Position;
    transform?: Transform;
    private isDragged = false;
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
        this.component = component;
        this.origin = params.origin;
        this.transform = params.transform;
    }//ctor


    private clientTransformPosition(pos: Position) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const CTM = kresmer.rootSVG.getScreenCTM()!;
        return {
          x: (pos.x - CTM.e) / CTM.a,
          y: (pos.y - CTM.f) / CTM.d
        };
    }//getMousePosition


    private getMousePosition(event: MouseEvent) {
        return this.clientTransformPosition({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent)
    {
        this.component.isHighlighted = true;
        this.dragStartPos = this.origin;
        this.savedMousePos = this.getMousePosition(event);
        this.isDragged = true;
    }//startDrag

    public drag(event: MouseEvent)
    {
        if (this.isDragged) {
            const mousePos = this.getMousePosition(event);
            this.origin.x = mousePos.x - this.savedMousePos!.x + this.dragStartPos!.x;
            this.origin.y = mousePos.x - this.savedMousePos!.y + this.dragStartPos!.y;
        }//if
    }//drag

    public endDrag(_event: MouseEvent)
    {
        this.component.isHighlighted = false;
        this.isDragged = false;
    }//endDrag
}//NetworkComponentLocation
