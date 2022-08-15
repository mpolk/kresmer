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

    const center = computed(() => {
        const r = bBox.value;
        if (r)
            return {x: r.x + r.width/2, y: r.y + r.height/2};
        else
            return {x: "center", y: "center"};
    })//center


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
    <svg ref="svg" :x="origin!.x" :y="origin!.y" 
        class="network-component" 
        :class="{
            highlighted: isHighlighted, 
            dragged: isDragged, 
            beingTransformed: isBeingTransformed
        }"
        >
        <g ref="trGroup" :transform="transform">
            <slot></slot>
        </g>
        <TransformBox v-if="isBeingTransformed" :b-box="bBox!" :transform-mode="transformMode" 
                      ref="trBox"
                      @box-clicked="onTransformBoxClick"
                      @box-right-clicked="onTransformBoxRightClick"
                      />
    </svg>
</template>