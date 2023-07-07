/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Bundle - data object 
 ***************************************************************************/

import Kresmer from "../Kresmer";
import LinkVertex from "./LinkVertex";

/**
 * Network Link Bundle - a virtual link aggregate consisting of two or more collinear link segments
 */
export default class LinkBundle  {
    public constructor(readonly kresmer: Kresmer) {}
    vertices: LinkVertex[] = [];
}//LinkBundle
