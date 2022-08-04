/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 * App level exceptions generated during library or drawing file parsing
\**************************************************************************/

import KresmerException from "../KresmerException";

/**
 * App level exceptions generated during library or drawing file parsing
 */
export default class ParsingException extends KresmerException
{
    constructor(message: string, source?: string)
    {
        super(message);
        this.source = source;
    }//ctor

    readonly source?: string;
}//ParsingException