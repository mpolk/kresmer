/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A loader for network element class libraries
\**************************************************************************/

import Kresmer from "../Kresmer";
import {Root as PostCSSRoot, Rule as PostCSSRule} from 'postcss';
import LibraryParser, { DefsLibNode, StyleLibNode } from "./LibraryParser";
import NetworkElementClass from "../NetworkElementClass";
import NetworkComponentClass from "../NetworkComponent/NetworkComponentClass";
import NetworkLinkClass from "../NetworkLink/NetworkLinkClass";

/**A loader for network element class libraries */
export default class LibraryLoader
{
    constructor(private kresmer: Kresmer) {}

    /**
     * Loads a component class library from the raw XML data
     * @param libData Library data
     */
    public loadLibrary(libData: string): boolean
    {
        console.debug("Loading library...");
        const parser = new LibraryParser(this.kresmer);
        let wereErrors = false;
        for (const element of parser.parseXML(libData)) {
            //console.debug(element);
            if (element instanceof NetworkComponentClass) {
                this.kresmer.registerNetworkComponentClass(element);
            } else if (element instanceof NetworkLinkClass) {
                this.kresmer.registerLinkClass(element);
            } else if (element instanceof DefsLibNode) {
                this.kresmer.defs.push(element.data);
                this.kresmer.appKresmer
                    .component(`GlobalDefs${this.kresmer.defs.length - 1}`, {template: element.data});
            } else if (element instanceof StyleLibNode) {
                this.kresmer.styles.push(this.scopeStyles(element.data));
            } else {
                console.error(`${element.message}\nSource: ${element.source}`);
                wereErrors = true;
            }//if
        }//for
        return !wereErrors;
    }//loadLibrary

    /**
     * Adds global and component class scopes (optionally) to the CSS style definition
     * @param ast Parsed CSS (Abstract Syntax Tree) to modify
     * @param classScope An element class to apply as a scope
     * @returns Modified AST
     */
    public scopeStyles(ast: PostCSSRoot, classScope?: NetworkElementClass)
    {
        const ast1 = ast.clone();

        ast1.walkRules((rule: PostCSSRule) => {
            const additionalScopes: string[] = [];
            let scope = ".kresmer";
            if (classScope) {
                scope += ` .${classScope.name}`;
                if (classScope.baseClasses) {
                    this.makeBaseClassScopes(additionalScopes, scope, classScope.baseClasses);
                }//if
            }//if

            const additionalSelectors: string[] = [];
            rule.selectors.forEach(sel => {
                additionalScopes.forEach(scope => {
                    additionalSelectors.push(`${scope} ${sel}`);
                });
            });

            rule.selectors = rule.selectors.map(sel => `${scope} ${sel}`);
            if (additionalSelectors.length) {
                rule.selector += `, ${additionalSelectors.join(", ")}`;
            }//if
        })

        return ast1;
    }//scopeStyles

    private makeBaseClassScopes(scopes: string[], prefix: string, baseClasses: NetworkElementClass[])
    {
        baseClasses.forEach(baseClass => {
            const baseScope = `${prefix} .${baseClass.name}`;
            scopes.push(baseScope);
            if (baseClass.baseClasses) {
                this.makeBaseClassScopes(scopes, baseScope, baseClass.baseClasses);
            }//if
        });
    }//makeBaseClassScopes
}//LibraryLoader