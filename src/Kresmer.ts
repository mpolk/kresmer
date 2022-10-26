/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, computed, createApp, InjectionKey, reactive } from "vue";
import KresmerVue from "./Kresmer.vue";
import KresmerEventFeatures from "./KresmerEventHandlers";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController from "./NetworkComponent/NetworkComponentController";
import { NetworkComponentHolderProps } from "./NetworkComponent/NetworkComponentHolder.d";
import { Position, Transform } from "./Transform/Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import LibraryParser from "./parsers/LibraryParser";
import DrawingParser from "./parsers/DrawingParser";
import TransformBox from "./Transform/TransformBox.vue"
import NetworkComponentHolder from "./NetworkComponent/NetworkComponentHolder.vue";


/**
 * The main class implementing the most of the Kresmer public API
 * Also acts as a proxy for the root vue-component of Kresmer
 */
export default class Kresmer extends KresmerEventFeatures {

    /** Kresmer vue-component App */
    readonly appKresmer: App;
    /** Kresmer vue-component itself */
    readonly vueKresmer: InstanceType<typeof KresmerVue>;
    /** A symbolic key for the Kresmer instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Kresmer>;

    constructor(mountPoint: string|HTMLElement, options?: {
        drawingWidth?: number | string,
        drawingHeight?: number | string,
        viewWidth?: number,
        viewHeight?: number,
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
            
        this.appKresmer = createApp(KresmerVue, {
            controller: this,
            networkComponents: this.networkComponents,
            drawingWidth: this.drawingWidth,
            drawingHeight: this.drawingHeight,
            viewWidth: this.viewWidth,
            viewHeight: this.viewHeight,

            onDrawingScale: this.onDrawingScale.bind(this),
        });

        this.appKresmer
            .component("TransformBox", TransformBox)
            .component("NetworkComponentHolder", NetworkComponentHolder);
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

    /**
     * A singleton list of all Component Classes, registered by Kresmer
     */
    protected static readonly registeredClasses: Record<string, NetworkComponentClass> = {};

    /**
     * Registers a Network Component Class in the Kresmer and registers
     * the corresponding new component in the Vue application
     * 
     * @param componentClass A Network Component Class to register
     */
    public registerNetworkComponentClass(componentClass: NetworkComponentClass) 
    {
        this.appKresmer
            .component(componentClass.vueName, 
            {
                template: componentClass.template,
                props: {
                    ...componentClass.props,
                    componentId: {type: Number},
                    componentName: {type: String},
                },
            })
            .component(componentClass.vueHolderName, 
            {
                setup(props) {
                    const componentProps = computed(() => {
                        const pr = {...props};
                        for (const key of Object.keys(NetworkComponentHolderProps)) {
                            delete pr[key];
                        }//for
                        return pr;
                    });
                    return {componentProps};
                },
                template: `\
                    <NetworkComponentHolder 
                            :origin="origin"
                            :transform="transform?.toCSS()"
                            :is-highlighted="isHighlighted"
                            :is-dragged="isDragged"
                            :is-being-transformed="isBeingTransformed"
                            >
                        <component is="${componentClass.vueName}" v-bind="componentProps">
                            <slot></slot>
                        </component>
                    </NetworkComponentHolder>`,
                props: {
                    ...componentClass.props,
                    ...NetworkComponentHolderProps,
                    componentId: {type: Number},
                    componentName: {type: String},
                },
            });

        Kresmer.registeredClasses[componentClass.name] = componentClass;
        return this;
    }//registerNetworkComponentClass

    /**
     * Returns the registered Network Component Class with the given name
     * if exists or "undefined" otherwise
     * @param className Class name
     */
     public static getNetworkComponentClass(className: string)
     {
         return Kresmer.registeredClasses[className];
     }//getNetworkComponentClass

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
            } else {
                console.error(`${element.message}\nSource: ${element.source}`);
                wereErrors = true;
            }//if
        }//for
        return !wereErrors;
     }//loadLibrary
 

    /**
     * Components currently placed to the drawing
     */
     private readonly networkComponents = reactive<Record<string, NetworkComponentController>>({});

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
        return this;
    }//addPositionedNetworkComponent


    /**
     * Loads a component class library from the raw XML data
     * @param dwgData Library data
     */
    public loadDrawing(dwgData: string): boolean
    {
        console.debug("Loading drawing...");
        const parser = new DrawingParser(this);
        let wereErrors = false;
        for (const element of parser.parseXML(dwgData)) {
            //console.debug(element);
            if (element instanceof NetworkComponentController) {
                this.addPositionedNetworkComponent(element);
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
     * Searches for the NetworkComponentController with the specified ID
     * @param id An ID of the component to search for
     * @returns The component controller if found or "undefined" otherwise
     */
    public getComponentControllerById(id: number)
    {
        return this.networkComponents[id];
    }//getComponentLoavtionById
  

    /**
     * Returns the root SVG element
     */
    public get rootSVG()
    {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.vueKresmer.svg!;
    }//rootSVG


    /**
     * Resets the mode (transform etc.) for all network modes except the one specified
     */
    public resetAllComponentMode(except?: NetworkComponentController)
    {
        for (const id in this.networkComponents) {
            const controller = this.networkComponents[id];
            if (controller !== except)
                controller.resetMode();
        }//for
    }//resetAllComponentMode


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


    // Hints: suggestions for the user that Kresmer sends to the host UI and which
    // can be displayed in status bar or somewhere else
    private hintStack: string[] = [];
    private hint = "";
    
    /** Sets the current hint */
    public setHint(hint: string)
    {
        this.hint = hint;
        this.onHint(hint);
    }//setHint
    
    /** Pushes the current hint to the stack and the sets a new one */
    public pushHint(hint: string)
    {
        this.hintStack.push(this.hint);
        this.hint = hint;
        this.onHint(hint);
    }//pushHint
    
    /** Pops a hint from the stack and the sets it as a current one */
    public popHint()
    {
        const hint = this.hintStack.pop();
        this.hint = hint ? hint : "";
        this.onHint(this.hint);
    }//popHint
}//Kresmer
