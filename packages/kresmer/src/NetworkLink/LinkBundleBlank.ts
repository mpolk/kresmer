/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Bundle Blank (temporary object for a link bundle creation)
 * Data object 
 ***************************************************************************/

import Kresmer, { NetworkLinkClass } from "../Kresmer";
import { Position } from "../Transform/Transform";
import NetworkLinkBlank from "./NetworkLinkBlank";

/**
 * Network Link Blank (temporary object for a link creation)
 */
export default class LinkBundleBlank extends NetworkLinkBlank {
    public constructor(
        kresmer: Kresmer,
        start: Position,
    ) {
        super(kresmer, NetworkLinkClass.getClass("bundle"), {pos: {...start}});
    }//ctor

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp(_event: MouseEvent)
    {
        this.kresmer._completeLinkBundleCreation();
    }//onMouseUp

}//LinkBundleBlank
