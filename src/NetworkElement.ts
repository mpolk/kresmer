/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Element - a base class for all things that can be placed 
 * on the drawing 
 ***************************************************************************/

import Kresmer from "./Kresmer";

export abstract class NetworkElement {
    protected kresmer: Kresmer;
    isHighlighted = false;

    constructor(kresmer: Kresmer)
    {
        this.kresmer = kresmer;
    }//ctor
}//NetworkElement