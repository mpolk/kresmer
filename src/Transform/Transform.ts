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
    translation?: {x: number, y: number};
    rotation?: Rotation;
    scale?: {x: number, y: number};
 }
 export class Transform implements ITransform {
    translation: {x: number, y: number} = {x: 0, y: 0};
    rotation: Rotation = {angle: 0, x: 0, y:0};
    scale: {x: number, y: number} = {x: 1, y: 1};

    constructor(init?: ITransform)
    {
        init?.translation && (this.translation = {...init.translation});
        init?.rotation && (this.rotation = {...init.rotation});
        init?.scale && (this.scale = {...init.scale});
    }//ctor

    public setPivot(pivot: Position)
    {
        if (!this.rotation) {
            this.rotation = {angle: 0, ...pivot};
        } else {
            const oldPivot = {x: this.rotation.x, y: this.rotation.y};
            oldPivot.x || (oldPivot.x = 0);
            oldPivot.y || (oldPivot.y = 0);
            const r = {x: oldPivot.x - pivot.x, y: oldPivot.y - pivot.y};
            const fi = this.rotation.angle * Math.PI / 180;
            const sinFi = Math.sin(fi); const cosFi = Math.cos(fi);
            const r1 = {x: r.x * cosFi - r.y * sinFi, y: r.x * sinFi + r.y * cosFi};
            const shift = {x: r.x - r1.x, y: r.y - r1.y};
            if (!this.translation)
                this.translation = {...shift};
            else {
                this.translation.x += shift.x;
                this.translation.y += shift.y;
            }//if
            this.rotation = {angle: this.rotation.angle, ...pivot};
        }//if
    }//setPivot

    public toAttr(applyRotation: boolean) 
    {
        const chunks: string[] = [];

        if (this.translation.x || this.translation.y) {
            chunks.push(`translate(${this.translation.x} ${this.translation.y})`);
        }//if

        if (this.rotation.angle && applyRotation) {
            chunks.push(`rotate(${this.rotation.angle} ${this.rotation.x} ${this.rotation.y})`);
        }//if

        if (this.scale.x != 1 || this.scale.y != 1) {
            chunks.push(`scale(${this.scale.x} ${this.scale.y})`);
        }//if

        return chunks.join(' ');
    }//toAttr
}//Transform
 
