/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *    User hints (i.e. suggestions for actions in the current situation)
\***************************************************************************/

import {statusBarData} from './renderer-main';

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
    static onComponentMouseEnter = "Drag the component to move it, ctrl-click to transform or ctrl-shift-click to adjust";
    static onDrag = "Drop the component where you want to leave it...";
    static onRotation = "Rotate the component around the center mark or click to switch to the scaling mode";
    static onScaling = "Drag any handle to scale, drag the center to move or click to switch to the rotaion mode";
    static onAdjustment = "Click on any adjustment tool to adjust (edit) the corresponding component prop";
    static onAdjustmentHandleSelected = "Drag any free (green) handle to adjust the corresponding component prop";
}//Hints