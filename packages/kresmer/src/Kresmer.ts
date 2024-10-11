/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, createApp, InjectionKey, reactive, PropType, computed, ComputedRef, ref, nextTick, Prop, provide } from "vue";
import {Root as PostCSSRoot} from 'postcss';
import KresmerEventHooks from "./KresmerEventHooks";
import KresmerVue from "./Kresmer.vue";
import LibraryLoader from "./loaders/LibraryLoader";
import DrawingLoader, {DrawingMergeOptions} from "./loaders/DrawingLoader";
import NetworkComponent, {ChangeComponentClassOp, NetworkComponentFunctions} from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { ComponentAddOp, ComponentDeleteOp, ComponentMoveUpOp, ComponentMoveToTopOp, 
    ComponentMoveDownOp, ComponentMoveToBottomOp } from "./NetworkComponent/NetworkComponentController";
import { Position, Shift, Transform, TransformFunctons, ITransform } from "./Transform/Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import NetworkLinkClass, { LinkBundleClass } from "./NetworkLink/NetworkLinkClass";
import NetworkComponentAdapterVue from "./NetworkComponent/NetworkComponentAdapter.vue";
import ConnectionPointVue from "./ConnectionPoint/ConnectionPoint.vue";
import NetworkLink, { AddLinkOp, ChangeLinkClassOp, DeleteLinkOp, LinkSpec, NetworkLinkMap } from "./NetworkLink/NetworkLink";
import KresmerException, { UndefinedAreaException, UndefinedLinkException, UndefinedVertexException } from "./KresmerException";
import UndoStack, { EditorOperation } from "./UndoStack";
import DrawingElement, { UpdateElementOp } from "./DrawingElement/DrawingElement";
import NetworkLinkBlank from "./NetworkLink/NetworkLinkBlank";
import ConnectionPoint from "./ConnectionPoint/ConnectionPoint";
import { MapWithZOrder } from "./ZOrdering";
import BackendConnection, { BackendConnectionTestResult } from "./BackendConnection";
import LinkBundle, { CreateBundleOp } from "./NetworkLink/LinkBundle";
import LinkVertex, { LinkVertexInitParams, LinkVertexSpec } from "./NetworkLink/LinkVertex";
import Vertex, { VertexSpec, VertexAlignmentMode, VertexMoveOp, VerticesMoveOp } from "./Vertex/Vertex";
import DrawingElementWithVertices, { AddVertexOp, DeleteVertexOp } from "./DrawingElement/DrawingElementWithVertices";
import { clone } from "./Utils";
import AdjustmentRulerVue from "./AdjustmentHandles/AdjustmentRuler.vue";
import { BackgroundImageData } from "./BackgroundImageData";
import DrawingArea, { DrawingAreaMap, AddAreaOp, DeleteAreaOp, AreaMoveUpOp, AreaMoveToTopOp, AreaMoveDownOp, AreaMoveToBottomOp, RemoveAreaBorderOp, AreaSpec } from "./DrawingArea/DrawingArea";
import DrawingAreaClass, { AreaBorderClass } from "./DrawingArea/DrawingAreaClass";
import DrawingElementClass from "./DrawingElement/DrawingElementClass";
import ConnectionIndicatorVue from "./ConnectionPoint/ConnectionIndicator.vue";
import SVGExporter from "./SVGExporter";
import AreaVertex, { AreaVertexSpec, AreaSegmentType, VertexGeomChangeOp } from "./DrawingArea/AreaVertex";


/**
 * The main class implementing the most of the Kresmer public API
 * Also acts as a proxy for the Kresmer's root vue-component
 */
export default class Kresmer extends KresmerEventHooks {

    constructor(mountPoint: string, options?: KresmerInitOptions);
    constructor(mountPoint: Element, options?: KresmerInitOptions);
    constructor(app: App, options?: KresmerInitOptions);
    constructor(mountPointOrApp: string|Element|App, options?: KresmerInitOptions)
    {
        super();
        if (typeof mountPointOrApp === "string")
            this._mountPoint = document.querySelector(mountPointOrApp)!;
        else if (mountPointOrApp instanceof Element)
            this._mountPoint = mountPointOrApp;
        options?.mountingWidth && (this.mountingBox.width = options.mountingWidth);
        options?.mountingHeight && (this.mountingBox.height = options.mountingHeight);
        options?.logicalWidth && (this.logicalBox.width = options.logicalWidth);
        options?.logicalHeight && (this.logicalBox.height = options.logicalHeight);
        this.isEditable = Boolean(options?.isEditable);
        this.showRulers = Boolean(options?.showRulers);
        this.showGrid = Boolean(options?.showGrid);
        this.snapToGrid = Boolean(options?.snapToGrid ?? true);
        options?.snappingGranularity && (this.snappingGranularity = options.snappingGranularity);
        this.saveDynamicPropValuesWithDrawing = Boolean(options?.saveDynamicPropValuesWithDrawing);
        this.embedLibDataInDrawing = Boolean(options?.embedLibDataInDrawing ?? true);
        this.libDataPriority = options?.libDataPriority ?? LibDataPriority.useVersioning;
        this.autoAlignVertices = options?.autoAlignVertices ?? true;
        this.animateComponentDragging = Boolean(options?.animateComponentDragging);
        this.animateLinkBundleDragging = Boolean(options?.animateLinkBundleDragging);
        options?.hrefBase && (this.hrefBase.value = options.hrefBase);
        options?.streetAddressFormat && (this.streetAddressFormat = options.streetAddressFormat);
        options?.backgroundImage && (this.backgroundImage.copy(options.backgroundImage));
        options?.backgroundColor && (this.backgroundColor = options.backgroundColor);
        options?.uiLanguage && (this.uiLanguage = options.uiLanguage);
        
        // if we received the mount-point from the calling site,
        // we create and mount the Kresmer app ourselves
        if (this.mountPoint) {
            this.app = createApp(KresmerVue, {model: this});
            // register the components used to construct the drawing
            Kresmer._registerGlobals(this.app);
            // at last mount the main vue
            this.app.mount(this.mountPoint) as InstanceType<typeof KresmerVue>;
        } else {
            // otherwise we consider that the Kresmer Vue component is already created and receive the reference
            // to the application from it
            this.app = mountPointOrApp as App;
        }//if

        // and somehow awake its scaling mechanism (workaround for something beyond understanding)
        this.zoomFactor = 1;

        if (options?.backendServerURL)
            this.connectToBackend(options.backendServerURL, options.backendConnectionPassword);

        // Load initial libraries and a drawing (if given)
        this.initializationCompleted = Promise.resolve();
        if (options?.libData)
            this.initializationCompleted = this.initializationCompleted
                .then(() => this.loadLibraries(options.libData!, options.libTranslationData));
        if (options?.drawingData)
            this.initializationCompleted = this.initializationCompleted
                .then(() => this.loadDrawing(options.drawingData!));
    }//ctor

    /** A promise that that completes at the same time when when the constructor's async part is completed */
    readonly initializationCompleted: Promise<unknown>;

    /*
     * Auxiliary function for registering global Kresmer components and properties in the Vue application
     * (for internal use)
     * @param app Vue App to register globals for
     */
    static _registerGlobals(app: App)
    {
        app
          .component("kre:connection-point", ConnectionPointVue)
          .component("kre:connection-indicator", ConnectionIndicatorVue)
          .component("kre:adjustment-ruler", AdjustmentRulerVue)
          ;
    }//_registerGlobals


    /** Kresmer's vue-component Application */
    readonly app: App;
    /** A symbolic key for the current App injection */
    static readonly ikApp = Symbol() as InjectionKey<App>;
    /** A symbolic key for the Kresmer instance injection */
    static readonly ikKresmer = Symbol() as InjectionKey<Kresmer>;
    /** Global SVG Defs */
    public readonly globalDefs = reactive(new Map<string, {data: Template, version: number, sourceCode: string}>());
    // /** SVG Defs collected from drawing element classes */
    // public readonly classDefs: Template[] = [];
    /** CSS styles collected from drawing element classes */
    public globalStyles = reactive(new Map<string, {data: PostCSSRoot, version: number, sourceCode: string}>());
    /** CSS styles collected from drawing element classes */
    public classStyles: PostCSSRoot[] = reactive([]);

    /** Returns the root SVG element */
    get rootSVG() { return this._rootSVG }
    private _rootSVG!: SVGSVGElement;
    /** The element Kresmer was mounted on */
    get mountPoint(): Element { return this._mountPoint }
    private _mountPoint!: Element;

    // For internal use
    _setRoot(rootSVG: SVGSVGElement, mountPoint: Element)
    {
        this._rootSVG = rootSVG;
        this._mountPoint = mountPoint;
    }//_setRoot

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
    /** The code of the language to use in UI */
    uiLanguage = new Intl.Locale(navigator.language).language;

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

    /** A base (common) prefix for all hyperlinks on the drawing */
    readonly hrefBase = ref("");
    /** Makes a hyperlink from the common prefix and the specific tail */
    makeHref = (tail: string) =>
    {
        if (!this.hrefBase || tail.match(/^(\/|data:|file:|[a-z]+:\/\/)/))
            return tail;
        return `${this.hrefBase.value.replace(/\/$/, '')}/${tail}`;
    }//makeHref

    // A set of functions we make available in the templates
    private readonly injectedTemplateFunctions = {
        ...TransformFunctons,
        ...NetworkComponentFunctions,
        kre$streetAddress: this.streetAddress,
        kre$openURL: this.openURL,
        kre$href: this.makeHref,
    }//injectedTemplateFunctions


    // Drawing geometry parameters
    /** Sets the drawing width within the browser client area */
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
    protected readonly mountingBox: {width: number|string, height: number|string} = reactive({width: "100%", height: "100%"});

    /** Sets the drawing area dimensions in SVG logical units 
     * (component sizes are measuring relative to this sizes) */
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
    protected readonly logicalBox = reactive({width: 1000, height: 1000});

    // Sets or returns the drawing background image (if exists)
    readonly backgroundImage = reactive(new BackgroundImageData);

    /** Sets or returns the drawing background color */
    get backgroundColor() {return this._backgroundColor.value}
    set backgroundColor(newColor: string) {this._backgroundColor.value = newColor}
    private readonly _backgroundColor = ref("#ffffff");

    /** Drawing scale (visual) */
    get drawingScale() {
        return this.baseScale * this.zoomFactor;
    }//drawingScale

    /** A zoom factor for visual scaling*/
    get zoomFactor() {return this._zoomFactor.value}
    set zoomFactor(newScale) {
        this._zoomFactor.value = newScale;
        nextTick(this.notifyOfScaleChange);
    }
    private _zoomFactor = ref(0.999999999); 
    // initially zoomFactor set to some value near 1 and then is reset to exact "1" dynamically
    // it somehow helps to initialize the drawing dimensions (who knows why?)

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
    /** Determines if components and link vertices should snap to the grid when being dragged and dropped */
    snapToGrid = true;
    /** A symbolic key for the snap-to-grid flag injection */
    static readonly ikSnapToGrid = Symbol() as InjectionKey<boolean>;
    /** A step (granularity) of snapping to the grid */
    get snappingGranularity() {return this._snappingGranularity}
    set snappingGranularity(newValue: number) {this._snappingGranularity = this._gridStep.value = newValue}
    protected _snappingGranularity = 1;
    /** Visual grid step */
    get gridStep() {return this._gridStep.value}
    protected _gridStep = ref(this._snappingGranularity);
    /** A symbolic key for the snap-to-grid step injection */
    static readonly ikSnappingGranularity = Symbol() as InjectionKey<number>;

    /** Kresmer-backend server connection (if any) */
    public backendConnection?: BackendConnection;
    /** 
     * Connects to the backend server
     * @param serverURL An URL of the backend server to connect to
     * @param password A password to use for the connection
     */
    public connectToBackend(serverURL: string, password?: string)
    {
        this.backendConnection = new BackendConnection(this, serverURL, password);
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
        this.resetAllComponentModes();
        return this.undoStack.undo();
    }//undo
    /**
     * Redoes the last undone editor operation 
     * @returns boolean True if an operation was redone, else false
     */
    public redo(): boolean {
        this.resetAllComponentModes();
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

    /** A list of all Component Classes, registered by Kresmer */
    public readonly registeredComponentClasses = new Map<string, NetworkComponentClass>();
    /** Returns a list of all Component Classes, registered by Kresmer */
    public getRegisteredComponentClasses() {return this.registeredComponentClasses.entries()}

    /** A symbolic key for the injection of the component embedding indicator */
    static readonly ikIsEmbedded = Symbol() as InjectionKey<boolean|undefined>;
    /** A symbolic key for the injection of the component being base embedded object indicator */
    static readonly ikIsBaseObject = Symbol() as InjectionKey<boolean|undefined>;

    /**
     * Registers a Network Component Class in the Kresmer and registers
     * the corresponding new component in the Vue application
     * 
     * @param componentClass A Network Component Class to register
     * @param options.force Forces the unconditional class registration, regardless to its version
     * @returns Kresmer itself
     */
    public registerNetworkComponentClass(componentClass: NetworkComponentClass, options?: {force?: boolean}): Kresmer
    {
        if (!options?.force) {
            const existingClass = this.registeredComponentClasses.get(componentClass.name);
            if (existingClass && existingClass.version >= componentClass.version) {
                return this;
            }//if
        }//if

        function patchBody(body: string) {
                return body
                    .replaceAll(/((?:computedProps|cp\$)\.\w+)(?!\w*\.value)/g, "$1.value")
                    .replaceAll(/(?:super\$)(?!\w*\.value)/g, "super$.value")
                    ;
        }//patchBody

        // Register a Vue-component for the class itself
        const injectedTemplateFunctions = this.injectedTemplateFunctions;
        this.app.component(componentClass.vueName, 
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

                const cp$ = computedProps, fn$ = functions, tf$ = injectedTemplateFunctions // aliases for more convenient usage outside of templates
                const super$ = computed(() => superFunctions);

                return {...cp$, ...fn$, super$, tf$, ...tf$};
            },
            template: componentClass.template,
            props: {
                ...componentClass.props,
                componentId: {type: Number},
                name: {type: [String, Number]},
            },
        // ...and the one for its adapter (used for component-in-component embedding)
        }).component(componentClass.adapterVueName, {
            components: {NetworkComponentAdapterVue},
            setup(props: Record<string, Prop<unknown>>) {
                const componentProps = computed(() => {
                    const prop = {...props};
                    for (const key of ["x", "y", "transform", "transformOrigin"]) {
                        delete prop[key];
                    }//for
                    return prop;
                });
                const provides = provide(Kresmer.ikIsEmbedded, true);
                return {componentProps, provides};
            },
            template: `\
                <NetworkComponentAdapterVue component-class="${componentClass.name}" 
                                         :x="x" :y="y" :transform="transform" :transform-origin="transformOrigin">
                    <component :is="'${componentClass.vueName}'" v-bind="componentProps">
                        <template v-for="(_, slotName) in $slots" v-slot:[slotName]="{...props}">
                            <slot :name="slotName"/>
                        </template>
                    </component>
                </NetworkComponentAdapterVue>`,
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
            this.app.component(componentClass.defsVueName, 
            {
                template: componentClass.defs,
            })
        }//if

        // ...and its css-styles
        if (componentClass.style) {
            this.classStyles.push(this.libraryLoader.scopeStyles(componentClass.style, componentClass, true));
        }//if

        this.registeredComponentClasses.set(componentClass.name, componentClass);
        return this;
    }//registerNetworkComponentClass

    /**
     * Register a Link Class in Kresmer
     * @param linkClass A class to register
     * @param options.force Forces the unconditional class registration, regardless to its version
     * @returns Kresmer itself
     */
    public registerLinkClass(linkClass: NetworkLinkClass, options?: {force?: boolean}): Kresmer
    {
        if (!options?.force) {
            const existingClass = this.registeredLinkClasses.get(linkClass.name);
            if (existingClass && existingClass.version >= linkClass.version) {
                return this;
            }//if
        }//if

        // Register class's svg-definitions
        if (linkClass.defs) {
            this.app.component(linkClass.defsVueName, 
            {
                template: linkClass.defs,
            })
        }//if

        // ...and its css-styles
        if (linkClass.style) {
            this.classStyles.push(this.libraryLoader.scopeStyles(linkClass.style, linkClass, false));
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
     * Register an Area Class in Kresmer
     * @param areaClass A class to register
     * @param options.force Forces the unconditional class registration, regardless to its version
     * @returns Kresmer itself
     */
    public registerAreaClass(areaClass: DrawingAreaClass, options?: {force?: boolean}): Kresmer
    {
        if (!options?.force) {
            const existingClass = this.registeredAreaClasses.get(areaClass.name);
            if (existingClass && existingClass.version >= areaClass.version) {
                return this;
            }//if
        }//if

        // Register class's svg-definitions
        if (areaClass.defs) {
            this.app.component(areaClass.defsVueName, 
            {
                template: areaClass.defs,
            })
        }//if

        // ...and its css-styles
        if (areaClass.style) {
            this.classStyles.push(this.libraryLoader.scopeStyles(areaClass.style, areaClass, false));
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


    /**
     * Registers any drawing element class (either a component, a link or an area)
     * @param clazz Clazz to register
     * @returns the Kresmer itself (for chaining)
     */
    public registerDrawingElementClass(clazz: DrawingElementClass)
    {
        if (clazz instanceof NetworkComponentClass)
            this.registerNetworkComponentClass(clazz);
        else if (clazz instanceof NetworkLinkClass)
            this.registerLinkClass(clazz);
        else if (clazz instanceof DrawingAreaClass)
            this.registerAreaClass(clazz);
        return this;
    }//registerDrawingElementClass


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
     * Loads a component class library translation from the raw XML data
     * @param libData Library translation data
     */
    public loadLibraryTranslation(libTranslationData: string)
    {
        this.libraryLoader.loadLibraryTranslation(libTranslationData);
    }//loadLibraryTranslation

    /**
     * Loads several libraries at once
     * @param libs Mapping libName => libData
     * @param translations Optional translations for the libs
     */
    public async loadLibraries(libs: LibData, translations?: LibTranslationData): Promise<number>
    {
        return await this.libraryLoader.loadLibraries(libs, translations);
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
     * @param libName The name of the library to register
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
    /** Determines whether library elements (classes) should be saved with the drawing */
    embedLibDataInDrawing = true;
    /** Determines the choice of the library data source when a conflict is detected */
    libDataPriority: LibDataPriority = LibDataPriority.useVersioning;


    public exportDrawingToSVG(styles: string): string
    {
        const exporter = new SVGExporter(this);
        return exporter.export(styles);
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
        this.areasByName.clear();
        this.areas.clear();
        this.zoomFactor = 1;
    }//eraseContent


    /**
     * Searches for the DrawingElement with the specified ID
     * @param id An ID of the element to search for
     * @returns The element if found or "undefined" otherwise
     */
    public getElementById(id: number): DrawingElement|undefined
    {
        return this.networkComponents.get(id)?.component ?? this.links.get(id) ?? this.areas.get(id);
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
    public resetAllComponentModes(except?: unknown): Kresmer
    {
        for (const controller of this.networkComponents.values()) {
            if (controller !== except)
                controller.resetMode();
        }//for
        return this;
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
        this.resetAllComponentModes();
    }//set selectedElement


    /** Deselects all components (probably except the one specified) */
    public deselectAllElements(except?: unknown): Kresmer
    {
        [this.networkComponents, this.links, this.areas].forEach(map => map.forEach(element => {
            if (element !== except && element.isSelected) {
                element.isSelected = false;
                element.returnFromTop();
            }//if
        }));

        if (!(except instanceof NetworkLinkBlank)) {
            this._abortLinkCreation();
        }//if
        this.selectedElement = undefined;
        return this;
    }//deselectAllElements


    /** Checks if more than one component is selected */
    public get multipleComponentsSelected() {
        if (!this._selectedElement)
            return false;
        
        let n = 0;
        for (const controller of this.networkComponents.values()) {
            if (controller.component.isSelected && ++n > 1) {
                return true;
            }//if
        }//for
        return false;
    }//multipleComponentsSelected


    /**
     * Converts screen coordinates to the user-space coordinates
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
     * Converts user-space coordinates to the screen coordinates
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
    public newLinkBlank: {value: NetworkLinkBlank|undefined} = reactive({value: undefined});

    /**
     * Completes the new link creation (for private use only)
     * @param toConnectionPoint The connection point, which will be the end of the new link
     */
    public _completeLinkCreation(toConnectionPoint?: ConnectionPoint)
    {
        const to = toConnectionPoint ? 
            {conn: toConnectionPoint} :
            {pos: {...this.newLinkBlank.value!.end}};
        const _class = this.newLinkBlank.value!._class;
        const newLink = _class instanceof LinkBundleClass ?  
            new LinkBundle(this, _class, {from: this.newLinkBlank.value!.start, to}) : 
            new NetworkLink(this, _class, {from: this.newLinkBlank.value!.start, to});
        newLink.initVertices();
        const op = newLink instanceof LinkBundle ? new CreateBundleOp(newLink) : new AddLinkOp(newLink);
        this.undoStack.execAndCommit(op);
        this.newLinkBlank.value = undefined;
    }//_completeLinkCreation

    /**
     * Aborts the new link creation (for private use only)
     */
    public _abortLinkCreation()
    {
        if (this.newLinkBlank.value) {
            this.newLinkBlank.value = undefined;
        }//if
    }//_abortLinkCreation

    /** Inactivates temporarily normal link behavior and reactivity (for internal use) */
    public _allLinksFreezed = false;

    /** Temporarily makes all connections points visible (for internal use) */
    readonly _showAllConnectionPoints = reactive({value: false}); 
    //!!! workaround for some Vue bug: normal "ref" doesn't work in this context


    /** 
     * Starts dragging the selected components following the leading one 
     * @param leader The object is going to be dragged (directly)
     * @param operation The operation being performed
    */
    public _startSelectionDragging(leader: unknown, operation: SelectionMoveOp)
    {
        for (const controller of operation.controllers) {
            if (controller.component.isSelected && controller !== leader) {
                controller._startDrag();
            }//if
        }//for
        for (const area of operation.areas) {
            if (area.isSelected && area !== leader) {
                area._startDrag();
            }//if
        }//for
    }//_startSelectionDragging

    /** 
     * Performs a step of dragging the selected components following the leading one 
     * @param effectiveMove The effective (current) move of the leading component
     * @param leader The object being dragged (directly)
    */
    public _dragSelection(effectiveMove: Shift, leader: unknown)
    {
        const operation = this.undoStack.currentOperation as SelectionMoveOp;
        for (const controller of operation.controllers) {
            if (controller.component.isSelected && controller !== leader) {
                controller.moveFromStartPos(effectiveMove);
            }//if
        }//for
        for (const area of operation.areas) {
            if (area.isSelected && area !== leader) {
                area.moveFromStartPos(effectiveMove);
            }//if
        }//for
    }//_dragSelection

    /** 
     * Finishes dragging the selected components following the leading one 
     * @param leader The controller of the component was being dragged (directly)
    */
    public _endSelectionDragging(leader: unknown)
    {
        const operation = this.undoStack.currentOperation as SelectionMoveOp;
        for (const controller of operation.controllers) {
            if (!this.animateComponentDragging)
                controller.updateConnectionPoints();
            if (controller.component.isSelected && controller !== leader) {
                this.emit("component-moved", controller);
            }//if
        }//for
        const effectiveMove = operation.effectiveMove;
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

        /**
         * Creates a new network component and places it ont the drawing
         * @param componentClass The class of the component to be created
         * @param position A position where the new component's origin should be placed
         * @param coordSystem A coord system type for the position
         */
        createComponent: (componentClass: NetworkComponentClass, position?: Position, coordSystem?: "screen"|"drawing") =>
        {
            const newComponent = new NetworkComponent(this, componentClass);
            const origin = !position ? {x: this.logicalBox.width/2, y: this.logicalBox.height/2} :
                coordSystem !== "drawing" ? this.applyScreenCTM(position) : 
                {...position};
            const controller = new NetworkComponentController(this, newComponent, {origin});
            this.undoStack.execAndCommit(new ComponentAddOp(controller));
        },//createComponent

        /**
         * Creates a new component using the original as a prototype
         * @param original The component to duplicate
         */
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
            this.newLinkBlank.value = new NetworkLinkBlank(this, linkClass, from);
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
         * @param linkID The link this vertex belongs
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
            const vertex = link.createVertex(segmentNumber, this.applyScreenCTM(mousePos));
            this.undoStack.execAndCommit(new AddVertexOp(vertex));
            this.emit("link-vertex-added", vertex);
            return vertex;
        },//addLinkVertex

        /**
         * Aligns (or at least tries to) a link vertex to its neighbors
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
         * Aligns (or at least tries to) all link vertices to their neighbors
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
            let {vertex} = vertexSpec as {vertex: LinkVertex};
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
         * Creates a new drawing area and places it on the drawing
         * @param componentClass The class of the area to be created
         * @param position A position where the new area's origin should be placed
         * @param coordSystem A coord system type for the position
         */
        createArea: (areaClass: DrawingAreaClass, position?: Position, coordSystem?: "screen"|"drawing") =>
        {
            const origin = !position ? {x: this.logicalBox.width/2, y: this.logicalBox.height/2} :
                coordSystem !== "drawing" ? this.applyScreenCTM(position) : 
                {...position};
            const oppositeCorner = {
                x: origin.x + Math.min(this.logicalWidth/2, this.logicalWidth - origin.x) * 0.8,
                y: origin.y + Math.min(this.logicalHeight/2, this.logicalHeight - origin.y) * 0.8,
            }
            const newArea = new DrawingArea(this, areaClass, {vertices: [
                {pos: origin},
                {pos: {x: oppositeCorner.x, y: origin.y}},
                {pos: oppositeCorner},
                {pos: {x: origin.x, y: oppositeCorner.y}},
            ]});
            this.undoStack.execAndCommit(new AddAreaOp(newArea));
        },//createArea

        /**
         * Creates a new area using the original as a prototype
         * @param original The area to duplicate
         */
        duplicateArea: (original: DrawingArea) =>
        {
            let name: string;
            for (let n = 1; (name = `${original.name}.${n}`) && this.areasByName.has(name); n++) {/**/}
            const props = clone(original.props);
            const shift = {x: 20, y: 20};
            const vertices = original.vertices.map(v => {
                return {
                    pos: {x: v.anchor.pos.x + shift.x, y: v.anchor.pos.y + shift.y}, 
                    geometry: v.geometry.copy().move(shift),
                }
            });
            const newArea = new DrawingArea(this, original.getClass(), {name, props, vertices});
            this.undoStack.execAndCommit(new AddAreaOp(newArea));
            nextTick(() => newArea.selectThis());
        },//duplicateArea

        /**
         * Move area one step up in z-order
         * @param area An area to move
         */
        moveAreaUp: (area: DrawingArea) => {
            this.undoStack.execAndCommit(new AreaMoveUpOp(area));
        },//moveAreaUp

        /**
         * Move area to the top in z-order
         * @param area An area to move
         */
        moveAreaToTop: (area: DrawingArea) => {
            this.undoStack.execAndCommit(new AreaMoveToTopOp(area));
        },//moveAreaToTop

        /**
         * Move area one step down in z-order
         * @param area An area to move
         */
        moveAreaDown: (area: DrawingArea) => {
            this.undoStack.execAndCommit(new AreaMoveDownOp(area));
        },//moveAreaUp

        /**
         * Move area to the bottom in z-order
         * @param area An area to move
         */
        moveAreaToBottom: (area: DrawingArea) => {
            this.undoStack.execAndCommit(new AreaMoveToBottomOp(area));
        },//moveAreaToBottom
    
        /**
         * Deletes an Area using an undoable editor operation
         * @param areaID A an ID of the Area to delete
         */
        deleteArea: (areaID: number) =>
        {
            const area = this.getAreaById(areaID);
            if (!area) {
                console.error(`Attempt to delete non-existent area (id=${areaID})`);
                return;
            }//if
            area.isSelected = false;
            area.returnFromTop();
            this.undoStack.execAndCommit(new DeleteAreaOp(area));
        },//deleteArea
        
        /**
         * Adds an area vertex
         * @param areaID The area this vertex belongs
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
            const vertex = area.createVertex(segmentNumber, this.applyScreenCTM(mousePos));
            this.undoStack.execAndCommit(new AddVertexOp(vertex));
            this.emit("area-vertex-added", vertex);
            return vertex;
        },//addAreaVertex
        
        /**
         * Sets an area segment type
         * @param areaID The area this segment belongs
         * @param segmentNumber The seq number of the segment, which should be set
         * @param type The new type of the segment
         */
        setAreaSegmentType: (areaID: number, segmentNumber: number, type: AreaSegmentType) =>
        {
            const area = this.getAreaById(areaID);
            if (!area) {
                throw new KresmerException(`Attempt to set the type of the segment of the non-existent area (id=${areaID})`);
            }//if
            const vertex = area.vertices[segmentNumber].nextNeighbour;
            if (!vertex) {
                throw new KresmerException(`Attempt to set the type of the non-existent segment (areaID=${areaID},segment=${segmentNumber})`);
            }//if
            if (vertex.geometry.type === type)
                return;
            const op = new VertexGeomChangeOp(vertex);
            this.undoStack.startOperation(op);
            vertex.changeType(type);
            this.undoStack.commitOperation();
            vertex.isSelected = true;
            this.emit("area-vertex-type-changed", vertex);
        },//setAreaSegmentType
        
        /**
         * Starts setting an area border beginning from the specified segment
         * @param areaID The area, which border should be set
         * @param segmentNumber The seq number of the segment where tne new border should begin
         */
        startSettingAreaBorder: (areaID: number, segmentNumber: number, borderClass: AreaBorderClass) =>
        {
            const area = this.getAreaById(areaID);
            if (!area) {
                throw new KresmerException(`Attempt to set a border of the non-existent area (id=${areaID})`);
            }//if
            area.startSettingBorder(segmentNumber, borderClass);
        },//startSettingAreaBorder
        
        /**
         * Removes an area border
         * @param areaID The area, which border should be removed
         * @param segmentNumber The seq number of the segment the border covers
         */
        removeAreaBorder: (areaID: number, segmentNumber: number) =>
        {
            const area = this.getAreaById(areaID);
            if (!area) {
                throw new KresmerException(`Attempt to remove a border from the non-existent area (id=${areaID})`);
            }//if
            const border = area.getBorder(segmentNumber);
            if (!border) {
                throw new KresmerException(`Attempt to remove a non-existent area border area (id=${areaID},segment=${segmentNumber})`);
            }//if
            this.undoStack.execAndCommit(new RemoveAreaBorderOp(area, border));
            this.emit("area-border-removed", area, border);
        },//removeAreaBorder
        
        /**
         * Deletes a area vertex
         * @param vertexSpec The specifier of the vertex to delete (either direct ref or (areaID, vertexNumber) pair)
         */
        deleteAreaVertex: (vertexSpec: AreaVertexSpec) =>
        {
            let {vertex} = vertexSpec as {vertex: AreaVertex};
            if (!vertex) {
                const {areaID, vertexNumber} = vertexSpec as {areaID: number, vertexNumber: number};
                const area = this.getAreaById(areaID);
                if (!area) 
                    throw new UndefinedAreaException({message: `Attempt to delete a vertex of the non-existent area (id=${areaID})`});
                vertex = area.vertices[vertexNumber];
                if (!vertex) 
                    throw new UndefinedVertexException({message: `Attempt to delete a non-existent vertex (id=${areaID})`});
            }//if
            this.undoStack.execAndCommit(new DeleteVertexOp(vertex));
            this.emit("area-vertex-deleted", vertex);
        },//deleteAreaVertex

        /**
         * Aligns (or at least tries to) all area vertices to their neighbors
         * @param areaSpec The specifier of the area (either direct ref or areaID)
         */
        alignAreaVertices: (areaSpec: AreaSpec) =>
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let area: DrawingArea|undefined = (areaSpec as any).area;
            if (!area) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const areaID = (areaSpec as any).areaID;
                area = this.getAreaById(areaID);
                if (!area) 
                    throw new UndefinedAreaException({message: `Attempt to align a vertex of the non-existent area (id=${areaID})`});
            }//if
            const op = new VerticesMoveOp(area.wouldAlignVertices);
            this.undoStack.startOperation(op);
            const verticesAligned = area.alignVertices() as Set<Vertex>;
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
        },//alignAreaVertices
                
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


/**
 * Vue plugin for using Kresmer component inside another Vue application
 */
export const kresmerPlugin = {
    install(app: App) {
        app.provide(Kresmer.ikApp, app);
        Kresmer._registerGlobals(app);
    }//install
}//kresmerPlugin


/** The name of the drawing to use when no explicit name is given */
const UNNAMED_DRAWING = "?unnamed?";

/** The set of optional values used for the Kresmer core- and Vue-components initialization */
export type KresmerInitOptions = {
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
    embedLibDataInDrawing?: boolean,
    libDataPriority?: LibDataPriority,
    autoAlignVertices?: boolean,
    animateComponentDragging?: boolean,
    animateLinkBundleDragging?: boolean,
    hrefBase?: string,
    streetAddressFormat?: StreetAddressFormat,
    uiLanguage?: string,
    libData?: LibData,
    libTranslationData?: LibTranslationData,
    drawingData?: string,
    backendServerURL?: string, 
    backendConnectionPassword?: string
}//KresmerInitOptions

/** 
 * A data collection for loading multiple libraries at once.
 * The format is Map<libName => xmlData>
 */
export type LibData = Map<string, string>;
/** 
 * A data collection for loading multiple library translations at once.
 * The format is Map<libName => languageCode => xmlData>
 */
export type LibTranslationData = Map<string, Map<string, string>>;

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

export class SelectionMoveOp extends EditorOperation {

    constructor(kresmer: Kresmer, public readonly leader: NetworkComponentController|DrawingArea)
    {
        super();
        this.leaderOldPos = this.leaderNewPos = {...leader.origin};
        for (const [, controller] of kresmer.networkComponents) {
            if (controller.component.isSelected) {
                this.controllers.push(controller);
                this.oldPos[controller.component.id] = {...controller.origin};
            }//if
        }//for
        for (const [, link] of kresmer.links) {
            if (link.isLoopback)
                continue;
            const fromComponent = link.vertices[0].anchor.conn?.hostElement ?? undefined;
            if (!fromComponent?.isSelected)
                continue;
            const toComponent = link.vertices[link.vertices.length-1].anchor.conn?.hostElement ?? undefined;
            if (!toComponent?.isSelected)
                continue;
            this.links.push(link);
            this.oldVertexPos[link.id] = link.vertices.map(v => ({...v.coords}));
        }//for
        for (const [, area] of kresmer.areas) {
            if (area.isSelected) {
                this.areas.push(area);
                this.oldVertexPos[area.id] = area.vertices.map(v => ({...v.coords}));
            }//if
        }//for
    }//ctor

    public controllers: NetworkComponentController[] = [];
    public links: NetworkLink[] = [];
    public areas: DrawingArea[] = [];
    public oldPos: Record<number, Position> = {};
    private oldVertexPos: Record<number, Position[]> = {};
    public newPos: Record<number, Position> = {};
    private newVertexPos: Record<number, Position[]> = {};
    public readonly leaderOldPos: Position;
    public leaderNewPos: Position;

    get effectiveMove() {
        return {
            x: this.leaderNewPos.x - this.leaderOldPos.x, 
            y: this.leaderNewPos.y - this.leaderOldPos.y
    }}//effectiveMove

    override onCommit(): void {
        this.leaderNewPos = {...this.leader.origin};
        for (const controller of this.controllers) {
            this.newPos[controller.component.id] = {...controller.origin};
        }//for
        for (const link of this.links) {
            this.newVertexPos[link.id] = link.vertices.map(v => ({...v.coords}));
        }//for
        for (const area of this.areas) {
            this.newVertexPos[area.id] = area.vertices.map(v => ({...v.coords}));
        }//for
    }//onCommit

    override exec(): void {
        for (const controller of this.controllers) {
            controller.origin = {...this.newPos[controller.component.id]};
            controller.updateConnectionPoints();
        }//for
        for (const link of this.links) {
            for (let i = 0; i < link.vertices.length; ++i) {
                if (!link.vertices[i].isConnected) {
                    link.vertices[i].pinUp(this.newVertexPos[link.id][i]);
                }//if
            }//for
            link.updateConnectionPoints();
        }//for
        for (const area of this.areas) {
            for (let i = 0; i < area.vertices.length; ++i) {
                area.vertices[i].pinUp(this.newVertexPos[area.id][i]);
            }//for
            area.updateConnectionPoints();
        }//for
    }//exec

    override undo(): void {
        for (const controller of this.controllers) {
            controller.origin = {...this.oldPos[controller.component.id]};
            controller.updateConnectionPoints();
        }//for
        for (const link of this.links) {
            for (let i = 0; i < link.vertices.length; ++i) {
                if (!link.vertices[i].isConnected) {
                    link.vertices[i].pinUp(this.oldVertexPos[link.id][i]);
                }//if
            }//for
            link.updateConnectionPoints();
        }//for
        for (const area of this.areas) {
            for (let i = 0; i < area.vertices.length; ++i) {
                area.vertices[i].pinUp(this.oldVertexPos[area.id][i]);
            }//for
            area.updateConnectionPoints();
        }//for
    }//undo
}//SelectionMoveOp


/** Data type for Vue templates */
export type Template = Element | string;

/** Options for the street address representation */
export const enum StreetAddressFormat {
    StreetFirst = "{street} {building-number}",
    BuildingFirst = "{building-number} {street}",
}//StreetAddressFormat

/** Class type of the generic drawing element */
export type DrawingElementClassType = typeof NetworkComponentClass | typeof NetworkLinkClass;
export type DrawingElementClassConstructor = NetworkComponentClass | NetworkLinkClass;

/** Options for choosing library data source when a conflict is detected */
export const enum LibDataPriority {
    preferSystem = "preferSystem",
    preferEmbedded = "preferEmbedded",
    useVersioning = "useVersioning",
}//LibDataPriority

// Re-export child classes to API
export {default as KresmerVue} from "./Kresmer.vue";
export {default as DrawingElement } from "./DrawingElement/DrawingElement";
export {default as DrawingElementClass, DrawingElementPropCategory, type PropTypeDescriptor, type DrawingElementClassProp} 
    from "./DrawingElement/DrawingElementClass";
export type {DrawingElementData} from "./DrawingElement/DrawingElement";
export {default as NetworkComponent} from "./NetworkComponent/NetworkComponent";
export {default as NetworkComponentClass} from "./NetworkComponent/NetworkComponentClass";
export {default as NetworkComponentController, type TransformMode} from "./NetworkComponent/NetworkComponentController";
export type { Position } from "./Transform/Transform";
export {default as NetworkLink} from "./NetworkLink/NetworkLink";
export {default as NetworkLinkClass} from "./NetworkLink/NetworkLinkClass";
export {default as DrawingArea} from "./DrawingArea/DrawingArea";
export {default as AreaVertex} from "./DrawingArea/AreaVertex";
export {default as DrawingAreaClass, AreaBorderClass} from "./DrawingArea/DrawingAreaClass";
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
export {type KresmerEvent} from "./KresmerEventHooks";