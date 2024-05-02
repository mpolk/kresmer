/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *            Data types for z-ordering support on the drawing 
 ***************************************************************************/

export interface ZOrderable<ID> {
    id: ID,
    zIndex: number,
}//ZOrderable

export const Z_INDEX_INF = Number.MAX_SAFE_INTEGER;

/** A specialized map for storing drawing elements */
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
        let maxZIndex = item.zIndex;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex > maxZIndex && item1.zIndex < Z_INDEX_INF)
                maxZIndex = item1.zIndex;
            if (item1.zIndex > item.zIndex && item1.zIndex < Z_INDEX_INF)
                item1.zIndex--;
        }//for

        item.zIndex = maxZIndex;
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
        let minZIndex = item.zIndex;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex < minZIndex)
                minZIndex = item1.zIndex;
            if (item1.zIndex < item.zIndex)
                item1.zIndex++;
        }//for

        item.zIndex = minZIndex;
    }//moveItemToBottom

    public moveItemTo(item: T, newZIndex: number)
    {
        if (newZIndex < item.zIndex)
            this.moveItemDownTo(item, newZIndex);
        else if (newZIndex > item.zIndex)
            this.moveItemUpTo(item, newZIndex);
    }//moveItemTo

    private moveItemDownTo(item: T, newZIndex: number)
    {
        let minZIndex = item.zIndex;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex < minZIndex && item1.zIndex >= newZIndex)
                minZIndex = item1.zIndex;
            if (item1.zIndex < item.zIndex && item1.zIndex >= newZIndex)
                item1.zIndex++;
        }//for

        item.zIndex = minZIndex;
    }//moveItemDownTo

    private moveItemUpTo(item: T, newZIndex: number)
    {
        let maxZIndex = item.zIndex;
        for (const entry of this) {
            const item1 = entry[1];
            if (item1.zIndex > maxZIndex && item1.zIndex <= newZIndex)
                maxZIndex = item1.zIndex;
            if (item1.zIndex > item.zIndex && item1.zIndex <= newZIndex)
                item1.zIndex--;
        }//for

        item.zIndex = maxZIndex;
    }//moveItemUpTo
}//MapWithZOrder

/**
 * Adds a mixin implementing z-order operations to some class
 * @param Base A base class to be augmented
 * @returns An augmented class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withZOrder<TBase extends abstract new(...args: any[]) => object>(Base: TBase)
{
    abstract class BaseWithZOrder extends Base {
        zIndex = -1;
        _savedZIndex = -1;

        public bringToTop()
        {
            if (this.zIndex < Z_INDEX_INF) {
                this._savedZIndex = this.zIndex;
                this.zIndex = Z_INDEX_INF;
            }//if
        }//bringToTop
    
        public returnFromTop()
        {
            if (this.zIndex === Z_INDEX_INF) {
                this.zIndex = this._savedZIndex;
            }//if
        }//returnFromTop
    }//class

    return BaseWithZOrder;
}//withZOrder
