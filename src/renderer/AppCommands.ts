/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Application commands that can be sent from the Main process to the Renderer
 ***************************************************************************/

import { ContextMenuCommands } from "../main/Menus";
import { DrawingMergeOptions } from "kresmer";
import { AppSettings } from "../main/main";

export interface LoadLibraryOptions {
    libraryFileName?: string, 
    notifyUser?: boolean,
}//LoadLibraryOptions

export interface LoadDrawingOptions {
    drawingFileName?: string, 
    mergeOptions?: DrawingMergeOptions,
    completionSignal?: number,
}//LoadDrawingOptions

export interface AppCommandFormats extends ContextMenuCommands {
    "edit-app-settings": (appSettings: AppSettings) => void,
    "load-library": (libData: string, options?: LoadLibraryOptions) => void,
    "create-new-drawing": () => void,
    "load-drawing": (drawingData: string, options?: LoadDrawingOptions) => void,
    "save-drawing": () => void,
    "export-drawing-to-SVG": () => void,
    "connect-to-server": (url: string, password: string, forceUI: boolean) => void,
    "disconnect-from-server": () => void,
    "escape": () => void,
    "undo": () => void,
    "redo": () => void,
    "toggle-background-editing-mode": () => void,
    "delete-selected-element": () => void,
    "duplicate-selected-element": () => void,
    "move-selected-element-up": () => void,
    "move-selected-element-down": () => void,
    "move-selected-element-to-top": () => void,
    "move-selected-element-to-bottom": () => void,
    "scale-drawing": (direction: ScaleDirection) => void,
    "toggle-vertex-auto-alignment": () => void,
    "toggle-snapping-to-grid": () => void,
    "toggle-grid": () => void,
    "toggle-rulers": () => void,
    "add-component": (position?: {x: number, y: number}) => void,
    "show-about-dialog": (appVersion: string, electronVersion: string) => void,
}//AppCommandFormats

export type AppCommand = keyof AppCommandFormats;
export type ScaleDirection = "+"|"-"|"0"|"1";

export class AppCommandExecutor {

    private handlers: Partial<AppCommandFormats> = {};

    execute(command: string, ...args: unknown[])
    {
        const handler = this.handlers[command as AppCommand];
        if (handler) {
            (handler as (...args: unknown[]) => void)(...args);
        } else {
            alert(`Unknown command: ${command}(${JSON.stringify(args)})`);
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
