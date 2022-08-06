/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    The main class implementing the most of the Kresmer public API
\**************************************************************************/

import { App, createApp, reactive } from "vue";
import KresmerVue from "./Kresmer.vue";
import NetworkComponent from "./NetworkComponent";
import NetworkComponentLocation, { Origin, Transform } from "./NetworkComponentLocation";
import NetworkComponentClass from "./NetworkComponentClass";
import LibraryParser from "./parsers/LibraryParser";
import DrawingParser from "./parsers/DrawingParser";

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
        this.appKresmer = createApp(KresmerVue, {networkComponents: this.networkComponents});
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
        this.appKresmer.component(componentClass.vueName, 
        {
            template: componentClass.template,
            props: {
                ...componentClass.props,
                origin: {type: Object, required: true},
                transform: {type: String},
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
     private readonly networkComponents = reactive<Record<string, NetworkComponentLocation>>({});

    /**
     * Adds a new Network Component to the content of the drawing
     * @param component A Network Component to add
     */
    public placeNetworkComponent(component: NetworkComponent,
                                 origin: Origin, transform?: Transform)
    {
        this.networkComponents[component.id] = new NetworkComponentLocation(
            component, {origin, transform});
        return this;
    }//placeNetworkComponent

    /**
     * Adds a new Network Component to the content of the drawing
     * @param location A Network Component to add
     */
    public addPositionedNetworkComponent(location: NetworkComponentLocation)
    {
        this.networkComponents[location.component.id] = location;
        return this;
    }//addPositionedNetworkComponent


    /**
     * Loads a component class library from the raw XML data
     * @param dwgData Library data
     */
    public loadDrawing(dwgData: string): boolean
    {
        console.debug("Loading drawing...");
        const parser = new DrawingParser();
        let wereErrors = false;
        for (const element of parser.parseXML(dwgData)) {
            //console.debug(element);
            if (element instanceof NetworkComponentLocation) {
                this.addPositionedNetworkComponent(element);
            } else {
                console.error(`${element.message}\nSource: ${element.source}`);
                wereErrors = true;
            }//if
        }//for
        return !wereErrors;
    }//loadDrawing
 
}//Kresmer
