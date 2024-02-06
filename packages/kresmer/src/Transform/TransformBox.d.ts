/**************************************************************************\
*                            👑 KresMer 👑
*       "Kreslennya Merezh" - network diagram editor and viewer
*      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
* --------------------------------------------------------------------------
*    Ephemeral box appearing at the time of a component transformation
*    Type definitions
\***************************************************************************/

export type TransformBoxZone = "tr-box" | 
    "nw-handle" | "n-handle" | "ne-handle" | 
    "w-handle"  |              "e-handle"  |
    "sw-handle" | "s-handle" | "se-handle" |
    "rot-handle";
