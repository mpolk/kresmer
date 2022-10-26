/* eslint "@typescript-eslint/no-unused-vars": [2, {"args": "none"}] */
/* eslint "@typescript-eslint/no-empty-function": [0, "decoratedFunctions"] */
/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *   Event-related features for incorporating to the main Kresmer class
\**************************************************************************/

import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { TransformMode } from "./NetworkComponent/NetworkComponentController";

/** A list of Kresmer events along with correponding handler definitions */
type KresmerEventHooks = {
    "scale-changed": (newScale: number) => void;
    "network-component-move-started": (controller: NetworkComponentController) => void;
    "network-component-moved": (controller: NetworkComponentController) => void;
    "network-component-entered-transform-mode": (controller: NetworkComponentController, 
                                                 mode: TransformMode) => void;
    "network-component-transform-started": (controller: NetworkComponentController) => void;
    "network-component-transformed": (controller: NetworkComponentController) => void;
    "network-component-exited-transform-mode": (controller: NetworkComponentController) => void;
    "component-right-click": (component: NetworkComponent, 
                              target: "component"|"transform-box", 
                              nativeEvent: MouseEvent) => void;
    "hint": (hint: string) => void;
}//KresmerEventHooks

/** Event names alone */
export type KresmerEvent = keyof KresmerEventHooks;

/** Event-related features for incorporating to the main Kresmer class */
export default class KresmerEventFeatures {

    protected externalHandlers: Partial<Record<KresmerEvent, (...args: unknown[]) => void>> = {};

    public on<Event extends KresmerEvent>(event: Event, handler: KresmerEventHooks[Event]): KresmerEventFeatures;
    public on<Event extends KresmerEvent>(event: Event, handler: (...args: unknown[]) => void)
    {
        this.externalHandlers[event] = handler;
        return this;
    }//on

    /**
     * Disables handling of the specified event
     * @param event 
     */
    public off(event: KresmerEvent)
    {
        delete this.externalHandlers[event];
        return this;
    }//off

    /** Utility method that invokes an external handler for the specified event 
     * if this handler was registered */
    public invokeExternalHandler(event: KresmerEvent, ...args: unknown[])
    {
        this.externalHandlers[event]?.apply(this, args);
    }//invokeExternalHandler


    /**
     * Is called when the global drawing scale changed occurs
     * @param newScale A new scale value
     */
    @overridableHandler("scale-changed")
    protected onScaleChanged(newScale: number) {}

    /**
     * Is called when a network component move starts
     * @param controller The controller of the component starting to move
     */
    @overridableHandler("network-component-move-started")
    public onNetworkComponentMoveStart(controller: NetworkComponentController) {}

    /**
     * Is called when a network component had been moved (dragged)
     * @param controller The controller of the component been moved
     */
    @overridableHandler("network-component-moved")
    public onNetworkComponentMoved(controller: NetworkComponentController) {}

    /**
     * Is called when a network component has entered transform mode
     * @param controller The controller of the component entered mode
     * @param mode Specific mode that was entered, i.e. "scaling"|"rotation"
     */
    @overridableHandler("network-component-entered-transform-mode")
    public onNetworkComponentEnteringTransformMode(controller: NetworkComponentController, 
                                                   mode: TransformMode) {}

    /**
     * Is called when a network component transform starts
     * @param controller The controller of the component starting to transform
     */
    @overridableHandler("network-component-transform-started")
    public onNetworkComponentTransformStart(controller: NetworkComponentController) {}
  
    /**
     * Is called when a network component had been transformed
     * @param controller The controller of the component been transformed
     */
    @overridableHandler("network-component-transformed")
    public onNetworkComponentTransformed(controller: NetworkComponentController) {}

    /**
     * Is called when a network component has exited transform mode
     * @param controller The controller of the component entered mode
     */
    @overridableHandler("network-component-exited-transform-mode")
    public onNetworkComponentExitingTransformMode(controller: NetworkComponentController) {}

    /**
     * Is called when a network component is right-clicked
     * @param component The component been transformed
     */
    @overridableHandler("component-right-click")
    protected onComponentRightClick(component: NetworkComponent, 
                                    target: "component"|"transform-box", 
                                    nativeEvent: MouseEvent) {}

    /**
     * Is called when Kresmer proposes a hint for the current situation to present to the user
     * @param hint A hint to show
     */
    @overridableHandler("hint")
    protected onHint(hint: string) {}

}//KresmerEventFeatures


// Decorator for the event handling methods defined in this class
function overridableHandler(event: KresmerEvent)
{
    return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor)
    {
        descriptor.value = function(this: KresmerEventFeatures, ...args: unknown[]) {
            this.invokeExternalHandler(event, ...args);
        }
    }
}//overridableHandler
