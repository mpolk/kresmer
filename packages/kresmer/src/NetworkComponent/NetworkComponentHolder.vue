<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
<*************************************************************************** -->

<script lang="ts">
    import { ref, PropType, onMounted, computed, provide, inject, watch, nextTick } from 'vue';
    import TransformBox from '../Transform/TransformBox.vue';
    import { TransformBoxZone } from '../Transform/TransformBox';
    import NetworkComponentController from "./NetworkComponentController";
    import NetworkComponent from "./NetworkComponent";
    import NetworkElement from "../NetworkElement";
    import { Transform } from '../Transform/Transform';
    import Kresmer from '../Kresmer';
    import { toCamelCase } from '../Utils';

    export default {
        components: { TransformBox },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        controller: {type: Object as PropType<NetworkComponentController>, required: true},
    });

    const kresmer = inject(Kresmer.ikKresmer)!;
    const isEditable = inject(Kresmer.ikIsEditable);
    const svg = ref<SVGSVGElement>()!;
    const trGroup = ref<SVGGElement>()!;
    const trBox = ref<InstanceType<typeof TransformBox>>()!;
    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(NetworkComponent.injectionKey, props.controller.component);
    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(NetworkElement.ikHostElement, props.controller.component);

    const applyTransform = ref(false);
    const bBox = ref<SVGRect>();

    const center = computed(() => {
        const rect = bBox.value;
        if (!rect)
            return {x: 0, y: 0};
        return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
    })//center

    function updateBoundingBox()
    {
        applyTransform.value = false;
        bBox.value = svg.value?.getBBox({stroke: true});
        applyTransform.value = true;
        if (props.controller.transform.nonEmpty) {
            props.controller.updateConnectionPoints();
        }//if
    }//updateBoundingBox

    onMounted(() => {
        updateBoundingBox();
        // eslint-disable-next-line vue/no-mutating-props
        props.controller.component.svg = svg.value;
        props.controller._setMouseCaptureTarget(trGroup.value!);
    })//onMounted

    watch(() => props.controller.component.propsUpdateIndicator, () => {
        nextTick(updateBoundingBox);
    })//watch

    const transform = computed(() => {
        if (props.controller.transform && applyTransform.value)
            return props.controller.transform;
        else
            return new Transform;
    })//transform

    const transformAttr = computed(() => {
        if (props.controller.transform && applyTransform.value)
            return props.controller.transform.toAttr();
        else
            return undefined;
    })//transformAttr

    const transformOrigin = computed(() => `${center.value.x} ${center.value.y}`)

    let transformStartEvent: MouseEvent | undefined;
    let wasJustTransformed = false;
    let lastActiveHandle: TransformBoxZone = "tr-box";

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && !props.controller.transformMode && isEditable) {
            event.preventDefault();
            if (event.altKey) {
                props.controller.enterAdjustmentMode(event);
            } else if (!event.ctrlKey) {
                props.controller.startDrag(event);
            } else if (event.shiftKey) {
                props.controller.enterAdjustmentMode(event);
            } else {
                props.controller.enterTransformMode(event);
            }//if
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        if (isEditable && !props.controller.transformMode && props.controller.endDrag(event)) { 
            props.controller.returnFromTop();
            return;
        }//if

        if (!props.controller.transformMode && !props.controller.isInAdjustmentMode) {
            props.controller.selectComponent(!event.shiftKey);
        }//if
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && !props.controller.transformMode && isEditable) {
            props.controller.drag(event);
        }//if
    }//onMouseMove

    function onMouseEnter(event: MouseEvent)
    {
        kresmer.emit("component-mouse-enter", props.controller);
    }//onMouseLeave

    function onMouseLeave(event: MouseEvent)
    {
        kresmer.emit("component-mouse-leave", props.controller);
    }//onMouseLeave

    function onMouseDownInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        if (event.buttons === 1) {
            transformStartEvent = event;
        }//if
    }//onMouseDownInTransformBox

    function onMouseUpInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        if (transformStartEvent)
            transformStartEvent = undefined;
        else if (isEditable) {
            props.controller._setMouseCaptureTarget(trGroup.value!);
            props.controller.endTransform(event) || props.controller.endDrag(event);
        }//if
    }//onMouseUpInTransformBox

    function onMouseMoveInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        event.preventDefault();
        if (isEditable && transformStartEvent) {
            const handleRef = toCamelCase(zone) as keyof InstanceType<typeof TransformBox>;
            props.controller._setMouseCaptureTarget(trBox.value![handleRef]);
            switch(zone) {
                case "tr-box":
                    props.controller.startDrag(transformStartEvent);
                    break;
                case "nw-handle":
                case "n-handle":
                case "ne-handle":
                case "w-handle":
                case "e-handle":
                case "sw-handle":
                case "s-handle":
                case "se-handle":
                    props.controller.startScale(transformStartEvent);
                    break;
                case "rot-handle":
                    props.controller.startRotate(transformStartEvent);
                    break;
            }//switch
            transformStartEvent = undefined;
            wasJustTransformed = true;
        }//if

        if (isEditable && event.buttons & 1) {
            switch(zone) {
                case "tr-box":
                    if (props.controller.isBeingTransformed && props.controller.transformMode == "scaling") {
                        props.controller.scale(event, lastActiveHandle, bBox.value!, center.value!);
                    } else {
                        props.controller.drag(event);
                    }//if
                    break;
                case "nw-handle":
                case "n-handle":
                case "ne-handle":
                case "w-handle":
                case "e-handle":
                case "sw-handle":
                case "s-handle":
                case "se-handle":
                    lastActiveHandle = zone;
                    props.controller.scale(event, zone, bBox.value!, center.value!);
                    break;
                case "rot-handle":
                    props.controller.rotate(event, center.value!);
                    break;
            }//switch
        }//if
    }//onMouseMoveInTransformBox

    function onMouseLeaveFromTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        // onMouseUpInTransformBox(zone, event);
    }//onMouseLeaveFromTransformBox

    function onTransformBoxClick(event: MouseEvent) {
        if (wasJustTransformed)
            wasJustTransformed = false;
        else if (isEditable)
            props.controller.onTransformBoxClick(event);
    }//onTransformBoxClick

    function onRightClick(event: MouseEvent, target: "component" | "transform-box") {
        kresmer.emit("component-right-click", props.controller, target, event);
    }//onRightClick

    function onDoubleClick(event: MouseEvent) {
        kresmer.emit("component-double-click", props.controller, event);
    }//onDoubleClick

    defineExpose({center});
</script>

<template>
    <svg ref="svg" v-bind="controller.origin" 
        class="network-component" 
        :class="{
            [controller.component.getClass().name]: true,
            selected: controller.component.isSelected,
            dragged: controller.isDragged, 
            x: controller.dragConstraint === 'x',
            y: controller.dragConstraint === 'y',
            beingTransformed: controller.isBeingTransformed
        }"
        >
        <g ref="trGroup" class="tr-group" 
            :transform="transformAttr" :transform-origin="transformOrigin"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop.prevent="onMouseMove($event)"
            @mouseenter.stop="onMouseEnter($event)"
            @mouseleave.stop="onMouseLeave($event)"
            @contextmenu="onRightClick($event, 'component')"
            @dblclick="onDoubleClick($event)"
            >
            <g class="network-component-slot"><slot></slot></g>
            <TransformBox v-if="controller.transformMode" ref="trBox" :origin="controller.origin" 
                :transform="transform" :transform-origin="transformOrigin" 
                :transform-mode="controller.transformMode"
                :b-box="bBox!" :center="center"
                @mouse-down="onMouseDownInTransformBox"
                @mouse-move="onMouseMoveInTransformBox"
                @mouse-up="onMouseUpInTransformBox"
                @mouse-leave="onMouseLeaveFromTransformBox"
                @box-click="onTransformBoxClick"
                @box-right-click="onRightClick($event, 'transform-box')"
                />
            </g>
    </svg>
</template>

<style lang="scss">
    svg.network-component {
        &.selected {
            outline: 4px green double;
        }
        
        &.dragged {
            outline: 4px red double;
            .network-component-slot { cursor: move; }
            &.x {.network-component-slot { cursor: ew-resize; }}
            &.y {.network-component-slot { cursor: ns-resize; }}
        }
        
        &.beingTransformed .network-component-slot {
            opacity: 0.5;
        }
    }
</style>