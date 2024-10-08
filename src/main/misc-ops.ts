/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *        Miscellaneous operations for the Electron node.js main script
 ***************************************************************************/

import { shell } from 'electron';
import { sendAppCommand, localSettings } from './main';


/**
 * Open an URL with the default system browser
 * @param url An URL to open
 */
export function openUrlWithSystemBrowser(url: string)
{
    console.debug(`trying to open external link ${url}`);
    shell.openExternal(url);
}//openUrlWithSystemBrowser


export function requestConnectToServer(forceUI: boolean)
{
    sendAppCommand("connect-to-server", localSettings.get("server", "url"), localSettings.get("server", "password"), forceUI);
}//requestConnectToServer

export function requestDisconnectFromServer()
{
    sendAppCommand("disconnect-from-server");
}//requestDisconnectFromServer
