/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Representation of the general geometric transformation
 ***************************************************************************/

 export type Position = {x: number, y: number};
 export type Rotation = {angle: number, x: number, y: number};
 export interface ITransform {
    translate?: {x: number, y: number};
    rotate?: Rotation;
    scale?: {x: number, y: number};
 }
 export class Transform implements ITransform {
    translate: {x: number, y: number} = {x: 0, y: 0};
    rotate: Rotation = {angle: 0, x: 0, y:0};
    scale: {x: number, y: number} = {x: 1, y: 1};

    constructor(init?: ITransform)
    {
        if (init?.translate) {
            this.translate = init.translate;
        }//if
        if (init?.rotate) {
            this.rotate = init.rotate;
        }//if
        if (init?.scale) {
            this.scale = init.scale;
        }//if
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

        if (this.translate.x || this.translate.y) {
            chunks.push(`translate(${this.translate.x} ${this.translate.y})`);
        }//if

        if (this.rotate.angle && applyRotation) {
            chunks.push(`rotate(${this.rotate.angle} ${this.rotate.x} ${this.rotate.y})`);
        }//if

        if (this.scale.x != 1 || this.scale.y != 1) {
            chunks.push(`scale(${this.scale.x} ${this.scale.y})`);
        }//if

        return chunks.join(' ');
    }//toAttr
}//Transform
 
