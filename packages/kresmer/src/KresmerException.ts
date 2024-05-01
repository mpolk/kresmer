/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *           Exceptions originated from our application level 
\**************************************************************************/

import LinkVertex from "./NetworkLink/LinkVertex";
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

export class LibraryImportException extends KresmerException {
    constructor(options: KresmerExceptionOptions & {message?: string, libName?: string, fileName?: string})
    {
        let message = options.message;
        if (message === undefined) {
            message = `Error importing library "${options.libName}"`;
            if (options.fileName) {
                message += ` (fileName="${options.fileName}")`;
            }//if
        }//if
        super(message, options);
    }//ctor
}//LibraryImportException

export class UndefinedElementException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{element?: string|number, message?: string}>)
    {
        const element = typeof options.element === "string" ? `"${options.element}"` : `(id=${options.element})`;
        super(options.message ?? `Undefined component "${element}`, options);
    }//ctor
}//UndefinedElementException

export class UndefinedComponentException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{component?: string|number, message?: string}>)
    {
        const component = typeof options.component === "string" ? `"${options.component}"` : `(id=${options.component})`;
        super(options.message ?? `Undefined component "${component}`, options);
    }//ctor
}//UndefinedComponentException

export class UndefinedComponentClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Undefined component class "${options.className}"`, options);
    }//ctor
}//UndefinedComponentClassException

export class DuplicateComponentClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Duplicate component class "${options.className}"`, options);
    }//ctor
}//DuplicateComponentClassException

export class UndefinedLinkException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{link?: string|number, message?: string}>)
    {
        const link = typeof options.link === "string" ? `"${options.link}"` : `(id=${options.link})`;
        super(options.message ?? `Undefined link "${link}`, options);
    }//ctor
}//UndefinedLinkException

export class UndefinedLinkClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Undefined link class "${options.className}"`, options);
    }//ctor
}//UndefinedLinkClassException

export class DuplicateLinkClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Duplicate link class "${options.className}"`, options);
    }//ctor
}//DuplicateLinkClassException

export class UndefinedBundleException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{bundleName?: string, message?: string}>)
    {
        super(options.message ?? `Undefined link bundle "${options.bundleName}"`, options);
    }//ctor
}//UndefinedBundleException

export class UndefinedBundleClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Undefined bundle class "${options.className}"`, options);
    }//ctor
}//UndefinedBundleClassException

export class DuplicateBundleClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Duplicate bundle class "${options.className}"`, options);
    }//ctor
}//DuplicateBundleClassException

export class UndefinedAreaException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{area?: string|number, message?: string}>)
    {
        const area = typeof options.area === "string" ? `"${options.area}"` : `(id=${options.area})`;
        super(options.message ?? `Undefined area "${area}`, options);
    }//ctor
}//UndefinedAreaException

export class UndefinedAreaClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Undefined area class "${options.className}"`, options);
    }//ctor
}//UndefinedAreaClassException

export class DuplicateAreaClassException extends KresmerException {
    constructor(options: KresmerExceptionOptions & RequireOnlyOne<{className?: string, message?: string}>)
    {
        super(options.message ?? `Duplicate area class "${options.className}"`, options);
    }//ctor
}//DuplicateAreaClassException

export class UndefinedVertexException extends KresmerException {
    constructor(options: KresmerExceptionOptions & {linkName?: string, vertexNumber?: number, message?: string})
    {
        super(options.message ?? `Undefined link vertex "${options.linkName}:${options.vertexNumber}"`, options);
    }//ctor
}//UndefinedVertexException

export class UndefinedConnectionPointException extends KresmerException {
    constructor(options: KresmerExceptionOptions & {elementName?: string, connectionPointName?: string|number, message?: string})
    {
        super(options.message ?? `Undefined connection point "${options.elementName}:${options.connectionPointName}"`, options);
    }//ctor
}//UndefinedConnectionPointException

export class UnrealizableVertexAlignmentException extends KresmerException {
    constructor(options: KresmerExceptionOptions & {vertex1?: LinkVertex, vertex2?: LinkVertex, message?: string})
    {
        const message = options.message ?? 
            (options.vertex2 ? `Cannot align vertex ${options.vertex1} to vertex ${options.vertex2}` : 
                               `Cannot align vertex ${options.vertex1}`);
        super(message, options);
    }//ctor
}//UnrealizableVertexAlignmentException
