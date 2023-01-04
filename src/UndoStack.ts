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
    private stackPointer = -1;
    private static readonly MAX_UNDOES = 100;
    private _wasTruncated = false;
    private operationInProgress?: EditorOperation;
    private purityMark = 0;

    /**
     * Marks the start of the specified editor operation
     * @param op The operation started
     */
    startOperation(op: EditorOperation)
    {
        this.operationInProgress = op;
    }//startOperation

    /**
     * Commits the currenly started operation
     * @returns Always returns true so that this function could be chained with the operation itself
     */
    commitOperation()
    {
        if (!this.operationInProgress) {
            throw new KresmerException("Undo stack: attempt to commit an operation without prior 'beginOperation'");
        }//if

        this._commit(this.operationInProgress);
        return true;
    }//commitOperation

    private _commit(op: EditorOperation)
    {
        if (this.stackPointer < this.stack.length - 1) {
            this.stack.splice(this.stackPointer + 1, this.stack.length - 1 - this.stackPointer);
        }//if

        op.onCommit();
        this.operationInProgress = undefined;
        this.stack.push(op);
        if (this.stack.length <= UndoStack.MAX_UNDOES) {
            this.stackPointer++;
        } else {
            this.stack.splice(0, 1);
            this.purityMark--;
            this._wasTruncated = true;
        }//if
    }//_commit

    /** Clears the reference to the currently started operation */
    cancelOperation()
    {
        if (!this.operationInProgress) {
            throw new KresmerException("Undo stack: attempt to cancel an operation without prior 'beginOperation'");
        }//if

        this.operationInProgress = undefined;
    }//cancelOperation

    /** Executes the operation and commits it a single step */
    execAndCommit(op: EditorOperation)
    {
        op.exec();
        this._commit(op);
    }//execAndCommit

    /** Undoes the last operation (or the next after the last of already undone ones) */
    undo()
    {
        if (this.canUndo) {
            this.stack[this.stackPointer--].undo();
        }//if
    }//undo

    /** Shows whether there are operations to undo */
    get canUndo()
    {
        return this.stackPointer >= 0;
    }//canUndo

    /** Redoes the last undone operation (or the next after the last of already redone ones) */
    redo()
    {
        if (this.stackPointer < this.stack.length - 1) {
            this.stack[++this.stackPointer].redo();
        }//if
    }//redo

    /** Clears the stack content and resets the stack to the initial state */
    reset()
    {
        this.stackPointer = -1;
        this.stack.splice(0, this.stack.length);
        this.operationInProgress = undefined;
        this._wasTruncated = false;
    }//reset

    /** Shows  whether the stack was truncated because of undo overlimit */
    get wasTruncated()
    {
        return this._wasTruncated;
    }//wasTruncated

    get isDirty()
    {
        return this.purityMark !== this.stackPointer + 1;
    }//get isDirty

    set isDirty(newValue: boolean)
    {
        if (newValue) {
            this.purityMark = -1;
        } else {
            this.purityMark = this.stackPointer + 1;
        }//if
    }//set isDirty
}//UndoStack


/** The base class for various undo-enabled editor operations */
export abstract class EditorOperation {
    abstract undo(): void;
    abstract exec(): void;
    redo() {this.exec()}
    onCommit() {/* do nothing by default */}
}//EditorOperation
