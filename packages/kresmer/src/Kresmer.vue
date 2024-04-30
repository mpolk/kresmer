<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main Kresmer Vue component acting as a container for the whole drawing
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, computed, provide, watch, nextTick, StyleValue } from 'vue';
    import Kresmer from './Kresmer';
    import NetworkComponentHolder from './NetworkComponent/NetworkComponentHolder.vue';
    import TransformBoxFilters from './Transform/TransformBoxFilters.vue';
    import ConnectionPointFilters from './ConnectionPoint/ConnectionPointFilters.vue';
    import NetworkLinkVue from './NetworkLink/NetworkLink.vue';
    import NetworkLinkFilters from './NetworkLink/NetworkLinkFilters.vue';
    import NetworkLinkBlankVue from './NetworkLink/NetworkLinkBlank.vue';

    export default {
        name: "Kresmer",
        components: { NetworkComponentHolder, NetworkLinkFilters, TransformBoxFilters, ConnectionPointFilters, 
                      NetworkLinkVue, NetworkLinkBlankVue },
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        controller: {type: Object as PropType<Kresmer>, required: true},
    });

    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(Kresmer.ikKresmer, props.controller);
    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(Kresmer.ikIsEditable, props.controller.isEditable);
    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(Kresmer.ikSnapToGrid, props.controller.snapToGrid);
    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(Kresmer.ikSnappingGranularity, props.controller.snappingGranularity);
    const rootSVG = ref<SVGSVGElement>()!;

    function zoomed(size: string|number)
    {
        const matches = size.toString().match(/^([0-9]+(?:\.[0-9]*)?)(.*)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        return `${n * props.controller.zoomFactor}${matches[2]}`;
    }//zoomed

    function zoomedOffset(size: string|number)
    {
        if (props.controller.zoomFactor >= 1)
            return 0;
        const matches = size.toString().match(/^([0-9]+(?:\.[0-9]*)?)(.*)$/);
        if (!matches)
            return undefined;

        const n = parseFloat(matches[1]);
        const units = matches[2] || "px";
        return `${Math.round(n * 0.5 * (1 - props.controller.zoomFactor))}${units}`;
    }//zoomedOffset

    const rootSVGStyle = computed(() => {
        let style: Record<string, unknown> = {
            marginLeft: zoomedOffset(props.controller.mountingWidth), 
            marginTop: zoomedOffset(props.controller.mountingHeight),
            backgroundColor: props.controller.backgroundColor,
            width: zoomed(props.controller.mountingWidth),
            height: zoomed(props.controller.mountingHeight),
        }; 

        if (props.controller.backgroundImage.nonEmpty) {
            style = {...style, ...props.controller.backgroundImage.cssAttr()};
        }//if

        return style as StyleValue;
    });

    const backgroundMaskStyle = computed(() => {
        return {...rulerBox.value, pointerEvents: "none"} as StyleValue;
    });

    const viewBox = computed(() => `0 0 ${props.controller.logicalWidth} ${props.controller.logicalHeight}`);

    const drawingOrigin = {x: 0, y: 0};
    provide(Kresmer.ikDrawingOrigin, drawingOrigin);
    watch(rootSVGStyle, () => {
        nextTick(() => {
            const styles = getComputedStyle(rootSVG.value!);
            // console.debug(styles);
            drawingOrigin.x = parseInt(styles.marginLeft);
            drawingOrigin.y = parseInt(styles.marginTop);
        })
    }, {immediate: true});

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
        for (let x = Math.ceil(from/step) * step; x <= Math.floor(to/step) * step; x += step) {
            if (!except || x % except)
                xs.push(x);
        }//for
        return xs;
    }//rulerMarkings

    const tensMarkingLength = 5, fiftiesMarkingLength = 8, hundredsMarkingLength = 12;

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

    function onMouseMove()
    {
        props.controller.highlightedLinks.forEach(link => link.onMouseLeave());
    }//onMouseMove

    function onMouseLeave()
    {
        props.controller.emit("drawing-mouse-leave");
    }//onMouseLeave

    defineExpose({rootSVG});
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" 
        class="kresmer" ref="rootSVG" 
        :style="rootSVGStyle" :viewBox="viewBox"
        @mousedown.self="onMouseDownOnCanvas($event)"
        @contextmenu.self="onCanvasRightClick($event)"
        @mousemove.prevent.self="onMouseMove"
        @wheel.ctrl.prevent="onMouseWheel($event)"
        @mouseenter.self="onMouseEnter"
        @mouseleave.self="onMouseLeave"
        >
        <!-- Definitions-->
        <defs>
            <!-- ...global -->
            <TransformBoxFilters />
            <NetworkLinkFilters />
            <ConnectionPointFilters />
            <component v-for="(_, i) in controller.defs" :is="`GlobalDefs${i}`" :key="`GlobalDefs${i}`" />
            <!-- ...component-specific -->
            <template v-for="_class of controller.registeredComponentClasses.values()">
                <component v-if="_class.defs" :is="_class.defsVueName" :key="`${_class}Defs`"/>
            </template>
            <!-- ...link-specific -->
            <template v-for="_class of controller.registeredLinkClasses.values()">
                <component v-if="_class.defs" :is="_class.defsVueName" :key="`${_class}Defs`"/>
            </template>
        </defs>
        <defs v-if="controller.styles.length" v-html="styles"></defs>

        <!-- Background mask -->
        <rect v-if="rootSVG" :style="backgroundMaskStyle" :fill="controller.backgroundColor" 
            :opacity="1 - controller.backgroundImage.visibility" />

        <!-- Grid -->
        <template v-if="controller.showGrid">
            <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 10)" :key="`x-grid${x}`">
                <line class="grid" :x1="x" :y1="rulerBox.y" :x2="x" :y2="rulerBox.y + rulerBox.height"
                    @mousedown.self="onMouseDownOnCanvas($event)"
                    @contextmenu.self="onCanvasRightClick($event)"
                    @mousemove.prevent.self=""
                    />
            </template>
            <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 10)" :key="`y-grid${y}`">
                <line class="grid" :x1="rulerBox.x" :y1="y" :x2="rulerBox.x + rulerBox.width" :y2="y"
                    @mousedown.self="onMouseDownOnCanvas($event)"
                    @contextmenu.self="onCanvasRightClick($event)"
                    @mousemove.prevent.self=""
                    />
            </template>
        </template>
        <!-- Rulers -->
        <template v-if="controller.showRulers">
            <g class="rulers">
                <rect class="axis" v-bind="rulerBox"/>
                <rect :class="{boundaries: true, strong: controller.showGrid}" 
                      x="0" y="0" :width="controller.logicalWidth" :height="controller.logicalHeight"/>
                <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 10, 50)" :key="`tx-marking${x}`">
                    <line class="marking" :x1="x" :y1="rulerBox.y" 
                                          :x2="x" :y2="rulerBox.y + tensMarkingLength"/>
                    <line class="marking" :x1="x" :y1="rulerBox.y + rulerBox.height" 
                                          :x2="x" :y2="rulerBox.y + rulerBox.height - tensMarkingLength"/>
                </template>
                <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 50, 100)" :key="`fx-marking${x}`">
                    <line class="marking" :x1="x" :y1="rulerBox.y" 
                                          :x2="x" :y2="rulerBox.y + fiftiesMarkingLength"/>
                    <line class="marking" :x1="x" :y1="rulerBox.y + rulerBox.height" 
                                          :x2="x" :y2="rulerBox.y + rulerBox.height - fiftiesMarkingLength"/>
                </template>
                <template v-for="x in rulerMarkings(rulerBox.x, rulerBox.x + rulerBox.width, 100)" :key="`hx-marking${x}`">
                    <line class="marking" :x1="x" :y1="rulerBox.y" 
                                          :x2="x" :y2="rulerBox.y + hundredsMarkingLength"/>
                    <text class="marking-text top" :x="x" :y="rulerBox.y + hundredsMarkingLength * 1.2">{{ x }}</text>
                    <line class="marking" :x1="x" :y1="rulerBox.y + rulerBox.height" 
                                          :x2="x" :y2="rulerBox.y + rulerBox.height - hundredsMarkingLength"/>
                    <text class="marking-text bottom" :x="x" :y="rulerBox.y + rulerBox.height - hundredsMarkingLength * 1.2">{{ x }}</text>
                </template>
                <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 10, 50)" :key="`ty-marking${y}`">
                    <line class="marking" :x1="rulerBox.x" :y1="y" 
                                          :x2="rulerBox.x + tensMarkingLength" :y2="y"/>
                    <line class="marking" :x1="rulerBox.x + rulerBox.width" :y1="y" 
                                          :x2="rulerBox.x + rulerBox.width - tensMarkingLength" :y2="y"/>
                </template>
                <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 50, 100)" :key="`fy-marking${y}`">
                    <line class="marking" :x1="rulerBox.x" :y1="y" 
                                          :x2="rulerBox.x + fiftiesMarkingLength" :y2="y"/>
                    <line class="marking" :x1="rulerBox.x + rulerBox.width" :y1="y" 
                                          :x2="rulerBox.x + rulerBox.width - fiftiesMarkingLength" :y2="y"/>
                </template>
                <template v-for="y in rulerMarkings(rulerBox.y, rulerBox.y + rulerBox.height, 100)" :key="`hy-marking${y}`">
                    <line class="marking" :x1="rulerBox.x" :y1="y" 
                                          :x2="rulerBox.x + hundredsMarkingLength" :y2="y"/>
                    <text class="marking-text left" :x="rulerBox.x + hundredsMarkingLength * 1.2" :y="y">{{ y }}</text>
                    <line class="marking" :x1="rulerBox.x + rulerBox.width" :y1="y" 
                                          :x2="rulerBox.x + rulerBox.width - hundredsMarkingLength" :y2="y"/>
                    <text class="marking-text right" :x="rulerBox.x + rulerBox.width - hundredsMarkingLength * 1.2" :y="y">{{ y }}</text>
                </template>
            </g>
        </template>

        <!-- Components -->
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

        <!-- Links -->
        <NetworkLinkVue v-for="link in controller.links.sorted" v-bind="link.props" :key="`link${link.id}`" :model="link" />
        <NetworkLinkBlankVue v-if="controller.newLinkBlank" :model="controller.newLinkBlank" />
    </svg>
</template>


<style lang="scss">
    svg.kresmer {
        background-color: white;
        box-shadow: 0.5rem 0.5rem 0.5rem lightgray;
        outline: thin darkgray dotted;

        svg.network-component {
            overflow: visible;
            cursor: default;
        }

        .rulers {
            .axis {
                stroke: gray; stroke-width: 1px;
                fill: none;
            }
            .boundaries {
                stroke: pink; stroke-width: 1px;
                fill: none;
                &.strong {
                    stroke: red;
                }
            }
            .marking {
                stroke: gray; stroke-width: 1px;
                fill: none;
            }
            .marking-text {
                // stroke: gray; stroke-width: 1px;
                fill: gray;
                &.top {
                    text-anchor: middle;
                    dominant-baseline: hanging;
                }
                &.bottom {
                    text-anchor: middle;
                    // dominant-baseline: ideographic;
                }
                &.left {
                    // text-anchor: start;
                    dominant-baseline: middle;
                }
                &.right {
                    text-anchor: end;
                    dominant-baseline: middle;
                }
            }
        }

        .grid {
            stroke: lightgray; stroke-width: 1px;
        }
    }
</style>