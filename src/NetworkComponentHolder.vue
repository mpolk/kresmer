<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
<*************************************************************************** -->

<script lang="ts">
    import { PropType, ref } from 'vue';
    import { Position } from './NetworkComponentLocation';
    import TransformBox from './TransformBox.vue';

    export default {
        components: { TransformBox },
    }
</script>

<script setup lang="ts">
    defineProps({
        origin: {type: Object as PropType<Position>, required: true},
        transform: {type: String},
        svg: {type: Object as PropType<SVGGraphicsElement>},
        isHighlighted: {type: Boolean, default: false},
        isDragged: {type: Boolean, default: false},
        isBeingTransformed: {type: Boolean, default: false},
    })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const svg = ref<SVGGraphicsElement>()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const trGroup = ref<SVGGraphicsElement>()!;
</script>

<template>
    <svg ref="svg" :x="origin.x" :y="origin.y" 
        class="network-component" 
        :class="{highlighted: isHighlighted, dragged: isDragged, beingTransformed: isBeingTransformed}"
        >
        <g ref="trGroup" :transform="transform" transform-origin="center, center">
            <slot></slot>
        </g>
        <TransformBox v-if="isBeingTransformed" :svg="svg" ref="trBox"/>
    </svg>
</template>