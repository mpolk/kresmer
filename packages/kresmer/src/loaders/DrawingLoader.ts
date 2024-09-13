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
import DrawingArea from "../DrawingArea/DrawingArea";
import XMLFormatter, { XMLTag } from "../XMLFormatter";


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
            } else if (element instanceof DrawingArea) {
                const area = element;
                this.kresmer.emit("area-loaded", area);
                if (area.dbID !== undefined) {
                    await this.kresmer.backendConnection?.onDrawingAreaLoaded(area);
                }//if
                this.kresmer.addArea(area);
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

        const outerTag = new XMLTag("kresmer-drawing",
            ["xmlns", "kresmer-drawing"],
            ["name", this.kresmer.drawingName],
            ["width", this.kresmer.logicalWidth], 
            ["height", this.kresmer.logicalHeight],
            ["background-color", this.kresmer.backgroundColor],
        );

        if (this.kresmer.hrefBase.value) 
            outerTag.addAttrib("href-base", this.kresmer.hrefBase.value);
        if (this.kresmer.backgroundImage.nonEmpty) {
            Object.entries(this.kresmer.backgroundImage.toMarkupAttrs()).forEach(([key, value]) => {
                outerTag.addAttrib(key, value);
            })
        }//if

        const formatter = new XMLFormatter();
        formatter
            .addLine('<?xml version="1.0" encoding="utf-8"?>')
            .addLine('<?xml-model href="xsd/kresmer-drawing.xsd"?>')
            .addLine(outerTag.opening("\n    ")).i()
            .addLine()
            .addLine()
            ;

        if (this.kresmer.embedLibDataInDrawing) {
            formatter.addLine(this.saveLibraryData(1)).addLine();
        }//if

        for (const area of this.kresmer.areas.sorted.values()) {
            formatter.addLine(area.toXML(1)).addLine().addLine();
        }//for

        for (const controller of this.kresmer.networkComponents.sorted.values()) {
            formatter.addLine(controller.toXML(1)).addLine().addLine();
        }//for

        for (const link of this.kresmer.links.sorted.values()) {
            formatter.addLine(link.toXML(1)).addLine().addLine();
        }//for

        formatter.u().addLine(outerTag.closing());
        this.kresmer.isDirty = false;
        return formatter.xml;
    }//saveDrawing


    public saveLibraryData(indentLevel: number): string
    {
        let xml = ""
        const alreadySerialized = new Set<DrawingElementClass>();

        const attrs: Record<string, unknown> = {
            "xmlns:kre": "kresmer-builtin-elements",
            "xmlns:Kre": "kresmer-user-defined-elements",
            "xmlns:v-bind": "v-bind",
            "xmlns:v-on": "v-on",
            "xmlns:v-slot": "v-slot",
        };
        xml += `${"\t".repeat(indentLevel)}<library
${"\t".repeat(indentLevel+1)}${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(`\n${"\t".repeat(indentLevel+1)}`)}>
`;

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
