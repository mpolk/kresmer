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
    import NetworkComponentClass from './NetworkComponentClass';

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const instance = getCurrentInstance()!;
    const networkComponents = reactive<NetworkComponent[]>([]);

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
            template: componentClass.template,
        });
        NetworkComponentClass.registeredClasses[componentClass.name] = componentClass;
        return this;
    }//registerNetworkComponentClass


    /**
     * Adds a new Network Component to the content of the drawing
     * @param component A Network Component to add
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function addNetworkComponent(this: any, component: NetworkComponent)
    {
        networkComponents.push(component);
        return this;
    }//addNetworkComponent


    defineExpose({
        registerNetworkComponentClass,
        addNetworkComponent,
    })//defineExpose
</script>

<template>
    <svg class="kresmer" ref="svg">
        <component v-for="(component, i) in networkComponents" 
                   :is="component.getVueName()"
                   :key="`networkComponent${i}`"
                   />
    </svg>
</template>


<style>
    svg.kresmer {
        width: 100%;
        height: 100%;
    }
</style>