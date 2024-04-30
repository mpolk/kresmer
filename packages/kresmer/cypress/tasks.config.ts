/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Test support functions exposed as Cypress tasks
 ***************************************************************************/

import * as fs from "node:fs";
import * as path from "node:path";
declare global {
    namespace Cypress {
        interface Chainable {
            task(event: "loadLibraries"): Chainable<Record<string, string>>,
        }
    }
}
  
export default {
    /** 
     * Loads all Kresmer libraries from the hardcoded directory 
     * @returns The libs loaded in the form {libName: libData, ...}
     */
    loadLibraries() {
        const libDir = "./lib";
        const libs: Record<string, string> = {};
        const libFilePaths = fs.readdirSync(libDir);
        libFilePaths.forEach(filePath => {
            const matches = filePath.match(/(.*)\.krel$/);
            if (matches) {
                const libName = matches[1];
                const libData = fs.readFileSync(path.join(libDir, filePath), "utf8");
                libs[libName] = libData;
            }//if
        });
        return libs;
    },//loadLibraries
}//export
