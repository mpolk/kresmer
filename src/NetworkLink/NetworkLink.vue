<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Component - a generic network element instance 
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, onBeforeMount, PropType } from 'vue';
    import NetworkLink from './NetworkLink';

    const props = defineProps({
        model: {type: Object as PropType<NetworkLink>, required: true},
    });

    onBeforeMount(props.model.initVertices);

    const vertices = computed(() => props.model.vertices
        .map((vertex) => `${vertex.coords.x},${vertex.coords.y}`)
        .join(' '));
</script>

<template>
    <g :class="model._class.name">
        <polyline :points="vertices" class="segment" />
    </g>
</template>