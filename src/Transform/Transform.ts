/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Representation of the general geometric transformation
 ***************************************************************************/

 export type Position = {x: number, y: number};
 export type Rotation = {angle: number, x?: number, y?: number};
 export interface ITransform {
    translate?: {x: number, y: number};
    rotate?: Rotation;
    scale?: {x: number, y?: number};
 }
 export class Transform implements ITransform {
    translate?: {x: number, y: number};
    rotate?: Rotation;
    scale?: {x: number, y?: number};

    constructor(init?: ITransform)
    {
        this.translate = init?.translate;
        this.rotate = init?.rotate;
        this.scale = init?.scale;
    }//ctor

    public setPivot(pivot: Position)
    {
        if (!this.rotate) {
            this.rotate = {angle: 0, ...pivot};
        } else {
            const oldPivot = {x: this.rotate.x, y: this.rotate.y};
            oldPivot.x || (oldPivot.x = 0);
            oldPivot.y || (oldPivot.y = 0);
            const r = {x: oldPivot.x - pivot.x, y: oldPivot.y - pivot.y};
            const fi = this.rotate.angle * Math.PI / 180;
            const sinFi = Math.sin(fi); const cosFi = Math.cos(fi);
            const r1 = {x: r.x * cosFi - r.y * sinFi, y: r.x * sinFi + r.y * cosFi};
            const shift = {x: r.x - r1.x, y: r.y - r1.y};
            if (!this.translate)
                this.translate = {...shift};
            else {
                this.translate.x += shift.x;
                this.translate.y += shift.y;
            }//if
            this.rotate = {angle: this.rotate.angle, ...pivot};
        }//if
    }//setPivot

    public toAttr(applyRotation: boolean) 
    {
        const chunks: string[] = [];

        if (this.translate) {
            chunks.push(`translate(${this.translate.x} ${this.translate.y})`);
        }//if

        if (this.rotate && applyRotation) {
            if (this.rotate.x !== undefined)
                chunks.push(`rotate(${this.rotate.angle} ${this.rotate.x} ${this.rotate.y})`);
            else
                chunks.push(`rotate(${this.rotate.angle})`);
        }//if

        if (this.scale) {
            if (this.scale.y === undefined)
                chunks.push(`scale(${this.scale.x})`);
            else
                chunks.push(`scale(${this.scale.x} ${this.scale.y})`);
        }//if

        return chunks.join(' ');
    }//toAttr
}//Transform
 