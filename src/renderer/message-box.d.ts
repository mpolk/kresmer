/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                             MessageBox
 *   an improved replacement for the JS built-ins "alert" and "confirm"
 ***************************************************************************/

export const enum MessageBoxSeverity {
    INFO,
    WARNING,
    CRITICAL,
}//MessageBoxSeverity

export const enum MessageBoxButtons {
    YES_NO,
    OK_CANCEL,
    YES_NO_CANCEL,
}//MessageBoxButtons

export const enum MessageBoxResult {
    YES, NO,
    OK, CANCEL,
}//MessageBoxResult

export type MessageBoxOptions = {
    title?: string,
    defaultIsNo?: boolean,
    buttons?: MessageBoxButtons,
    severity?: MessageBoxSeverity,
    rawHtml?: boolean,
}//MessageBoxOptions