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
    import TransformBox, { TransformBoxZone } from '../Transform/TransformBox.vue';
import NetworkComponent from './NetworkComponent';
    import NetworkComponentController, { NetworkComponentHolderProps } from "./NetworkComponentController";

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

    const applyRotation = ref(false);
    const bBox = ref<SVGRect>();

    const center = computed(() => {
        const rect = bBox.value;
        if (!rect)
            return undefined;
        return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
    })//center

    onMounted(() => {
        bBox.value = svg.value?.getBBox({stroke: true});
        applyRotation.value = true;
    })//onMounted

    const emit = defineEmits<{
        (event: "right-click", component: NetworkComponent, 
         target: "component" | "transform-box", nativeEvent: MouseEvent): void,
    }>();

    let transformStartEvent: MouseEvent | undefined;
    let wasJustTransformed = false;

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && !props.transformMode) {
            event.preventDefault();
            if (!event.ctrlKey)
                props.controller?.startDrag(event);
            else
                props.controller?.enterTransformMode(event);
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

    function onMouseLeave(event: MouseEvent)
    {
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
                case "rot-handle":
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    props.controller?.startRotate(transformStartEvent, center.value!);
                    break;
            }//switch
            transformStartEvent = undefined;
            wasJustTransformed = true;
        }//if

        if (event.buttons & 1) {
            switch(zone) {
                case "tr-box":
                    props.controller?.drag(event);
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
        onMouseUpInTransformBox(zone, event);
    }//onMouseLeaveFromTransformBox

    function onTransformBoxClick(event: MouseEvent) {
        if (wasJustTransformed)
            wasJustTransformed = false;
        else
            props.controller?.onTransformBoxClick(event);
    }//onTransformBoxClick

    function onRightClick(event: MouseEvent, target: "component" | "transform-box") {
        if (props.controller)
            emit("right-click", props.controller.component, target, event);
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
        <g ref="trGroup" class="tr-group" :transform="transform?.toAttr(applyRotation)"
            @mousedown.prevent.stop="onMouseDown($event)"
            @mouseup.prevent="onMouseUp($event)"
            @mousemove.prevent="onMouseMove($event)"
            @mouseleave.prevent="onMouseLeave($event)"
            @contextmenu="onRightClick($event, 'component')"
            >
            <slot></slot>
        </g>
        <TransformBox v-if="transformMode" :origin="origin!" 
            :transform="transform" :transform-mode="transformMode" :apply-rotation="applyRotation"
            ref="trBox" :b-box="bBox!"
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