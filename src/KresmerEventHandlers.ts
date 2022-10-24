/* eslint "@typescript-eslint/no-unused-vars": [2, {"args": "none"}] */
/* eslint "@typescript-eslint/no-empty-function": [0, "decoratedFunctions"] */
/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *             Events an event handlers for the main class
\**************************************************************************/

import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { TransformMode } from "./NetworkComponent/NetworkComponentController";

/** Events an event handlers for the main Kresmer class */
export default class KresmerEventHandlers {

    protected externalHandlers: Record<string, (...args: unknown[]) => void> = {};

    /**
     * Sets a handler fired after the drawing scale was changed
     * @param event 
     * @param handler 
     */
    public on(event: "scale-changed", 
              handler: (newScale: number) => void): KresmerEventHandlers;

    /**
     * Sets a handler fired after a network component move (dragging) started
     * @param event 
     * @param handler 
     */
    public on(event: "network-component-move-started", 
              handler: (controller: NetworkComponentController) => void): KresmerEventHandlers;

    /**
     * Sets a handler fired after a network component had been moved (dragged)
     * @param event 
     * @param handler 
     */
     public on(event: "network-component-moved", 
               handler: (controller: NetworkComponentController) => void): KresmerEventHandlers;

    /**
     * Sets a handler fired after a network component transform started
     * @param event 
     * @param handler 
     */
     public on(event: "network-component-transform-started", 
               handler: (controller: NetworkComponentController) => void): KresmerEventHandlers;

    /**
     * Sets a handler fired after a network component had been transformed
     * @param event 
     * @param handler 
     */
     public on(event: "network-component-transformed", 
               handler: (controller: NetworkComponentController) => void): KresmerEventHandlers;

    /**
     * Sets a handler fired after a network component had been transformed
     * @param event 
     * @param handler 
     */
     public on(event: "component-right-click", 
               handler: (component: NetworkComponent, 
                         target: "component"|"transform-box", 
                         nativeEvent: MouseEvent) => void): KresmerEventHandlers;

    /**
     * Sets a handler for the current situation hint setting
     * @param event 
     * @param handler 
     */
     public on(event: "hint", handler: (hint: string) => void): KresmerEventHandlers;

    /**
     * Sets a handler for the generic event
     * @param event An event to be handled
     * @param handler A handler for this event
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public on(event: string, handler: (...args: any[]) => void)
    {
        this.externalHandlers[event] = handler;
        return this;
    }//on

    /**
     * Disables handling of the specified event
     * @param event 
     */
    public off(event: string)
    {
        delete this.externalHandlers[event];
        return this;
    }//off

    /** Utility method that invokes an external handler for the specified event 
     * if this handler was registered */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public invokeExternalHandler(event: string, ...args: any[])
    {
        if (event in this.externalHandlers)
            this.externalHandlers[event].apply(this, args);
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

}//KresmerEventHandlers


// Decorator for the event hadling methods defined in this class
function overridableHandler(event: string)
{
    return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor)
    {
        descriptor.value = function(this: KresmerEventHandlers, ...args: unknown[]) {
            this.invokeExternalHandler(event, ...args);
        }
    }
}//overridableHandler
