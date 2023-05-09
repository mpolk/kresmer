<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main Kresmer Vue component acting as a container for the whole drawing
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, computed, provide } from 'vue';
    import Kresmer from './Kresmer';
    import NetworkComponentHolder from './NetworkComponent/NetworkComponentHolder.vue';
    import TransformBoxFilters from './Transform/TransformBoxFilters.vue';
    import ConnectionPointFilters from './ConnectionPoint/ConnectionPointFilters.vue';
    import NetworkLinkVue from './NetworkLink/NetworkLink.vue';
    import NetworkLinkBlankVue from './NetworkLink/NetworkLinkBlank.vue';

    export default {
        name: "Kresmer",
        components: { NetworkComponentHolder, TransformBoxFilters, ConnectionPointFilters, 
                      NetworkLinkVue, NetworkLinkBlankVue },
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        controller: {type: Object as PropType<Kresmer>, required: true},
    });

    provide(Kresmer.ikKresmer, props.controller);
    provide(Kresmer.ikIsEditable, props.controller.isEditable);
    const rootSVG = ref<SVGSVGElement>();
    const boundingRect = computed(() => rootSVG.value!.getBBox());

    function scaled(size: string|number)
    {
        const matches = size.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * props.controller.drawingScale}${matches[2]}`;
    }//scaled

    function scaledOffset(size: string|number)
    {
        if (props.controller.drawingScale >= 1)
            return 0;
        const matches = size.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * 0.5 * (1 - props.controller.drawingScale)}${matches[2]}`;
    }//scaledOffset

    const x = computed(() => scaledOffset(props.controller.mountingBox.width));
    const y = computed(() => scaledOffset(props.controller.mountingBox.height));
    const width = computed(() => scaled(props.controller.mountingBox.width));
    const height = computed(() => scaled(props.controller.mountingBox.height));
    const viewBox = computed(() => {
        return `0 0 ${props.controller.logicalBox.width} ${props.controller.logicalBox.height}`;
    });

    const styles = computed(() => {
        return `<style>${props.controller.styles.map(style => style.toResult().css).join(" ")}</style>`;
    });


    // Event handlers

    function onMouseDownOnCanvas(event: MouseEvent)
    {
        if (event.button & 1) {
            event.preventDefault();
        }//if

        props.controller.deselectAllElements();
        props.controller.resetAllComponentMode();
        props.controller.emit("mode-reset");
    }//onMouseDownOnCanvas

    function onCanvasRightClick(event: MouseEvent)
    {
        props.controller.emit("canvas-right-click", event);
    }//onCanvasRightClick

    function onMouseWheel(event: WheelEvent)
    {
        props.controller.changeScale(Math.pow(1.05, event.deltaY * -0.01));
    }//onMouseWheel

    function onMouseEnter()
    {
        props.controller.emit("drawing-mouse-enter");
    }//onMouseEnter

    function onMouseLeave()
    {
        props.controller.emit("drawing-mouse-leave");
    }//onMouseLeave

    defineExpose({rootSVG});
</script>

<template>
    <svg class="kresmer" ref="rootSVG" 
        :style="{marginLeft: x, marginTop: y}" 
        :width="width" :height="height" :viewBox="viewBox"
        @mousedown.self="onMouseDownOnCanvas($event)"
        @contextmenu.self="onCanvasRightClick($event)"
        @mousemove.prevent.self=""
        @wheel.ctrl.prevent="onMouseWheel($event)"
        @mouseenter.self="onMouseEnter"
        @mouseleave.self="onMouseLeave"
        >
        <defs>
            <TransformBoxFilters />
            <ConnectionPointFilters />
            <component v-for="(_, i) in controller.defs" :is="`GlobalDefs${i}`" :key="`GlobalDefs${i}`" />
            <template v-for="_class of controller.registeredComponentClasses.values()">
                <component v-if="_class.defs" :is="_class.defsVueName" :key="`${_class}Defs`"/>
            </template>
            <template v-for="_class of controller.registeredLinkClasses.values()">
                <component v-if="_class.defs" :is="_class.defsVueName" :key="`${_class}Defs`"/>
            </template>
        </defs>
        <defs v-if="controller.styles.length" v-html="styles"></defs>

        <template v-if="controller.showRulers">
            <g class="ruler">
                <rect class="axis" :x="boundingRect.x" :y="boundingRect.y" :width="boundingRect.width" :height="boundingRect.height"/>
            </g>
        </template>

        <NetworkComponentHolder 
            v-for="componentController in controller.networkComponents.sorted" 
            :key="`networkComponent${componentController.component.id}`" :controller="componentController"
                >
            <component :is="componentController.component.vueName" v-bind="componentController.component.props"
                   :component-id="componentController.component.id" :name="componentController.component.name"
                >
                {{componentController.component.content}}
            </component>
        </NetworkComponentHolder>

        <NetworkLinkVue v-for="link in controller.links.sorted" v-bind="link.props" :key="`link${link.id}`" :model="link" />
        <NetworkLinkBlankVue v-if="controller.newLinkBlank" :model="controller.newLinkBlank" />
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

        .ruler {
            .axis {
                outline: gray solid 1px;
                fill: none;
            }
        }
    }
</style>