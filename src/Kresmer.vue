<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main Kresmer Vue component acting as a container for the whole drawing
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, computed, provide } from 'vue';
    import Kresmer from './Kresmer';
import NetworkComponent from './NetworkComponent/NetworkComponent';
    import NetworkComponentController from './NetworkComponent/NetworkComponentController';
    import NetworkComponentHolder from './NetworkComponent/NetworkComponentHolder.vue';

    export default {
        components: { NetworkComponentHolder },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        controller: {type: Object as PropType<Kresmer>, required: true},
        networkComponents: {
            type: Object as PropType<Record<string, NetworkComponentController>>, 
            required: true
        },
        drawingWidth: {type: [Number, String], default: "100%"},
        drawingHeight: {type: [Number, String], default: "100%"},
        viewWidth: {type: Number, default: 1000},
        viewHeight: {type: Number, default: 1000},
    });

    provide(Kresmer.injectionKey, props.controller);
    const rootSVG = ref<SVGGraphicsElement>();

    const networkComponentsSorted = computed(() => {
        return Object.values(props.networkComponents).sort((c1, c2) => c1.zIndex - c2.zIndex)
    })

    const scale = ref(1);

    const width = computed(() => {
        const matches = props.drawingWidth.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * scale.value}${matches[2]}`;
    })//width

    const height = computed(() => {
        const matches = props.drawingHeight.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * scale.value}${matches[2]}`;
    })//height


    const emit = defineEmits<{
        (event: "scale-changed", newScale: number): void,
        (event: "component-right-click", component: NetworkComponent, 
         target: "component" | "transform-box", nativeEvent: MouseEvent): void,
    }>();

    // Event handlers

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseDownOnCanvas(_event: MouseEvent)
    {
        props.controller.resetAllComponentMode();
    }//onMouseDownOnCanvas

    function onMouseWheel(event: WheelEvent)
    {
        scale.value *= Math.pow(1.1, event.deltaY * -0.01);
        emit("scale-changed", scale.value);
    }//onMouseWheel

    function onComponentRightClick(component: NetworkComponent, target: "component"|"transform-box", 
                                   nativeEvent: MouseEvent)
    {
        emit("component-right-click", component, target, nativeEvent);
    }//onComponentRightClick

    defineExpose({svg: rootSVG});
</script>

<template>
    <svg class="kresmer" ref="rootSVG" 
        :width = "width" :height="height"
        :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
        @mousedown.prevent="onMouseDownOnCanvas($event)"
        @mousemove.prevent=""
        @wheel.ctrl.prevent="onMouseWheel($event)"
        >
        <NetworkComponentHolder v-for="controller in networkComponentsSorted" 
                   :key="`networkComponent${controller.component.id}`"
                   :controller="controller"
                   :origin="controller.origin"
                   :transform="controller.transform"
                   :is-highlighted="controller.component.isHighlighted"
                   :is-dragged="controller.isDragged"
                   :is-being-transformed="controller.isBeingTransformed"
                   :transform-mode="controller.transformMode"
                   @right-click="onComponentRightClick"
                >
            <component :is="controller.component.vueName"
                   :component-id="controller.component.id"
                   :component-name="controller.component.name"
                   v-bind="controller.component.props"
                >
                {{controller.component.content}}
            </component>
        </NetworkComponentHolder>
    </svg>
</template>


<style lang="scss">
    svg.kresmer {
        //width: 100%; height: 100%;
        //overflow: scroll;

        svg.network-component {
            overflow: visible;
            cursor: default;
        }
    }
</style>