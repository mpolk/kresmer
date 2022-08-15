/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, computed, createApp, reactive } from "vue";
import KresmerVue from "./Kresmer.vue";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { NetworkComponentHolderProps } from "./NetworkComponent/NetworkComponentController";
import { Position, Transform } from "./Transform";
import NetworkComponentClass from "./NetworkComponent/NetworkComponentClass";
import LibraryParser from "./parsers/LibraryParser";
import DrawingParser from "./parsers/DrawingParser";
import TransformBox from "./TransformBox.vue"
import NetworkComponentHolder from "./NetworkComponent/NetworkComponentHolder.vue";

/**
 * The main class implementing the most of the Kresmer public API
 * Also acts as a proxy for the Kresmer vue-component
 */
export default class Kresmer {

    /** Kresmer vue-component App */
    readonly appKresmer: App;
    /** Kresmer vue-component itself */
    readonly vueKresmer: InstanceType<typeof KresmerVue>;

    constructor(mountPoint: string|HTMLElement)
    {
        this.appKresmer = createApp(KresmerVue, {
            controller: this,
            networkComponents: this.networkComponents,
        });
        this.appKresmer.component("TransformBox", TransformBox)
            .component("NetworkComponentHolder", NetworkComponentHolder);
        this.vueKresmer = this.appKresmer.mount(mountPoint) as InstanceType<typeof KresmerVue>;
    }//ctor


    /**
     * A singleton list of all Component Classes, registerd by Kresmer
     */
    private static readonly registeredClasses: Record<string, NetworkComponentClass> = {};

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
      * Resets the mode (transform etc.) for all network modes excpet the one specified
      */
     public resetAllComponentMode(except?: NetworkComponentController)
     {
        for (const id in this.networkComponents) {
            const controller = this.networkComponents[id];
            if (controller !== except)
                controller.resetMode();
        }//for
     }//resetAllComponentMode
}//Kresmer
