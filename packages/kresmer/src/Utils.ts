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


export function indent(indentLevel: number)
{
    return " ".repeat(indentLevel * 4);
}//indent