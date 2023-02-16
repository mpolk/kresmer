/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Application commands that can be sent from the Main process to the Renderer
 ***************************************************************************/

import { ContextMenuCommands } from "../main/Menus";
import { DrawingMergeOptions } from "kresmer";
import { AppInitStage } from "./ElectronAPI";

export interface AppCommandFormats extends ContextMenuCommands {
    "load-library": (libData: string, completionSignal?: number) => void,
    "load-drawing": (drawingData: string, 
                     options?: {
                        drawingFileName?: string, 
                        mergeOptions?: DrawingMergeOptions,
                        completionSignal?: number,
                    }) => void,
    "save-drawing": () => void,
    "connect-to-server": (url: string, password: string, forceUI: boolean, 
                          completionSignal?: AppInitStage) => void,
    "disconnect-from-server": () => void,
    "undo": () => void,
    "redo": () => void,
    "scale-drawing": (direction: ScaleDirection) => void,
    "delete-selected-element": () => void,
    "add-component": (position?: {x: number, y: number}) => void,
}//AppCommandFormats

export type AppCommand = keyof AppCommandFormats;
export type ScaleDirection = "+"|"-"|"0";

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
        handler: (...args: Parameters<AppCommandFormats[Command]>) => ReturnType<AppCommandFormats[Command]>): AppCommandExecutor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on<Command extends AppCommand>(command: Command, handler: (...args: unknown[]) => any)
    {
        this.handlers[command] = handler;
        return this;
    }//on
 
}//AppCommandExecutor
