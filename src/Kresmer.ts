/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, createApp, InjectionKey, reactive, PropType, computed, ComputedRef } from "vue";
import {Root as PostCSSRoot, Rule as PostCSSRule} from 'postcss';
import KresmerVue from "./Kresmer.vue";
import KresmerEventFeatures from "./KresmerEventFeatures";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController from "./NetworkComponent/NetworkComponentController";
import { Position, Transform, TransformFunctons, ITransform } from "./Transform/Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import LinkClass from "./NetworkLink/NetworkLinkClass";
import LibraryParser, { DefsLibNode, StyleLibNode } from "./parsers/LibraryParser";
import DrawingParser from "./parsers/DrawingParser";
import TransformBoxVue from "./Transform/TransformBox.vue"
import NetworkComponentHolderVue from "./NetworkComponent/NetworkComponentHolder.vue";
import NetworkComponentAdapterVue from "./NetworkComponent/NetworkComponentAdapter.vue";
import ConnectionPointVue from "./ConnectionPoint/ConnectionPoint.vue";
import Link from "./NetworkLink/NetworkLink";
import NetworkLink from "./NetworkLink/NetworkLink";


/**
 * The main class implementing the most of the Kresmer public API
 * Also acts as a proxy for the Kresmer's root vue-component
 */
export default class Kresmer extends KresmerEventFeatures {

    /** Kresmer's vue-component Application */
    readonly appKresmer: App;
    /** Kresmer's vue-component instance itself */
    readonly vueKresmer: InstanceType<typeof KresmerVue>;
    /** A symbolic key for the Kresmer instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Kresmer>;
    /** Global SVG Defs */
    public readonly defs: Template[] = [];
    /** CSS styles collected component libraries */
    public styles: PostCSSRoot[] = [];

    constructor(mountPoint: string|HTMLElement, options?: {
        drawingWidth?: number | string,
        drawingHeight?: number | string,
        viewWidth?: number,
        viewHeight?: number,
        isEditable?: boolean,
    }) {
        super();
        if (options?.drawingWidth)
            this.drawingWidth = options.drawingWidth;
        if (options?.drawingHeight)
            this.drawingHeight = options.drawingHeight;
        if (options?.viewWidth)
            this.viewWidth = options.viewWidth;
        if (options?.viewHeight)
            this.viewHeight = options.viewHeight;
        if (options?.isEditable !== undefined)
            this.isEditable = options.isEditable;
            
        this.appKresmer = createApp(KresmerVue, {
            controller: this,
            networkComponents: this.networkComponents,
            networkComponentClasses: this.registeredComponentClasses,
            links: this.links,
            linkClasses: this.registeredLinkClasses,
            drawingWidth: this.drawingWidth,
            drawingHeight: this.drawingHeight,
            viewWidth: this.viewWidth,
            viewHeight: this.viewHeight,
            isEditable: this.isEditable,
        });

        this.appKresmer
            // register the components used to construct the drawing
            .component("TransformBox", TransformBoxVue)
            .component("NetworkComponentHolder", NetworkComponentHolderVue)
            .component("NetworkComponentAdapter", NetworkComponentAdapterVue)
            .component("ConnectionPoint", ConnectionPointVue)
            // register the functions that can be used in templates
            .config.globalProperties = {...GeneralTemplateFunctions, ...TransformFunctons}
            ;
        this.vueKresmer = this.appKresmer.mount(mountPoint) as InstanceType<typeof KresmerVue>;
    }//ctor


    // Drawing geometry parameters
    /** Sets the drawing width within the browser client area */
    readonly drawingWidth: number|string = "100%";
    /** Sets the drawing height within the browser client area */
    readonly drawingHeight: number|string = "100%";
    /** Sets the drawing area width in SVG logical units 
     * (component sizes are measuring related this width) */
    readonly viewWidth: number = 1000;
    /** Sets the drawing area height in SVG logical units 
     * (component sizes are measuring related this height) */
    readonly viewHeight: number = 1000;
    /** Determines whether the drawing is editable */
    readonly isEditable: boolean = true;

    /**
     * A list of all Component Classes, registered by Kresmer
     */
    protected readonly registeredComponentClasses: Record<string, NetworkComponentClass> = {};

    /**
     * Registers a Network Component Class in the Kresmer and registers
     * the corresponding new component in the Vue application
     * 
     * @param componentClass A Network Component Class to register
     */
    public registerNetworkComponentClass(componentClass: NetworkComponentClass) 
    {
        // Register a Vue-component for the class itself
        this.appKresmer.component(componentClass.vueName, 
        {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setup(props) {
                const computedProps: Record<string, ComputedRef> = {};
                for (const name in componentClass.computedProps) {
                    const body = componentClass.computedProps[name].body
                        .replaceAll(/(computedProps\.\w+)(?!\w*\.value)/g, "$1.value");
                    computedProps[name] = computed(eval(`() => (${body})`));
                }//for
                return computedProps;
            },
            template: componentClass.template,
            props: {
                ...componentClass.props,
                componentId: {type: Number},
                name: {type: [String, Number]},
                // the next two props are added just to relax Vue prop passing mechanism, which 
                // does not like xmlns:* attributes leaked from DOMParser
                "xmlns:Kre": {type: String},
                "xmlns:v-bind": {type: String},
            },
        // ...and the one for its adapter (used for component-in-component embedding)
        }).component(componentClass.adapterVueName, {
            setup(props) {
                const componentProps = computed(() => {
                    const pr = {...props};
                    for (const key of ["x", "y", "transform", "transformOrigin"]) {
                        delete pr[key];
                    }//for
                    return pr;
                });
                return {componentProps};
            },
            template: `\
                <NetworkComponentAdapter component-class="${componentClass.name}" 
                                         :x="x" :y="y" :transform="transform" :transform-origin="transformOrigin">
                    <component :is="'${componentClass.vueName}'" v-bind="componentProps"/>
                </NetworkComponentAdapter>`,
            props: {
                ...componentClass.props,
                name: {type: [String, Number]},
                x: {type: [Number, String] as PropType<number|string>, default: 0},
                y: {type: [Number, String] as PropType<number|string>, default: 0},
                transform: {type: [Object, String] as PropType<ITransform|string>},
                transformOrigin: {type: [Object, String] as PropType<Position|string>},
                // the next two props are added just to relax Vue prop passing mechanism, which 
                // does not like xmlns:* attributes leaked from DOMParser
                "xmlns:Kre": {type: String},
                "xmlns:v-bind": {type: String},
            },
        });

        // also register class's svg-definitions
        if (componentClass.defs) {
            this.appKresmer.component(componentClass.defsVueName, 
            {
                template: componentClass.defs,
            })
        }//if

        // ...and its css-styles
        if (componentClass.style) {
            this.styles.push(this.scopeStyles(componentClass.style, componentClass.name));
        }//if

        this.registeredComponentClasses[componentClass.name] = componentClass;

        // automatically create a single component instance if required
        if (componentClass.autoInstanciate) {
            this.placeNetworkComponent(new NetworkComponent(this, componentClass.name), {x: 0, y: 0});
        }//if
        return this;
    }//registerNetworkComponentClass

    /**
     * Register a Link Class in Kresmer
     * @param linkClass A class to register
     * @returns Kresmer itself
     */
    public registerLinkClass(linkClass: LinkClass)
    {

        // Register class's svg-definitions
        if (linkClass.defs) {
            this.appKresmer.component(linkClass.defsVueName, 
            {
                template: linkClass.defs,
            })
        }//if

        // ...and its css-styles
        if (linkClass.style) {
            this.styles.push(this.scopeStyles(linkClass.style, linkClass.name));
        }//if

        this.registeredLinkClasses[linkClass.name] = linkClass;
        return this;
    }//registerLinkClass

    /**
     * A list of all Link Classes, registered by Kresmer
     */
    protected readonly registeredLinkClasses: Record<string, LinkClass> = {};


    /**
     * Loads a component class library from the raw XML data
     * @param libData Library data
     */
    public loadLibrary(libData: string): boolean
    {
        console.debug("Loading library...");
        const parser = new LibraryParser();
        let wereErrors = false;
        for (const element of parser.parseXML(libData)) {
            //console.debug(element);
            if (element instanceof NetworkComponentClass) {
                this.registerNetworkComponentClass(element);
            } else if (element instanceof LinkClass) {
                this.registerLinkClass(element);
            } else if (element instanceof DefsLibNode) {
                this.defs.push(element.data);
                this.appKresmer.component(`GlobalDefs${this.defs.length - 1}`, {template: element.data});
            } else if (element instanceof StyleLibNode) {
                this.styles.push(this.scopeStyles(element.data));
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
     * @param classScope A component class name to apply as a scope
     * @returns Modified AST
     */
    private scopeStyles(ast: PostCSSRoot, classScope?: string)
    {
        const ast1 = ast.clone();
        ast1.walkRules((rule: PostCSSRule) => {
            // Scope all rules within the ".kresmer" class and optionally with a component class
            let scope = ".kresmer";
            if (classScope)
                scope += ` .${classScope}`;
            rule.selectors = rule.selectors.map(sel => `${scope} ${sel}`);
        })

        return ast1;
    }//scopeStyles
 
    /**
     * Components currently placed to the drawing
     */
    private readonly networkComponents = reactive<Record<string, NetworkComponentController>>({});
    private readonly componentsByName: Record<string, number> = {};

    /**
     * Adds a new Network Component to the content of the drawing
     * @param component A Network Component to add
     */
    public placeNetworkComponent(component: NetworkComponent,
                                 origin: Position, transform?: Transform)
    {
        const controller = new NetworkComponentController(
            this, component, {origin, transform});
        return this.addPositionedNetworkComponent(controller);
    }//placeNetworkComponent

    /**
     * Adds a new Network Component to the content of the drawing
     * @param controller A Network Component to add
     */
    public addPositionedNetworkComponent(controller: NetworkComponentController)
    {
        this.networkComponents[controller.component.id] = controller;
        this.componentsByName[controller.component.name] = controller.component.id;
        return this;
    }//addPositionedNetworkComponent
 
    /**
     * Links currently placed to the drawing
     */
     private readonly links = reactive<Record<string, Link>>({});

    /**
     * Adds a new Link to the content of the drawing
     * @param link A Link to add
     */
     public addLink(link: Link)
     {
         this.links[link.id] = link;
         return this;
     }//addLink
 

    /**
     * Loads a component class library from the raw XML data
     * @param dwgData Library data
     */
    public loadDrawing(dwgData: string): boolean
    {
        console.debug("Loading drawing...");
        // console.debug(dwgData);
        const parser = new DrawingParser(this);
        let wereErrors = false;
        for (const element of parser.parseXML(dwgData)) {
            //console.debug(element);
            if (element instanceof NetworkComponentController) {
                this.addPositionedNetworkComponent(element);
            } else if (element instanceof Link) {
                this.addLink(element);
            } else {
                console.error(`${element.message}\nSource: ${element.source}`);
                wereErrors = true;
            }//if
        }//for
        return !wereErrors;
    }//loadDrawing


    /**
     * Searches for the NetworkComponent with the specified ID
     * @param id An ID of the component to search for
     * @returns The component if found or "undefined" otherwise
     */
    public getComponentById(id: number)
    {
        return this.networkComponents[id].component;
    }//getComponentById


    /**
     * Searches for the NetworkComponent with the specified name
     * @param name A name of the component to search for
     * @returns The component if found or "undefined" otherwise
     */
    public getComponentByName(name: string)
    {
        const id = this.componentsByName[name];
        if (id === undefined)
            return undefined;
        return this.networkComponents[id].component;
    }//getComponentByName
 

    /**
     * Searches for the NetworkComponentController with the specified ID
     * @param id An ID of the component to search for
     * @returns The component controller if found or "undefined" otherwise
     */
    public getComponentControllerById(id: number)
    {
        return this.networkComponents[id];
    }//getComponentLoavtionById
  

    /** Returns the root SVG element */
    public get rootSVG(): SVGGraphicsElement
    {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.vueKresmer.rootSVG!;
    }//rootSVG


    /** Returns the whole drawing boundiing rectangle */
    public get drawingRect(): DOMRect
    {
        return this.rootSVG.getBoundingClientRect();
    }//drawingRect


    /**
     * Resets the mode (transform etc.) for all network component modes except the one specified
     */
    public resetAllComponentMode(except?: NetworkComponentController)
    {
        for (const id in this.networkComponents) {
            const controller = this.networkComponents[id];
            if (controller !== except)
                controller.resetMode();
        }//for
    }//resetAllComponentMode

    /** Deselects all components (probably except the one specified) */
    public deselectAllComponents(except?: NetworkComponentController)
    {
        for (const id in this.networkComponents) {
            const controller = this.networkComponents[id];
            if (controller !== except) {
                controller.component.isSelected = false;
            }//if
        }//for
    }//deselectAllComponents

    /** Deselects all links (probably except the one specified) */
    public deselectAllLinks(except?: NetworkLink)
    {
        for (const id in this.links) {
            const link = this.links[id];
            if (link !== except) {
                link.isSelected = false;
            }//if
        }//for
    }//deselectAllLinks

    /** Deselects all components (probably except the one specified) */
    public deselectAllElements(except?: NetworkComponentController|NetworkLink)
    {
        for (const id in this.networkComponents) {
            const controller = this.networkComponents[id];
            if (controller !== except) {
                controller.component.isSelected = false;
            }//if
        }//for
        for (const id in this.links) {
            const link = this.links[id];
            if (link !== except) {
                link.isSelected = false;
            }//if
        }//for
    }//deselectAllElements


    /**
     * Applies Client-to-Viewport transfotm matrix to the specified position
     * @param pos The position (x, y) to transform
     * @returns The transformed position
     */
    public applyScreenCTM(pos: Position) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const CTM = this.rootSVG.getScreenCTM()!;
        return {
          x: (pos.x - CTM.e) / CTM.a,
          y: (pos.y - CTM.f) / CTM.d
        };
    }//applyScreenCTM

}//Kresmer

/** Data type for Vue templates */
export type Template = Element | string;

/** General-purpose functions for using in component templates */
export const GeneralTemplateFunctions = {
    /** A dictionary for "global" values defined with $global function */
    $$: {},

    /**
     * 
     * @param name Defines a "global" value that may be accessed in any component template
     * @param value 
     */
    $global: function(name: string, value: unknown)
    {
        if (!(name in GeneralTemplateFunctions.$$))
            Object.defineProperty(GeneralTemplateFunctions.$$, name, {value});
    }//$global
}//GeneralTemplateFunctions
