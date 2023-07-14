<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import { computed, onBeforeMount, PropType, provide, onMounted } from 'vue';
    import NetworkLink from './NetworkLink';
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

    const linkClass = computed(() => {
        return {
            [props.model.getClass().name]: true,
            link: true,
            selected: props.model.isSelected,
            highlighted: props.model.isHighlighted,
        }
    })//linkClass

    const segmentClass = computed(() => {
        return {
            link: true,
            segment: true,
            selected: props.model.isSelected,
            highlighted: props.model.isHighlighted,
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
            markerStart: props.startMarker ? `url(#kre:link-marker-${props.startMarker})` : "none",
            markerEnd: props.endMarker ? `url(#kre:link-marker-${props.endMarker})` : "none",
        }
    })//segmentStyle

    const path = computed(() => {
        return props.model.vertices.map((vertex, i) => `${i ? 'L' : 'M'}${vertex.coords.x},${vertex.coords.y}`).join(" ");
    })//path

    const pathID = computed(() => `kre:link${props.model.id}path`);

    function segmentDataAttr(i: number)
    {
        return props.model.isBundle ? `${props.model.name}:${i}` : undefined;
    }//segmentDataAttr
</script>

<template>
    <g :class="linkClass" 
        @mouseenter="model.onMouseEnter"
        @mouseleave="model.onMouseLeave"
        >
        <path :id="pathID" :d="path" :class="segmentClass" style="fill: none;" :style="segmentStyle" />
        <text v-if="startLabel" class="label start">
            <textPath :href="`#${pathID}`">{{startLabel}}</textPath>
        </text>
        <text v-if="endLabel" class="label end">
            <textPath :href="`#${pathID}`" startOffset="98%">{{endLabel}}</textPath>
        </text>
        <template v-for="(vertex, i) in model.vertices" :key="`segment${vertex.key}`">
            <template v-if="i">
                <line :x1="model.vertices[i-1].coords.x" :y1="model.vertices[i-1].coords.y" 
                    :x2="vertex.coords.x" :y2="vertex.coords.y" 
                    class="padding" style="stroke: transparent; fill: none;" 
                    @click.self="model.onClick(i - 1, $event)"
                    @contextmenu.self="model.onRightClick(i - 1, $event)"
                    @dblclick.self="model.onDoubleClick(i - 1, $event)"
                    :style="cursorStyle"
                    :data-link-bundle="segmentDataAttr(i-1)"
                    ><title>{{model.displayString}}</title></line>
            </template>
        </template>
        <template v-for="(vertex, i) in props.model.vertices" :key="`vertex${vertex.key}`">
            <link-vertex-vue :model="vertex" :data-link-bundle-vertex="segmentDataAttr(i)"/>
        </template>
    </g>
</template>

<style lang="scss">
    .link {
        .label {
            cursor: default; dominant-baseline: ideographic;
            &.start {text-anchor: start;}
            &.end {text-anchor: end;}
        }
    }
</style>