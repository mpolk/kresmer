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
    import NetworkComponentClass from './NetworkComponent/NetworkComponentClass';
    import NetworkComponentController from './NetworkComponent/NetworkComponentController';
    import NetworkComponentHolder from './NetworkComponent/NetworkComponentHolder.vue';
    import TransformBoxFilters from './Transform/TransformBoxFilters.vue';

    export default {
        components: { NetworkComponentHolder, TransformBoxDefs: TransformBoxFilters },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        controller: {type: Object as PropType<Kresmer>, required: true},
        networkComponents: {
            type: Object as PropType<Record<string, NetworkComponentController>>, 
            required: true
        },
        networkComponentClasses: {
            type: Object as PropType<Record<string, NetworkComponentClass>>, 
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

    function scaled(size: string|number)
    {
        const matches = size.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * scale.value}${matches[2]}`;
    }//scaled

    function scaledOffset(size: string|number)
    {
        if (scale.value >= 1)
            return 0;
        const matches = size.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * 0.5 * (1 - scale.value)}${matches[2]}`;
    }//scaledOffset

    const x = computed(() => scaledOffset(props.drawingWidth));
    const y = computed(() => scaledOffset(props.drawingHeight));
    const width = computed(() => scaled(props.drawingWidth));
    const height = computed(() => scaled(props.drawingHeight));

    const styles = computed(() => {
        return `<style>${props.controller.styles.map(r => r.css).join(" ")}</style>`;
    });

    const emit = defineEmits<{
        (event: "drawing-scale", newScale: number): void,
        (event: "component-right-click", controller: NetworkComponentController,
         target: "component" | "transform-box", nativeEvent: MouseEvent): void,
        (event: "mouse-enter"): void,
        (event: "mouse-leave"): void,
        (event: "component-mouse-enter", controller?: NetworkComponentController): void,
        (event: "component-mouse-leave", controller?: NetworkComponentController): void,
    }>();

    // Event handlers

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseDownOnCanvas(_event: MouseEvent)
    {
        props.controller.resetAllComponentMode();
        props.controller.onModeReset();
    }//onMouseDownOnCanvas

    function onMouseWheel(event: WheelEvent)
    {
        scale.value *= Math.pow(1.05, event.deltaY * -0.01);
        emit("drawing-scale", scale.value);
    }//onMouseWheel

    function onComponentRightClick(controller: NetworkComponentController, 
                                   target: "component"|"transform-box", 
                                   nativeEvent: MouseEvent)
    {
        emit("component-right-click", controller, target, nativeEvent);
    }//onComponentRightClick

    function onMouseEnter()
    {
        emit("mouse-enter");
    }//onMouseEnter

    function onMouseLeave()
    {
        emit("mouse-leave");
    }//onMouseLeave

    function onComponentMouseEnter(controller?: NetworkComponentController)
    {
        emit("component-mouse-enter", controller);
    }//onComponentMouseEnter

    function onComponentMouseLeave(controller?: NetworkComponentController)
    {
        emit("component-mouse-leave", controller);
    }//onComponentMouseLeave

    defineExpose({svg: rootSVG});
</script>

<template>
    <svg class="kresmer" ref="rootSVG" 
        :style="{marginLeft: x, marginTop: y, marginRight: 0, marginBottom: 0}" 
        :width = "width" :height="height"
        :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
        @mousedown.prevent="onMouseDownOnCanvas($event)"
        @mousemove.prevent=""
        @wheel.ctrl.prevent="onMouseWheel($event)"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        >
        <defs>
            <TransformBoxFilters />
            <component v-for="(_, i) in controller.defs" :is="`GlobalDefs${i}`" :key="`GlobalDefs${i}`" />
            <template v-for="_class in networkComponentClasses">
                <component v-if="_class.defs" :is="_class.defsVueName" :key="`${_class}Defs`"/>
            </template>
        </defs>
        <defs v-if="controller.styles.length" v-html="styles"></defs>
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
                   @mouse-enter="onComponentMouseEnter"
                   @mouse-leave="onComponentMouseLeave"
                >
            <component :is="controller.component.vueName"
                   :component-id="controller.component.id"
                   :name="controller.component.name"
                   v-bind="controller.component.props"
                >
                {{controller.component.content}}
            </component>
        </NetworkComponentHolder>
    </svg>
</template>


<style lang="scss">
    svg.kresmer {
        background-color: whitesmoke;
        box-shadow: 0.5rem 0.5rem 0.5rem lightgray;
        outline: thin darkgray dotted;

        svg.network-component {
            overflow: visible;
            cursor: default;
        }
    }
</style>