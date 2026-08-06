/* **************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *     A dialog for specifying drawing merge options upon its loading
\* **************************************************************************/

export type DrawingMergeDialogResult = {
    drawingMergeOption: DrawingMergeOptions|null,
    saveChanges: boolean
}
