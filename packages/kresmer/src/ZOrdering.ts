/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *            Data types for z-ordering support on the drawing 
 ***************************************************************************/

export interface ZOrderable<ID> {
    id: ID,
    zIndex: number,
}//ZOrderable

export const Z_INDEX_INF = Number.MAX_SAFE_INTEGER;

/** A specialized map for storing network elements */
export class MapWithZOrder<ID, T extends ZOrderable<ID>> extends Map<ID, T> {
    public add(item: T) {
        if (item.zIndex < 0) {
            item.zIndex = Array.from(this.values())
                .reduce((acc, {zIndex: z}) => (z < Z_INDEX_INF && z > acc ? z : acc), -1) + 1;
        }//if
        this.set(item.id, item);
        return this;
    }//add

    public get sorted()
    {
        return Array.from(this.values()).sort((item1, item2) => item1.zIndex - item2.zIndex);
    }//sorted
}//MapWithZOrder

/**
 * Adds a mixin implementing z-order operations to some class
 * @param Base A base class to be augmented
 * @returns An augmented class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withZOrder<TBase extends new(...args: any[]) => object>(Base: TBase)
{
    return class extends Base {
        zIndex = -1;
        savedZIndex = -1;

        public bringToTop()
        {
            if (this.zIndex < Z_INDEX_INF) {
                this.savedZIndex = this.zIndex;
                this.zIndex = Z_INDEX_INF;
            }//if
        }//bringToTop
    
        public restoreZPosition()
        {
            if (this.zIndex === Z_INDEX_INF) {
                this.zIndex = this.savedZIndex;
            }//if
        }//restoreZPosition
    }//class
}//withZOrder
