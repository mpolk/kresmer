/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    Utility functions
\**************************************************************************/

export function toCamelCase(s: string): string
{
    return s.replaceAll(/-([a-z])/g, (_, p1) => p1.toUpperCase());
}//toCamelCase

export function toKebabCase(s: string): string
{
    return s.replaceAll(/([A-Z])/g, (_, p1) => `-${p1.toLowerCase()}`);
}//toKebabCase

export function indent(indentLevel: number)
{
    return " ".repeat(indentLevel * 4);
}//indent

export function svgDataURI(content: string) {
    const body = content.replace(/"/g, "'");
    return 'data:image/svg+xml,' + encodeURIComponent(body);
}//svgDataURI
