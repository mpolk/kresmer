/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *         The stack for the editor operations undo/redo
\**************************************************************************/

import KresmerException from "./KresmerException";

export default class UndoStack {
    private stack: EditorOperation[] = [];
    private stackPointer = 0;
    private operationInProgress?: EditorOperation;

    /**
     * Marks the start of the specified editor operation
     * @param op The operation started
     */
    beginOperation(op: EditorOperation)
    {
        this.operationInProgress = op;
    }//beginOperation

    /**
     * Commits the currenly started operation
     * @returns Always returns true so that this function could be chained with the operation itself
     */
    commitOperation()
    {
        if (!this.operationInProgress) {
            throw new KresmerException("Undo stack: attempt to commit an operation without prior 'beginOperation'");
        }//if

        if (this.stackPointer) {
            this.stack.splice(0, this.stackPointer);
            this.stackPointer = 0;
        }//if

        this.stack.push(this.operationInProgress);
        this.operationInProgress = undefined;
        return true;
    }//commitOperation

    /** Clears the reference to the currently started operation */
    cancelOperation()
    {
        if (!this.operationInProgress) {
            throw new KresmerException("Undo stack: attempt to cancel an operation without prior 'beginOperation'");
        }//if

        this.operationInProgress = undefined;
    }//cancelOperation

    /** Undoes the last operation (or the next after the last already undone ones) */
    undo()
    {
        if (this.stackPointer < this.stack.length) {
            this.stack[this.stackPointer++].undo();
        }//if
    }//undo

    /** Redoes the last undone operation (or the next after the last already redone ones) */
    redo()
    {
        if (this.stackPointer > 0) {
            this.stack[--this.stackPointer].redo();
        }//if
    }//redo

}//UndoStack


export abstract class EditorOperation {
    abstract undo(): void;
    abstract exec(): void;
    redo() {this.exec()}
}//EditorOperation
