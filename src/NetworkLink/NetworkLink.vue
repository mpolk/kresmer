<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Component - a generic network element instance 
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, ref, onBeforeMount, PropType } from 'vue';
    import NetworkLink from './NetworkLink';

    const props = defineProps({
        model: {type: Object as PropType<NetworkLink>, required: true},
        isSelected: {type: Boolean, default: false},
    });

    onBeforeMount(props.model.initVertices);

    const isHighlighted = ref(false);

    const vertices = computed(() => props.model.vertices
        .map((vertex) => `${vertex.coords.x},${vertex.coords.y}`)
        .join(' '));

    const linkClass = computed(() => {
        return {
            [props.model._class.name]: true,
            selected: props.isSelected,
            highlighted: isHighlighted.value,
        }
    })//linkClass

    const segmentClass = computed(() => {
        return {
            segment: true,
            selected: props.isSelected,
            highlighted: isHighlighted.value,
        }
    })//segmentClass
</script>

<template>
    <g :class="linkClass" 
        @click="model.selectLink()"
        @mouseenter="isHighlighted = true"
        @mouseleave="isHighlighted = false"
        >
        <polyline :points="vertices" style="stroke-width: 8px; stroke: transparent; fill: transparent;" />
        <polyline :points="vertices" :class="segmentClass" />
    </g>
</template>