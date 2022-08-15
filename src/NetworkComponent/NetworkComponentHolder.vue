<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
<*************************************************************************** -->

<script lang="ts">
    import { ref, computed, onMounted, getCurrentInstance } from 'vue';
    import TransformBox from '../Transform/TransformBox.vue';
    import { NetworkComponentHolderProps } from "./NetworkComponentController";

    export default {
        components: { TransformBox },
    }
</script>

<script setup lang="ts">
    defineProps(NetworkComponentHolderProps);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const svg = ref<SVGGraphicsElement>()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const trGroup = ref<SVGGraphicsElement>()!;

    const bBox = computed(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return svg.value?.getBBox({stroke: true});
    })//bBox

    const center = computed(() => {
        const r = bBox.value;
        if (r)
            return {x: r.x + r.width/2, y: r.y + r.height/2};
        else
            return {x: "center", y: "center"};
    })//center

    onMounted(() => {
        getCurrentInstance()?.proxy?.$forceUpdate();
    })
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
        <TransformBox v-if="isBeingTransformed" :b-box="bBox!" ref="trBox"/>
    </svg>
</template>