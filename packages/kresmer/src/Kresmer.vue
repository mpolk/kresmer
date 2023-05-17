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
    const rootSVG = ref<SVGSVGElement>()!;

    function zoomed(size: string|number)
    {
        const matches = size.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * props.controller.zoomFactor}${matches[2]}`;
    }//zoomed

    function zoomedOffset(size: string|number)
    {
        if (props.controller.zoomFactor >= 1)
            return 0;
        const matches = size.toString().match(/^([0-9.]+)(.+)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * 0.5 * (1 - props.controller.zoomFactor)}${matches[2]}`;
    }//zoomedOffset

    const x = computed(() => zoomedOffset(props.controller.mountingWidth));
    const y = computed(() => zoomedOffset(props.controller.mountingHeight));
    const width = computed(() => zoomed(props.controller.mountingWidth));
    const height = computed(() => zoomed(props.controller.mountingHeight));
    const viewBox = computed(() => {
        return `0 0 ${props.controller.logicalWidth} ${props.controller.logicalHeight}`;
    });

    const rulerBox = computed(() => {
        props.controller.mountingHeight;
        props.controller.mountingWidth;
        props.controller.zoomFactor;
        const drawingWidth = rootSVG.value!.width.baseVal.value;
        const drawingHeight = rootSVG.value!.height.baseVal.value;
        const aspectRatio = drawingWidth / drawingHeight * props.controller.logicalHeight / props.controller.logicalWidth;
        const [x, width] = (aspectRatio <= 1 ? [0, 1] : [(1 - aspectRatio) / 2, aspectRatio])
            .map(x => x * props.controller.logicalWidth);
        const [y, height] = (aspectRatio >= 1 ? [0, 1] : [(1 - 1/aspectRatio) / 2, 1/aspectRatio])
            .map(y => y * props.controller.logicalHeight);
        return {x, y, width, height};
    });

    function rulerMarkings(from: number, to: number, step: number, except?: number) {
        const xs: number[] = [];
        for (let x = Math.ceil(from / step) * step; x < Math.floor(to / step) * step; x += step) {
            if (!except || x % except)
                xs.push(x);
        }//for
        return xs;
    }//rulerMarkings

    const tensMarkingsLength = 5, fiftiesMarkingsLength = 8, hundredsMarkingsLength = 12;

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
        props.controller._onMouseWheel(event);
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
                <rect class="axis" v-bind="rulerBox"/>
                <rect class="boundaries" x="0" y="0" :width="controller.logicalWidth" :height="controller.logicalHeight"/>
                <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 10, 50)" :key="`tx-marking${x}`">
                    <line class="marking" :x1="x" :y1="rulerBox.y" 
                                          :x2="x" :y2="rulerBox.y + tensMarkingsLength"/>
                    <line class="marking" :x1="x" :y1="rulerBox.y + rulerBox.height" 
                                          :x2="x" :y2="rulerBox.y + rulerBox.height - tensMarkingsLength"/>
                </template>
                <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 50, 100)" :key="`fx-marking${x}`">
                    <line class="marking" :x1="x" :y1="rulerBox.y" 
                                          :x2="x" :y2="rulerBox.y + fiftiesMarkingsLength"/>
                    <line class="marking" :x1="x" :y1="rulerBox.y + rulerBox.height" 
                                          :x2="x" :y2="rulerBox.y + rulerBox.height - fiftiesMarkingsLength"/>
                </template>
                <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 100)" :key="`hx-marking${x}`">
                    <line class="marking" :x1="x" :y1="rulerBox.y" 
                                          :x2="x" :y2="rulerBox.y + hundredsMarkingsLength"/>
                    <line class="marking" :x1="x" :y1="rulerBox.y + rulerBox.height" 
                                          :x2="x" :y2="rulerBox.y + rulerBox.height - hundredsMarkingsLength"/>
                </template>
                <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 10, 50)" :key="`ty-marking${y}`">
                    <line class="marking" :x1="rulerBox.x" :y1="y" 
                                          :x2="rulerBox.x + tensMarkingsLength" :y2="y"/>
                    <line class="marking" :x1="rulerBox.x + rulerBox.width" :y1="y" 
                                          :x2="rulerBox.x + rulerBox.width - tensMarkingsLength" :y2="y"/>
                </template>
                <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 50, 100)" :key="`fy-marking${y}`">
                    <line class="marking" :x1="rulerBox.x" :y1="y" 
                                          :x2="rulerBox.x + fiftiesMarkingsLength" :y2="y"/>
                    <line class="marking" :x1="rulerBox.x + rulerBox.width" :y1="y" 
                                          :x2="rulerBox.x + rulerBox.width - fiftiesMarkingsLength" :y2="y"/>
                </template>
                <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 100)" :key="`fy-marking${y}`">
                    <line class="marking" :x1="rulerBox.x" :y1="y" 
                                          :x2="rulerBox.x + hundredsMarkingsLength" :y2="y"/>
                    <line class="marking" :x1="rulerBox.x + rulerBox.width" :y1="y" 
                                          :x2="rulerBox.x + rulerBox.width - hundredsMarkingsLength" :y2="y"/>
                </template>
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
                stroke: gray; stroke-width: 1px;
                fill: none;
            }
            .boundaries {
                stroke: pink; stroke-width: 1px;
                fill: none;
            }
            .marking {
                stroke: gray; stroke-width: 1px;
                fill: none;
            }
        }
    }
</style>