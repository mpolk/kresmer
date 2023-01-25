<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
<*************************************************************************** -->

<script lang="ts">
    import { ref, PropType, onMounted, computed, provide } from 'vue';
    import TransformBox from '../Transform/TransformBox.vue';
    import { TransformBoxZone } from '../Transform/TransformBox';
    import NetworkComponentController from "./NetworkComponentController";
    import NetworkComponent from "./NetworkComponent";
    import { NetworkComponentHolderProps } from "./NetworkComponentHolder.d";
    import { Transform } from '../Transform/Transform';

    export default {
        components: { TransformBox },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        ...NetworkComponentHolderProps,
        controller: {type: Object as PropType<NetworkComponentController>, required: true},
        isEditable: {type: Boolean, required: true},
    });

    const svg = ref<SVGGraphicsElement>()!;
    const trGroup = ref<SVGGraphicsElement>()!;
    provide(NetworkComponent.injectionKey, props.controller.component);

    const applyTransform = ref(false);
    const bBox = ref<SVGRect>();

    const center = computed(() => {
        const rect = bBox.value;
        if (!rect)
            return {x: 0, y: 0};
        return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
    })//center

    onMounted(() => {
        bBox.value = svg.value?.getBBox({stroke: true});
        applyTransform.value = true;
        if (props.transform.nonEmpty) {
            props.controller.updateConnectionPoints();
        }//if
    })//onMounted

    const transform = computed(() => {
        if (props.transform && applyTransform.value)
            return props.transform;
        else
            return new Transform;
    })//transform

    const transformAttr = computed(() => {
        if (props.transform && applyTransform.value)
            return props.transform.toAttr();
        else
            return undefined;
    })//transformAttr

    const transformOrigin = computed(() => `${center.value.x} ${center.value.y}`)

    const emit = defineEmits<{
        (event: "right-click", controller: NetworkComponentController, 
         target: "component" | "transform-box", nativeEvent: MouseEvent): void,
        (event: "double-click", controller: NetworkComponentController, nativeEvent: MouseEvent): void,
        (event: "mouse-enter", controller: NetworkComponentController): void,
        (event: "mouse-leave", controller: NetworkComponentController): void,
    }>();

    let transformStartEvent: MouseEvent | undefined;
    let wasJustTransformed = false;
    let lastActiveHandle: TransformBoxZone = "tr-box";

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && !props.transformMode && props.isEditable) {
            event.preventDefault();
            if (!event.ctrlKey) {
                props.controller.startDrag(event);
            } else {
                props.controller.enterTransformMode(event);
            }//if
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        if (props.isEditable && !props.transformMode && props.controller.endDrag(event)) { 
            props.controller.restoreComponentZPosition();
            return;
        }//if

        if (!props.transformMode) {
            props.controller.selectComponent();
        }//if
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && !props.transformMode && props.isEditable) {
            props.controller.drag(event);
        }//if
    }//onMouseMove

    function onMouseEnter(event: MouseEvent)
    {
        emit("mouse-enter", props.controller);
    }//onMouseLeave

    function onMouseLeave(event: MouseEvent)
    {
        emit("mouse-leave", props.controller);
        // props.isEditable &&
        // !props.transformMode &&
        // props.controller.endDrag(event) && 
        // props.controller.restoreComponentZPosition();
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
        else if (props.isEditable)
            props.controller.endTransform(event) || props.controller.endDrag(event);
    }//onMouseUpInTransformBox

    function onMouseMoveInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        if (props.isEditable && transformStartEvent) {
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

        if (props.isEditable && event.buttons & 1) {
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
        else if (props.isEditable)
            props.controller.onTransformBoxClick(event);
    }//onTransformBoxClick

    function onRightClick(event: MouseEvent, target: "component" | "transform-box") {
        emit("right-click", props.controller, target, event);
    }//onRightClick

    function onDoubleClick(event: MouseEvent) {
        emit("double-click", props.controller, event);
    }//onDoubleClick

    defineExpose({center});
</script>

<template>
    <svg ref="svg" v-bind="origin" 
        class="network-component" 
        :class="{
            [controller.component._class.name]: true,
            highlighted: isHighlighted, 
            selected: isSelected,
            dragged: isDragged, 
            beingTransformed: isBeingTransformed
        }"
        >
        <g ref="trGroup" class="tr-group" 
            :transform="transformAttr" :transform-origin="transformOrigin"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove="onMouseMove($event)"
            @mouseenter.stop="onMouseEnter($event)"
            @mouseleave.stop="onMouseLeave($event)"
            @contextmenu="onRightClick($event, 'component')"
            @dblclick="onDoubleClick($event)"
            >
            <g class="network-component-slot"><slot></slot></g>
            <TransformBox v-if="transformMode" ref="trBox" :origin="origin!" 
                :transform="transform" :transform-origin="transformOrigin" 
                :transform-mode="transformMode"
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
            outline: thin green solid;
        }
        
        &.dragged {
            outline: thin red solid;
        }
        
        &.beingTransformed .network-component-slot {
            opacity: 0.5;
        }
    }
</style>