/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *           Exceptions originated from our application level 
\**************************************************************************/

/** 
 * Exceptions originated from our application level 
 */
export default class KresmerException {
    public readonly message: string;

    constructor(message: string)
    {
        this.message = message;
    }//ctor
}//KresmerException