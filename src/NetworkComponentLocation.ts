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
    readonly kresmer: Kresmer;
    readonly component: NetworkComponent;
    origin: Position;
    transform?: Transform;
    public isDragged = false;
    public isBeingTransformed = false;
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
        return NetworkComponentLocation.positionCT({x: event.clientX, y: event.clientY});
    }//getMousePosition

    public startDrag(event: MouseEvent)
    {
        this.component.isHighlighted = true;
        this.dragStartPos = NetworkComponentLocation.positionCT(this.origin);
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
}//NetworkComponentLocation
