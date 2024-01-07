/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                Enumeration representing URL types: 
 *             data:, file: and regular hrefs (http(s):)
 ***************************************************************************/

export enum UrlType {
    data = "data:",
    href = "href",
    fileAbs = "file: (abs)",
    fileRel = "file: (rel)"
} //UrlType

