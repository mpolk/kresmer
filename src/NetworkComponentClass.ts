/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 ***************************************************************************/

import { ComponentObjectPropsOptions } from "vue";

/**
 * Network Component Class - a generic network element class
 * (the word "class" here means a runtime class, not a Typescript one)
 */
export default class NetworkComponentClass {
    /**
     * @param name Class name
     * @param params Class creation parameters:
     *               template: Template for the Vue-component for this class
     *               props: Props definition of the Vue-component for this class
     */
    public constructor(name: string, params: {
        template: string | Element,
        props?: ComponentObjectPropsOptions,
    })
    {
        this.name = name;
        this.template = params.template;
        this.props = params.props;
    }//ctor

    /**
     * Class name
     */
    readonly name: string;
    /**
     * Template for the Vue-component for this class
     */
    readonly template: string | Element;
    /**
     * Props definition of the Vue-component for this class
     */
    readonly props?: ComponentObjectPropsOptions;

    /**
     * Returns the name of the vue-component for this class
     * @returns The vue-component name
     */
    get vueName() {return "NetworkComponent_" + this.name}


    private prepareTemplate(template: string | Element)
    {
        if (template instanceof Element)
            return this.prepareTemplateDOM(template);
        else
            return this.prepareTemplateStr(template);
    }//prepareTemplate

    private prepareTemplateDOM(templateNode: Element)
    {
        const dom = templateNode.ownerDocument;
        const svg = dom.createElement("svg");
        svg.setAttribute(":x", "origin.x");
        svg.setAttribute(":y", "origin.y");
        svg.setAttribute("style", "overflow: visible");

        const g = dom.createElement("g");
        svg.appendChild(g);
        g.setAttribute(":transform", "transform");

        const n = templateNode.childNodes.length;
        for (let i = 0; i < n; i++) {
            const child = templateNode.childNodes[0];
            g.appendChild(child);
        }//for

        templateNode.appendChild(svg);
        return templateNode;
    }//prepareTemplateDOM

    private prepareTemplateStr(templateStr: string)
    {
        return templateStr;
    }//prepareTemplateStr
}//NetworkComponentClass
