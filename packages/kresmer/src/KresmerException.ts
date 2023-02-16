/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *           Exceptions originated from our application level 
\**************************************************************************/

/** 
 * Exceptions originated from our application level 
 */
export default class KresmerException {
    public readonly message: string;
    public readonly severity: KresmerExceptionSeverity;
    public readonly source?: string;

    constructor(message: string, options?: {
        severity?: KresmerExceptionSeverity,
        source?: string,
    }) {
        this.message = message;
        if (options) {
            if (options.severity)
                this.severity = options.severity;
            else
                this.severity = "error";
        } else {
            this.severity = "error";
        }//if
        this.source = options?.source;
    }//ctor
}//KresmerException

export type KresmerExceptionSeverity = "error" | "warning";