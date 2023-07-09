/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Bundle - data object 
 ***************************************************************************/

import Kresmer, { NetworkLink, Position } from "../Kresmer";
import { EditorOperation } from "../UndoStack";

/**
 * Network Link Bundle - a virtual link aggregate consisting of two or more collinear link segments
 */
export default class LinkBundle extends NetworkLink {
    public constructor(kresmer: Kresmer, from: Position, to: Position) {
        super(kresmer, "bundle", {from: {pos: from}, to: {pos: to}});
    }//ctor
}//LinkBundle


export class CreateBundleOp extends EditorOperation {

    constructor(protected readonly bundle: LinkBundle)
    {
        super();
    }//ctor

    override exec(): void {
        this.bundle.kresmer.addLink(this.bundle);
    }//exec

    override undo(): void {
        this.bundle.kresmer.deleteLink(this.bundle);
    }//undo
}//CreateBundleOp