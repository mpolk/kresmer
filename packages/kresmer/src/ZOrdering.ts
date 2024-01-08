/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
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

    public isOnTop(item: T)
    {
        for (const item1 of this) {
            if (item1[1].zIndex > item.zIndex)
                return false;
        }//for
        return true;
    }//isOnTop

    public isOnBottom(item: T)
    {
        for (const entry of this) {
            if (entry[1].zIndex < item.zIndex)
                return false;
        }//for
        return true;
    }//isOnTop

    public moveItemUp(item: T)
    {
        let nextItem: T|undefined;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex > item.zIndex && (nextItem === undefined || item1.zIndex < nextItem.zIndex))
                nextItem = item1;
        }//for

        if (nextItem) {
            ({z: nextItem.zIndex, zn: item.zIndex} = {z: item.zIndex, zn: nextItem.zIndex});
        }//if
    }//moveItemUp

    public moveItemToTop(item: T)
    {
        let topmostItem = item;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex > topmostItem.zIndex && item1.zIndex < Z_INDEX_INF)
                topmostItem = item1;
            if (item1.zIndex > item.zIndex && item1.zIndex < Z_INDEX_INF)
                item1.zIndex--;
        }//for

        item.zIndex = topmostItem.zIndex;
    }//moveItemToTop

    public moveItemDown(item: T)
    {
        let prevItem: T|undefined;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex < item.zIndex && (prevItem === undefined || item1.zIndex > prevItem.zIndex))
                prevItem = item1;
        }//for

        if (prevItem) {
            ({z: prevItem.zIndex, zp: item.zIndex} = {z: item.zIndex, zp: prevItem.zIndex});
        }//if
    }//moveItemDown

    public moveItemToBottom(item: T)
    {
        let bottomItem = item;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex < bottomItem.zIndex)
                bottomItem = item1;
            if (item1.zIndex < item.zIndex)
                item1.zIndex++;
        }//for

        item.zIndex = bottomItem.zIndex;
    }//moveItemToBottom
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
        _savedZIndex = -1;

        public bringToTop()
        {
            if (this.zIndex < Z_INDEX_INF) {
                this._savedZIndex = this.zIndex;
                this.zIndex = Z_INDEX_INF;
            }//if
        }//bringToTop
    
        public restoreZPosition()
        {
            if (this.zIndex === Z_INDEX_INF) {
                this.zIndex = this._savedZIndex;
            }//if
        }//restoreZPosition
    }//class
}//withZOrder
