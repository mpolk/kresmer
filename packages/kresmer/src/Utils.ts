/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    Utility functions
\**************************************************************************/

export function toCamelCase(s: string|null)
{
    if (!s) return "";
    return s.replaceAll(/-([a-z])/g, (_, p1) => p1.toUpperCase());
}//toCamelCase

export function toKebabCase(s: string|null)
{
    if (!s) return "";
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

export function encodeHtmlEntities(s: string|null)
{
    if (!s) return "";
    return s.replace(/[<>&]/g, i =>  '&#'+i.charCodeAt(0)+';');
}//encodeHtmlEntities


export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>>
    & {
        [K in Keys]-?:
            Required<Pick<T, K>>
            & Partial<Record<Exclude<Keys, K>, undefined>>
    }[Keys]

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> 
    & {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
    }[Keys]


export function clone<T>(x: T): T
{
    if (Array.isArray(x))
        return x.map(el => clone(el)) as T;
    else if (typeof x === "object") {
        const y: Record<string, unknown> = {};
        for (const k in x) {
            y[k] = clone(x[k as keyof typeof x]);
        }//for
        return y as T;
    } else
        return x;
}//clone


