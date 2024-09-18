/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A loader for drawing element class libraries
\**************************************************************************/

import Kresmer, { LibDataPriority } from "../Kresmer";
import {Root as PostCSSRoot, Rule as PostCSSRule} from 'postcss';
import LibraryParser, { DefsLibNode, ImportStatement, LibParams, LibraryParsingException, 
    NetworkComponentClassTranslation, NetworkLinkClassTranslation, DrawingAreaClassTranslation, StyleLibNode } from "./LibraryParser";
import DrawingElementClass, {PropTypeDescriptor} from "../DrawingElement/DrawingElementClass";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkLinkClass from "../NetworkLink/NetworkLinkClass";
import { LibraryImportException } from "../KresmerException";
import DrawingAreaClass from "../DrawingArea/DrawingAreaClass";

/**A loader for drawing element class libraries */
export default class LibraryLoader
{
    constructor(private kresmer: Kresmer, 
                private propTypes: Map<string, Map<string, PropTypeDescriptor>> = new Map, 
                private depth = 0
               ) {}

    /**
     * Loads a component class library from the raw XML data
     * @param libData Library data
     * @returns Result code: 0 - success, -1 - library already loaded, >0 - the number of errors
     */
    public async loadLibrary(libData: string): Promise<number>
    {
        return this._loadLibrary(
            libData, 
            (libName, libFile) => this.kresmer.emit("library-import-requested", libName, libFile),
            (libName, language) => this.kresmer.emit("library-translation-requested", libName, language),
        );
    }//loadLibrary


    private async _loadLibrary(libData: string, 
                               importHandler: (libName: string, fileName?: string) => Promise<string|undefined>,
                               translationHandler: (libName: string, language: string, fileName?: string) => Promise<string|undefined>,
                            ): Promise<number>
    {
        // console.debug("Loading library...");
        const parser = new LibraryParser(this.kresmer, this.propTypes);
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
                if (!this.kresmer.globalDefs.has(element.name) || this.kresmer.globalDefs.get(element.name)!.version < element.version) {
                    this.kresmer.globalDefs.set(element.name, element);
                    this.kresmer.app.component(`GlobalDefs${this.kresmer.globalDefs.size - 1}`, {template: element.data});
                }//if

            } else if (element instanceof StyleLibNode) {
                if (!this.kresmer.globalStyles.has(element.name) || this.kresmer.globalStyles.get(element.name)!.version < element.version) {
                    this.kresmer.globalStyles.set(element.name, 
                        {data: this.scopeStyles(element.data, undefined, false), version: element.version, sourceCode: element.sourceCode});
                }//if

            } else if (element instanceof ImportStatement) {
                if (!this.kresmer.isLibraryLoaded(element.libName)) {
                    const importedLibData = await importHandler(element.libName, element.fileName);
                    if (!importedLibData)
                        this.kresmer.raiseError(new LibraryImportException({libName: element.libName, fileName: element.fileName}));
                    else {
                        const childLoader = new LibraryLoader(this.kresmer, this.propTypes, this.depth+1);
                        const nImportErrors = await childLoader._loadLibrary(importedLibData, importHandler, translationHandler);
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

        const translation = await translationHandler(libName, this.kresmer.uiLanguage);
        if (translation) {
            this.loadLibraryTranslation(translation);
            console.debug(`${"  ".repeat(this.depth)}Translation for the library "${libName}" loaded`);
        }//if

        console.debug(`${"  ".repeat(this.depth)}Library "${libName}" - loaded (${nErrors} errors)`);
        return nErrors;
    }//_loadLibrary

    /**
     * Loads several libraries at once
     * @param libs Mapping libName => libData
     */
    public async loadLibraries(libs: Map<string, string>, translations?: Map<string, Map<string, string>>): Promise<number>
    {
        let nErrors = 0;
        for (const libData of libs.values()) {
            const rc = await this._loadLibrary(libData, 
                (importedLibName: string) => {
                    const importedLibData = libs.get(importedLibName);
                    return importedLibData ? Promise.resolve(importedLibData) : 
                        this.kresmer.emit("library-import-requested", importedLibName );
                },
                (libName: string) => {
                    const transData = translations?.get(libName)?.get(this.kresmer.uiLanguage);
                    return transData ? Promise.resolve(transData) : 
                        this.kresmer.emit("library-translation-requested", libName, this.kresmer.uiLanguage);
                }
            );
            if (rc > 0)
                nErrors += rc;
        }//for
        return nErrors;
    }//loadLibraries


    /**
     * Loads a library embedded into the drawing
     * @param root library root node
     */
    public loadEmbeddedLibrary(root: Element)
    {
        // console.debug("Loading library...");
        const parser = new LibraryParser(this.kresmer, this.propTypes);
        for (const element of parser.parseLibraryNode(root)) {
            //console.debug(element);
            if (element instanceof NetworkComponentClass) {
                if (this.shouldOverrideWithEmbedded(this.kresmer.registeredComponentClasses.get(element.name), element))
                    this.kresmer.registerNetworkComponentClass(element, {force: true});

            } else if (element instanceof NetworkLinkClass) {
                if (this.shouldOverrideWithEmbedded(this.kresmer.registeredLinkClasses.get(element.name), element))
                    this.kresmer.registerLinkClass(element, {force: true});

            } else if (element instanceof DrawingAreaClass) {
                if (this.shouldOverrideWithEmbedded(this.kresmer.registeredAreaClasses.get(element.name), element))
                    this.kresmer.registerAreaClass(element, {force: true});

            } else if (element instanceof DefsLibNode) {
                if (this.shouldOverrideWithEmbedded(this.kresmer.globalDefs.get(element.name), element)) {
                    this.kresmer.globalDefs.set(element.name, element);
                    this.kresmer.app.component(`GlobalDefs${this.kresmer.globalDefs.size - 1}`, {template: element.data});
                }//if

            } else if (element instanceof StyleLibNode) {
                if (this.shouldOverrideWithEmbedded(this.kresmer.globalStyles.get(element.name), element)) {
                    this.kresmer.globalStyles.set(element.name, 
                        {data: this.scopeStyles(element.data, undefined, false), version: element.version, sourceCode: element.sourceCode});
                }//if

            } else {
                this.kresmer.raiseError(new LibraryParsingException(`Invalid embedded library content: ${element}`));
            }//if
        }//for
    }//loadEmbeddedLibrary


    /** Checks whether the existing library element should be overridden with the similar element from the embedded library */
    private shouldOverrideWithEmbedded(oldLibElement: {version: number}|undefined, newLibElement: {version: number}): boolean
    {
        if (!oldLibElement || this.kresmer.libDataPriority === LibDataPriority.preferEmbedded)
            return true;
        if (this.kresmer.libDataPriority === LibDataPriority.preferSystem)
            return false;
        return newLibElement.version > oldLibElement.version;
    }//shouldOverrideWithEmbedded


    /**
     * Loads library translation data from XML and applies the translation to the registered classes
     * @param translationData Library translation raw data (XML)
     */
    public loadLibraryTranslation(translationData: string)
    {
        const parser = new LibraryParser(this.kresmer);
        for (const element of parser.parseTranslationXML(translationData)) {
            if (element instanceof NetworkComponentClassTranslation) {
                NetworkComponentClass.getClass(element.ref)?.applyTranslation(element);
            } else if (element instanceof NetworkLinkClassTranslation) {
                NetworkLinkClass.getClass(element.ref)?.applyTranslation(element);
            } else if (element instanceof DrawingAreaClassTranslation) {
                DrawingAreaClass.getClass(element.ref)?.applyTranslation(element);
            } else {
                this.kresmer.raiseError(element);
            }//if
        }//for
    }//loadLibraryTranslation

    /**
     * Adds global and (optionally) component class scopes to the CSS style definition
     * @param ast Parsed CSS (Abstract Syntax Tree) to modify
     * @param classScope An element class to apply as a scope
     * @returns Modified AST
     */
    public scopeStyles(ast: PostCSSRoot, classScope: DrawingElementClass|undefined, recurse: boolean)
    {
        const ast1 = ast.clone() as PostCSSRoot;

        ast1.walkRules((rule: PostCSSRule) => {
            if (rule.selector.startsWith('/')) {
                rule.selector = rule.selector.slice(1);
                return;
            }//if

            const additionalScopes: string[] = [];
            let firstScope = ".kresmer";
            if (classScope) {
                firstScope += ` .${classScope.name}`;
                const baseClasses: DrawingElementClass[] = [];
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

    private makeBaseClassScopes(scopes: string[], prefix: string, baseClasses: DrawingElementClass[], recurse: boolean)
    {
        baseClasses.forEach(baseClass => {
            const baseScope = baseClass.usesEmbedding ? `${prefix} .${baseClass.name}` : prefix;
            scopes.push(baseScope);
            if (recurse) {
                const grandBaseClasses: DrawingElementClass[] = [];
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