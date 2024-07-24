/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                Enumeration representing URL types: 
 *             data:, file: and regular hrefs (http(s):)
 ***************************************************************************/
import i18next from "i18next";

export enum URLType {
    data = "data:",
    href = "href",
    fileAbs = "file: (abs)",
    fileRel = "file: (rel)"
} //URLType

export function urlTypeDescription(ut: URLType) {
    switch (ut) {
        case URLType.data: return i18next.t("url-type.data", "Embedded graphics data");
        case URLType.href: return i18next.t("url-type.href", "Regular URL (http: or https:)");
        case URLType.fileAbs: return i18next.t("url-type.file-abs", "File URL with an absolute path");
        case URLType.fileRel: return i18next.t("url-type.file-rel", "File URL with a relative path");
    }//switch
}//urlTypeDescriptions

export function getURLType(url: string|undefined)
{
    return !url || url.startsWith("data:") ? URLType.data :
           url.startsWith("file:") ? URLType.href :
           url.match(/^file:(\/\/)?(\/|\\|[a-zA-Z]:)/) ? URLType.fileAbs :
               URLType.fileRel
}//getURLType