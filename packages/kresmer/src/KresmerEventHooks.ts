/* eslint "@typescript-eslint/no-unused-vars": [2, {"args": "none"}] */
/* eslint "@typescript-eslint/no-empty-function": [0, "decoratedFunctions"] */
/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *   Event-related features for incorporating to the main Kresmer class
\**************************************************************************/

import ConnectionPointProxy from "./ConnectionPoint/ConnectionPointProxy";
import KresmerException from "./KresmerException";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkComponentController, { TransformMode } from "./NetworkComponent/NetworkComponentController";
import LinkVertex from "./NetworkLink/LinkVertex";
import NetworkLink from "./NetworkLink/NetworkLink";
import {toCamelCase} from "./Utils";

/** A list of Kresmer events along with correponding handler definitions */
class KresmerEventFormats  {
    "error":                            (error: KresmerException) => void;
    "got-dirty":                        (isDirty: boolean) => void;
    "drawing-scale":                    (newScale: number) => void;
    "drawing-mouse-enter":              () => void;
    "drawing-mouse-leave":              () => void;
    "canvas-right-click":               (nativeEvent: MouseEvent) => void;
    "component-loaded":                 (component: NetworkComponent) => boolean;
    "component-added":                  (controller: NetworkComponentController) => void;
    "component-deleted":                (controller: NetworkComponentController) => void;
    "component-selected":               (component: NetworkComponent, isSelected: boolean) => void;
    "component-mouse-enter":            (controller: NetworkComponentController) => void;
    "component-mouse-leave":            (controller: NetworkComponentController) => void;
    "component-move-started":           (controller: NetworkComponentController) => void;
    "component-being-moved":            (controller: NetworkComponentController) => void;
    "component-moved":                  (controller: NetworkComponentController) => void;
    "component-entered-transform-mode": (controller: NetworkComponentController, 
                                         mode: TransformMode) => void;
    "component-transform-started":      (controller: NetworkComponentController) => void;
    "component-being-transformed":      (controller: NetworkComponentController) => void;
    "component-transformed":            (controller: NetworkComponentController) => void;
    "component-exited-transform-mode":  (controller: NetworkComponentController) => void;
    "component-double-click":           (controller: NetworkComponentController, 
                                         nativeEvent: MouseEvent) => void;
    "component-right-click":            (controller: NetworkComponentController, 
                                         target: "component"|"transform-box", 
                                         nativeEvent: MouseEvent) => void;
    "mode-reset":                       () => void;
    "link-loaded":                      (component: NetworkLink) => boolean;
    "link-added":                       (link: NetworkLink) => void;
    "link-deleted":                     (link: NetworkLink) => void;
    "link-selected":                    (link: NetworkLink, isSelected: boolean) => void;
    "link-right-click":                 (link: NetworkLink, segmentNumber: number, mouseEvent: MouseEvent) => void;
    "link-double-click":                (link: NetworkLink, segmentNumber: number, mouseEvent: MouseEvent) => void;
    "link-vertex-added":                (vertex: LinkVertex) => void;
    "link-vertex-deleted":              (vertex: LinkVertex) => void;
    "link-vertex-move-started":         (vertex: LinkVertex) => void;
    "link-vertex-being-moved":          (vertex: LinkVertex) => void;
    "link-vertex-moved":                (vertex: LinkVertex) => void;
    "link-vertex-connected":            (vertex: LinkVertex) => void;
    "link-vertex-disconnected":         (vertex: LinkVertex, connectionPoint: ConnectionPointProxy) => void;
    "link-vertex-right-click":          (vertex: LinkVertex, mouseEvent: MouseEvent) => void;
    "connection-point-right-click":     (connectionPoint: ConnectionPointProxy) => void;
}//KresmerEventFormats

/** Event names alone */
export type KresmerEvent = keyof KresmerEventFormats;

/** Event-related features for incorporating to the main Kresmer class */
@checked
export default class KresmerEventHooks {

    /** The map (event => handler) */
    protected readonly eventHandlers = new KresmerEventFormats;

    /* The following two auxiliary maps a used for internal KresmerEventFeatures testing
       for completeness: whether all events have corresponding handler placeholders 
       (i.e. empty protected methods) defined.
       The first map collects all defined handler hooks
    */
    static readonly _definedHooks: Partial<{[event in KresmerEvent]: keyof KresmerEventHooks}> = {};
    // The second one contains all possible events
    static readonly _allEvents = new KresmerEventFormats;

    /** Sets up the handler for the specified event
     * @param event The event to setup handler for
     * @param handler The handler to set
     */
    public on<Event extends KresmerEvent>(event: Event, handler: KresmerEventFormats[Event]): KresmerEventHooks
    {
        this.eventHandlers[event] = handler;
        return this;
    }//on

    /**
     * Disables handling of the specified event
     * @param event 
     */
    public off(event: KresmerEvent)
    {
        delete this.eventHandlers[event];
        return this;
    }//off


    /**
     * Emits the specified event with the specified parameters
     * @param event Event to emit
     * @param args Arguments to pass to the handler
     */
    public emit<Event extends KresmerEvent>(event: Event, ...args: Parameters<KresmerEventFormats[Event]>): 
        ReturnType<KresmerEventFormats[Event]>
    {
        const placeholder = KresmerEventHooks._definedHooks[event];
        if (placeholder) {
            return (this[placeholder] as (...args: Parameters<KresmerEventFormats[Event]>) => ReturnType<KresmerEventFormats[Event]>)(...args);
        } else {
            throw new KresmerException(`emit: invalid event id "${event}"`);
        }//if
    }//emit


    /**
     * Is called when the error signal is emitted
     * @param message A error message
     */
    @overridableHandler("error")
    protected onError(error: KresmerException) {}

    /**
     * Is called when the dirtiness state change occurs
     * @param isDirty A new dirtiness state
     */
    @overridableHandler("got-dirty")
    protected onGotDirty(isDirty: boolean) {}

    /**
     * Is called when the global drawing scale change occurs
     * @param newScale A new scale value
     */
    @overridableHandler("drawing-scale")
    protected onDrawingScale(newScale: number) {}

    /**
     * Is called when the mouse cursor enters a drawing visible area
     */
    @overridableHandler("drawing-mouse-enter")
    protected onDrawingMouseEnter() {}

    /**
     * Is called when the mouse cursor leaves a drawing visible area
     */
    @overridableHandler("drawing-mouse-leave")
    protected onDrawingMouseLeave() {}

    /**
     * Is called on mouse click on the drawing canvas
     */
    @overridableHandler("canvas-right-click")
    protected onCanvasRightClick() {}

    /**
     * Is called when a network component is loaded from the drawing file
     * @param controller Th component been loaded
     */
    @overridableHandler("component-loaded")
    protected onComponentLoaded(component: NetworkComponent) {}

    /**
     * Is called when a network component is added to the drawing
     * @param controller The controller of the component been added
     */
    @overridableHandler("component-added")
    protected onComponentAdded(controller: NetworkComponentController) {}

    /**
     * Is called when a network component is deleted
     * @param controller The controller of the component been deleted
     */
    @overridableHandler("component-deleted")
    protected onComponentDeleted(controller: NetworkComponentController) {}

    /**
     * Is called when a network component is selected or deselected
     * @param controller The component been (de-)selected
     */
    @overridableHandler("component-selected")
    protected onComponentSelected(component: NetworkComponent, isSelected: boolean) {}

    /**
     * Is called when the mouse cursor enters a network component visible area
     * @param controller The controller of the component
     */
    @overridableHandler("component-mouse-enter")
    protected onComponentMouseEnter(controller: NetworkComponentController) {}

     /**
      * Is called when the mouse cursor leaves from the network component visible area
      * @param controller The controller of the component
      */
    @overridableHandler("component-mouse-leave")
    protected onComponentMouseLeave(controller: NetworkComponentController) {}
  
    /**
     * Is called when a network component move starts
     * @param controller The controller of the component starting to move
     */
    @overridableHandler("component-move-started")
    protected onComponentMoveStarted(controller: NetworkComponentController) {}
 
    /**
     * Is called when a network component is being moved (dragged)
     * @param controller The controller of the component is being moved
     */
    @overridableHandler("component-being-moved")
    protected onComponentBeingMoved(controller: NetworkComponentController) {}
 
    /**
     * Is called when a network component had been moved (dragged)
     * @param controller The controller of the component been moved
     */
    @overridableHandler("component-moved")
    protected onComponentMoved(controller: NetworkComponentController) {}
 
    /**
     * Is called when a network component has entered transform mode
     * @param controller The controller of the component entered mode
     * @param mode Specific mode that was entered, i.e. "scaling"|"rotation"
     */
    @overridableHandler("component-entered-transform-mode")
    protected onComponentEnteredTransformMode(controller: NetworkComponentController, 
                                               mode: TransformMode) {}

    /**
     * Is called when a network component transform starts
     * @param controller The controller of the component starting to transform
     */
    @overridableHandler("component-transform-started")
    protected onComponentTransformStarted(controller: NetworkComponentController) {}
  
    /**
     * Is called when a network component is being transformed
     * @param controller The controller of the component is being transformed
     */
    @overridableHandler("component-being-transformed")
    protected onComponentBeingTransformed(controller: NetworkComponentController) {}
  
    /**
     * Is called when a network component had been transformed
     * @param controller The controller of the component been transformed
     */
    @overridableHandler("component-transformed")
    protected onComponentTransformed(controller: NetworkComponentController) {}
 
    /**
     * Is called when a network component has exited transform mode
     * @param controller The controller of the component entered mode
     */
    @overridableHandler("component-exited-transform-mode")
    protected onComponentExitedTransformMode(controller: NetworkComponentController) {}

    /**
     * Is called when a network component is double-clicked
     * @param component The component been clicked
     */
    @overridableHandler("component-double-click")
    protected onComponentDoubleClick(controller: NetworkComponentController, 
                                     nativeEvent: MouseEvent) {}

    /**
     * Is called when a network component is right-clicked
     * @param component The component been right-clicked
     */
    @overridableHandler("component-right-click")
    protected onComponentRightClick(controller: NetworkComponentController, 
                                    target: "component"|"transform-box", 
                                    nativeEvent: MouseEvent) {}

    /**
     * Is called when mode reset was performed for all components
     */
    @overridableHandler("mode-reset")
    protected onModeReset() {}

    /**
     * Is called when a network link is loaded from the drawing file
     * @param controller The link been loaded
     */
    @overridableHandler("link-loaded")
    protected onLinkLoaded(link: NetworkLink) {}

    /**
     * Is called when a network component is added
     * @param link The link been added
     */
    @overridableHandler("link-added")
    protected onLinkAdded(link: NetworkLink) {}

    /**
     * Is called when a network component is deleted
     * @param link The link been deleted
     */
    @overridableHandler("link-deleted")
    protected onLinkDeleted(link: NetworkLink) {}

    /**
     * Is called when a network component is selected or deselected
     * @param link The link been selected
     */
    @overridableHandler("link-selected")
    protected onLinkSelected(link: NetworkLink, isSelected: boolean) {}

    /**
     * Is called upon right mouse click on the network link
     * @param link The link been clicked
     */
    @overridableHandler("link-right-click")
    protected onLinkRightClick(link: NetworkLink, segmentNumber: number, mouseEvent: MouseEvent) {}

    /**
     * Is called upon double mouse click on the network link
     * @param link The link been clicked
     */
    @overridableHandler("link-double-click")
    protected onLinkDoubleClick(link: NetworkLink, segmentNumber: number, mouseEvent: MouseEvent) {}
 
    /**
     * Is called when a network link vertex had been added
     * @param controller The vertex been added
     */
    @overridableHandler("link-vertex-added")
    protected onLinkVertexAdded(vertex: LinkVertex) {}
 
    /**
     * Is called when a network link vertex had been deleted
     * @param controller The vertex been deleted
     */
    @overridableHandler("link-vertex-deleted")
    protected onLinkVertexDeleted(vertex: LinkVertex) {}
  
    /**
     * Is called when a network link vertex move starts
     * @param controller The controller of the component starting to move
     */
    @overridableHandler("link-vertex-move-started")
    protected onLinkVertexMoveStarted(vertex: LinkVertex) {}
 
    /**
     * Is called when a network link vertex is being moved (dragged)
     * @param controller The vertex is being moved
     */
    @overridableHandler("link-vertex-being-moved")
    protected onLinkVertexBeingMoved(vertex: LinkVertex) {}
 
    /**
     * Is called when a network link vertex had been moved (dragged)
     * @param controller The vertex been moved
     */
    @overridableHandler("link-vertex-moved")
    protected onLinkVertexMoved(vertex: LinkVertex) {}
 
    /**
     * Is called when a network link vertex had been connected to some connection point
     * @param controller The vertex been moved
     */
    @overridableHandler("link-vertex-connected")
    protected onLinkVertexConnected(vertex: LinkVertex) {}
 
    /**
     * Is called when a network link vertex had been disconnected from the connection point
     * @param controller The vertex been moved
     */
    @overridableHandler("link-vertex-disconnected")
    protected onLinkVertexDisconnected(vertex: LinkVertex, connectionPoint: ConnectionPointProxy) {}

    /**
     * Is called upon right mouse click on the network link vertex
     * @param vertex The vertex been clicked
     */
    @overridableHandler("link-vertex-right-click")
    protected onLinkVertexRightClick(vertex: LinkVertex, mouseEvent: MouseEvent) {}

    /**
     * Is called upon right mouse click on the connection point
     * @param link The connection point been clicked
     */
    @overridableHandler("connection-point-right-click")
    protected onConnectionPointRightClick(connectionPoint: ConnectionPointProxy) {}

}//KresmerEventHooks


// Decorator for the event handling methods defined in this class
function overridableHandler<Event extends KresmerEvent>(event: Event)
{
    return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor)
    {
        const properMethodName = toCamelCase("on-" + event);
        if (propertyKey != properMethodName) {
            throw new KresmerException(`Method name "${propertyKey}" does not match the event id ("${event}")`);
        }//if

        KresmerEventHooks._definedHooks[event] = propertyKey as keyof KresmerEventHooks;
        descriptor.value = function(this: KresmerEventHooks, ...args: Parameters<KresmerEventFormats[Event]>) {
            const handler = this.eventHandlers[event];
            if (handler) {
                return (handler as (...args: unknown[]) => unknown)(...args);
            }//if
            return undefined;
        }//function
    }//function
}//overridableHandler

// Decorator checking if handler placeholers are defined for every event
// (a kind of self-testing)
function checked(target: typeof KresmerEventHooks)
{
    const missedPlaceholders: string[] = [];
    Object.getOwnPropertyNames(KresmerEventHooks._allEvents).forEach(event => {
        if (! (event in KresmerEventHooks._definedHooks))
            missedPlaceholders.push(event);
    })//foreach
    if (missedPlaceholders.length)
        throw new KresmerException("The following events have not handler placeholders defined:" +
            missedPlaceholders.join());
}//checked
