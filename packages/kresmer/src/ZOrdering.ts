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

export const MAX_Z_INDEX = Number.MAX_SAFE_INTEGER;

/** A specialized map for storing network elements */
export class MapWithZOrder<ID, T extends ZOrderable<ID>> extends Map<ID, T> {
    public add(item: T) {
        if (item.zIndex < 0) {
            item.zIndex = Array.from(this.values())
                .reduce((acc, {zIndex: z}) => (z < MAX_Z_INDEX && z > acc ? z : acc), -1) + 1;
        }//if
        this.set(item.id, item);
        return this;
    }//add

    public get sorted()
    {
        return Array.from(this.values()).sort((item1, item2) => item1.zIndex - item2.zIndex);
    }//sorted
}//MapWithZOrder
