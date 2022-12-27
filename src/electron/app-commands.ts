/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Application commands that can be sent from the Main process to the Renderer
 ***************************************************************************/

import { ContextMenuCommands } from "./main/menus";
import { DrawingMergeOptions } from "../Kresmer";

export interface AppCommandFormats extends ContextMenuCommands {
    "load-library": (libData: string, completionSignal?: number) => void,
    "load-drawing": (drawingData: string, 
                     options?: {
                        drawingFileName?: string, 
                        mergeOptions?: DrawingMergeOptions,
                        completionSignal?: number,
                    }) => void,
    "undo": () => void,
    "redo": () => void,
}//AppCommandFormats

export type AppCommand = keyof AppCommandFormats;

export class AppCommandExecutor {

    private handlers: Partial<AppCommandFormats> = {};

    execute(command: string, ...args: unknown[])
    {
        const handler = this.handlers[command as AppCommand];
        if (handler) {
            (handler as (...args: unknown[]) => void)(...args);
        } else {
            alert(`Unknown command: ${command}(${args.join(", ")})`);
        }//if
    }//execute

    on<Command extends AppCommand>(
        command: Command, 
        handler: (...args: Parameters<AppCommandFormats[Command]>) => void): AppCommandExecutor;
    on<Command extends AppCommand>(command: Command, handler: (...args: unknown[]) => void)
    {
        this.handlers[command] = handler;
        return this;
    }//on
 
}//AppCommandExecutor
