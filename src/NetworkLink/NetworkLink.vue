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
    });

    onBeforeMount(props.model.initVertices);

    const isHighlighted = ref(false);

    const vertices = computed(() => props.model.vertices
        .map((vertex) => `${vertex.coords.x},${vertex.coords.y}`)
        .join(' '));

    const linkClass = computed(() => {
        return {
            [props.model._class.name]: true,
            selected: props.model.isSelected,
            highlighted: isHighlighted.value,
        }
    })//linkClass

    const segmentClass = computed(() => {
        return {
            segment: true,
            selected: props.model.isSelected,
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
        <template v-if="model.isSelected">
            <template v-for="(vertex, i) in props.model.vertices">
                <circle v-if="i > 0 && i < props.model.vertices.length - 1" :key="`vertex${i}`"
                    :cx="vertex.coords.x" :cy="vertex.coords.y" r="4px" class="vertex"/>
            </template>
        </template>
    </g>
</template>