/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, createApp, InjectionKey, reactive, PropType, computed, ComputedRef, ref, nextTick, Prop } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import KresmerEventHooks from "./KresmerEventHooks";
import KresmerVue from "./Kresmer.vue";
import LibraryLoader from "./loaders/LibraryLoader";
import DrawingLoader, {DrawingMergeOptions} from "./loaders/DrawingLoader";
import NetworkComponent, {ChangeComponentClassOp, NetworkComponentFunctions} from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { ComponentAddOp, ComponentDeleteOp, ComponentMoveUpOp, ComponentMoveToTopOp, 
    ComponentMoveDownOp, ComponentMoveToBottomOp, SelectionMoveOp } from "./NetworkComponent/NetworkComponentController";
import { Position, Shift, Transform, TransformFunctons, ITransform } from "./Transform/Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import NetworkLinkClass, { LinkBundleClass } from "./NetworkLink/NetworkLinkClass";
import TransformBoxVue from "./Transform/TransformBox.vue"
import NetworkComponentHolderVue from "./NetworkComponent/NetworkComponentHolder.vue";
import NetworkComponentAdapterVue from "./NetworkComponent/NetworkComponentAdapter.vue";
import ConnectionPointVue from "./ConnectionPoint/ConnectionPoint.vue";
import NetworkLink, { AddLinkOp, ChangeLinkClassOp, DeleteLinkOp, DeleteVertexOp, LinkSpec, NetworkLinkMap } from "./NetworkLink/NetworkLink";
import KresmerException, { DuplicateAreaClassException, UndefinedLinkException, UndefinedVertexException } from "./KresmerException";
import UndoStack, { EditorOperation } from "./UndoStack";
import DrawingElement, { UpdateElementOp } from "./DrawingElement/DrawingElement";
import NetworkLinkBlank from "./NetworkLink/NetworkLinkBlank";
import ConnectionPoint from "./ConnectionPoint/ConnectionPoint";
import { MapWithZOrder } from "./ZOrdering";
import BackendConnection, { BackendConnectionTestResult } from "./BackendConnection";
import LinkBundle, { CreateBundleOp } from "./NetworkLink/LinkBundle";
import LinkVertex, { LinkVertexInitParams, LinkVertexSpec } from "./NetworkLink/LinkVertex";
import Vertex, { VertexSpec, VertexAlignmentMode, VertexMoveOp, VerticesMoveOp } from "./Vertex/Vertex";
import DrawingElementWithVertices from "./DrawingElement/DrawingElementWithVertices";
import { clone } from "./Utils";
import AdjustmentRulerVue from "./AdjustmentHandles/AdjustmentRuler.vue";
import { BackgroundImageData } from "./BackgroundImageData";
import DrawingArea, { DrawingAreaMap } from "./DrawingArea/DrawingArea";
import DrawingAreaClass from "DrawingArea/DrawingAreaClass";


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
        backgroundImage?: BackgroundImageData,
        backgroundColor?: string,
        isEditable?: boolean,
        showRulers?: boolean,
        showGrid?: boolean,
        snapToGrid?: boolean,
        snappingGranularity?: number,
        saveDynamicPropValuesWithDrawing?: boolean,
        autoAlignVertices?: boolean,
        animateComponentDragging?: boolean,
        animateLinkBundleDragging?: boolean,
        hrefBase?: string,
        streetAddressFormat?: StreetAddressFormat,
    }) {
        super();
        this.mountPoint = typeof mountPoint === "string" ? document.querySelector(mountPoint)! : mountPoint;
        options?.mountingWidth && (this.mountingBox.width = options.mountingWidth);
        options?.mountingHeight && (this.mountingBox.height = options.mountingHeight);
        options?.logicalWidth && (this.logicalBox.width = options.logicalWidth);
        options?.logicalHeight && (this.logicalBox.height = options.logicalHeight);
        options?.isEditable !== undefined && (this.isEditable = options.isEditable);
        this.showRulers = Boolean(options?.showRulers);
        this.showGrid = Boolean(options?.showGrid);
        this.snapToGrid = options?.snapToGrid ?? true;
        options?.snappingGranularity && (this.snappingGranularity = options.snappingGranularity);
        this.saveDynamicPropValuesWithDrawing = Boolean(options?.saveDynamicPropValuesWithDrawing);
        this.autoAlignVertices = options?.autoAlignVertices ?? true;
        this.animateComponentDragging = Boolean(options?.animateComponentDragging);
        this.animateLinkBundleDragging = Boolean(options?.animateLinkBundleDragging);
        options?.hrefBase && (this.hrefBase.value = options.hrefBase);
        options?.streetAddressFormat && (this.streetAddressFormat = options.streetAddressFormat);
        options?.backgroundImage && (this.backgroundImage.copy(options.backgroundImage));
        options?.backgroundColor && (this.backgroundColor = options.backgroundColor);
            
        this.appKresmer = createApp(KresmerVue, {
            controller: this,
        });

        // register the components used to construct the drawing
        this.appKresmer
            .component("TransformBox", TransformBoxVue)
            .component("NetworkComponentHolder", NetworkComponentHolderVue)
            .component("NetworkComponentAdapter", NetworkComponentAdapterVue)
            .component("ConnectionPoint", ConnectionPointVue)
            .component("AdjustmentRuler", AdjustmentRulerVue)
            ;
        // register the functions that can be used in templates
        const templateFunctions = {
            ...GeneralTemplateFunctions, 
            ...TransformFunctons,
            ...NetworkComponentFunctions,
            $streetAddress: this.streetAddress,
            $openURL: this.openURL,
            $href: this.makeHref,
        }//templateFunctions
        this.appKresmer.config.globalProperties = templateFunctions;
        // also make them available from computed props
        for (const funcName in templateFunctions) {
            if (!(funcName in window))
                Object.defineProperty(window, funcName, {value: templateFunctions[funcName as keyof typeof templateFunctions]});
        }//for

        // at last mount the main vue
        this.vueKresmer = this.appKresmer.mount(mountPoint) as InstanceType<typeof KresmerVue>;
        // and somehow awake its scaling mechanism (workaround for something beyond understanding)
        this.zoomFactor = 1;
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
    public styles: PostCSSRoot[] = reactive([]);

    /** Drawing name */
    public drawingName = UNNAMED_DRAWING;
    /** Should the drawing border rulers be shown? */
    get showRulers() {return this._showRulers.value}
    set showRulers(show: boolean) {this._showRulers.value = show}
    protected _showRulers = ref(false);
    /** Should the drawing grid be shown? */
    get showGrid() {return this._showGrid.value}
    set showGrid(show: boolean) {this._showGrid.value = show}
    protected _showGrid = ref(false);
    /** Should vertex alignment be performed automatically after vertex moving */
    autoAlignVertices = true;
    /** Specifies whether component dragging should be animated */
    animateComponentDragging = false;
    /** Specifies whether link bundle dragging should be animated */
    animateLinkBundleDragging = false;

    /** Specifies the street address representation format */
    streetAddressFormat = StreetAddressFormat.StreetFirst;
    /** Makes the street address from the street name and the building number according to globally selected format */
    readonly streetAddress = (addrElems: {street?: string, buildingNumber?: string}) =>
    {
        if (!addrElems.buildingNumber)
            return addrElems.street;
        if (!addrElems.street)
            return addrElems.buildingNumber;
        
        return this.streetAddressFormat
            .replace("{street}", addrElems.street)
            .replace("{building-number}", addrElems.buildingNumber);
    }//streetAddress

    // Drawing geometry parameters
    /** Sets the drawing width within the browser client area */
    protected readonly mountingBox: {width: number|string, height: number|string} = reactive({width: "100%", height: "100%"});
    get mountingWidth() {return this.mountingBox.width}
    set mountingWidth(newWidth) {
        this.mountingBox.width = newWidth;
        nextTick(this.notifyOfScaleChange);
    }
    get mountingHeight() {return this.mountingBox.height}
    set mountingHeight(newHeight) {
        this.mountingBox.height = newHeight;
        nextTick(this.notifyOfScaleChange);
    }

    /** Sets the drawing area dimensions in SVG logical units 
     * (component sizes are measuring relative to this sizes) */
    protected readonly logicalBox = reactive({width: 1000, height: 1000});
    get logicalWidth() {return this.logicalBox.width}
    set logicalWidth(newWidth) {
        this.logicalBox.width = newWidth;
        nextTick(this.notifyOfScaleChange);
    }
    get logicalHeight() {return this.logicalBox.height}
    set logicalHeight(newHeight) {
        this.logicalBox.height = newHeight;
        nextTick(this.notifyOfScaleChange);
    }

    /** Sets or returns the drawing background image (if exists) */
    readonly backgroundImage = reactive(new BackgroundImageData);

    private readonly _backgroundColor = ref("#ffffff");
    /** Sets or returns the drawing background color */
    get backgroundColor() {return this._backgroundColor.value}
    set backgroundColor(newColor: string) {this._backgroundColor.value = newColor}

    /** Drawing scale (visual) */
    get drawingScale() {
        return this.baseScale * this.zoomFactor;
    }//drawingScale

    private _zoomFactor = ref(0.999999999); 
    // initially zoomFactor set to some value near 1 and then is reset to exact "1" dynamically
    // it somehow helps to initialize the drawing dimensions (who knows why?)

    /** A zoom factor for visual scaling*/
    get zoomFactor() {return this._zoomFactor.value}
    set zoomFactor(newScale) {
        this._zoomFactor.value = newScale;
        nextTick(this.notifyOfScaleChange);
    }
    protected notifyOfScaleChange = () =>
    {
        this.emit("drawing-scale", this.drawingScale);
    }//notifyOfScaleChange

    /** Base drawing scale (not taking into account the zoom factor) */
    get baseScale() {
        const baseXScale = this.rootSVG.width.baseVal.value / this.logicalWidth / this.zoomFactor;
        const baseYScale = this.rootSVG.height.baseVal.value / this.logicalHeight / this.zoomFactor;
        return Math.min(baseXScale, baseYScale)
    }//baseScale

    /** Raised error counter */
    get errorCount() {return this._errorCount}
    /** Resets the error count */
    resetErrors() {this._errorCount = 0; return this;}
    protected _errorCount = 0;


    public _onMouseWheel(event: WheelEvent)
    {
        this.zoomFactor *= Math.pow(1.05, event.deltaY * -0.01);
    }//_onMouseWheel

    /** A key for drawing origin injection */
    static readonly ikDrawingOrigin = Symbol() as InjectionKey<Position>;

    /** Determines whether the drawing is editable */
    isEditable = true;
    /** A symbolic key for the editability flag injection */
    static readonly ikIsEditable = Symbol() as InjectionKey<boolean>;
    /** The element Kresmer was mounted on */
    readonly mountPoint: HTMLElement;

    /** Determines if components and link vertices should snap to the grid when being dragged and dropped */
    snapToGrid = true;
    /** A symbolic key for the snap-to-grid flag injection */
    static readonly ikSnapToGrid = Symbol() as InjectionKey<boolean>;
    /** A step (granularity) of snapping to the grid */
    snappingGranularity = 1;
    /** A symbolic key for the snap-to-grid step injection */
    static readonly ikSnappingGranularity = Symbol() as InjectionKey<number>;

    /** A base (common) prefix for all hyperlinks on the drawing */
    readonly hrefBase = ref("");
    /** Makes a hyperlink from the commpon prefix and the specific tail */
    private makeHref = (tail: string) =>
    {
        if (!this.hrefBase || tail.match(/^(\/|data:|file:|[a-z]+:\/\/)/))
            return tail;
        return `${this.hrefBase.value.replace(/\/$/, '')}/${tail}`;
    }//makeHref

    /** Kresmer-backend server connection (if any) */
    public backendConnection?: BackendConnection;
    /** 
     * Connects to the backend server
     * @param serverURL An URL of the backend server to connect to
     * @param password A password to use for the connection
     */
    public connectToBackend(serverURL: string, password?: string)
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
    public async testBackendConnection(serverURL: string, password: string): Promise<BackendConnectionTestResult>
    {
        return BackendConnection.testConnection(serverURL, password);
    }//testBackendConnection

    /** The stack for undoing editor operations */
    readonly undoStack = new UndoStack(this);
    /** 
     * Undoes the last editor operation 
     * @returns boolean True if an operation was undone, else false
     */
    public undo(): boolean {
        this.resetAllComponentMode();
        return this.undoStack.undo();
    }//undo
    /**
     * Redoes the last undone editor operation 
     * @returns boolean True if an operation was redone, else false
     */
    public redo(): boolean {
        this.resetAllComponentMode();
        return this.undoStack.redo();
    }//redo

    /** Signals an application error */
    public raiseError(exception: KresmerException): Kresmer
    {
        this.emit("error", exception);
        this._errorCount++;
        return this;
    }//raiseError

    /** Shows whether the content was modified comparing to the last data loading */
    public get isDirty(): boolean
    {
        return this.undoStack.isDirty;
    }//get isDirty

    public set isDirty(newValue)
    {
        this.undoStack.isDirty = newValue;
    }//set isDirty

    /** Shows whether the drawing has no content  */
    public get isEmpty(): boolean
    {
        return !this.links.size && !this.networkComponents.size;
    }//get isEmpty

    /** Forces update on the underlying Vue-component */
    public forceUpdate(): Kresmer
    {
        this.vueKresmer.$forceUpdate();
        return this;
    }//forceUpdate

    /**
     * Opens an URL. First it tries to delegate opening an URL to the host and then
     * (if the host returns false) opens an URL on its own.
     * @param url An URL to open
     * @param target Navigation target
     */
    public readonly openURL = (url: string, target = "_self") =>
    {
        console.debug(`openURL("${url}")`);
        if (this.onOpenUrl(url, target))
            return;
        window.open(url, target);
    }//openURL

    /** A list of all Component Classes, registered by Kresmer */
    public readonly registeredComponentClasses = new Map<string, NetworkComponentClass>();
    /** Returns a list of all Component Classes, registered by Kresmer */
    public getRegisteredComponentClasses() {return this.registeredComponentClasses.entries()}

    /**
     * Registers a Network Component Class in the Kresmer and registers
     * the corresponding new component in the Vue application
     * 
     * @param componentClass A Network Component Class to register
     */
    public registerNetworkComponentClass(componentClass: NetworkComponentClass): Kresmer
    {

        function patchBody(body: string) {
                return body
                    .replaceAll(/((?:computedProps|cp\$)\.\w+)(?!\w*\.value)/g, "$1.value")
                    .replaceAll(/(?:super\$)(?!\w*\.value)/g, "super$.value")
                    ;
        }//patchBody

        // Register a Vue-component for the class itself
        this.appKresmer.component(componentClass.vueName, 
        {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setup(props: Record<string, Prop<unknown>>) {

                const computedProps: Record<string, ComputedRef> = {};
                for (const name in componentClass.computedProps) {
                    const body = patchBody(componentClass.computedProps[name].body);
                    computedProps[name] = computed(eval(`() => (${body})`));
                }//for

                // eslint-disable-next-line @typescript-eslint/ban-types
                const functions: Record<string, Function> = {};
                for (const name in componentClass.functions) {
                    const params = componentClass.functions[name].params;
                    const body = patchBody(componentClass.functions[name].body);
                    eval(`functions.${name} = function ${name}(${params.join(",")}) {${body}}`);
                }//for

                // eslint-disable-next-line @typescript-eslint/ban-types
                const superFunctions: Record<string, Function> = {};
                for (const name in componentClass.baseClass?.functions) {
                    const params = componentClass.baseClass.functions[name].params;
                    const body = patchBody(componentClass.baseClass.functions[name].body);
                    eval(`superFunctions.${name} = function ${name}(${params.join(",")}) {${body}}`);
                }//for

                const cp$ = computedProps, fn$ = functions; // aliases for more convenient usage outside of tepmlates
                const super$ = computed(() => superFunctions);

                return {...cp$, ...fn$, super$};
            },
            template: componentClass.template,
            props: {
                ...componentClass.props,
                componentId: {type: Number},
                name: {type: [String, Number]},
            },
        // ...and the one for its adapter (used for component-in-component embedding)
        }).component(componentClass.adapterVueName, {
            setup(props: Record<string, Prop<unknown>>) {
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
            this.styles.push(this.libraryLoader.scopeStyles(componentClass.style, componentClass, true));
        }//if

        this.registeredComponentClasses.set(componentClass.name, componentClass);
        return this;
    }//registerNetworkComponentClass

    /**
     * Register a Link Class in Kresmer
     * @param linkClass A class to register
     * @returns Kresmer itself
     */
    public registerLinkClass(linkClass: NetworkLinkClass): Kresmer
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
            this.styles.push(this.libraryLoader.scopeStyles(linkClass.style, linkClass, false));
        }//if

        this.registeredLinkClasses.set(linkClass.name, linkClass);
        return this;
    }//registerLinkClass

    /**
     * A list of all Link Classes, registered by Kresmer
     */
    public readonly registeredLinkClasses = new Map<string, NetworkLinkClass>();
    /** Returns a list of all Link Classes, registered by Kresmer */
    public getRegisteredLinkClasses(): IterableIterator<[string, NetworkLinkClass]>
    {
        return this.registeredLinkClasses.entries();
    }//getRegisteredLinkClasses

    /**
     * Register a Area Class in Kresmer
     * @param areaClass A class to register
     * @returns Kresmer itself
     */
    public registerAreaClass(areaClass: DrawingAreaClass): Kresmer
    {
        if (this.registeredAreaClasses.has(areaClass.name)) {
            this.raiseError(new DuplicateAreaClassException({className: areaClass.name}));
            return this;
        }//if

        // Register class's svg-definitions
        if (areaClass.defs) {
            this.appKresmer.component(areaClass.defsVueName, 
            {
                template: areaClass.defs,
            })
        }//if

        // ...and its css-styles
        if (areaClass.style) {
            this.styles.push(this.libraryLoader.scopeStyles(areaClass.style, areaClass, false));
        }//if

        this.registeredAreaClasses.set(areaClass.name, areaClass);
        return this;
    }//registerAreaClass

    /**
     * A list of all Area Classes, registered by Kresmer
     */
    public readonly registeredAreaClasses = new Map<string, DrawingAreaClass>();
    /** Returns a list of all Area Classes, registered by Kresmer */
    public getRegisteredAreaClasses(): IterableIterator<[string, DrawingAreaClass]>
    {
        return this.registeredAreaClasses.entries();
    }//getRegisteredAreaClasses


    private readonly libraryLoader = new LibraryLoader(this);
    private readonly librariesLoaded = new Set<string>();

    /**
     * Loads a component class library from the raw XML data
     * @param libData Library data
     * @returns Result code: 0 - success, -1 - library already loaded, >0 - the number of errors
     */
    public async loadLibrary(libData: string): Promise<number>
    {
        return this.libraryLoader.loadLibrary(libData);
    }//loadLibrary

    /**
     * Loads several libraries at once
     * @param libs Mapping libName => libData
     */
    public loadLibraries(libs: Record<string, string>): Promise<number>
    {
        return this.libraryLoader.loadLibraries(libs);
    }//loadLibraries

    /**
     * Checks if the specified is already loaded
     * @param libName The library name to check
     * @returns True of the library is already loaded or false otherwise
     */
    public isLibraryLoaded(libName: string): boolean
    {
        return this.librariesLoaded.has(libName);
    }//isLibraryLoaded
 
    /**
     * Tries to register a library with the given name (for the private use)
     * @param libName The name of th library to register
     */
    public _registerLibrary(libName: string): boolean
    {
        if (this.librariesLoaded.has(libName))
            return false;
        this.librariesLoaded.add(libName);
        return true;
    }//_registerLibrary

    /**
     * Components currently placed to the drawing
     */
    public readonly networkComponents = reactive(new MapWithZOrder<number, NetworkComponentController>()) as unknown as 
        MapWithZOrder<number, NetworkComponentController>; // !!! workaround for some Vue "reactive" typing anomaly
    public readonly componentsByName = new Map<string, number>();

    /**
     * Adds a new Network Component to the content of the drawing
     * @param component A Network Component to add
     */
    public placeNetworkComponent(component: NetworkComponent,
                                 origin: Position, transform?: Transform): Kresmer
    {
        const controller = new NetworkComponentController(this, component, {origin, transform});
        component.controller = controller;
        return this.addPositionedNetworkComponent(controller);
    }//placeNetworkComponent

    /**
     * Adds a new Network Component to the content of the drawing
     * @param controller A Network Component to add
     */
    public addPositionedNetworkComponent(controller: NetworkComponentController): Kresmer
    {
        this.networkComponents.add(controller);
        this.componentsByName.set(controller.component.name, controller.component.id);
        return this;
    }//addPositionedNetworkComponent

    /**
     * Deletes the specified component from the drawing
     * @param controller The controller of the component to delete
     */
    public deleteComponent(controller: NetworkComponentController): Kresmer
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
        return this;
    }//deleteComponent
 
    /**
     * Drawing areas
     */
    readonly areas = reactive(new DrawingAreaMap()) as unknown as DrawingAreaMap; // !!! workaround for some Vue "reactive" typing anomaly
    readonly areasByName = new Map<string, number>();

    /**
     * Adds a new Area to the drawing
     * @param area An Area to add
     */
    public addArea(area: DrawingArea): Kresmer
    {
        this.areas.add(area);
        this.areasByName.set(area.name, area.id);
        this.emit("area-added", area);
        return this;
    }//addArea

    /**
     * Deletes a Area from the content of the drawing
     * @param area An Area to delete
     */
    public deleteArea(area: DrawingArea): Kresmer
    {
        this.areas.delete(area.id);
        this.areasByName.delete(area.name);
        this.emit("area-deleted", area);
        return this;
    }//deleteArea
 
    /**
     * Links currently placed to the drawing
     */
    readonly links = reactive(new NetworkLinkMap()) as unknown as NetworkLinkMap; // !!! workaround for some Vue "reactive" typing anomaly
    readonly linksByName = new Map<string, number>();
    readonly highlightedLinks = new Set<NetworkLink>();

    /** Links bundles (visual aggregates) currently on the drawing */
    readonly linkBundles = new Array<LinkBundle>();

    /**
     * Adds a new Link to the drawing
     * @param link A Link to add
     */
    public addLink(link: NetworkLink): Kresmer
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
    public deleteLink(link: NetworkLink): Kresmer
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
    public saveDrawing(): string
    {
        return this.drawingLoader.saveDrawing();
    }//saveDrawing

    /** Determines whether "dynamic" element prop values should be saved with the drawing */
    saveDynamicPropValuesWithDrawing = false;


    public exportDrawingToSVG(styles: string): string
    {
        const svg = this.rootSVG.cloneNode(true) as SVGElement;
        const defsElement = document.createElement("defs");
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        defsElement.appendChild(styleElement);
        svg.insertBefore(defsElement, svg.firstChild);
        return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE inline_dtd[<!ENTITY nbsp "&#160;">]>
${svg.outerHTML}
`;
    }//exportDrawingToSVG


    /** Erases everything that is in the drawing now */
    public eraseContent(): void
    {
        this.drawingName = UNNAMED_DRAWING;
        this.hrefBase.value = "";
        this.backgroundImage.url = "";
        this.undoStack.reset();
        this.linksByName.clear();
        this.links.clear();
        this.networkComponents.forEach((controller, id) => {
            this.networkComponents.delete(id);
        });
        this.componentsByName.forEach((id, name) => {
            if (!this.networkComponents.has(id)) {
                this.componentsByName.delete(name);
            }//if
        });
    }//eraseContent


    /**
     * Searches for the DrawingElement with the specified ID
     * @param id An ID of the element to search for
     * @returns The element if found or "undefined" otherwise
     */
    public getElementById(id: number): DrawingElement|undefined
    {
        return this.networkComponents.get(id)?.component ?? this.links.get(id);
    }//getElementById


    /**
     * Searches for the NetworkComponent with the specified ID
     * @param id An ID of the component to search for
     * @returns The component if found or "undefined" otherwise
     */
    public getComponentById(id: number): NetworkComponent|undefined
    {
        return this.networkComponents.get(id)?.component;
    }//getComponentById
 

    /**
     * Searches for the NetworkComponentController with the specified ID
     * @param id An ID of the component to search for
     * @returns The component controller if found or "undefined" otherwise
     */
    public getComponentControllerById(id: number): NetworkComponentController|undefined
    {
        return this.networkComponents.get(id);
    }//getComponentControllerById


    /**
     * Searches for the NetworkComponent with the specified name
     * @param name A name of the component to search for
     * @returns The component if found or "undefined" otherwise
     */
    public getComponentByName(name: string): NetworkComponent|undefined
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
    public getLinkById(id: number): NetworkLink|undefined
    {
        return this.links.get(id);
    }//getLinkById


    /**
     * Searches for the NetworkLink with the specified name
     * @param name A name of the link to search for
     * @returns The link if found or "undefined" otherwise
     */
    public getLinkByName(name: string): NetworkLink|undefined
    {
        const id = this.linksByName.get(name);
        if (id === undefined)
            return undefined;
        return this.links.get(id);
    }//getLinkByName


    /**
     * Searches for the NetworkArea with the specified ID
     * @param id An ID of the area to search for
     * @returns The area if found or "undefined" otherwise
     */
    public getAreaById(id: number): DrawingArea|undefined
    {
        return this.areas.get(id);
    }//getAreaById


    /**
     * Searches for the NetworkArea with the specified name
     * @param name A name of the area to search for
     * @returns The area if found or "undefined" otherwise
     */
    public getAreaByName(name: string): DrawingArea|undefined
    {
        const id = this.areasByName.get(name);
        if (id === undefined)
            return undefined;
        return this.areas.get(id);
    }//getAreaByName


    /**
     * Searches for the NetworkComponent or Link with the specified name.
     * If name starts with "-" then the link is searched, otherwise the component is searched.
     * @param name A name of the element to search for
     * @returns The element if found or "undefined" otherwise
     */
    public getElementByName(name: string): DrawingElement|undefined
    {
        if (name.startsWith("-"))
            return this.getLinkByName(name.slice(1));
        else
            return this.getComponentByName(name);
    }//getElementByName
  

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

    /** Returns the center of the drawing bounding rectangle */
    public get drawingCenter(): Position
    {
        return {x: this.drawingRect.width/2, y: this.drawingRect.height/2};
    }//drawingCenter


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


    /** Currently selected drawing element */
    private _selectedElement?: DrawingElement;
    public get selectedElement() {return this._selectedElement}
    public set selectedElement(newSelectedElement: DrawingElement | undefined) 
    {
        if (newSelectedElement === this._selectedElement) {
            return;
        }//if

        newSelectedElement?._onSelection(true) || this._selectedElement?._onSelection(false);
        this._selectedElement = newSelectedElement;
        this.resetAllComponentMode();
    }//set selectedElement


    /** Deselects all components (probably except the one specified) */
    public deselectAllElements(except?: unknown)
    {
        this.networkComponents.forEach(controller => {
            if (controller !== except) {
                controller.component.isSelected = false;
                controller.returnFromTop();
            }//if
        });
        this.links.forEach(link => {
            if (link !== except) {
                link.isSelected = false;
                link.returnFromTop();
            }//if
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
     * Converts screen coordiates to the user-space coordinates
     * @param pos The position (x, y) to convert
     * @returns The converted position
     */
    public applyScreenCTM(pos: Position) {
        const CTM = this.rootSVG.getScreenCTM()!;
        return {
          x: (pos.x - CTM.e) / CTM.a,
          y: (pos.y - CTM.f) / CTM.d
        };
    }//applyScreenCTM


    /**
     * Converts user-space coordiates to the screen coordinates
     * @param pos The position (x, y) to convert
     * @returns The converted position
     */
    public unapplyScreenCTM(pos: Position) {
        const CTM = this.rootSVG.getScreenCTM()!;
        return {
          x: pos.x * CTM.a + CTM.e,
          y: pos.y * CTM.d + CTM.f
        };
    }//unapplyScreenCTM

    // For internal use: reacts on some drawing element rename refreshing corresponding map
    public _onElementRename(element: DrawingElement, oldName: string)
    {
        if (element.name != oldName) {
            element._byNameIndex.delete(oldName);
            element._byNameIndex.set(element.name, element.id);
        }//if
    }//onElementRename

    /** A blank for a new link creation */
    public newLinkBlank?: NetworkLinkBlank;

    /**
     * Completes the new link creation (for private use only)
     * @param toConnectionPoint The connection point, which will be the end of the new link
     */
    public _completeLinkCreation(toConnectionPoint?: ConnectionPoint)
    {
        const to = toConnectionPoint ? 
            {conn: toConnectionPoint} :
            {pos: {...this.newLinkBlank!.end}};
        const _class = this.newLinkBlank!._class;
        const newLink = _class instanceof LinkBundleClass ?  
            new LinkBundle(this, _class, {from: this.newLinkBlank!.start, to}) : 
            new NetworkLink(this, _class, {from: this.newLinkBlank!.start, to});
        newLink.initVertices();
        const op = newLink instanceof LinkBundle ? new CreateBundleOp(newLink) : new AddLinkOp(newLink);
        this.undoStack.execAndCommit(op);
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

    /** Inactivates temporarily normal link behaviour and reactivity (for internal use) */
    public _allLinksFreezed = false;

    /** Temporarily makes all connections points visible (for internal use) */
    readonly _showAllConnectionPoints = reactive({value: false}); 
    //!!! workaround for some Vue bug: normal "ref" doesn't work in this context


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
            if (!this.animateComponentDragging)
                controller.updateConnectionPoints();
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

        createComponent: (componentClass: NetworkComponentClass, position?: Position, coordSystem?: "screen"|"drawing") =>
        {
            const newComponent = new NetworkComponent(this, componentClass);
            const origin = !position ? {x: this.logicalBox.width/2, y: this.logicalBox.height/2} :
                coordSystem !== "drawing" ? this.applyScreenCTM(position) : 
                {...position};
            const controller = new NetworkComponentController(this, newComponent, {origin});
            this.undoStack.execAndCommit(new ComponentAddOp(controller));
        },//createComponent

        duplicateComponent: (original: NetworkComponentController) =>
        {
            let name: string;
            for (let n = 1; (name = `${original.component.name}.${n}`) && this.componentsByName.has(name); n++) {/**/}
            const props = clone(original.component.props);
            const newComponent = new NetworkComponent(this, original.component.getClass(), {name, props});
            const origin = {x: original.origin.x + 10, y: original.origin.y + 10};
            const controller = new NetworkComponentController(this, newComponent, {origin});
            this.undoStack.execAndCommit(new ComponentAddOp(controller));
        },//duplicateComponent

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
            controller.returnFromTop();
            this.undoStack.execAndCommit(new ComponentDeleteOp(controller));
        },//deleteComponent

        /**
         * Move component one step up in z-order
         * @param controller A controller of the component to move
         */
        moveComponentUp: (controller: NetworkComponentController) => {
            this.undoStack.execAndCommit(new ComponentMoveUpOp(controller));
        },//moveComponentUp

        /**
         * Move component to the top in z-order
         * @param controller A controller of the component to move
         */
        moveComponentToTop: (controller: NetworkComponentController) => {
            this.undoStack.execAndCommit(new ComponentMoveToTopOp(controller));
        },//moveComponentToTop

        /**
         * Move component one step down in z-order
         * @param controller A controller of the component to move
         */
        moveComponentDown: (controller: NetworkComponentController) => {
            this.undoStack.execAndCommit(new ComponentMoveDownOp(controller));
        },//moveComponentUp

        /**
         * Move component to the bottom in z-order
         * @param controller A controller of the component to move
         */
        moveComponentToBottom: (controller: NetworkComponentController) => {
            this.undoStack.execAndCommit(new ComponentMoveToBottomOp(controller));
        },//moveComponentToBottom

        /**
         * Changes class of the specified component
         * @param componentID A component to modify ID
         * @param newClass A new class of the component
         */
        changeComponentClass: (component: NetworkComponent, newClass: NetworkComponentClass) =>
        {
            this.undoStack.execAndCommit(new ChangeComponentClassOp(component, newClass));
        },//changeComponentClass

        /**
         * Starts link creation pulling it from the specified connection point
         * @param linkClass A class of the new link
         * @param from An anchor from which the link is started
         */
        startLinkCreation: (linkClass: NetworkLinkClass, from: LinkVertexInitParams) =>
        {
            this.newLinkBlank = new NetworkLinkBlank(this, linkClass, from);
            this.vueKresmer.$forceUpdate();
        },//startLinkCreation

        /**
         * Changes class of the specified link
         * @param linkID A link to modify ID
         * @param newClass A new class of the link
         */
        changeLinkClass: (link: NetworkLink, newClass: NetworkLinkClass) =>
        {
            this.undoStack.execAndCommit(new ChangeLinkClassOp(link, newClass));
        },//changeLinkClass

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
            link.returnFromTop();
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
         * @param vertexSpec The specifier of the vertex to align (either direct ref or (parentID, vertexNumber) pair)
         */
        alignVertex: (vertexSpec: VertexSpec, mode: VertexAlignmentMode = "normal") =>
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let vertex: Vertex = (vertexSpec as any).vertex;
            if (!vertex) {
                const {parentID, vertexNumber} = vertexSpec as {parentID: number, vertexNumber: number};
                const parentElement = this.getElementById(parentID);
                if (parentElement instanceof DrawingElementWithVertices && vertexNumber in parentElement.vertices)
                    vertex = parentElement.vertices[vertexNumber];
                else
                    throw new UndefinedVertexException({message: `Attempt to align a non-existent vertex (${parentID},${vertexNumber})`});
            }//if
            this.undoStack.startOperation(new VertexMoveOp(vertex));
            if (vertex.align(mode)) {
                this.undoStack.commitOperation();
                vertex.notifyOnVertexMove();
                return true;
            } else {
                this.undoStack.cancelOperation();
                return false;
            }//if
        },//alignVertex

        /**
         * Aligns (or at least tries to) all link vertices to their neighbours
         * @param linkSpec The specifier of the link (either direct ref or linkID)
         */
        alignLinkVertices: (linkSpec: LinkSpec) =>
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let link: NetworkLink|undefined = (linkSpec as any).link;
            if (!link) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const linkID = (linkSpec as any).linkID;
                link = this.getLinkById(linkID);
                if (!link) 
                    throw new UndefinedLinkException({message: `Attempt to align a vertex of the non-existent link (id=${linkID})`});
            }//if
            const op = new VerticesMoveOp(link.wouldAlignVertices);
            this.undoStack.startOperation(op);
            const verticesAligned = link.alignVertices() as Set<Vertex>;
            if (verticesAligned.size) {
                for (const vertex of op.vertices) {
                    if (!verticesAligned.has(vertex))
                        op.vertices.delete(vertex);
                }//for
                this.undoStack.commitOperation();
                for (const vertex of op.vertices) {
                    vertex.notifyOnVertexMove();
                }//for
                return true;
            } else {
                this.undoStack.cancelOperation();
                return false;
            }//if
        },//alignLinkVertices

        /**
         * Deletes a link vertex
         * @param vertexSpec The specifier of the vertex to delete (either direct ref or (linkID, vertexNumber) pair)
         */
        deleteLinkVertex: (vertexSpec: LinkVertexSpec) =>
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let vertex: LinkVertex = (vertexSpec as any).vertex;
            if (!vertex) {
                const {linkID, vertexNumber} = vertexSpec as {linkID: number, vertexNumber: number};
                const link = this.getLinkById(linkID);
                if (!link) 
                    throw new UndefinedLinkException({message: `Attempt to delete a vertex of the non-existent link (id=${linkID})`});
                vertex = link.vertices[vertexNumber];
                if (!vertex) 
                    throw new UndefinedVertexException({message: `Attempt to delete a non-existent vertex (id=${linkID})`});
            }//if
            this.undoStack.execAndCommit(new DeleteVertexOp(vertex));
            this.emit("link-vertex-deleted", vertex);
        },//deleteLinkVertex

        /**
         * Adds an area vertex
         * @param areaID The area this vertexs belongs
         * @param segmentNumber The seq number of the segment where tne vertex should be added
         * @param mousePos The mouse click position
         * @returns True if the vertex was added or false otherwise
         */
        addAreaVertex: (areaID: number, segmentNumber: number, mousePos: Position) =>
        {
            const area = this.getAreaById(areaID);
            if (!area) {
                throw new KresmerException(`Attempt to add a vertex to the non-existent area (id=${areaID})`);
            }//if
            const vertex = area.addVertex(segmentNumber, mousePos);
            this.emit("area-vertex-added", vertex);
            return vertex;
        },//addAreaVertex
    
        /**
         * Update the specified drawing element props and name (if required)
         * @param element The element to update
         * @param newProps The new prop values
         * @param newName The new element name
         */
        updateElement: (element: DrawingElement, 
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

const UNNAMED_DRAWING = "?unnamed?";

export type DrawingProps = {
    /** The drawing name */
    name?: string|undefined;
    /** The drawing logical width */
    logicalWidth?: number|undefined;
    /** The drawing logical height */
    logicalHeight?: number|undefined;
    /** A common base prefix for all hrefs on the drawing */
    hrefBase?: string|undefined;
    /** An URL of the background image (if any) */
    backgroundImage?: BackgroundImageData;
    /** The drawing background color */
    backgroundColor?: string|undefined;
}//DrawingProps

class UpdateDrawingPropsOp extends EditorOperation
{
    constructor(private readonly kresmer: Kresmer, newProps: DrawingProps)
    {
        super();
        this.oldProps = {
            name: kresmer.drawingName,
            logicalWidth: kresmer.logicalWidth,
            logicalHeight: kresmer.logicalHeight,
            hrefBase: kresmer.hrefBase.value,
            backgroundImage: new BackgroundImageData(kresmer.backgroundImage),
            backgroundColor: kresmer.backgroundColor,
        }//oldProps
        this.newProps = {
            name: newProps.name,
            logicalWidth: newProps.logicalWidth,
            logicalHeight: newProps.logicalHeight,
            hrefBase: newProps.hrefBase,
            backgroundImage: new BackgroundImageData(newProps.backgroundImage),
            backgroundColor: newProps.backgroundColor,
        }//oldProps
    }//ctor

    private readonly oldProps: Required<DrawingProps>;
    private readonly newProps: DrawingProps;

    override exec(): void
    {
        this.newProps.name && (this.kresmer.drawingName = this.newProps.name);
        this.newProps.logicalWidth && (this.kresmer.logicalWidth = this.newProps.logicalWidth);
        this.newProps.logicalHeight && (this.kresmer.logicalHeight = this.newProps.logicalHeight);
        this.newProps.hrefBase !== undefined && (this.kresmer.hrefBase.value = this.newProps.hrefBase);
        this.newProps.backgroundImage && this.kresmer.backgroundImage.copy(this.newProps.backgroundImage);
        this.newProps.backgroundColor && (this.kresmer.backgroundColor = this.newProps.backgroundColor);
    }//exec

    override undo(): void
    {
        this.oldProps.name != this.kresmer.drawingName && (this.kresmer.drawingName = this.oldProps.name);
        this.oldProps.logicalWidth != this.kresmer.logicalWidth && 
            (this.kresmer.logicalWidth = this.oldProps.logicalWidth);
        this.oldProps.logicalHeight != this.kresmer.logicalHeight && 
            (this.kresmer.logicalHeight = this.oldProps.logicalHeight);
        this.oldProps.hrefBase != this.kresmer.hrefBase.value && (this.kresmer.hrefBase.value = this.oldProps.hrefBase);
        this.kresmer.backgroundImage.copy(this.oldProps.backgroundImage);
        this.oldProps.backgroundColor != this.kresmer.backgroundColor && (this.kresmer.backgroundColor = this.oldProps.backgroundColor);
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
    },//$global
}//GeneralTemplateFunctions

/** Options for the street address representation */
export const enum StreetAddressFormat {
    StreetFirst = "{street} {building-number}",
    BuildingFirst = "{building-number} {street}",
}//StreetAddressFormat

/** Class type of the generic drawing element */
export type DrawingElementClassType = typeof NetworkComponentClass | typeof NetworkLinkClass;
export type DrawingElementClassConstructor = NetworkComponentClass | NetworkLinkClass;

// Re-export child classes to API
export {default as DrawingElement } from "./DrawingElement/DrawingElement";
export {default as DrawingElementClass, DrawingElementPropCategory } from "./DrawingElement/DrawingElementClass";
export type {DrawingElementData} from "./DrawingElement/DrawingElement";
export {default as NetworkComponent} from "./NetworkComponent/NetworkComponent";
export {default as NetworkComponentClass} from "./NetworkComponent/NetworkComponentClass";
export {default as NetworkComponentController, type TransformMode} from "./NetworkComponent/NetworkComponentController";
export type { Position } from "./Transform/Transform";
export {default as NetworkLink} from "./NetworkLink/NetworkLink";
export {default as NetworkLinkClass} from "./NetworkLink/NetworkLinkClass";
export {default as LinkBundle} from "./NetworkLink/LinkBundle";
export {LinkBundleClass} from "./NetworkLink/NetworkLinkClass";
export {default as Vertex} from "./Vertex/Vertex";
export {default as LinkVertex} from "./NetworkLink/LinkVertex";
export {LinkVertexAnchor} from "./NetworkLink/LinkVertex";
export {default as KresmerException, LibraryImportException} from "./KresmerException";
export {default as KresmerParsingException} from "./loaders/ParsingException";
export {default as ConnectionPointProxy} from "./ConnectionPoint/ConnectionPoint";
export type {DrawingMergeOptions} from "./loaders/DrawingLoader";
export {BackgroundImageData, BackgroundImageAlignment} from "./BackgroundImageData";
