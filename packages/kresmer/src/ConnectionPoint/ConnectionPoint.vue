<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject, onMounted, ref, watch, nextTick, computed, PropType } from 'vue';
    import Kresmer from '../Kresmer';
    import NetworkElement from '../NetworkElement';
    import NetworkLink from '../NetworkLink/NetworkLink';
    import ConnectionPointProxy from './ConnectionPointProxy';

    const props = defineProps({
        name: {type: [String, Number], required: true},
        x: {type: Number, default: 0}, 
        y: {type: Number, default: 0}, 
        d: {type: Number, default: 10}, 
        dir: {type: [Number, String], default: 90},
        proxy: {type: Object as PropType<ConnectionPointProxy>},
    });

    const hostElement = inject(NetworkElement.ikHostElement)!;
    const hostIsLink = hostElement instanceof NetworkLink;
    const proxy = props.proxy ?? new ConnectionPointProxy(hostElement, props.name, props.dir);
    if (!props.proxy)
        hostElement.addConnectionPoint(props.name, proxy);

    const kresmer = inject(Kresmer.ikKresmer)!;
    const isEditable = inject(Kresmer.ikIsEditable);
    const drawingOrigin = inject(Kresmer.ikDrawingOrigin)!;
    const cpMarker = ref<SVGCircleElement>();

    const dataAttr = computed(() => {
        if (!proxy.isActive)
            return undefined;
        const hostName = hostIsLink ? `-${hostElement.name}` : hostElement.name;
        return `${hostName}:${props.name}`;
    });

    onMounted(updatePos);
    function updatePos()
    {
        const drawingRect = kresmer.drawingRect;
        const mountingRect = kresmer.mountPoint.getBoundingClientRect();
        let coords = {x: props.x, y: props.y};
        let rot = 0;
        if (cpMarker.value?.ownerSVGElement != kresmer.rootSVG) {
            const matrix = cpMarker.value!.getCTM()!;
            coords = {
                x: (matrix.a * props.x) + (matrix.c * props.y) + matrix.e - 
                    drawingRect.left + mountingRect.left + drawingOrigin.x,
                y: (matrix.b * props.x) + (matrix.d * props.y) + matrix.f - 
                    drawingRect.top + mountingRect.top + drawingOrigin.y,
            };        
            rot = Math.atan2(matrix.b, matrix.a) / Math.PI * 180;
        }//if
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
    <circle v-if="proxy.isActive" :cx="x" :cy="y" :r="d/2" class="connection-point-marker" ref="cpMarker"
        :data-connection-point="dataAttr"
        @contextmenu.stop="onRightClick()"
        ><title v-if="hostIsLink">{{ String(name).replace(/@[a-z0-9]+$/, "") }}</title></circle>
    <circle v-else :cx="x" :cy="y" :r="d/2" fill="none" stroke="none" ref="cpMarker"/>
</template>

<style lang="scss">
    .connection-point-marker {
        fill-opacity: 0;
        stroke-opacity: 0;

        &:hover {
            fill-opacity: 0.5;
            stroke-opacity: 1;
        }
    }
</style>