<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box showing at the time of a component transformation
<*************************************************************************** -->

<script setup lang="ts">
import { PropType, computed } from 'vue';

    const props = defineProps({
        svg: {type: Object as PropType<SVGElement>, required: true},
    })

    const bBox = computed(() => {
        const bBox = props.svg.getBoundingClientRect();
        bBox.x = 0; bBox.y = 0;
        return bBox;
    })//bBox

</script>

<template>
    <rect :x="bBox.x" :y="bBox.x" :width="bBox.width" :height="bBox.height" class="tr-box"/>
</template>

<style>
    .tr-box {
        opacity: 1 !important;
        stroke: blue;
        fill: none;
    }
</style>
