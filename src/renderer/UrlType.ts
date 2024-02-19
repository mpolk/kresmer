/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
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

export const urlTypeDescriptions = {
    [UrlType.data]: "Embedded graphics data",
    [UrlType.href]: "Regular URL (http: or https:)",
    [UrlType.fileAbs]: "File URL with an absolute path",
    [UrlType.fileRel]: "File URL with a relative path",
}//urlTypeDescriptions
