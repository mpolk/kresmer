/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                  A loader for the drawing files
\**************************************************************************/

import Kresmer, { DrawingElementClass } from "../Kresmer";
import DrawingParser, { DrawingHeaderData } from "./DrawingParser";
import NetworkComponentController from "../NetworkComponent/NetworkComponentController";
import NetworkLink from "../NetworkLink/NetworkLink";


export default class DrawingLoader {

    constructor(private kresmer: Kresmer) {}

    /**
     * Loads a component class library from the raw XML data
     * @param dwgData Library data
     * @param mergeOptions Defines the way the loaded content should be merged with the existing one
     */
    public async loadDrawing(dwgData: string, mergeOptions?: DrawingMergeOptions): Promise<boolean>
    {
        console.debug("Loading drawing...");
        // console.debug(dwgData);
        if (mergeOptions === "erase-previous-content") {
            this.kresmer.eraseContent();
        }//if

        let drawingHeaderData!: DrawingHeaderData;
        const componentRenames = new Map<string, string>();

        const parser = new DrawingParser(this.kresmer);
        let wereErrors = false;
        for (const element of parser.parseXML(dwgData)) {
            //console.debug(element);
            if (element instanceof DrawingHeaderData) {
                drawingHeaderData = element;
            } else if (element instanceof NetworkComponentController) {
                let componentName = element.component.name;
                if (this.kresmer.componentsByName.has(componentName)) {
                    switch (mergeOptions) {
                        case "merge-duplicates": {
                            const id = this.kresmer.componentsByName.get(componentName)!;
                            this.kresmer.networkComponents.delete(id);
                            break;
                        }
                        case "rename-duplicates":
                            for (let i = 1; i <= Number.MAX_SAFE_INTEGER; i++) {
                                const newName = `${componentName}.${i}`;
                                if (!(newName in this.kresmer.componentsByName)) {
                                    componentRenames.set(componentName, newName);
                                    element.component.name = newName;
                                    break;
                                }//if
                            }//for
                            break;
                    }//switch
                }//if
                componentName = element.component.name;
                this.kresmer.emit("component-loaded", element.component);
                if (element.component.dbID !== undefined) {
                    await this.kresmer.backendConnection?.onNetworkComponentLoaded(element.component);
                }//if
                if (element.component.name !== componentName) {
                    componentRenames.set(componentName, element.component.name);
                }//if
                this.kresmer.addPositionedNetworkComponent(element);
            } else if (element instanceof NetworkLink) {
                const link = element;
                for (const vertex of link.vertices) {
                    const connTargetName = vertex.uninitializedConnectionTargetHostName;
                    if (connTargetName && componentRenames.has(connTargetName)) {
                        vertex.uninitializedConnectionTargetHostName = componentRenames.get(connTargetName)!;
                    }//if
                }//for

                this.kresmer.emit("link-loaded", link);
                if (link.dbID !== undefined) {
                    await this.kresmer.backendConnection?.onNetworkLinkLoaded(link);
                }//if

                const linkName = link.name;
                if (this.kresmer.linksByName.has(linkName)) {
                    switch (mergeOptions) {
                        case "merge-duplicates": {
                            const id = this.kresmer.linksByName.get(linkName)!;
                            this.kresmer.links.delete(id);
                            break;
                        }
                        case "rename-duplicates":
                            for (let i = 1; i <= Number.MAX_SAFE_INTEGER; i++) {
                                const newName = `${linkName}.${i}`;
                                if (!(newName in this.kresmer.linksByName)) {
                                    link.name = newName;
                                    break;
                                }//if
                            }//for
                            break;
                    }//switch
                }//if
                this.kresmer.addLink(link);
            } else {
                this.kresmer.raiseError(element);
                wereErrors = true;
            }//if
        }//for

        this.kresmer.undoStack.reset();
        switch (mergeOptions) {
            case undefined: case "erase-previous-content":
                this.kresmer.drawingName = drawingHeaderData.name;
                drawingHeaderData.width && (this.kresmer.logicalWidth = drawingHeaderData.width);
                drawingHeaderData.height && (this.kresmer.logicalHeight = drawingHeaderData.height);
                drawingHeaderData.hrefBase && (this.kresmer.hrefBase.value = drawingHeaderData.hrefBase);
                drawingHeaderData.backgroundImage && this.kresmer.backgroundImage.copy(drawingHeaderData.backgroundImage);
                drawingHeaderData.backgroundColor && (this.kresmer.backgroundColor = drawingHeaderData.backgroundColor);
                this.kresmer.isDirty = false;
                break;
            default:
                if (!this.kresmer.drawingName) {
                    this.kresmer.drawingName = drawingHeaderData.name;
                }//if
                this.kresmer.isDirty = true;
        }//switch

        return !wereErrors;
    }//loadDrawing


    /** Serializes the drawing data to the string and returns this string */
    public saveDrawing(): string
    {
        this.kresmer.deselectAllElements();

        const attrs: Record<string, unknown> = {
            name: this.kresmer.drawingName,
            width: this.kresmer.logicalWidth, 
            height: this.kresmer.logicalHeight,
            "background-color": this.kresmer.backgroundColor,
        };

        if (this.kresmer.hrefBase.value) 
            attrs["href-base"] = this.kresmer.hrefBase.value;
        if (this.kresmer.backgroundImage.nonEmpty) {
            Object.entries(this.kresmer.backgroundImage.toMarkupAttrs()).forEach(([key, value]) => {
                attrs[key] = value;
            })
        }//if

        let xml = `\
<?xml version="1.0" encoding="utf-8"?>
<?xml-model href="xsd/kresmer-drawing.xsd"?>
<kresmer-drawing 
    ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join("\n\t")}>

`;

        if (this.kresmer.embedLibDataInDrawing)
            xml += this.saveLibraryData(1) + "\n";

        for (const controller of this.kresmer.networkComponents.sorted.values()) {
            xml += controller.toXML(1) + "\n\n";
        }//for

        for (const link of this.kresmer.links.sorted.values()) {
            xml += link.toXML(1) + "\n\n";
        }//for

        xml += "</kresmer-drawing>\n"
        this.kresmer.isDirty = false;
        return xml;
    }//saveDrawing


    public saveLibraryData(indentLevel: number): string
    {
        let xml = ""
        const alreadySerialized = new Set<DrawingElementClass>();
        xml += `${"\t".repeat(indentLevel)}<library xmlns:Kre="Kre" xmlns:v-bind="v-bind" xmlns:v-on="v-on" xmlns:v-slot="v-slot" xmlns:uk="uk">\n`;

        for (const def of this.kresmer.globalDefs.values()) {
            let i = indentLevel+1;
            for (const line of def.sourceCode.split("\n")) {
                xml += `${"\t".repeat(i)}${line}\n`;
                i = 1;
            }//for
        }//for

        for (const style of this.kresmer.globalStyles.values()) {
            let i = indentLevel+1;
            for (const line of style.sourceCode.split("\n")) {
                xml += `${"\t".repeat(i)}${line}\n`;
                i = 1;
            }//for
        }//for

        for (const controller of this.kresmer.networkComponents.sorted.values()) {
            xml += controller.component.getClass().toXML(indentLevel+1, alreadySerialized);
        }//for

        for (const link of this.kresmer.links.sorted.values()) {
            xml += link.getClass().toXML(indentLevel+1, alreadySerialized);
        }//for

        for (const area of this.kresmer.areas.sorted.values()) {
            xml += area.getClass().toXML(indentLevel+1, alreadySerialized);
        }//for

        xml += `${"\t".repeat(indentLevel)}</library>\n`;
        return xml;
}//saveLibraryData

}//DrawingLoader

/** The options to perform drawing merge upon its loading */
export type DrawingMergeOptions = 
    "erase-previous-content" | 
    "merge-duplicates" |
    "rename-duplicates"
    ;
