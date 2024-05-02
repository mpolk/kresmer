/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A loader for network element class libraries
\**************************************************************************/

import Kresmer from "../Kresmer";
import {Root as PostCSSRoot, Rule as PostCSSRule} from 'postcss';
import LibraryParser, { DefsLibNode, ImportStatement, LibParams, StyleLibNode } from "./LibraryParser";
import NetworkElementClass from "../DrawingElement/NetworkElementClass";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkLinkClass from "../NetworkLink/NetworkLinkClass";
import { LibraryImportException } from "../KresmerException";
import DrawingAreaClass from "../DrawingArea/DrawingAreaClass";

/**A loader for network element class libraries */
export default class LibraryLoader
{
    constructor(private kresmer: Kresmer, private depth = 0) {}

    /**
     * Loads a component class library from the raw XML data
     * @param libData Library data
     * @returns Result code: 0 - success, -1 - library already loaded, >0 - the number of errors
     */
    public async loadLibrary(libData: string): Promise<number>
    {
        return this._loadLibrary(
            libData, 
            (libName, fileName) => this.kresmer.emit("library-import-requested", libName, fileName)
        );
    }//loadLibrary


    private async _loadLibrary(libData: string, 
                               importHandler: (libName: string, fileName?: string) => Promise<string|undefined>,
                            ): Promise<number>
    {
        // console.debug("Loading library...");
        const parser = new LibraryParser(this.kresmer);
        let nErrors = 0;
        let libName = "";
        for (const element of parser.parseXML(libData)) {
            //console.debug(element);
            if (element instanceof LibParams) {
                libName = element.name;
                const alreadyLoaded = !this.kresmer._registerLibrary(libName);
                if (alreadyLoaded) {
                    console.debug(`Library "${libName}" - dup, ignored`);
                    return -1;
                }//if

            } else if (element instanceof NetworkComponentClass) {
                this.kresmer.registerNetworkComponentClass(element);

            } else if (element instanceof NetworkLinkClass) {
                this.kresmer.registerLinkClass(element);

            } else if (element instanceof DrawingAreaClass) {
                this.kresmer.registerAreaClass(element);

            } else if (element instanceof DefsLibNode) {
                this.kresmer.defs.push(element.data);
                this.kresmer.appKresmer.component(`GlobalDefs${this.kresmer.defs.length - 1}`, {template: element.data});

            } else if (element instanceof StyleLibNode) {
                this.kresmer.styles.push(this.scopeStyles(element.data, undefined, false));

            } else if (element instanceof ImportStatement) {
                if (!this.kresmer.isLibraryLoaded(element.libName)) {
                    const importedLibData = await importHandler(element.libName, element.fileName);
                    if (!importedLibData)
                        this.kresmer.raiseError(new LibraryImportException({libName: element.libName, fileName: element.fileName}));
                    else {
                        const childLoader = new LibraryLoader(this.kresmer, this.depth+1);
                        const nImportErrors = await childLoader._loadLibrary(importedLibData, importHandler);
                        if (nImportErrors > 0)
                            nErrors += nImportErrors;
                        console.debug(`${"  ".repeat(this.depth+1)}Library "${element.libName}" - imported`);
                    }//if
                }//if

            } else {
                this.kresmer.raiseError(element);
                nErrors++;
            }//if
        }//for

        console.debug(`${"  ".repeat(this.depth)}Library "${libName}" - loaded (${nErrors} errors)`);
        return nErrors;
    }//_loadLibrary

    /**
     * Loads several libraries at once
     * @param libs Mapping libName => libData
     */
    public async loadLibraries(libs: Record<string, string>): Promise<number>
    {
        let nErrors = 0;
        for (const libName in libs) {
            const libData = libs[libName];
            const rc = await this._loadLibrary(libData, (libToImportName: string) => {
                const libToImportData = libs[libToImportName];
                return libToImportData ? Promise.resolve(libToImportData) : 
                    this.kresmer.emit("library-import-requested", libToImportName );
            });
            if (rc > 0)
                nErrors += rc;
        }//for
        return nErrors;
    }//loadLibraries

    /**
     * Adds global and (optionally) component class scopes to the CSS style definition
     * @param ast Parsed CSS (Abstract Syntax Tree) to modify
     * @param classScope An element class to apply as a scope
     * @returns Modified AST
     */
    public scopeStyles(ast: PostCSSRoot, classScope: NetworkElementClass|undefined, recurse: boolean)
    {
        const ast1 = ast.clone() as PostCSSRoot;

        ast1.walkRules((rule: PostCSSRule) => {
            const additionalScopes: string[] = [];
            let firstScope = ".kresmer";
            if (classScope) {
                firstScope += ` .${classScope.name}`;
                const baseClasses: NetworkElementClass[] = [];
                if (classScope.baseClass) {
                    baseClasses.push(classScope.baseClass);
                }//if
                if (classScope.styleBaseClasses) {
                    baseClasses.push(...classScope.styleBaseClasses);
                }//if
                if (baseClasses.length) {
                    this.makeBaseClassScopes(additionalScopes, firstScope, baseClasses, recurse);
                }//if
            }//if

            const additionalSelectors: string[] = [];
            rule.selectors.forEach(sel => {
                additionalScopes.forEach(scope => {
                    if (scope != firstScope) {
                        const additionalSelector = `${scope} ${sel}`;
                        if (additionalSelectors.indexOf(additionalSelector) == -1) {
                            additionalSelectors.push(additionalSelector);
                        }//if
                    }//if
                });
            });

            rule.selectors = rule.selectors.map(sel => `${firstScope} ${sel}`);
            if (additionalSelectors.length) {
                rule.selector += `, ${additionalSelectors.join(", ")}`;
            }//if
        })

        return ast1;
    }//scopeStyles

    private makeBaseClassScopes(scopes: string[], prefix: string, baseClasses: NetworkElementClass[], recurse: boolean)
    {
        baseClasses.forEach(baseClass => {
            const baseScope = baseClass.usesEmbedding ? `${prefix} .${baseClass.name}` : prefix;
            scopes.push(baseScope);
            if (recurse) {
                const grandBaseClasses: NetworkElementClass[] = [];
                if (baseClass.baseClass) {
                    grandBaseClasses.push(baseClass.baseClass);
                }//if
                if (baseClass.styleBaseClasses) {
                    grandBaseClasses.push(...baseClass.styleBaseClasses);
                }//if
                if (grandBaseClasses.length) {
                    this.makeBaseClassScopes(scopes, baseScope, grandBaseClasses, true);
                }//if
            }//if
        });
    }//makeBaseClassScopes
}//LibraryLoader