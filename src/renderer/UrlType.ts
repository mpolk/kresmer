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

export function getURLType(url: string|undefined)
{
    return !url || url.startsWith("data:") ? UrlType.data :
           url.startsWith("file:") ? UrlType.href :
           url.match(/^file:(\/\/)?(\/|\\|[a-zA-Z]:)/) ? UrlType.fileAbs :
               UrlType.fileRel
}//getURLType