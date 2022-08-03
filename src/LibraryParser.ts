/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                     Component library parser
\**************************************************************************/

import { ComponentPropsOptions } from "vue";
import NetworkComponentClass from "./NetworkComponentClass";

export default class LibraryParser {

    public *parseXML(rawData: string)
    {
        console.debug('Parsing library XML...');
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(rawData, "text/xml") as XMLDocument;
        const root = dom.firstChild;

        if (root?.nodeName !== "kresmer-library")
            throw `Invalid library root element: ${root?.nodeName}`;

        for (let i = 0; i < root.childNodes.length; i++) {
            const node = root.childNodes[i];
            switch (node.nodeName) {
                case "component-class":
                    yield this.parseComponentClassNode(node);
                    break;
                case "#text":
                    break;
                default:
                    throw `Invalid top-level node in library: "${node.nodeName}"`;
            }//switch
        }//for
    }//parseXML


    private parseComponentClassNode(node: Node)
    {
        const className = node.getAttribute("name");
        if (!className) 
            throw "Component class without name";

        let template: string | null = null;
        let props: ComponentPropsOptions = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === node.ELEMENT_NODE) {
                switch (child.nodeName) {
                    case "template":
                        template = child.innerHTML.trim().replace(/v--/g, ":");
                        break;
                    case "props":
                        props = this.parseProps(child);
                }//switch
            }//if
        }//for

        if (!template) 
            throw `Component ${className} class without template`;

        return new NetworkComponentClass(className, {template, props})
    }//parseComponentClassNode


    private parseProps(node: Node)
    {
        const props: ComponentPropsOptions = {};
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === node.ELEMENT_NODE) {
                switch (child.nodeName) {
                    case "prop": {
                        const propName = child.getAttribute("name");
                        const prop = {
                            type: child.getAttribute("type"),
                            required: child.getAttribute("required"),
                            default: child.getAttribute("default"),
                        };
                        if (!propName)
                            throw "Prop without name";
                        if (prop.default == null)
                            delete prop.default;

                        switch (prop.type) {
                            case "String":
                                prop.type = String;
                                break;
                            case "Number":
                                prop.type = Number;
                                if (prop.default)
                                    prop.default = parseFloat(prop.default);
                                break;
                            case "Object":
                                prop.type = Object;
                                if (prop.default)
                                    prop.default = JSON.parse(prop.default);
                                break;
                            case "Array":
                                prop.type = Array;
                                if (prop.default)
                                    prop.default = JSON.parse(prop.default);
                                break;
                            default:
                                throw `Invalid prop type: ${prop.type}`;
                        }//switch

                        switch (prop.required) {
                            case "true": case "false":
                                prop.required = prop.required === "true";
                                break;
                            case null: case undefined:
                                delete prop.required;
                                break;
                            default:
                                throw `Invalid prop "required" attribute: ${prop.required}`;
                        }//switch

                        props[propName] = prop;
                        break;
                    }
                }//switch
            }//if
        }//for

        return props;
    }//parseProps

}//LibraryParser