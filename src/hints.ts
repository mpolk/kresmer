/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *    User hints (i.e. suggestions for actions in the current situation)
 ***************************************************************************/

import {statusBarData} from './renderer-main';

export default class Hints {
    private currentHint = "";
    private hintStack: string[] = [];

    get current() {return this.currentHint}
    
    /** Sets the current hint */
    public setHint(hint: string)
    {
        statusBarData.hint = this.currentHint = hint;
    }//setHint
    
    /** Pushes the current hint to the stack and the sets a new one */
    public push(hint: string)
    {
        this.hintStack.push(this.currentHint);
        this.setHint(hint);
    }//push
    
    /** Pops a hint from the stack and the sets it as a current one */
    public pop()
    {
        const hint = this.hintStack.pop();
        this.setHint(hint ? hint : "");
    }//pop

    // Specific hints
    static onComponentMouseEnter = "Drag the component to move it or ctrl-click to transform";
    static onDrag = "Drop the component where you want to leave it...";
    static onRotation = "Rotate the component around the center mark or click to switch to the scaling mode";
    static onScaling = "Drag any handle to scale, drag the center to move or click to switch to the rotaion mode";
}//Hints