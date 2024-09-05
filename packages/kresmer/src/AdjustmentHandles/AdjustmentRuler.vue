<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for rendering Adjustment Rulers 
 * (ruler-like handles for component numeric props adjustment)
<*************************************************************************** -->

<script lang="ts">
    import { inject, reactive, ref } from 'vue';
    import Kresmer from '../Kresmer';
    import { Position } from '../Transform/Transform';
    import AdjustmentRuler from './AdjustmentRuler';
    import { NetworkComponent } from '../Kresmer';

    export default {
        name: "adjustment-ruler",
    }
</script>

<script setup lang="ts">

    const {targetProp, x1, y1, x2, y2, fixedEnd} = defineProps<{
        targetProp: string,
        x1: number
        y1: number,
        x2: number,
        y2: number,
        fixedEnd?: number | string,
    }>();//props

    const hostComponent = inject(NetworkComponent.injectionKey)!;
    const isEmbedded = inject(Kresmer.ikIsEmbedded, false);
    const isBaseObject = inject(Kresmer.ikIsBaseObject, false);
    const proxy = reactive(new AdjustmentRuler(hostComponent, targetProp)) as unknown as AdjustmentRuler;
    hostComponent.addAdjustmentHandle(proxy);
    const kresmer = inject(Kresmer.ikKresmer)!;
    const drawingOrigin = inject(Kresmer.ikDrawingOrigin)!;
    const markerPadding = ref<SVGCircleElement[]>()!;

    function markerID(forEnd: 1 | 2)
    {
        return `kre:adjustment-ruler-marker${forEnd == fixedEnd ? "-fixed" : ""}`;
    }//markerID

    function markerCenter(forEnd: 1 | 2)
    {
        return forEnd === 1 ? {cx: x1, cy: y1} : {cx: x2, cy: y2};
    }//markerCenter

    function markerPaddingStyle(forEnd: 1 | 2)
    {
        return forEnd != fixedEnd && proxy.isSelected ? "cursor: move" : "";
    }//markerPaddingStyle


    function onMouseDownInMarker(event: MouseEvent, forEnd: 1 | 2)
    {
        if (forEnd == fixedEnd || !proxy.isSelected)
            return;

        event.preventDefault();
        event.stopPropagation();

        const drawingRect = kresmer.drawingRect;
        const mountingRect = kresmer.mountPoint.getBoundingClientRect();
        const ends: [Position, Position] = [{x: x1, y: y1}, {x: x2, y: y2}];
        for (const i of [0,1]) {
            const mp = markerPadding.value![i];
            if (mp.ownerSVGElement != kresmer.rootSVG) {
                const matrix = mp.getCTM()!;
                ends[i] = {
                    x: (matrix.a * ends[i].x) + (matrix.c * ends[i].y) + matrix.e - 
                        drawingRect.left + mountingRect.left + drawingOrigin.x,
                    y: (matrix.b * ends[i].x) + (matrix.d * ends[i].y) + matrix.f - 
                        drawingRect.top + mountingRect.top + drawingOrigin.y,
                };        
            }//if
        }//if
        if (forEnd === 1)
            ends.reverse();
        proxy.startDrag(event, markerPadding.value![forEnd-1], ends);
    }//onMouseDownInMarker


    function onMouseMoveInMarker(event: MouseEvent, forEnd: 1 | 2)
    {
        if (forEnd == fixedEnd || !(event.buttons & 1))
            return;

        event.preventDefault();
        event.stopPropagation();
        proxy.drag(event);
    }//onMouseMoveInMarker


    function onMouseUpInMarker(event: MouseEvent, forEnd: 1 | 2)
    {
        if (forEnd == fixedEnd || !proxy.isDragged)
            return;

        event.preventDefault();
        event.stopPropagation();
        proxy.endDrag(event);
    }//onMouseMoveUpMarker
</script>

<template>
    <template v-if="hostComponent?.controller?.isInAdjustmentMode && (!isEmbedded || isBaseObject)">
        <g class="adjustment-ruler" :class="{selected: proxy.isSelected}" @click="hostComponent.selectAdjustmentHandle(proxy)">
            <line :x1="x1" :y1="y1" :x2="x2" :y2="y2"
                :marker-start="`url(#${markerID(1)})`" :marker-end="`url(#${markerID(2)})`" />
            <circle v-for="i in 2" :key="`padding${i}`" ref="markerPadding" v-bind="markerCenter(i as 1|2)" 
                class="marker-padding" style="fill: transparent; stroke: transparent;" 
                :style="markerPaddingStyle(i as 1|2)"
                @mousedown="onMouseDownInMarker($event, i as 1|2)"
                @mousemove="onMouseMoveInMarker($event, i as 1|2)"
                @mouseup="onMouseUpInMarker($event, i as 1|2)"
                />
        </g>
    </template>
</template>
