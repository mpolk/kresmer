/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Representation of the general geometric transformation that can be
 * applied to the Network Component images
 ***************************************************************************/

// Utility types for some geometry objects and transformations
 export type Position = {x: number, y: number};
 export type RadiusVector = Position;
 export type Shift = Position;
 export type BoxSize = {width: number, height: number};
 export type Scale = Position;
 export type Rotation = {angle: number, x: number, y: number};
 
 /**
  * Raw data for the Transform class. Consists  of three transformation primitives
  * from which the transformation is composed.
  */
 export interface ITransform {
    translation?: Shift;
    rotation?: Rotation;
    scale?: Scale;
 }
 
 /**
 * Representation of the general geometric transformation that can be
 * applied to the Network Component images
 */
 export class Transform implements ITransform {
    // Raw data for the Transform class. Consists  of three transformation primitives
    // from which the transformation is composed.
    translation: Shift = {x: 0, y: 0};
    rotation: Rotation = {angle: 0, x: 0, y:0};
    scale: Scale = {x: 1, y: 1};

    /**
     * Constructs a Transform from the raw data
     * @param init Transform data for the initialization
     */
    constructor(init?: ITransform)
    {
        init?.translation && (this.translation = {...init.translation});
        init?.rotation && (this.rotation = {...init.rotation});
        init?.scale && (this.scale = {...init.scale});
    }//ctor

    /**
     * Set a rotation pivot to the specified position and adjusts the translation component
     * to compensate the pivot change and prevent the component shift
     * @param pivot Position to set the pivot to
     */
    public setPivot(pivot: Position)
    {
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
    }//setPivot

    /**
     * Generates an SVG "transform" attribute for this Transform
     * @param applyRotation Specifies where to apply the rotation transform component
     *                      along with other transform primitives. Normally the rotation
     *                      should be applied, but at the component initialization time
     *                      it should be turned off in order to generate the proper
     *                      bounding box for the component.
     * @returns A string containing SVG transform attribute value
     */
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

    /** A transform state snapshot used as a starting point for the additional transformations */
    private operationStartTransform?: Required<ITransform>;

    /** Takes a snapshot of the current transform state and stores it in the private property */
    public makeSnapshot()
    {
        this.operationStartTransform = {
            translation: {...this.translation},
            rotation: {...this.rotation},
            scale: {...this.scale}
        };
    }//makeSnapshot

    /**
     * Applies an additional rotattion to the current transform 
     * based on pointing device pointer shift
     * @param r1 Pointer radius-vector specifying the final rotation value
     * @param r0 Pointer radius-vector specifying the starting rotation value
     */
    public rotate(r1: RadiusVector, r0: RadiusVector)
    {
        console.assert(this.operationStartTransform);
        const angleDelta = Math.atan2(r0.x * r1.y - r0.y * r1.x, r0.x * r1.x + r0.y * r1.y) / 
                           Math.PI * 180;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.rotation.angle = this.operationStartTransform!.rotation.angle + angleDelta;
        (this.rotation.angle < 0) && (this.rotation.angle += 360);
        (this.rotation.angle > 360) && (this.rotation.angle -= 360);
    }//rotate

    /**
     * Changes the scale component of the transform based on pointing device pointer shift
     * @param shift Pointing device pointer shift setting a new effective component size and
     *              thus a new scale
     * @param direction Resize direction (in the form "n" (north), "ne" (north-east) etc.)
     * @param bBoxSize Component bounding box sizes
     */
    public changeScale(shift: Shift, direction: string, bBoxSize: BoxSize)
    {
        console.assert(this.operationStartTransform);
        const {x: dx0, y: dy0} = shift;
        const fi = this.rotation.angle * Math.PI / 180;
        const sinFi = Math.sin(fi); const cosFi = Math.cos(fi);

        let dx1 = 0; 
        let dy1 = 0;
        switch (direction) {
            case "se":
                dx1 =  dx0 * cosFi + dy0 * sinFi;
                dy1 = -dx0 * sinFi + dy0 * cosFi;
                break;
            case "s":
                dy1 = -dx0 * sinFi + dy0 * cosFi;
                break;
            case "e":
                dx1 =  dx0 * cosFi + dy0 * sinFi;
                break;
            case "nw":
                dx1 = -dx0 * cosFi - dy0 * sinFi;
                dy1 =  dx0 * sinFi - dy0 * cosFi;
                break;
            case "n":
                dy1 =  dx0 * sinFi - dy0 * cosFi;
                break;
            case "w":
                dx1 = -dx0 * cosFi - dy0 * sinFi;
                break;
            case "ne":
                dx1 =  dx0 * cosFi + dy0 * sinFi;
                dy1 =  dx0 * sinFi - dy0 * cosFi;
                break;
            case "sw":
                dx1 = -dx0 * cosFi - dy0 * sinFi;
                dy1 = -dx0 * sinFi + dy0 * cosFi;
                break;
        }//switch

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.scale.x = this.operationStartTransform!.scale.x + dx1 / bBoxSize.width;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.scale.y = this.operationStartTransform!.scale.y + dy1 / bBoxSize.height;
/* 
        let dx2 = 0;
        let dy2 = 0;
        switch (direction) {
            case "nw":
            case "n":
            case "w":
                dx2 = dx1 * cosFi - dy1 * sinFi;
                dy2 = dx1 * sinFi + dy1 * cosFi;
                break;
            case "ne":
                dx2 =              -dy1 * sinFi;
                dy2 = dx1 * sinFi + dy1 * cosFi;
                break;
            case "sw":
                dx2 = dx1 * cosFi - dy1 * sinFi;
                dy2 = -dx1 * sinFi;
                break;
        }//switch

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.translation.x = this.operationStartTransform!.translation.x - dx2;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.translation.y = this.operationStartTransform!.translation.y - dy2;
 */
    }//changeScale
}//Transform
 
