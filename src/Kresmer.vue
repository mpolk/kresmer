<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main Kresmer Vue component acting as a container for the whole drawing
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, computed, provide, readonly } from 'vue';
    import Kresmer from './Kresmer';
    import NetworkComponentController from './NetworkComponent/NetworkComponentController';
    import NetworkComponentHolder from './NetworkComponent/NetworkComponentHolder.vue';

    export default {
        components: { NetworkComponentHolder },
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        controller: {
            type: Object as PropType<Kresmer>, 
            required: true
        },
        networkComponents: {
            type: Object as PropType<Record<string, NetworkComponentController>>, 
            required: true
        }
    });

    provide(Kresmer.injectionKey, props.controller);
    const rootSVG = ref<SVGGraphicsElement>();

    const networkComponentsSorted = computed(() => {
        return Object.values(props.networkComponents).sort((c1, c2) => c1.zIndex - c2.zIndex)
    })

    // Event handlers

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseDownOnCanvas(_event: MouseEvent)
    {
        props.controller.resetAllComponentMode();
    }//onMouseDownOnCanvas

    defineExpose({svg: rootSVG});
</script>

<template>
    <svg class="kresmer" ref="rootSVG" @mousedown.prevent="onMouseDownOnCanvas($event)">
        <NetworkComponentHolder v-for="controller in networkComponentsSorted" 
                   :key="`networkComponent${controller.component.id}`"
                   :id="controller.component.id"
                   :controller="controller"
                   :origin="controller.origin"
                   :transform="controller.transform?.toCSS()"
                   :is-highlighted="controller.component.isHighlighted"
                   :is-dragged="controller.isDragged"
                   :is-being-transformed="controller.isBeingTransformed"
                   :transform-mode="controller.transformMode"
                >
            <component :is="controller.component.vueName"
                   :component-id="controller.component.id"
                   :component-name="controller.component.name"
                   v-bind="controller.component.props"
                >
                {{controller.component.content}}
            </component>
        </NetworkComponentHolder>
    </svg>
</template>


<style lang="scss">
    svg.kresmer {
        width: 100%;
        height: 100%;

        svg.network-component {
            overflow: visible;
            cursor: default;
        }
    }
</style>