/* eslint "@typescript-eslint/no-unused-vars": [2, {"args": "none"}] */
/* eslint "@typescript-eslint/no-empty-function": [0, "decoratedFunctions"] */
/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *   Event-related features for incorporating to the main Kresmer class
\**************************************************************************/

import NetworkComponentController, { TransformMode } from "./NetworkComponent/NetworkComponentController";

/** A list of Kresmer events along with correponding handler definitions */
type KresmerEventHooks = {
    "drawing-scale":                    (newScale: number) => void;
    "drawing-mouse-enter":              () => void;
    "drawing-mouse-leave":              () => void;
    "component-mouse-enter":            (controller: NetworkComponentController) => void;
    "component-mouse-leave":            (controller: NetworkComponentController) => void;
    "component-move-started":           (controller: NetworkComponentController) => void;
    "component-moved":                  (controller: NetworkComponentController) => void;
    "component-entered-transform-mode": (controller: NetworkComponentController, 
                                         mode: TransformMode) => void;
    "component-transform-started":      (controller: NetworkComponentController) => void;
    "component-transformed":            (controller: NetworkComponentController) => void;
    "component-exited-transform-mode":  (controller: NetworkComponentController) => void;
    "component-right-click":            (controller: NetworkComponentController, 
                                         target: "component"|"transform-box", 
                                         nativeEvent: MouseEvent) => void;
    "hint": (hint: string) => void;
}//KresmerEventHooks

/** Event names alone */
export type KresmerEvent = keyof KresmerEventHooks;

/** Event-related features for incorporating to the main Kresmer class */
export default class KresmerEventFeatures {

    /** The map (event => handler) */
    protected externalHandlers: Partial<Record<KresmerEvent, (...args: unknown[]) => void>> = {};

    /** Sets up the handler for the specified event
     * @param event The event to setup handler for
     * @param handler The handler to set
     */
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


    /**
     * Is called when the global drawing scale changed occurs
     * @param newScale A new scale value
     */
    @overridableHandler("drawing-scale")
    protected onDrawingScale(newScale: number) {}

    /**
     * Is called when the mouse cursor enters a drawing visible area
     * @param controller The controller of the component
     */
    @overridableHandler("drawing-mouse-enter")
    public onDrawingMouseEnter() {}

    /**
     * Is called when the mouse cursor leaves a drawing visible area
     * @param controller The controller of the component
     */
    @overridableHandler("drawing-mouse-leave")
    public onDrawingMouseLeave() {}

    /**
     * Is called when the mouse cursor enters a network component visible area
     * @param controller The controller of the component
     */
     @overridableHandler("component-mouse-enter")
     public onComponentMouseEnter(controller: NetworkComponentController) {}
 
     /**
      * Is called when the mouse cursor leaves a network component visible area
      * @param controller The controller of the component
      */
     @overridableHandler("component-mouse-leave")
     public onComponentMouseLeave(controller: NetworkComponentController) {}
  
    /**
     * Is called when a network component move starts
     * @param controller The controller of the component starting to move
     */
    @overridableHandler("component-move-started")
    public onComponentMoveStart(controller: NetworkComponentController) {}
 
    /**
     * Is called when a network component had been moved (dragged)
     * @param controller The controller of the component been moved
     */
    @overridableHandler("component-moved")
    public onComponentMoved(controller: NetworkComponentController) {}

    /**
     * Is called when a network component has entered transform mode
     * @param controller The controller of the component entered mode
     * @param mode Specific mode that was entered, i.e. "scaling"|"rotation"
     */
    @overridableHandler("component-entered-transform-mode")
    public onComponentEnteringTransformMode(controller: NetworkComponentController, 
                                                   mode: TransformMode) {}

    /**
     * Is called when a network component transform starts
     * @param controller The controller of the component starting to transform
     */
    @overridableHandler("component-transform-started")
    public onComponentTransformStart(controller: NetworkComponentController) {}
  
    /**
     * Is called when a network component had been transformed
     * @param controller The controller of the component been transformed
     */
    @overridableHandler("component-transformed")
    public onComponentTransformed(controller: NetworkComponentController) {}

    /**
     * Is called when a network component has exited transform mode
     * @param controller The controller of the component entered mode
     */
    @overridableHandler("component-exited-transform-mode")
    public onComponentExitingTransformMode(controller: NetworkComponentController) {}

    /**
     * Is called when a network component is right-clicked
     * @param component The component been transformed
     */
    @overridableHandler("component-right-click")
    protected onComponentRightClick(controller: NetworkComponentController, 
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
function overridableHandler<Event extends KresmerEvent>(event: Event)
{
    return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor)
    {
        descriptor.value = function(this: KresmerEventFeatures, ...args: Parameters<KresmerEventHooks[Event]>) {
            this.externalHandlers[event]?.apply(this, args);
        }
    }
}//overridableHandler
