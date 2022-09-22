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
     rotate?: Rotation;
 }
 export class Transform implements ITransform {
     rotate?: Rotation;
 
     constructor(init?: ITransform)
     {
         this.rotate = init?.rotate;
     }//ctor
 
     public toAttr(applyRotation: boolean) 
     {
         const chunks: string[] = [];
 
         if (this.rotate && applyRotation) {
             if (this.rotate.x !== undefined)
                 chunks.push(`rotate(${this.rotate.angle} ${this.rotate.x} ${this.rotate.y})`);
             else
                 chunks.push(`rotate(${this.rotate.angle})`);
         }//if
 
         return chunks.join(' ');
     }//toAttr
 }//Transform
 