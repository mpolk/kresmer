<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
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
        isEditable: {type: Boolean, required: true},
    });

    onBeforeMount(props.model.initVertices);

    const isHighlighted = ref(false);

    const vertices = computed(() => props.model.vertices
        .map((vertex) => `${vertex.coords.x},${vertex.coords.y}`)
        .join(' '));

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
    })//segmentClass
</script>

<template>
    <g :class="linkClass" 
        @click="model.selectLink()"
        @mouseenter="isHighlighted = true"
        @mouseleave="isHighlighted = false"
        >
        <polyline :points="vertices" class="padding" style="stroke: transparent; fill: none;" 
            @contextmenu.self="model.onRightClick($event)"
            :style="segmentStyle" />
        <polyline :points="vertices" :class="segmentClass" style="fill: none;" :style="segmentStyle"
            @contextmenu.self="model.onRightClick($event)"
            />
        <template v-if="model.isSelected">
            <template v-for="(vertex, i) in props.model.vertices" :key="`vertex${i}`">
                <link-vertex-vue :model="vertex" :is-editable="isEditable"/>
            </template>
        </template>
    </g>
</template>