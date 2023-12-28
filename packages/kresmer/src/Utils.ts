/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *    Utility functions
\**************************************************************************/

export function toCamelCase(s: string|null)
{
    if (!s) return "";
    return s.replaceAll(/-([a-z])/g, (_, p1) => p1.toUpperCase());
}//toCamelCase

export function toKebabCase(s: string|null)
{
    if (!s) return "";
    return s.replaceAll(/([A-Z])/g, (_, p1) => `-${p1.toLowerCase()}`);
}//toKebabCase

export function indent(indentLevel: number)
{
    return " ".repeat(indentLevel * 4);
}//indent

export function svgDataURI(content: string) {
    const body = content.replace(/"/g, "'");
    return 'data:image/svg+xml,' + encodeURIComponent(body);
}//svgDataURI

export function encodeHtmlEntities(s: string|null)
{
    if (!s) return "";
    return s.replace(/[<>&]/g, i =>  '&#'+i.charCodeAt(0)+';');
}//encodeHtmlEntities


export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>>
    & {
        [K in Keys]-?:
            Required<Pick<T, K>>
            & Partial<Record<Exclude<Keys, K>, undefined>>
    }[Keys]

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> 
    & {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
    }[Keys]


export function clone<T>(x: T): T
{
    if (Array.isArray(x))
        return x.map(el => clone(el)) as T;
    else if (typeof x === "object") {
        const y: Record<string, unknown> = {};
        for (const k in x) {
            y[k] = clone(x[k as keyof typeof x]);
        }//for
        return y as T;
    } else
        return x;
}//clone


// Our self-made implementation of mouse capture

/** An element that captures mouse events */
let mouseEventCaptureTarget: SVGElement|undefined;
/** A list of the mouse events to be captured */
let capturedMouseEvents: string[];

/**
 * Starts mouse event capturing
 * @param el The element mouse events should be captured for
 * @param events A list of the mouse events to be captured  (without the "mouse" prefix)
 */
export function captureMouseEvents(el: SVGElement, ...events: string[])
{
    mouseEventCaptureTarget = el;
    capturedMouseEvents = [];
    if (!events.length)
        events = ["move", "leave", "enter", "up"];
    for (const event of events) {
        const fullEventName = `mouse${event}`;
        capturedMouseEvents.push(fullEventName);
        window.addEventListener(fullEventName, dispatchCapturedEvent, {capture: true});
    }//for
    window.addEventListener('mouseup', releaseMouseEventsCapture, {capture: true, once: true});
}//captureMouseEvents

/** Releases mouse event capture */
export function releaseMouseEventsCapture()
{
    if (!mouseEventCaptureTarget)
        return;
    for (const event of capturedMouseEvents) {
        window.removeEventListener(event, dispatchCapturedEvent, {capture: true});
    }//for
    mouseEventCaptureTarget = undefined;
    capturedMouseEvents = [];
}//releaseMouseEventsCapture

/** Redirects captured mouse event to the capture target */
function dispatchCapturedEvent(event: Event) 
{
    if (event.type === "mouseup")
        releaseMouseEventsCapture();
    if (!mouseEventCaptureTarget || event.target === mouseEventCaptureTarget)
        return true;

    const oldEvent = event as MouseEvent;
    const newEvent = new MouseEvent(event.type, {
        detail: oldEvent.detail,
        view: oldEvent.view,
        clientX: oldEvent.clientX,
        clientY: oldEvent.clientY,
        screenX: oldEvent.screenX,
        screenY: oldEvent.screenY,
        ctrlKey: oldEvent.ctrlKey,
        shiftKey: oldEvent.shiftKey,
        altKey: oldEvent.altKey,
        metaKey: oldEvent.metaKey,
        button: oldEvent.button,
        buttons: oldEvent.buttons,
        relatedTarget: oldEvent.relatedTarget,
    });

    oldEvent.preventDefault();
    oldEvent.stopPropagation();
    oldEvent.stopImmediatePropagation();

    mouseEventCaptureTarget!.dispatchEvent(newEvent);
    return false;
}//dispatchCapturedEvent