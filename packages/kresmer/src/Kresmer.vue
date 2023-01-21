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
    import ConnectionPointFilters from './ConnectionPoint/ConnectionPointFilters.vue';
    import NetworkLinkVue from './NetworkLink/NetworkLink.vue';
    import NetworkLink from './NetworkLink/NetworkLink';
    import NetworkLinkClass from './NetworkLink/NetworkLinkClass';

    export default {
        components: { NetworkComponentHolder, TransformBoxFilters, ConnectionPointFilters, NetworkLinkVue },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        controller: {type: Object as PropType<Kresmer>, required: true},
        networkComponents: {
            type: Object as PropType<Map<string, NetworkComponentController>>, 
            required: true
        },
        networkComponentClasses: {
            type: Object as PropType<Map<string, NetworkComponentClass>>, 
            required: true
        },
        links: {
            type: Object as PropType<Map<string, NetworkLink>>, 
            required: true
        },
        linkClasses: {
            type: Object as PropType<Map<string, NetworkLinkClass>>, 
            required: true
        },
        drawingWidth: {type: [Number, String], default: "100%"},
        drawingHeight: {type: [Number, String], default: "100%"},
        viewWidth: {type: Number, default: 1000},
        viewHeight: {type: Number, default: 1000},
        isEditable: {type: Boolean, default: true},
    });

    provide(Kresmer.injectionKey, props.controller);
    const rootSVG = ref<SVGGraphicsElement>();

    const networkComponentsSorted = computed(() => {
        return Array.from(props.networkComponents.values()).sort((c1, c2) => c1.zIndex - c2.zIndex)
    })

    const linksSorted = computed(() => {
        return Array.from(props.links.values()).sort((c1, c2) => c1.zIndex - c2.zIndex)
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

    // function scaledOffset(size: string|number)
    // {
    //     if (scale.value >= 1)
    //         return 0;
    //     const matches = size.toString().match(/^([0-9.]+)(.+)$/);
    //     if (!matches)
    //         return undefined;

    //     const n = parseFloat(matches[1]);
    //     return `${n * 0.5 * (1 - scale.value)}${matches[2]}`;
    // }//scaledOffset

    // const x = computed(() => scaledOffset(props.drawingWidth));
    // const y = computed(() => scaledOffset(props.drawingHeight));
    const width = computed(() => scaled(props.drawingWidth));
    const height = computed(() => scaled(props.drawingHeight));

    const styles = computed(() => {
        return `<style>${props.controller.styles.map(style => style.toResult().css).join(" ")}</style>`;
    });


    // Event handlers

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseDownOnCanvas(_event: MouseEvent)
    {
        props.controller.deselectAllElements();
        props.controller.resetAllComponentMode();
        props.controller.emit("mode-reset");
    }//onMouseDownOnCanvas

    function onMouseWheel(event: WheelEvent)
    {
        scale.value *= Math.pow(1.05, event.deltaY * -0.01);
        props.controller.emit("drawing-scale", scale.value);
    }//onMouseWheel

    function onComponentRightClick(controller: NetworkComponentController, 
                                   target: "component"|"transform-box", 
                                   nativeEvent: MouseEvent)
    {
        props.controller.emit("component-right-click", controller, target, nativeEvent);
    }//onComponentRightClick

    function onMouseEnter()
    {
        props.controller.emit("drawing-mouse-enter");
    }//onMouseEnter

    function onMouseLeave()
    {
        props.controller.emit("drawing-mouse-leave");
    }//onMouseLeave

    function onComponentMouseEnter(controller: NetworkComponentController)
    {
        props.controller.emit("component-mouse-enter", controller);
    }//onComponentMouseEnter

    function onComponentMouseLeave(controller: NetworkComponentController)
    {
        props.controller.emit("component-mouse-leave", controller);
    }//onComponentMouseLeave

    defineExpose({rootSVG});
</script>

<template>
    <svg class="kresmer" ref="rootSVG" 
        xx-style="{marginLeft: x, marginTop: y, marginRight: 0, marginBottom: 0}" 
        :width = "width" :height="height"
        :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
        @mousedown.prevent.self="onMouseDownOnCanvas($event)"
        @mousemove.prevent=""
        @wheel.ctrl.prevent="onMouseWheel($event)"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        >
        <defs>
            <TransformBoxFilters />
            <ConnectionPointFilters />
            <component v-for="(_, i) in controller.defs" :is="`GlobalDefs${i}`" :key="`GlobalDefs${i}`" />
            <template v-for="_class of networkComponentClasses.values()">
                <component v-if="_class.defs" :is="_class.defsVueName" :key="`${_class}Defs`"/>
            </template>
        </defs>
        <defs v-if="controller.styles.length" v-html="styles"></defs>

        <NetworkComponentHolder v-for="controller in networkComponentsSorted" 
                   :key="`networkComponent${controller.component.id}`"
                   :controller="controller"
                   :is-editable="isEditable"
                   :origin="controller.origin"
                   :transform="controller.transform"
                   :is-selected="controller.component.isSelected"
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

        <NetworkLinkVue v-for="link in linksSorted" :key="`link${link.id}`" 
            :model="link"
            :is-editable="isEditable"
            />
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