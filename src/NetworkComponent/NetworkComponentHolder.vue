<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
<*************************************************************************** -->

<script lang="ts">
    import { ref, PropType, onMounted, computed } from 'vue';
    import TransformBox from '../Transform/TransformBox.vue';
    import { TransformBoxZone } from '../Transform/TransformBox';
    import NetworkComponentController from "./NetworkComponentController";
    import { NetworkComponentHolderProps } from "./NetworkComponentHolder.d";
    import { Transform } from '../Transform/Transform';

    export default {
        components: { TransformBox },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        ...NetworkComponentHolderProps,
        controller: {type: Object as PropType<NetworkComponentController>},
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const svg = ref<SVGGraphicsElement>()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const trGroup = ref<SVGGraphicsElement>()!;

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
        (event: "mouse-enter", controller?: NetworkComponentController): void,
        (event: "mouse-leave", controller?: NetworkComponentController): void,
    }>();

    let transformStartEvent: MouseEvent | undefined;
    let wasJustTransformed = false;
    let lastActiveHandle: TransformBoxZone = "tr-box";

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && !props.transformMode) {
            event.preventDefault();
            if (!event.ctrlKey) {
                props.controller?.startDrag(event);
            } else {
                props.controller?.enterTransformMode(event);
            }//if
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        !props.transformMode &&
        props.controller?.endDrag(event) && 
        props.controller?.restoreComponentZPosition();
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && !props.transformMode)
            props.controller?.drag(event);
    }//onMouseMove

    function onMouseEnter(event: MouseEvent)
    {
        emit("mouse-enter", props.controller);
    }//onMouseLeave

    function onMouseLeave(event: MouseEvent)
    {
        emit("mouse-leave", props.controller);
        !props.transformMode &&
        props.controller?.endDrag(event) && 
        props.controller?.restoreComponentZPosition();
    }//onMouseLeave

    function onMouseDownInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        if (event.buttons === 1) {
            transformStartEvent = event;
        }//if
    }//onMouseDownInTransformBox

    function onMouseUpInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        transformStartEvent = undefined;
        props.controller?.endTransform(event);
    }//onMouseUpInTransformBox

    function onMouseMoveInTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        if (transformStartEvent) {
            switch(zone) {
                case "tr-box":
                    props.controller?.startDrag(transformStartEvent);
                    break;
                case "nw-handle":
                case "n-handle":
                case "ne-handle":
                case "w-handle":
                case "e-handle":
                case "sw-handle":
                case "s-handle":
                case "se-handle":
                    props.controller?.startScale(transformStartEvent);
                    break;
                case "rot-handle":
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    props.controller?.startRotate(transformStartEvent);
                    break;
            }//switch
            transformStartEvent = undefined;
            wasJustTransformed = true;
        }//if

        if (event.buttons & 1) {
            switch(zone) {
                case "tr-box":
                    if (props.controller?.isBeingTransformed && props.controller.transformMode == "scaling") {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        props.controller?.scale(event, lastActiveHandle, bBox.value!, center.value!);
                    } else {
                        props.controller?.drag(event);
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
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    props.controller?.scale(event, zone, bBox.value!, center.value!);
                    break;
                case "rot-handle":
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    props.controller?.rotate(event, center.value!);
                    break;
            }//switch
        }//if
    }//onMouseMoveInTransformBox

    function onMouseLeaveFromTransformBox(zone: TransformBoxZone, event: MouseEvent)
    {
        switch (zone) {
            case "tr-box":
            case "rot-handle":
                onMouseUpInTransformBox(zone, event);
        }//switch
    }//onMouseLeaveFromTransformBox

    function onTransformBoxClick(event: MouseEvent) {
        if (wasJustTransformed)
            wasJustTransformed = false;
        else
            props.controller?.onTransformBoxClick(event);
    }//onTransformBoxClick

    function onRightClick(event: MouseEvent, target: "component" | "transform-box") {
        if (props.controller)
            emit("right-click", props.controller, target, event);
    }//onRightClick

    defineExpose({center});
</script>

<template>
    <svg ref="svg" v-bind="origin" 
        class="network-component" 
        :class="{
            highlighted: isHighlighted, 
            dragged: isDragged, 
            beingTransformed: isBeingTransformed
        }"
        >
        <g ref="trGroup" class="tr-group" 
            :transform="transformAttr" :transform-origin="transformOrigin"
            @mousedown.prevent.stop="onMouseDown($event)"
            @mouseup.prevent="onMouseUp($event)"
            @mousemove.prevent="onMouseMove($event)"
            @mouseenter.prevent="onMouseEnter($event)"
            @mouseleave.prevent="onMouseLeave($event)"
            @contextmenu="onRightClick($event, 'component')"
            >
            <slot></slot>
        </g>
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
    </svg>
</template>

<style lang="scss">
    svg.network-component {
            &.dragged {
                outline: thin red solid;
            }
            
            &.beingTransformed > g.tr-group {
                opacity: 0.5;
            }
    }
</style>