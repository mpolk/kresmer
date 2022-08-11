<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main Kresmer Vue component acting as a container for the whole drawing
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType, ref, computed } from 'vue';
    import Kresmer from './Kresmer';
    import NetworkComponentLocation from './NetworkComponentLocation';

    const props = defineProps({
        controller: {
            type: Object as PropType<Kresmer>, 
            required: true
        },
        networkComponents: {
            type: Object as PropType<Record<string, NetworkComponentLocation>>, 
            required: true
        }
    })

    const rootSVG = ref<SVGGraphicsElement>();

    const networkComponentsSorted = computed(() => {
        return Object.values(props.networkComponents).sort((c1, c2) => c1.zIndex - c2.zIndex)
    })

    // Event handlers
    function onMouseDownInComponent(event: MouseEvent, componentID: number)
    {
        const componentClicked = props.controller.getComponentLocationById(componentID);
        props.controller.resetAllComponentMode(componentClicked);
        if (event.buttons === 1) {
            componentClicked.startDrag(event);
        } else if (event.buttons & 2) {
            componentClicked.enterTransformMode(event);
        }//if
    }//onMouseDownInComponent

    function onMouseUpInComponent(event: MouseEvent, componentID: number)
    {
        props.controller.getComponentLocationById(componentID).endDrag(event);
    }//onMouseUpInComponent

    function onMouseMoveInComponent(event: MouseEvent, componentID: number)
    {
        if (event.buttons & 1)
            props.controller.getComponentLocationById(componentID).drag(event);
    }//onMouseMoveInComponent

    function onMouseLeaveComponent(event: MouseEvent, componentID: number)
    {
        props.controller.getComponentLocationById(componentID).endDrag(event);
    }//onMouseLeaveComponent

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseDownOnCanvas(_event: MouseEvent)
    {
        props.controller.resetAllComponentMode();
    }//onMouseDownOnCanvas

    defineExpose({svg: rootSVG});
</script>

<template>
    <svg class="kresmer" ref="rootSVG" @mousedown.prevent="onMouseDownOnCanvas($event)">
        <component v-for="location in networkComponentsSorted" 
                   :is="location.component.vueName"
                   :key="`networkComponent${location.component.id}`"
                   :component-id="location.component.id"
                   :id="location.component.id"
                   :component-name="location.component.name"
                   :origin="location.origin"
                   :transform="location.transform?.toCSS()"
                   v-bind="location.component.props"
                   :is-highlighted="location.component.isHighlighted"
                   :is-dragged="location.isDragged"
                   :is-being-transformed="location.isBeingTransformed"
                   @mousedown.prevent.stop="onMouseDownInComponent($event, location.component.id)"
                   @mouseup.prevent="onMouseUpInComponent($event, location.component.id)"
                   @mousemove.prevent="onMouseMoveInComponent($event, location.component.id)"
                   @mouseleave.prevent="onMouseLeaveComponent($event, location.component.id)"
                >{{location.component.content}}</component>
    </svg>
</template>


<style lang="scss">
    svg.kresmer {
        width: 100%;
        height: 100%;

        svg.network-component {
            overflow: visible;
            cursor: default;

            &.dragged {
                outline: thin red solid;
            }
            
            &.beingTransformed > g {
                opacity: 0.4;
            }
        }
    }
</style>