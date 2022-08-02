<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *                        The main Vue component
<*************************************************************************** -->

<script setup lang="ts">
    /**
     * The main Kresmer Vue component acting as a container for the whole drawing
     */

    import { getCurrentInstance, reactive } from 'vue';
    import NetworkComponent from './NetworkComponent';
    import NetworkComponentLocation from './NetworkComponentLocation';
    import NetworkComponentClass from './NetworkComponentClass';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const instance = getCurrentInstance()!;

    /**
     * Components currently placed to the drawing
     */
    const networkComponents = reactive<Record<string, NetworkComponentLocation>>({});

    /**
     * Registers a Network Component Class in the Kresmer and registers
     * the corresponding new component in the Vue application
     * 
     * @param componentClass A Network Component Class to register
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function registerNetworkComponentClass(this: any, componentClass: NetworkComponentClass) 
    {
        instance.appContext.app.component(componentClass.getVueName(), 
        {
            template: componentClass.getTemplate(),
            props: {
                ...componentClass.getProps(),
                originX: {type: Number, required: true},
                originY: {type: Number, required: true},
            },
        });
        NetworkComponentClass.registeredClasses[componentClass.getName()] = componentClass;
        return this;
    }//registerNetworkComponentClass


    /**
     * Adds a new Network Component to the content of the drawing
     * @param component A Network Component to add
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function placeNetworkComponent(this: any, component: NetworkComponent,
                                   origin: {x: number, y: number})
    {
        networkComponents[component.getID()] = new NetworkComponentLocation(
            component, {origin});
        return this;
    }//placeNetworkComponent

    /**
     * Outputs an attribute list for the network component
     * @param location A component location
     */
    function componentAttrs(location: NetworkComponentLocation)
    {
        return {
            ...location.component.getProps(), 
            "origin-x": location.origin.x,
            "origin-y": location.origin.y,
        };
    }//componentAttrs

    defineExpose({
        registerNetworkComponentClass,
        placeNetworkComponent,
    })//defineExpose
</script>

<template>
    <svg class="kresmer" ref="svg">
        <component v-for="(location, id) in networkComponents" 
                   :is="location.component.getVueName()"
                   :key="`networkComponent${id}`"
                   v-bind="componentAttrs(location)"
                >{{location.component.getContent()}}</component>
    </svg>
</template>


<style>
    svg.kresmer {
        width: 100%;
        height: 100%;
    }
</style>