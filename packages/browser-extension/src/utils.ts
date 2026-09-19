/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                  Browser extension utility functions
 ***************************************************************************/

import browser from 'webextension-polyfill';

export const interceptionMarker = "in-brext";

export function makeViewerURL(url?: string) {
    return browser.runtime.getURL(`src/viewer.html?${url ? `file=${encodeURIComponent(url)}&` : ''}${interceptionMarker}`);
}//makeViewerURL

