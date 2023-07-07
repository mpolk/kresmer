<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Bundle - presentation code 
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, PropType } from 'vue';
    import LinkBundle from './LinkBundle';

    const props = defineProps({
        model: {type: Object as PropType<LinkBundle>, required: true},
    });

    const path = computed(() => {
        return props.model.vertices.map((vertex, i) => `${i ? 'L' : 'M'}${vertex.coords.x},${vertex.coords.y}`).join(" ");
    })//path
</script>

<template>
    <g class="link-bundle">
        <path :d="path" />
    </g>
</template>