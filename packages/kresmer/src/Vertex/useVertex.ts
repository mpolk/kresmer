/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                   Abstract base Vertex composable
\***************************************************************************/
import { Ref, ref, inject, computed } from 'vue';
import Kresmer from '../Kresmer';
import Vertex from './Vertex';

export default function useVertex(model: Ref<Vertex>) {

    const isEditable = inject(Kresmer.ikIsEditable);
    const circle = ref<SVGElement>()!;
    const padding = ref<SVGElement>()!;

    const draggingCursor =  computed(() => {
        if (!model.value.parentElement.kresmer.isEditable)
            return "cursor: default";
        switch (model.value.dragConstraint) {
            case "x": return "cursor: ew-resize";
            case "y": return "cursor: ns-resize";
            default: return "cursor: move";
        }//switch
    });

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1) {
            if (isEditable) {
                event.preventDefault();
                model.value.startDrag(event);
            } else {
                model.value.parentElement.selectThis();
            }//if
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        isEditable && model.value.endDrag(event);
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && isEditable) {
            model.value.drag(event);
        }//if
    }//onMouseMove

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseLeave(event: MouseEvent)
    {
        // event.relatedTarget !== circle.value &&
        // event.relatedTarget !== padding.value &&
        // isEditable &&
        // model.value.endDrag(event) && 
        // model.value.link.restoreZPosition();
    }//onMouseLeave

    function onRightClick(event: MouseEvent)
    {
        model.value.onRightClick(event);
    }//onRightClick

    function onClick()
    {
        model.value.onClick();
    }//onClick

    function onDoubleClick()
    {
        model.value.onDoubleClick();
    }//onDoubleClick
        
    return {
        isEditable, padding, circle, draggingCursor, 
        onMouseDown, onMouseUp, onMouseMove, onMouseLeave, onRightClick, onClick, onDoubleClick,
    }
}//useVertex