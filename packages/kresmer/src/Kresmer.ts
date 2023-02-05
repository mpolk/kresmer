/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, createApp, InjectionKey, reactive, PropType, computed, ComputedRef, ref } from "vue";
import {Root as PostCSSRoot, Rule as PostCSSRule} from 'postcss';
import KresmerEventHooks from "./KresmerEventHooks";
import KresmerVue from "./Kresmer.vue";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { ComponentDeleteOp } from "./NetworkComponent/NetworkComponentController";
import { Position, Transform, TransformFunctons, ITransform } from "./Transform/Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import NetworkLinkClass from "./NetworkLink/NetworkLinkClass";
import LibraryParser, { DefsLibNode, StyleLibNode } from "./parsers/LibraryParser";
import DrawingParser, { DrawingProperties } from "./parsers/DrawingParser";
import TransformBoxVue from "./Transform/TransformBox.vue"
import NetworkComponentHolderVue from "./NetworkComponent/NetworkComponentHolder.vue";
import NetworkComponentAdapterVue from "./NetworkComponent/NetworkComponentAdapter.vue";
import ConnectionPointVue from "./ConnectionPoint/ConnectionPoint.vue";
import NetworkLink, { AddLinkOp, DeleteLinkOp } from "./NetworkLink/NetworkLink";
import KresmerException from "./KresmerException";
import UndoStack from "./UndoStack";
import NetworkElement, { UpdateElementOp } from "./NetworkElement";
import NetworkLinkBlank from "./NetworkLink/NetworkLinkBlank";
import ConnectionPointProxy from "./ConnectionPoint/ConnectionPointProxy";
import NetworkElementClass from "./NetworkElementClass";
import { MapWithZOrder } from "./ZOrdering";


/**
 * The main class implementing the most of the Kresmer public API
 * Also acts as a proxy for the Kresmer's root vue-component
 */
export default class Kresmer extends KresmerEventHooks {

    constructor(mountPoint: string|HTMLElement, options?: {
        mountingWidth?: number | string,
        mountingHeight?: number | string,
        logicalWidth?: number,
        logicalHeight?: number,
        isEditable?: boolean,
    }) {
        super();
        this.mountPoint = typeof mountPoint === "string" ? document.querySelector(mountPoint)! : mountPoint;
        options?.mountingWidth && (this.mountingBox.width = options.mountingWidth);
        options?.mountingHeight && (this.mountingBox.height = options.mountingHeight);
        options?.logicalWidth && (this.logicalBox.width = options.logicalWidth);
        options?.logicalHeight && (this.logicalBox.height = options.logicalHeight);
        options?.isEditable !== undefined && (this.isEditable = options.isEditable);
            
        this.appKresmer = createApp(KresmerVue, {
            controller: this,
            networkComponents: this.networkComponents,
            networkComponentClasses: this.registeredComponentClasses,
            links: this.links,
            linkClasses: this.registeredLinkClasses,
            mountingBox: this.mountingBox,
            logicalBox: this.logicalBox,
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


    /** Kresmer's vue-component Application */
    readonly appKresmer: App;
    /** Kresmer's vue-component instance itself */
    private readonly vueKresmer: InstanceType<typeof KresmerVue>;
    /** A symbolic key for the Kresmer instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Kresmer>;
    /** Global SVG Defs */
    public readonly defs: Template[] = [];
    /** CSS styles collected component libraries */
    public styles: PostCSSRoot[] = [];
    /** Drawing name */
    public drawingName?: string;

    // Drawing geometry parameters
    /** Sets the drawing width within the browser client area */
    readonly mountingBox: {width: number|string, height: number|string} = reactive({width: "100%", height: "100%"});
    get mountingWidth() {return this.mountingBox.width}
    set mountingWidth(newWidth) {this.mountingBox.width = newWidth}
    get mountingHeight() {return this.mountingBox.height}
    set mountingHeight(newHeight) {this.mountingBox.height = newHeight}

    /** Sets the drawing area dimensions in SVG logical units 
     * (component sizes are measuring relative to this sizes) */
    readonly logicalBox = reactive({width: 1000, height: 1000});
    get logicalWidth() {return this.logicalBox.width}
    set logicalWidth(newWidth) {this.logicalBox.width = newWidth}
    get logicalHeight() {return this.logicalBox.height}
    set logicalHeight(newHeight) {this.logicalBox.height = newHeight}

    /** Drawing scale (visual) */
    private _drawingScale = ref(1);
    get drawingScale() {return this._drawingScale.value}
    set drawingScale(newScale) {
        this._drawingScale.value = newScale;
        this.emit("drawing-scale", this._drawingScale.value);
    }
    changeScale(factor?: number)
    {
        if (factor) {
            this.drawingScale *= factor;
        } else {
            this.drawingScale = 1;
        }//if
    }//changeScale

    /** Determines whether the drawing is editable */
    isEditable = true;
    /** The element Kresmer was mounted on */
    readonly mountPoint: HTMLElement;

    /** The stack for undoing editor operations */
    readonly undoStack = new UndoStack(this);
    public undo() {this.undoStack.undo()}
    public redo() {this.undoStack.redo()}

    /** Shows whether the content was modified comparing to the last data loading */
    public get isDirty()
    {
        return this.undoStack.isDirty;
    }//get isDirty

    public set isDirty(newValue)
    {
        this.undoStack.isDirty = newValue;
    }//set isDirty

    /** Shows whether the drawing has no content  */
    public get isEmpty()
    {
        return !this.links.size && 
               !Array.from(this.networkComponents)
                     .filter(([, controller]) => !controller.component.isAutoInstantiated)
                     .length;
    }//get isEmpty

    /** Forces update on the underlying Vue-component */
    public forceUpdate()
    {
        this.vueKresmer.$forceUpdate();
    }//forceUpdate

    /** A list of all Component Classes, registered by Kresmer */
    protected readonly registeredComponentClasses = new Map<string, NetworkComponentClass>();
    /** Returns a list of all Component Classes, registered by Kresmer */
    public getRegisteredComponentClasses() {return this.registeredComponentClasses.entries()}

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
                    const prop = {...props};
                    for (const key of ["x", "y", "transform", "transformOrigin"]) {
                        delete prop[key];
                    }//for
                    return prop;
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
            this.styles.push(this.scopeStyles(componentClass.style, componentClass));
        }//if

        this.registeredComponentClasses.set(componentClass.name, componentClass);

        // automatically create a single component instance if required
        if (componentClass.autoInstanciate) {
            const component = new NetworkComponent(this, componentClass.name, 
                                                   {isAutoInstantiated: true});
            this.placeNetworkComponent(component, {x: 0, y: 0});
        }//if
        return this;
    }//registerNetworkComponentClass

    /**
     * Register a Link Class in Kresmer
     * @param linkClass A class to register
     * @returns Kresmer itself
     */
    public registerLinkClass(linkClass: NetworkLinkClass)
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
            this.styles.push(this.scopeStyles(linkClass.style, linkClass));
        }//if

        this.registeredLinkClasses.set(linkClass.name, linkClass);
        return this;
    }//registerLinkClass

    /**
     * A list of all Link Classes, registered by Kresmer
     */
    protected readonly registeredLinkClasses = new Map<string, NetworkLinkClass>();
    /** Returns a list of all Link Classes, registered by Kresmer */
    public getRegisteredLinkClasses() {
        return this.registeredLinkClasses.entries();
    }//getRegisteredLinkClasses


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
            } else if (element instanceof NetworkLinkClass) {
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
     * @param classScope An element class to apply as a scope
     * @returns Modified AST
     */
    private scopeStyles(ast: PostCSSRoot, classScope?: NetworkElementClass)
    {
        const ast1 = ast.clone();

        ast1.walkRules((rule: PostCSSRule) => {
            const additionalScopes: string[] = [];
            let scope = ".kresmer";
            if (classScope) {
                scope += ` .${classScope.name}`;
                classScope.baseClasses?.forEach(baseClass => {
                    additionalScopes.push(`${scope} .${baseClass.name}`);
                });
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
 
    /**
     * Components currently placed to the drawing
     */
    private readonly networkComponents = reactive(new MapWithZOrder<number, NetworkComponentController>());
    private readonly componentsByName = new Map<string, number>();

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
        this.networkComponents.add(controller);
        this.componentsByName.set(controller.component.name, controller.component.id);
        return this;
    }//addPositionedNetworkComponent

    /**
     * Deletes the specified component from the drawing
     * @param controller The controller of the component to delete
     */
    public deleteComponent(controller: NetworkComponentController)
    {
        this.links.forEach(link => {
            link.vertices.forEach(vertex => {
                if (vertex.isConnected && vertex.anchor.conn?.component === controller.component) {
                    vertex.detach();
                }//if
            })//vertices
        })//links

        this.componentsByName.delete(controller.component.name);
        this.networkComponents.delete(controller.component.id);
        this.emit("component-deleted", controller);
    }//deleteComponent
 
    /**
     * Links currently placed to the drawing
     */
     readonly links = reactive(new MapWithZOrder<number, NetworkLink>());
     protected readonly linksByName = new Map<string, number>();

    /**
     * Adds a new Link to the drawing
     * @param link A Link to add
     */
     public addLink(link: NetworkLink)
     {
        this.links.add(link);
        this.linksByName.set(link.name, link.id);
        this.emit("link-added", link);
        return this;
     }//addLink

    /**
     * Deletes a Link from the content of the drawing
     * @param link A Link to delete
     */
    public deleteLink(link: NetworkLink)
    {
        this.links.delete(link.id);
        this.linksByName.delete(link.name);
        this.emit("link-deleted", link);
        return this;
    }//deleteLink


    /**
     * Loads a component class library from the raw XML data
     * @param dwgData Library data
     * @param mergeOptions Defines the way the loaded content should be merged with the existing one
     */
    public loadDrawing(dwgData: string, mergeOptions?: DrawingMergeOptions): boolean
    {
        console.debug("Loading drawing...");
        // console.debug(dwgData);
        if (mergeOptions === "erase-previous-content") {
            this.eraseContent();
        }//if

        let drawingProperties!: DrawingProperties;
        const componentRenames = new Map<string, string>();

        const parser = new DrawingParser(this);
        let wereErrors = false;
        for (const element of parser.parseXML(dwgData)) {
            //console.debug(element);
            if (element instanceof DrawingProperties) {
                drawingProperties = element;
            } else if (element instanceof NetworkComponentController) {
                const componentName = element.component.name;
                if (this.componentsByName.has(componentName)) {
                    switch (mergeOptions) {
                        case "merge-duplicates": {
                            const id = this.componentsByName.get(componentName)!;
                            this.networkComponents.delete(id);
                            break;
                        }
                        case "rename-duplicates":
                            for (let i = 1; i <= Number.MAX_SAFE_INTEGER; i++) {
                                const newName = `${componentName}.${i}`;
                                if (!(newName in this.componentsByName)) {
                                    componentRenames.set(componentName, newName);
                                    element.component.name = newName;
                                    break;
                                }//if
                            }//for
                            break;
                    }//switch
                }//if
                this.addPositionedNetworkComponent(element);
            } else if (element instanceof NetworkLink) {
                for (const vertex of element.vertices) {
                    const componentName = vertex.initParams?.conn?.component;
                    if (componentName && componentRenames.has(componentName)) {
                        vertex.initParams!.conn!.component = componentRenames.get(componentName)!;
                    }//if
                }//for

                const linkName = element.name;
                if (this.linksByName.has(linkName)) {
                    switch (mergeOptions) {
                        case "merge-duplicates": {
                            const id = this.linksByName.get(linkName)!;
                            this.links.delete(id);
                            break;
                        }
                        case "rename-duplicates":
                            for (let i = 1; i <= Number.MAX_SAFE_INTEGER; i++) {
                                const newName = `${linkName}.${i}`;
                                if (!(newName in this.linksByName)) {
                                    element.name = newName;
                                    break;
                                }//if
                            }//for
                            break;
                    }//switch
                }//if
                this.addLink(element);
            } else {
                console.error(`${element.message}\nSource: ${element.source}`);
                wereErrors = true;
            }//if
        }//for

        this.undoStack.reset();
        switch (mergeOptions) {
            case undefined: case "erase-previous-content":
                this.drawingName = drawingProperties.name;
                drawingProperties.width && (this.logicalBox.width = drawingProperties.width);
                drawingProperties.height && (this.logicalBox.height = drawingProperties.height);
                this.isDirty = false;
                break;
            default:
                if (!this.drawingName) {
                    this.drawingName = drawingProperties.name;
                }//if
                this.isDirty = true;
        }//switch

        return !wereErrors;
    }//loadDrawing


    /** Serializes the drawing data to the string and returns this string */
    public saveDrawing()
    {
        let xml = `\
<?xml version="1.0" encoding="utf-8"?>
<?xml-model href="xsd/kresmer-drawing.xsd"?>
<kresmer-drawing name="${this.drawingName}" width="${this.logicalBox.width}" height="${this.logicalBox.height}">
`;

        for (const controller of this.networkComponents.values()) {
            if (!controller.component.isAutoInstantiated) {
                xml += controller.toXML(1) + "\n\n";
            }//for
        }//for

        for (const link of this.links.values()) {
            xml += link.toXML(1) + "\n\n";
        }//for

        xml += "</kresmer-drawing>\n"
        this.isDirty = false;
        return xml;
    }//saveDrawing


    /** Erases everything that is in the drawing now */
    public eraseContent()
    {
        this.undoStack.reset();
        this.linksByName.clear();
        this.links.clear();
        this.networkComponents.forEach((controller, id) => {
            if (!controller.component.isAutoInstantiated) {
                this.networkComponents.delete(id);
            }//if
        });
        this.componentsByName.forEach((id, name) => {
            if (!this.networkComponents.has(id)) {
                this.componentsByName.delete(name);
            }//if
        });
    }//eraseContent


    /**
     * Searches for the NetworkComponent with the specified ID
     * @param id An ID of the component to search for
     * @returns The component if found or "undefined" otherwise
     */
    public getComponentById(id: number)
    {
        return this.networkComponents.get(id)?.component;
    }//getComponentById


    /**
     * Searches for the NetworkComponent with the specified name
     * @param name A name of the component to search for
     * @returns The component if found or "undefined" otherwise
     */
    public getComponentByName(name: string)
    {
        const id = this.componentsByName.get(name);
        if (id === undefined)
            return undefined;
        return this.networkComponents.get(id)?.component;
    }//getComponentByName


    /**
     * Searches for the NetworkLink with the specified ID
     * @param id An ID of the link to search for
     * @returns The link if found or "undefined" otherwise
     */
    public getLinkById(id: number)
    {
        return this.links.get(id);
    }//getLinkById


    /**
     * Searches for the NetworkLink with the specified name
     * @param name A name of the link to search for
     * @returns The link if found or "undefined" otherwise
     */
    public getLinkByName(name: string)
    {
        const id = this.linksByName.get(name);
        if (id === undefined)
            return undefined;
        return this.links.get(id);
    }//getLinkByName
 

    /**
     * Searches for the NetworkComponentController with the specified ID
     * @param id An ID of the component to search for
     * @returns The component controller if found or "undefined" otherwise
     */
    public getComponentControllerById(id: number)
    {
        return this.networkComponents.get(id);
    }//getComponentLoavtionById
  

    /** Returns the root SVG element */
    public get rootSVG(): SVGSVGElement
    {
        return this.vueKresmer.rootSVG!;
    }//rootSVG


    /** Returns the whole drawing bounding rectangle */
    public get drawingRect(): DOMRect
    {
        return this.rootSVG.getBoundingClientRect();
    }//drawingRect


    /**
     * Resets the mode (transform etc.) for all network component modes except the one specified
     */
    public resetAllComponentMode(except?: NetworkComponentController)
    {
        for (const controller of this.networkComponents.values()) {
            if (controller !== except)
                controller.resetMode();
        }//for
    }//resetAllComponentMode


    /** Currently selected network element */
    private _selectedElement?: NetworkElement;
    public get selectedElement() {return this._selectedElement}
    public set selectedElement(newSelectedElement: NetworkElement | undefined) 
    {
        if (newSelectedElement === this._selectedElement) {
            return;
        }//if

        if (newSelectedElement) {
            if (newSelectedElement instanceof NetworkComponent) {
                this.emit("component-selected", newSelectedElement, true);
            } else if (newSelectedElement instanceof NetworkLink) {
                this.emit("link-selected", newSelectedElement, true);
            }//if
        } else {
            if (this._selectedElement instanceof NetworkComponent) {
                this.emit("component-selected", this._selectedElement, false);
            } else if (this._selectedElement instanceof NetworkLink) {
                this.emit("link-selected", this._selectedElement, false);
            }//if
        }//if

        this._selectedElement = newSelectedElement;
    }//set selectedElement


    /** Deselects all components (probably except the one specified) */
    public deselectAllElements(except?: NetworkComponentController | NetworkLink | NetworkLinkBlank)
    {
        this.networkComponents.forEach(controller => {
            (controller !== except) && (controller.component.isSelected = false);
        });
        this.links.forEach(link => {
            (link !== except) && (link.isSelected = false);
        });

        if (!(except instanceof NetworkLinkBlank)) {
            this._abortLinkCreation();
        }//if
    }//deselectAllElements


    /**
     * Applies Client-to-Viewport transfotm matrix to the specified position
     * @param pos The position (x, y) to transform
     * @returns The transformed position
     */
    public applyScreenCTM(pos: Position) {
        const CTM = this.rootSVG.getScreenCTM()!;
        return {
          x: (pos.x - CTM.e) / CTM.a,
          y: (pos.y - CTM.f) / CTM.d
        };
    }//applyScreenCTM

    // For internal use: reacts on some network element rename refreshing corresponding map
    public _onElementRename(element: NetworkElement, oldName: string)
    {
        if (element.name != oldName) {
            if (element instanceof NetworkComponent) {
                this.componentsByName.delete(oldName);
                this.componentsByName.set(element.name, element.id);
            } else if (element instanceof NetworkLink) {
                this.linksByName.delete(oldName);
                this.linksByName.set(element.name, element.id);
            }//if
        }//if
    }//onElementRename

    /** A blank for a new link creation */
    public newLinkBlank?: NetworkLinkBlank;

    /**
     * Completes the new link creation (for private use only)
     * @param toConnectionPoint The connection point, which will be the end of the new link
     */
    public _completeLinkCreation(toConnectionPoint?: ConnectionPointProxy)
    {
        const to = toConnectionPoint ? 
            {connectionPoint: toConnectionPoint} :
            {pos: {...this.newLinkBlank!.end}};
        const newLink = new NetworkLink(this, this.newLinkBlank!._class,
            {from: {connectionPoint: this.newLinkBlank!.start}, to});
        newLink.initVertices();
        this.undoStack.execAndCommit(new AddLinkOp(newLink));
        this.newLinkBlank = undefined;
        this.vueKresmer.$forceUpdate();
    }//_completeLinkCreation


    /**
     * Aborts the new link creation (for private use only)
     */
    public _abortLinkCreation()
    {
        if (this.newLinkBlank) {
            this.newLinkBlank = undefined;
            this.vueKresmer.$forceUpdate();
        }//if
    }//_abortLinkCreation


    /** Editor API functions (externally available operations with the drawing objects) */
    readonly edAPI = {

        createComponent: (componentClass: NetworkComponentClass, position?: Position) =>
        {
            const newComponent = new NetworkComponent(this, componentClass);
            const origin = position ? this.applyScreenCTM(position) : 
                                      {x: this.logicalBox.width/2, y: this.logicalBox.height/2};
            this.placeNetworkComponent(newComponent, origin);
        },//createComponent

        /**
         * Deletes the specified component from the drawing using an undoable editor operation
         * @param componentID The ID of the component to delete
         */
        deleteComponent: (componentID: number) =>
        {
            const controller = this.networkComponents.get(componentID);
            if (!controller) {
                throw new KresmerException(`Attempt to delete non-existent component (id=${componentID})`);
            }//if
            controller.component.isSelected = false;
            controller.restoreComponentZPosition();
            this.undoStack.execAndCommit(new ComponentDeleteOp(controller));
        },//deleteComponent

        /**
         * Starts link creation pulling in from the specified connection point
         * @param linkClass A class of the new link
         * @param fromComponentID A component from which the link is started
         * @param fromConnectionPointName A connection point from which the link is started
         */
        startLinkCreation: (linkClass: NetworkLinkClass, fromComponentID: number, 
                            fromConnectionPointName: string|number) =>
        {
            const fromComponent = this.getComponentById(fromComponentID);
            if (!fromComponent) {
                console.error(`Trying to create a link from non-existing component (id=${fromComponentID})!`);
                return;
            }//if
            const fromConnectionPoint = fromComponent.connectionPoints[fromConnectionPointName];
            if (!fromConnectionPoint) {
                console.error(`Trying to create a link from non-existing connection point (${fromComponentID}:${fromConnectionPointName})!`);
                return;
            }//if
            this.newLinkBlank = new NetworkLinkBlank(this, linkClass, fromConnectionPoint);
            this.vueKresmer.$forceUpdate();
        },//startLinkCreation

        /**
         * Deletes a Link using an undoable editor operation
         * @param linkID A an ID of the Link to delete
         */
        deleteLink: (linkID: number) =>
        {
            const link = this.getLinkById(linkID);
            if (!link) {
                console.error(`Attempt to delete non-existent link (id=${linkID})`);
                return;
            }//if
            link.isSelected = false;
            link.restoreZPosition();
            this.undoStack.execAndCommit(new DeleteLinkOp(link));
        },//deleteLink

        /**
         * Adds a link vertex
         * @param linkID The link this vertexs belongs
         * @param segmentNumber The seq number of the segment where tne vertex should be added
         * @param mousePos The mouse click position
         * @returns True if the vertex was added or false otherwise
         */
        addLinkVertex: (linkID: number, segmentNumber: number, mousePos: Position) =>
        {
            const link = this.getLinkById(linkID);
            if (!link) {
                throw new KresmerException(`Attempt to add a vertex to the non-existent link (id=${linkID})`);
            }//if
            const vertex = link.addVertex(segmentNumber, mousePos);
            this.emit("link-vertex-added", vertex);
            return vertex;
        },//addLinkVertex

        /**
         * Aligns (or at least tries to) a link vertex to its neighbours
         * @param linkID The link this vertexs belongs
         * @param vertexNumber The seq number of the vertex to align
         * @returns True if the vertex was aligned or false otherwise
         */
        alignLinkVertex: (linkID: number, vertexNumber: number) =>
        {
            const link = this.getLinkById(linkID);
            if (!link) {
                throw new KresmerException(`Attempt to aling a vertex of the non-existent link (id=${linkID})`);
            }//if
            const vertex = link.alignVertex(vertexNumber);
            if (vertex) {
                this.emit("link-vertex-moved", vertex);
            }//if
            return vertex;
        },//alignLinkVertex

        /**
         * Deletes a link vertex
         * @param linkID The link this vertexs belongs
         * @param vertexNumber The seq number of the vertex to delete
         * @returns True if the vertex was deleted or false otherwise
         */
        deleteLinkVertex: (linkID: number, vertexNumber: number) =>
        {
            const link = this.getLinkById(linkID);
            if (!link) {
                throw new KresmerException(`Attempt to delete a vertex from the non-existent link (id=${linkID})`);
            }//if
            const vertex = link.deleteVertex(vertexNumber);
            if (vertex) {
                this.emit("link-vertex-deleted", vertex);
            }//if
            return vertex;
        },//deleteLinkVertex

        /**
         * 
         * @param element Update the specified network element props and name (if required)
         * @param newProps The new prop values
         * @param newName The new element name
         */
        updateElement: (element: NetworkElement, 
                        newProps: {name: string, value: unknown}[], 
                        newName?: string) =>
        {
            const newPropsObj = Object.fromEntries(newProps.map(prop => [prop.name, prop.value]));
            this.undoStack.execAndCommit(new UpdateElementOp(element, newPropsObj, newName));
        },//updateElement

    }//edAPI
}//Kresmer


/** Data type for Vue templates */
export type Template = Element | string;

/** General-purpose functions for using in component templates */
export const GeneralTemplateFunctions = {
    /** A dictionary for "global" values defined with $global function */
    $$: {},

    /**
     * Defines a "global" value that may be accessed in any component template
     * @param name The name for this global
     * @param value The value itself
     */
    $global: function(name: string, value: unknown)
    {
        if (!(name in GeneralTemplateFunctions.$$)) {
            Object.defineProperty(GeneralTemplateFunctions.$$, name, {value});
        }//if
    }//$global
}//GeneralTemplateFunctions

/** The options to perform drawing merge upon its loading */
export type DrawingMergeOptions = 
    "erase-previous-content" | 
    "merge-duplicates" |
    "rename-duplicates" |
    "ignore-duplicates";


// Re-export child classes to API
export {default as NetworkElement} from "./NetworkElement";
export {default as NetworkComponent} from "./NetworkComponent/NetworkComponent";
export {default as NetworkComponentClass} from "./NetworkComponent/NetworkComponentClass";
export {default as NetworkComponentController, type TransformMode} from "./NetworkComponent/NetworkComponentController";
export type { Position } from "./Transform/Transform";
export {default as NetworkLink} from "./NetworkLink/NetworkLink";
export {default as NetworkLinkClass} from "./NetworkLink/NetworkLinkClass";
export {default as LinkVertex} from "./NetworkLink/LinkVertex";
export {default as ParsingException} from "./parsers/ParsingException";
export {default as ConnectionPointProxy} from "./ConnectionPoint/ConnectionPointProxy";
    