/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *    User hints (i.e. suggestions for actions in the current situation)
\***************************************************************************/

import {statusBarData} from './renderer-main';
import i18next from 'i18next';

export default class Hints {
    private currentHint = "";
    private hintStack: string[] = [];

    get current() {return this.currentHint}
    
    /** Sets the current hint */
    public setHint(hint: string)
    {
        // console.debug(`Hints.setHint("${hint}")`);
        statusBarData.hint = this.currentHint = hint;
    }//setHint
    
    /** Pushes the current hint to the stack and the sets a new one */
    public push(hint: string)
    {
        // console.debug(`Hints.push("${hint}")`);
        // console.trace();
        this.hintStack.push(this.currentHint);
        this.setHint(hint);
    }//push
    
    /** Pops a hint from the stack and the sets it as a current one */
    public pop()
    {
        // console.debug(`Hints.pop()`);
        // console.trace();
        const hint = this.hintStack.pop();
        this.setHint(hint ? hint : "");
    }//pop

    public reset()
    {
        // console.debug(`Hints.reset()`);
        // console.trace();
        this.hintStack = [];
        this.setHint("");
    }//reset

    // Specific hints
    onComponentMouseEnter = i18next.t("hints.drag-component", "Drag the component to move it, \"ctrl-click\" to transform or \"ctrl-shift-click\" to adjust");
    onDrag = i18next.t("hints.drop-component", "Drop the component where you want to leave it...");
    onRotation = i18next.t("hints.rotate-component", "Rotate the component around the center mark or click to switch to the scaling mode");
    onScaling = i18next.t("hints.scale-component", "Drag any handle to scale, drag the center to move or click to switch to the rotaion mode");
    onAdjustment = i18next.t("hints.adjust-component", "Click on any adjustment tool to adjust (edit) the corresponding component prop");
    onAdjustmentHandleSelected = i18next.t("hints.adjust-component-prop", "Drag any free (green) handle to adjust the corresponding component prop");
}//Hints