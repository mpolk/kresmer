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

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1) {
            props.controller?.startDrag(event);
        } else if (event.buttons & 2) {
            props.controller?.enterTransformMode(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        props.controller?.endDrag(event);
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1)
            props.controller?.drag(event);
    }//onMouseMove

    function onMouseLeave(event: MouseEvent)
    {
        props.controller?.endDrag(event);
    }//onMouseLeave

    function onTransformBoxClick(event: MouseEvent) {
        if (props.controller) {
            props.controller.onTransformBoxClick(event);
        }//if
    }//onTransformBoxClick

    function onTransformBoxRightClick(event: MouseEvent) {
        if (props.controller) {
            props.controller.onTransformBoxRightClick(event);
        }//if
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
        @mousedown.prevent.stop="onMouseDown($event)"
        @mouseup.prevent="onMouseUp($event)"
        @mousemove.prevent="onMouseMove($event)"
        @mouseleave.prevent="onMouseLeave($event)"
        >
        <g ref="trGroup" :transform="transform">
            <slot></slot>
        </g>
        <TransformBox v-if="transformMode" :origin="origin" :transform-mode="transformMode" 
                      ref="trBox" :b-box="bBox!"
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