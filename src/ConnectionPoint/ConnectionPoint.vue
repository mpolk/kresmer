<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject, onMounted, ref, watch, nextTick } from 'vue';
    import Kresmer from '../Kresmer';
    import NetworkComponent from '../NetworkComponent/NetworkComponent';
    import ConnectionPointProxy from './ConnectionPointProxy';

    const props = defineProps({
        name: {type: [String, Number], required: true},
        x: {type: Number, default: 0}, 
        y: {type: Number, default: 0}, 
        d: {type: Number, default: 0}, 
        dir: {type: Number, default: 90},
    });

    const proxy = new ConnectionPointProxy(props.dir);
    const component = inject(NetworkComponent.injectionKey)!;
    component.connectionPoints[props.name] = proxy;

    const kresmer = inject(Kresmer.injectionKey)!;
    const circle = ref<SVGCircleElement>();

    onMounted(updatePos);
    function updatePos()
    {
        const drawingRect = kresmer.drawingRect;
        const mountingRect = kresmer.mountPoint.getBoundingClientRect();
        const matrix = circle.value!.getCTM()!;
        const connectionCoords = {
            x: (matrix.a * props.x) + (matrix.c * props.y) + matrix.e - 
               drawingRect.left + mountingRect.left /* - window.scrollX */,
            y: (matrix.b * props.x) + (matrix.d * props.y) + matrix.f - 
               drawingRect.top + mountingRect.top /* - window.scrollY */,
        };        
        proxy.setCoords(connectionCoords);
    }//updatePos

    watch(proxy.posUpdateTrigger, () => {nextTick(updatePos)});
</script>

<template>
    <circle :cx="x" :cy="y" :r="d/2" class="connection-point" ref="circle"
        :data-connection-point="`${component.name}:${name}`"/>
</template>

<style lang="scss">
    .connection-point {
        cursor: pointer; 
        fill: yellow;
        fill-opacity: 0;

        &:hover {
            fill-opacity: 0.5;
            // filter: url(#kre:fltCPHover);
        }
    }
</style>