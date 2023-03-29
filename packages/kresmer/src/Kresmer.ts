/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, createApp, InjectionKey, reactive, PropType, computed, ComputedRef, ref } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import KresmerEventHooks from "./KresmerEventHooks";
import KresmerVue from "./Kresmer.vue";
import LibraryLoader from "./loaders/LibraryLoader";
import DrawingLoader, {DrawingMergeOptions} from "./loaders/DrawingLoader";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { ComponentAddOp, ComponentDeleteOp, SelectionMoveOp } 
    from "./NetworkComponent/NetworkComponentController";
import { Position, Shift, Transform, TransformFunctons, ITransform } from "./Transform/Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import NetworkLinkClass from "./NetworkLink/NetworkLinkClass";
import TransformBoxVue from "./Transform/TransformBox.vue"
import NetworkComponentHolderVue from "./NetworkComponent/NetworkComponentHolder.vue";
import NetworkComponentAdapterVue from "./NetworkComponent/NetworkComponentAdapter.vue";
import ConnectionPointVue from "./ConnectionPoint/ConnectionPoint.vue";
import NetworkLink, { AddLinkOp, DeleteLinkOp } from "./NetworkLink/NetworkLink";
import KresmerException from "./KresmerException";
import UndoStack, { EditorOperation } from "./UndoStack";
import NetworkElement, { UpdateElementOp } from "./NetworkElement";
import NetworkLinkBlank from "./NetworkLink/NetworkLinkBlank";
import ConnectionPointProxy from "./ConnectionPoint/ConnectionPointProxy";
import { MapWithZOrder } from "./ZOrdering";
import BackendConnection from "./BackendConnection";


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
    static readonly ikKresmer = Symbol() as InjectionKey<Kresmer>;
    /** Global SVG Defs */
    public readonly defs: Template[] = [];
    /** CSS styles collected component libraries */
    public styles: PostCSSRoot[] = [];
    /** Drawing name */
    public drawingName = "?unnamed?";

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
    /** A symbolic key for the editability flag injection */
    static readonly ikIsEditable = Symbol() as InjectionKey<boolean>;
    /** The element Kresmer was mounted on */
    readonly mountPoint: HTMLElement;

    /** Kresmer-backend server connection (if any) */
    public backendConnection?: BackendConnection;
    /** 
     * Connects to the backend server
     * @param serverURL An URL of the backend server to connect to
     * @param password A password to use for the connection
     */
    public connectToBackend(serverURL: string, password: string)
    {
        this.backendConnection = new BackendConnection(serverURL, password);
    }//connectToBackend
    /** Disconnects from the backend server */
    public disconnectFromBackend()
    {
        this.backendConnection = undefined;
    }//disconnectFromBackend
    /** 
     * Tests a connection to the backend server using the specified URL and password
     * @param serverURL An URL of the backend server to connect to
     * @param password A password to use for the connection
     */
    public async testBackendConnection(serverURL: string, password: string)
    {
        return BackendConnection.testConnection(serverURL, password);
    }//testBackendConnection

    /** The stack for undoing editor operations */
    readonly undoStack = new UndoStack(this);
    public undo() {this.undoStack.undo()}
    public redo() {this.undoStack.redo()}

    /** Signals an application error */
    public raiseError(exception: KresmerException)
    {
        this.emit("error", exception);
    }//raiseError

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
                    <component :is="'${componentClass.vueName}'" v-bind="componentProps">
                        <template v-for="(_, slotName) in $slots" v-slot:[slotName]="{...props}">
                            <slot :name="slotName"/>
                        </template>
                    </component>
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
            this.styles.push(this.libraryLoader.scopeStyles(componentClass.style, componentClass));
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
            this.styles.push(this.libraryLoader.scopeStyles(linkClass.style, linkClass));
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


    private readonly libraryLoader = new LibraryLoader(this);

    /**
     * Loads a component class library from the raw XML data
     * @param libData Library data
     */
    public loadLibrary(libData: string): boolean
    {
        return this.libraryLoader.loadLibrary(libData);
    }//loadLibrary
 
    /**
     * Components currently placed to the drawing
     */
    public readonly networkComponents = reactive(new MapWithZOrder<number, NetworkComponentController>());
    public readonly componentsByName = new Map<string, number>();

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
                if (vertex.isConnected && vertex.anchor.conn?.hostElement === controller.component) {
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
     readonly linksByName = new Map<string, number>();

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


    private readonly drawingLoader = new DrawingLoader(this);

    /**
     * Loads a component class library from the raw XML data
     * @param dwgData Library data
     * @param mergeOptions Defines the way the loaded content should be merged with the existing one
     */
    public async loadDrawing(dwgData: string, mergeOptions?: DrawingMergeOptions): Promise<boolean>
    {
        return this.drawingLoader.loadDrawing(dwgData, mergeOptions);
    }//loadDrawing


    /** Serializes the drawing data to the string and returns this string */
    public saveDrawing()
    {
        return this.drawingLoader.saveDrawing();
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
     * Searches for the NetworkComponent or Link with the specified name.
     * If name starts with "-" then the link is searched, otherwise the component is searched.
     * @param name A name of the element to search for
     * @returns The element if found or "undefined" otherwise
     */
    public getElementByName(name: string)
    {
        if (name.startsWith("-"))
            return this.getLinkByName(name.slice(1));
        else
            return this.getComponentByName(name);
    }//getElementByName
 

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
        this.selectedElement = undefined;
    }//deselectAllElements


    /** Checks if more than one component is selected */
    public get muiltipleComponentsSelected() {
        if (!this._selectedElement)
            return false;
        
        let n = 0;
        for (const controller of this.networkComponents.values()) {
            if (controller.component.isSelected && ++n > 1) {
                return true;
            }//if
        }//for
        return false;
    }//muiltipleComponentsSelected


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


    /** 
     * Starts dragging the selected components following the leading one 
     * @param leader The controller of the component being dragged (directly)
     * @param operation The operation being performed
    */
    public _startSelectionDragging(leader: NetworkComponentController, operation: SelectionMoveOp)
    {
        for (const controller of operation.controllers) {
            if (controller.component.isSelected && controller !== leader) {
                controller._startDrag();
            }//if
        }//for
    }//_startSelectionDragging

    /** 
     * Performs a step of dragging the selected components following the leading one 
     * @param effectiveMove The effective (current) move of the leading component
     * @param leader The controller of the component being dragged (directly)
    */
    public _dragSelection(effectiveMove: Shift, leader: NetworkComponentController)
    {
        const operation = this.undoStack.currentOperation as SelectionMoveOp;
        for (const controller of operation.controllers) {
            if (controller.component.isSelected && controller !== leader) {
                controller.moveFromStartPos(effectiveMove);
            }//if
        }//for
    }//_dragSelection

    /** 
     * Finishes dragging the selected components following the leading one 
     * @param leader The controller of the component was being dragged (directly)
    */
    public _endSelectionDragging(leader: NetworkComponentController)
    {
        const operation = this.undoStack.currentOperation as SelectionMoveOp;
        for (const controller of operation.controllers) {
            if (controller.component.isSelected && controller !== leader) {
                this.emit("component-moved", controller);
            }//if
        }//for
        const oldPos = operation.oldPos[leader.component.id];
        const newPos = {...leader.origin};
        const effectiveMove = {x: newPos.x - oldPos.x, y: newPos.y - oldPos.y};
        for (const link of operation.links) {
            for (let i = 0; i < link.vertices.length; i++) {
                const vertex = link.vertices[i];
                if (!vertex.isConnected) {
                    const oldPos = vertex.coords;
                    vertex.pinUp({x: oldPos.x + effectiveMove.x, y: oldPos.y + effectiveMove.y});
                }//if
            }//for
        }//for
    }//_endSelectionDragging

    /** Editor API functions (externally available operations with the drawing objects) */
    readonly edAPI = {

        /** Updates drawing properties */
        updateDrawingProperties: (props: DrawingProps) =>
        {
            this.undoStack.execAndCommit(new UpdateDrawingPropsOp(this, props));
        },//updateDrawingProperties

        createComponent: (componentClass: NetworkComponentClass, position?: Position) =>
        {
            const newComponent = new NetworkComponent(this, componentClass);
            const origin = position ? this.applyScreenCTM(position) : 
                                      {x: this.logicalBox.width/2, y: this.logicalBox.height/2};
            const controller = new NetworkComponentController(this, newComponent, {origin});
            this.undoStack.execAndCommit(new ComponentAddOp(controller));
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
            controller.restoreZPosition();
            this.undoStack.execAndCommit(new ComponentDeleteOp(controller));
        },//deleteComponent

        /**
         * Starts link creation pulling in from the specified connection point
         * @param linkClass A class of the new link
         * @param fromElementID A component from which the link is started
         * @param fromConnectionPointName A connection point from which the link is started
         */
        startLinkCreation: (linkClass: NetworkLinkClass, fromElementID: number, 
                            fromConnectionPointName: string|number) =>
        {
            const fromComponent = this.getComponentById(fromElementID) ?? this.getLinkById(fromElementID);
            if (!fromComponent) {
                console.error(`Trying to create a link from non-existing component (id=${fromElementID})!`);
                return;
            }//if
            const fromConnectionPoint = fromComponent.getConnectionPoint(fromConnectionPointName);
            if (!fromConnectionPoint) {
                console.error(`Trying to create a link from non-existing connection point (${fromElementID}:${fromConnectionPointName})!`);
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
                        newName: string|undefined,
                        newDbID: number|string|undefined,
                        ) =>
        {
            const newPropsObj = Object.fromEntries(newProps.map(prop => [prop.name, prop.value]));
            const newData = {props: newPropsObj, name: newName, dbID: newDbID};
            this.undoStack.execAndCommit(new UpdateElementOp(element, newData));
        },//updateElement

    }//edAPI
}//Kresmer


export type DrawingProps = {
    /** The drawing name */
    name?: string|undefined;
    /** The drawing logical width */
    logicalWidth?: number|undefined;
    /** The drawing logical height */
    logicalHeight?: number|undefined;
}//DrawingProps


class UpdateDrawingPropsOp extends EditorOperation
{
    constructor(private readonly kresmer: Kresmer, private readonly newProps: DrawingProps)
    {
        super();
        this.oldProps = {
            name: kresmer.drawingName,
            logicalWidth: kresmer.logicalWidth,
            logicalHeight: kresmer.logicalHeight
        }//oldProps
    }//ctor

    private readonly oldProps: Required<DrawingProps>;

    override exec(): void
    {
        this.newProps.name && (this.kresmer.drawingName = this.newProps.name);
        this.newProps.logicalWidth && (this.kresmer.logicalWidth = this.newProps.logicalWidth);
        this.newProps.logicalHeight && (this.kresmer.logicalHeight = this.newProps.logicalHeight);
    }//exec

    override undo(): void
    {
        this.oldProps.name != this.kresmer.drawingName && (this.kresmer.drawingName = this.oldProps.name);
        this.oldProps.logicalWidth != this.kresmer.logicalWidth && 
            (this.kresmer.logicalBox.width = this.oldProps.logicalWidth);
        this.oldProps.logicalHeight != this.kresmer.logicalHeight && 
            (this.kresmer.logicalBox.height = this.oldProps.logicalHeight);
    }//undo
}//UpdateDrawingPropsOp


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


// Re-export child classes to API
export {default as NetworkElement } from "./NetworkElement";
export type {NetworkElementData} from "./NetworkElement";
export {default as NetworkComponent} from "./NetworkComponent/NetworkComponent";
export {default as NetworkComponentClass} from "./NetworkComponent/NetworkComponentClass";
export {default as NetworkComponentController, type TransformMode} from "./NetworkComponent/NetworkComponentController";
export type { Position } from "./Transform/Transform";
export {default as NetworkLink} from "./NetworkLink/NetworkLink";
export {default as NetworkLinkClass} from "./NetworkLink/NetworkLinkClass";
export {default as LinkVertex} from "./NetworkLink/LinkVertex";
export {default as KresmerException} from "./KresmerException";
export {default as KresmerParsingException} from "./loaders/ParsingException";
export {default as ConnectionPointProxy} from "./ConnectionPoint/ConnectionPointProxy";
export type {DrawingMergeOptions} from "./loaders/DrawingLoader";
    