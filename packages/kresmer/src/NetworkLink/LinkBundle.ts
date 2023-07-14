/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Bundle - data object 
 ***************************************************************************/

import Kresmer, { NetworkLink } from "../Kresmer";
import { EditorOperation } from "../UndoStack";
import { LinkVertexInitParams } from "./LinkVertex";

/**
 * Network Link Bundle - a virtual link aggregate consisting of two or more collinear link segments
 */
export default class LinkBundle extends NetworkLink {
    public constructor(kresmer: Kresmer, args?: {
        name?: string,
        dbID?: number|string|null,
        props?: Record<string, unknown>,
        from?: LinkVertexInitParams,
        to?: LinkVertexInitParams,
        vertices?: LinkVertexInitParams[],
    }) {
        super(kresmer, LinkBundle.className, args);
    }//ctor

    static className = "link-bundle";

    override readonly isBundle = true;
    protected readonly outerXMLTag = "link-bundle";

    override getNamePrefix(): string {
        return "Bundle";
    }//getNamePrefix
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