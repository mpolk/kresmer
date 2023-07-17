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

    private attachedLinks = new Map<NetworkLink, {number: number, isAttached: boolean}>();
    private nextAttachedLinkNumber = 1;

    public registerAttachedLink(link: NetworkLink)
    {
        const entry = this.attachedLinks.get(link);
        if (entry)
            entry.isAttached = true;
        else
            this.attachedLinks.set(link, {number: this.nextAttachedLinkNumber++, isAttached: true});
    }//registerAttachedLink

    public unregisterAttachedLink(link: NetworkLink)
    {
        const entry = this.attachedLinks.get(link);
        if (entry)
            entry.isAttached = false;
    }//unregisterAttachedLink

    public getLinkNumber(link: NetworkLink)
    {
        const entry = this.attachedLinks.get(link);
        return entry?.isAttached ? entry.number : undefined;
    }//getLinkNumber

    public updateBundledLinkVues()
    {
        for (const [link, {isAttached}] of this.attachedLinks) {
            if (isAttached) {
                for (const vertex of link.vertices) {
                    vertex.updateVue();
                }//for
            }//if
        }//for
    }//updateBundledLinkVues
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