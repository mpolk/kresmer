<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject, onMounted, ref, watch, nextTick, computed } from 'vue';
    import Kresmer from '../Kresmer';
    import NetworkElement from '../NetworkElement';
    import NetworkLink from '../NetworkLink/NetworkLink';
    import ConnectionPointProxy from './ConnectionPointProxy';

    const props = defineProps({
        name: {type: [String, Number], required: true},
        x: {type: Number, default: 0}, 
        y: {type: Number, default: 0}, 
        d: {type: Number, default: 0}, 
        dir: {type: [Number, String], default: 90},
    });

    const hostElement = inject(NetworkElement.ikHostElement)!;
    const proxy = new ConnectionPointProxy(hostElement, props.name, props.dir);
    hostElement.setConnectionPoint(props.name, proxy);

    const kresmer = inject(Kresmer.ikKresmer)!;
    const isEditable = inject(Kresmer.ikIsEditable);
    const circle = ref<SVGCircleElement>();

    const dataAttr = computed(() => {
        const hostName = hostElement instanceof NetworkLink ? `-${hostElement.name}` : hostElement.name;
        return proxy.isAcceptingConnections ? `${hostName}:${props.name}` : undefined
    });

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
            proxy.hostElement.kresmer.emit("connection-point-right-click", proxy);
        }//if
    }//onRightClick

    watch(proxy.posUpdateTrigger, () => {nextTick(updatePos)});
</script>

<template>
    <circle :cx="x" :cy="y" :r="d/2" class="connection-point" ref="circle"
        :data-connection-point="dataAttr"
        @contextmenu.stop="onRightClick()"
        ><title>{{ String(name).replace(/@[a-z0-9]+$/, "") }}</title></circle>
</template>

<style lang="scss">
    .connection-point {
        fill-opacity: 0;
        stroke-opacity: 0;

        &:hover {
            fill-opacity: 0.5;
            stroke-opacity: 1;
        }
    }
</style>