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
    import NetworkComponentLocation from './NetworkComponentLocation';

    defineProps({
        networkComponents: {
            type: Object as PropType<Record<string, NetworkComponentLocation>>, 
            required: true
        }
    })

    /**
     * Outputs an attribute list for the network component
     * @param location A component location
     */
    function componentAttrs(location: NetworkComponentLocation)
    {
        return {
            ...location.component.props, 
            "origin": location.origin,
            "transform": location.transform?.toCSS(),
        };
    }//componentAttrs
</script>

<template>
    <svg class="kresmer" ref="svg">
        <component v-for="(location, id) in networkComponents" 
                   :is="location.component.vueName"
                   :key="`networkComponent${id}`"
                   v-bind="componentAttrs(location)"
                >{{location.component.content}}</component>
    </svg>
</template>


<style>
    svg.kresmer {
        width: 100%;
        height: 100%;
    }
</style>