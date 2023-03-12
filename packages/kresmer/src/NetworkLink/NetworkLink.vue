<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import { computed, ref, onBeforeMount, PropType } from 'vue';
    import NetworkLink from './NetworkLink';
    import LinkVertexVue from './LinkVertex.vue';
    
    export default {
        components: {LinkVertexVue}
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        model: {type: Object as PropType<NetworkLink>, required: true},
    });

    onBeforeMount(props.model.initVertices);

    const isHighlighted = ref(false);

    const linkClass = computed(() => {
        return {
            [props.model._class.name]: true,
            link: true,
            selected: props.model.isSelected,
            highlighted: isHighlighted.value,
        }
    })//linkClass

    const segmentClass = computed(() => {
        return {
            link: true,
            segment: true,
            selected: props.model.isSelected,
            highlighted: isHighlighted.value,
        }
    })//segmentClass

    const segmentStyle = computed(() => {
        return {
            cursor: props.model.isSelected ? "default" : "pointer",
        }
    })//segmentStyle

    const vertices = computed(() => 
        props.model.vertices.map(vertex => `${vertex.coords.x},${vertex.coords.y}`).join(" ")
    )//vertices
</script>

<template>
    <g :class="linkClass" 
        @mouseenter="isHighlighted = true"
        @mouseleave="isHighlighted = false"
        >
        <polyline :points="vertices" :class="segmentClass" style="fill: none;" :style="segmentStyle" />
        <template v-for="(vertex, i) in props.model.vertices" :key="`segment${i}`">
            <template v-if="i">
                <line :x1="model.vertices[i-1].coords.x" :y1="model.vertices[i-1].coords.y" 
                    :x2="vertex.coords.x" :y2="vertex.coords.y" 
                    class="padding" style="stroke: transparent; fill: none;" 
                    @click.self="model.onClick(i - 1, $event)"
                    @contextmenu.self="model.onRightClick(i - 1, $event)"
                    @dblclick.self="model.onDoubleClick(i - 1, $event)"
                    :style="segmentStyle"
                    />
            </template>
        </template>
        <template v-for="(vertex, i) in props.model.vertices" :key="`vertex${i}`">
            <link-vertex-vue :model="vertex"/>
        </template>
    </g>
</template>