<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import LinkVertexVue from './LinkVertex.vue';
    export default {
        components: {LinkVertexVue}
    }
</script>

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
        @click.stop="model.selectLink()"
        @mouseenter="isHighlighted = true"
        @mouseleave="isHighlighted = false"
        >
        <polyline :points="vertices" style="stroke-width: 8px; stroke: transparent; fill: none;" />
        <polyline :points="vertices" :class="segmentClass" />
        <template v-if="model.isSelected">
            <template v-for="(vertex, i) in props.model.vertices">
                <link-vertex-vue v-if="i > 0 && i < props.model.vertices.length - 1" :key="`vertex${i}`"
                    :model="vertex"/>
            </template>
        </template>
    </g>
</template>