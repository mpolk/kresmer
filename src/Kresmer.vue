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
        console.debug(`${event} ${componentID}`);
        props.controller.getComponentById(componentID).isHighlighted = true;
    }//onMouseDownInComponent

</script>

<template>
    <svg class="kresmer" ref="svg">
        <component v-for="(location, id) in networkComponents" 
                   :is="location.component.vueName"
                   :key="`networkComponent${id}`"
                   :component-id="location.component.id"
                   :component-name="location.component.name"
                   :origin="location.origin"
                   :transform="location.transform?.toCSS()"
                   v-bind="location.component.props"
                   :is-highlighted="location.component.isHighlighted"
                   @mousedown="onMouseDownInComponent($event, location.component.id)"
                >{{location.component.content}}</component>
    </svg>
</template>


<style>
    svg.kresmer {
        width: 100%;
        height: 100%;
    }
</style>