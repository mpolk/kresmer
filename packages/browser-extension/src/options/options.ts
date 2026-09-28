/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *           Browser extension options page initialization script
 ***************************************************************************/

import { createApp } from "vue";
import Options from "./options.vue";
import browser from "webextension-polyfill";

createApp(Options).mount("#options-root");

export async function loadLibraryPaths() {
    const libraryPaths = ["lib"];
    try {
        const result = await browser.storage.local.get("libraryPaths") as {libraryPaths: Record<number, string>};
        libraryPaths.length = 0;
        for (const [i, path] of Object.entries(result.libraryPaths))
            libraryPaths[i as unknown as number] = path;
    } catch  {/* ignore */}
    return libraryPaths;
}//loadLibraryPaths