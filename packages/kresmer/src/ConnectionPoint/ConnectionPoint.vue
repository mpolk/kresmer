<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
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
        dir: {type: [Number, String], default: 90},
    });

    const component = inject(NetworkComponent.injectionKey)!;
    const proxy = new ConnectionPointProxy(component, props.name, props.dir);
    component.connectionPoints[props.name] = proxy;

    const kresmer = inject(Kresmer.ikKresmer)!;
    const isEditable = inject(Kresmer.ikIsEditable);
    const circle = ref<SVGCircleElement>();

    onMounted(updatePos);
    function updatePos()
    {
        const drawingRect = kresmer.drawingRect;
        const mountingRect = kresmer.mountPoint.getBoundingClientRect();
        const matrix = circle.value!.getCTM()!;
        const coords = {
            x: (matrix.a * props.x) + (matrix.c * props.y) + matrix.e - 
               drawingRect.left + mountingRect.left /* - window.scrollX */,
            y: (matrix.b * props.x) + (matrix.d * props.y) + matrix.f - 
               drawingRect.top + mountingRect.top /* - window.scrollY */,
        };        
        const rot = Math.atan2(matrix.b, matrix.a) / Math.PI * 180;
        proxy._setPos(coords, proxy.dir0 + rot);
    }//updatePos

    function onRightClick()
    {
        if (isEditable) {
            proxy.component.kresmer.emit("connection-point-right-click", proxy);
        }//if
    }//onRightClick

    watch(proxy.posUpdateTrigger, () => {nextTick(updatePos)});
</script>

<template>
    <circle :cx="x" :cy="y" :r="d/2" class="connection-point" ref="circle"
        :data-connection-point="`${component.name}:${name}`"
        @contextmenu.stop="onRightClick()"
        ><title>{{ name }}</title></circle>
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