<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
<*************************************************************************** -->

<script lang="ts">
    import { ref, computed, PropType } from 'vue';
    import TransformBox from '../Transform/TransformBox.vue';
    import NetworkComponentController, { NetworkComponentHolderProps } from "./NetworkComponentController";

    export default {
        components: { TransformBox },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        ...NetworkComponentHolderProps,
        controller: {type: Object as PropType<NetworkComponentController>},
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const svg = ref<SVGGraphicsElement>()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const trGroup = ref<SVGGraphicsElement>()!;

    const bBox = computed(() => {
        return svg.value?.getBBox({stroke: true});
    })//bBox

    let dragStartEvent: MouseEvent | undefined;

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && !props.transformMode) {
            event.preventDefault();
            if (!event.ctrlKey)
                props.controller?.startDrag(event);
            else
                props.controller?.enterTransformMode(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        !props.transformMode &&
        props.controller?.endDrag(event) && 
        props.controller?.restoreComponentZPosition();
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && !props.transformMode)
            props.controller?.drag(event);
    }//onMouseMove

    function onMouseLeave(event: MouseEvent)
    {
        !props.transformMode &&
        props.controller?.endDrag(event) && 
        props.controller?.restoreComponentZPosition();
    }//onMouseLeave

    function onMouseDownInTransformBox(event: MouseEvent)
    {
        if (event.buttons === 1) {
            dragStartEvent = event;
        }//if
    }//onMouseDownInTransformBox

    function onMouseUpInTransformBox(event: MouseEvent)
    {
        dragStartEvent = undefined;
        props.controller?.endDrag(event);
    }//onMouseUpInTransformBox

    function onMouseMoveInTransformBox(event: MouseEvent)
    {
        if (dragStartEvent) {
            props.controller?.startDrag(dragStartEvent);
            dragStartEvent = undefined;
        }//if

        if (event.buttons & 1) {
            props.controller?.drag(event);
        }//if
    }//onMouseMoveInTransformBox

    function onMouseLeaveFromTransformBox(event: MouseEvent)
    {
        dragStartEvent = undefined;
        props.controller?.endDrag(event);
    }//onMouseLeaveFromTransformBox

    function onTransformBoxClick(event: MouseEvent) {
        props.controller?.onTransformBoxClick(event);
    }//onTransformBoxClick

    function onTransformBoxRightClick(event: MouseEvent) {
        props.controller?.onTransformBoxRightClick(event);
    }//onTransformBoxRightClick
</script>

<template>
    <svg ref="svg" v-bind="origin" 
        class="network-component" 
        :class="{
            highlighted: isHighlighted, 
            dragged: isDragged, 
            beingTransformed: isBeingTransformed
        }"
        >
        <g ref="trGroup" :transform="transform"
            @mousedown.prevent.stop="onMouseDown($event)"
            @mouseup.prevent="onMouseUp($event)"
            @mousemove.prevent="onMouseMove($event)"
            @mouseleave.prevent="onMouseLeave($event)"
            >
            <slot></slot>
        </g>
        <TransformBox v-if="transformMode" :origin="origin" :transform-mode="transformMode" 
                      ref="trBox" :b-box="bBox!"
                      @mouse-down-in-box="onMouseDownInTransformBox"
                      @mouse-move-in-box="onMouseMoveInTransformBox"
                      @mouse-up-in-box="onMouseUpInTransformBox"
                      @mouse-leave-from-box="onMouseLeaveFromTransformBox"
                      @box-clicked="onTransformBoxClick"
                      @box-right-clicked="onTransformBoxRightClick"
                      />
    </svg>
</template>

<style lang="scss">
    svg.network-component {
            &.dragged {
                outline: thin red solid;
            }
            
            &.beingTransformed > g {
                opacity: 0.5;
            }
    }
</style>