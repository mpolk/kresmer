<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import { computed, ref, onBeforeMount, PropType, provide, onMounted } from 'vue';
    import NetworkLink, {linkMarkers} from './NetworkLink';
    import NetworkElement from '../NetworkElement';
    import LinkVertexVue from './LinkVertex.vue';
    
    export default {
        components: {LinkVertexVue}
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        model: {type: Object as PropType<NetworkLink>, required: true},
        startLabel: {type: String, required: false},
        endLabel: {type: String, required: false},
        startMarker: {type: String, required: false},
        endMarker: {type: String, required: false},
    });

    provide(NetworkElement.ikHostElement, props.model);

    onBeforeMount(props.model.initVertices);
    onMounted(() => {
        props.model.updateConnectionPoints();
    })

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

    const cursorStyle = computed(() => {
        return {
            cursor: props.model.isSelected ? "default" : "pointer",
        }
    })//segmentStyle

    const segmentStyle = computed(() => {
        return {
            cursor: cursorStyle.value.cursor,
            markerStart: props.startMarker === "arrow" ? `url(#${linkMarkers.arrow})` :
                props.startMarker === "circle" ? `url(#${linkMarkers.circle})` : 
                props.startMarker === "square" ? `url(#${linkMarkers.square})`: 
                props.startMarker === "diamond" ? `url(#${linkMarkers.diamond})`: 
                "none",
            markerEnd: props.endMarker === "arrow" ? `url(#${linkMarkers.arrow})` :
                props.endMarker === "circle" ? `url(#${linkMarkers.circle})` : 
                props.endMarker === "square" ? `url(#${linkMarkers.square})`: 
                props.endMarker === "diamond" ? `url(#${linkMarkers.diamond})`: 
                "none",
        }
    })//segmentStyle

    const path = computed(() => {
        const path = props.model.vertices.map(vertex => `L${vertex.coords.x},${vertex.coords.y}`).join(" ");
        return `M${props.model.vertices[0].coords.x},${props.model.vertices[0].coords.y} ${path}`;
    })//path

    const pathID = computed(() => `kre:link${props.model.id}path`)
</script>

<template>
    <g :class="linkClass" 
        @mouseenter="isHighlighted = true"
        @mouseleave="isHighlighted = false"
        >
        <path :id="pathID" :d="path" :class="segmentClass" style="fill: none;" :style="segmentStyle" />
        <text v-if="startLabel" class="label" style="cursor: default; text-anchor: start; dominant-baseline: ideographic;">
            <textPath :href="`#${pathID}`">{{startLabel}}</textPath>
        </text>
        <text v-if="endLabel" class="label" style="cursor: default; text-anchor: end; dominant-baseline: ideographic;">
            <textPath :href="`#${pathID}`" startOffset="98%">{{endLabel}}</textPath>
        </text>
        <template v-for="(vertex, i) in props.model.vertices" :key="`segment${i}`">
            <template v-if="i">
                <line :x1="model.vertices[i-1].coords.x" :y1="model.vertices[i-1].coords.y" 
                    :x2="vertex.coords.x" :y2="vertex.coords.y" 
                    class="padding" style="stroke: transparent; fill: none;" 
                    @click.self="model.onClick(i - 1, $event)"
                    @contextmenu.self="model.onRightClick(i - 1, $event)"
                    @dblclick.self="model.onDoubleClick(i - 1, $event)"
                    :style="cursorStyle"
                    />
            </template>
        </template>
        <template v-for="(vertex, i) in props.model.vertices" :key="`vertex${i}`">
            <link-vertex-vue :model="vertex"/>
        </template>
    </g>
</template>