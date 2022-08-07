<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main Kresmer Vue component acting as a container for the whole drawing
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType } from 'vue';
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

    // Event handlers
    function onMouseDownInComponent(event: MouseEvent, componentID: number)
    {
        props.controller.getComponentById(componentID).isHighlighted = true;
    }//onMouseDownInComponent

    function onMouseUpInComponent(event: MouseEvent, componentID: number)
    {
        props.controller.getComponentById(componentID).isHighlighted = false;
    }//onMouseUpInComponent

    function onMouseOutFromComponent(event: MouseEvent, componentID: number)
    {
        console.debug(event);
        let el = event.relatedTarget;
        while (el instanceof Element) {
            if (el.id == componentID.toString())
                return;
            el = el.parentElement;
        }//while
        props.controller.getComponentById(componentID).isHighlighted = false;
    }//onMouseOutFromComponent
</script>

<template>
    <svg class="kresmer" ref="svg">
        <component v-for="(location, id) in networkComponents" 
                   :is="location.component.vueName"
                   :key="`networkComponent${id}`"
                   :component-id="location.component.id"
                   :id="location.component.id"
                   :component-name="location.component.name"
                   :origin="location.origin"
                   :transform="location.transform?.toCSS()"
                   v-bind="location.component.props"
                   :is-highlighted="location.component.isHighlighted"
                   @mousedown.prevent="onMouseDownInComponent($event, location.component.id)"
                   @mouseup="onMouseUpInComponent($event, location.component.id)"
                   @mouseout="onMouseOutFromComponent($event, location.component.id)"
                >{{location.component.content}}</component>
    </svg>
</template>


<style lang="scss">
    svg.kresmer {
        width: 100%;
        height: 100%;

        svg.network-component {
            overflow: visible;
            &.highlighted {
                outline: thin red solid;
            }
        }
    }
</style>