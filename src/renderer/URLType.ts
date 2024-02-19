/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                Enumeration representing URL types: 
 *             data:, file: and regular hrefs (http(s):)
 ***************************************************************************/

export enum URLType {
    data = "data:",
    href = "href",
    fileAbs = "file: (abs)",
    fileRel = "file: (rel)"
} //URLType

export const urlTypeDescriptions = {
    [URLType.data]: "Embedded graphics data",
    [URLType.href]: "Regular URL (http: or https:)",
    [URLType.fileAbs]: "File URL with an absolute path",
    [URLType.fileRel]: "File URL with a relative path",
}//urlTypeDescriptions

export function getURLType(url: string|undefined)
{
    return !url || url.startsWith("data:") ? URLType.data :
           url.startsWith("file:") ? URLType.href :
           url.match(/^file:(\/\/)?(\/|\\|[a-zA-Z]:)/) ? URLType.fileAbs :
               URLType.fileRel
}//getURLType