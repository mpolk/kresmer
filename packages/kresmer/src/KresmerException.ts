/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *           Exceptions originated from our application level 
\**************************************************************************/

import { RequireOnlyOne } from "./Utils";

/** 
 * Exceptions originated from our application level 
 */
export default class KresmerException {
    public readonly message: string;
    public readonly severity: KresmerExceptionSeverity;
    public source?: string;

    constructor(message: string, options?: KresmerExceptionOptions) {
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

export type KresmerExceptionSeverity = "fatal" | "error" | "warning";
export type KresmerExceptionOptions = {
    severity?: KresmerExceptionSeverity,
    source?: string,
}//KresmerExceptionOptions

// Specific exceptions
export class UndefinedBundleException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{bundleName?: string, message?: string}>)
    {
        super(options.message ?? `Undefined link bundle "${options.bundleName}"`, options);
    }//ctor
}//UndefinedBundleException

export class UndefinedVertexException extends KresmerException {
    constructor(options: KresmerExceptionOptions & {linkName?: string, vertexNumber?: number, message?: string})
    {
        super(options.message ?? `Undefined link vertex "${options.linkName}:${options.vertexNumber}"`, options);
    }//ctor
}//UndefinedVertexException