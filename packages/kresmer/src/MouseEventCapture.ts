// Our self-made implementation of mouse capture


export default class MouseEventCapture {

    /** An element that captures mouse events */
    private static target: SVGElement | undefined;
    /** A list of the mouse events to be captured */
    private static capturedEvents: string[];

    /**
     * Starts mouse event capturing
     * @param el The element mouse events should be captured for
     * @param events A list of the mouse events to be captured  (without the "mouse" prefix)
     */
    static start(el: SVGElement, ...events: string[]) {
        MouseEventCapture.target = el;
        MouseEventCapture.capturedEvents = [];

        if (!events.length)
            events = ["move", "leave", "enter", "up"];
        for (const event of events) {
            const fullEventName = `mouse${event}`;
            MouseEventCapture.capturedEvents.push(fullEventName);
            window.addEventListener(fullEventName, MouseEventCapture.dispatchCapturedEvent, { capture: true });
        } //for
        window.addEventListener('mouseup', MouseEventCapture.release, { capture: true, once: true });
    } //start

    /** Releases mouse event capture */
    static release() {
        if (!MouseEventCapture.target)
            return;
        for (const event of MouseEventCapture.capturedEvents) {
            window.removeEventListener(event, MouseEventCapture.dispatchCapturedEvent, { capture: true });
        } //for
        MouseEventCapture.target = undefined;
        MouseEventCapture.capturedEvents = [];
    } //release

    /** Redirects captured mouse event to the capture target */
    private static dispatchCapturedEvent(event: Event) {
        if (event.type === "mouseup")
        MouseEventCapture.release();
        if (!MouseEventCapture.target || event.target === MouseEventCapture.target)
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

        MouseEventCapture.target!.dispatchEvent(newEvent);
        return false;
    } //dispatchCapturedEvent

}//MouseEventCapture