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
        svg: {type: Object as PropType<SVGGraphicsElement>, required: true},
    })

    const bBox = computed(() => {
        return props.svg.getBBox({stroke: true});
    })//bBox

</script>

<template>
    <rect v-bind="bBox" class="tr-box"/>
</template>

<style>
    .tr-box {
        stroke: blue;
        fill: none;
    }
</style>
