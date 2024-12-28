<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject, onMounted, ref, watch, nextTick, computed, onBeforeUnmount } from 'vue';
    import Kresmer from '../Kresmer';
    import DrawingElement from '../DrawingElement/DrawingElement';
    import NetworkLink from '../NetworkLink/NetworkLink';
    import ConnectionPoint from './ConnectionPoint';

    const {name, x = 0, y = 0, d = 10, dir = 90, model, showTooltip = true, connectionId, connectionMapIn, connectionMapOut} = defineProps<{
        name: string | number,
        x?: number, 
        y?: number, 
        d?: number, 
        dir?: number | string,
        model?: ConnectionPoint,
        showTooltip?: boolean,
        connectionId?: string,
        connectionMapIn?: Record<string, string>,
        connectionMapOut?: Record<string, string>,
    }>();

    const hostElement = inject(DrawingElement.ikHostElement)!;
    const modelObject = model ?? new ConnectionPoint(hostElement, name, dir, {connectionId, connectionMapIn, connectionMapOut});
    if (!model)
        hostElement.addConnectionPoint(name, modelObject);

    const kresmer = inject(Kresmer.ikKresmer)!;
    const isEditable = inject(Kresmer.ikIsEditable);
    const drawingOrigin = inject(Kresmer.ikDrawingOrigin)!;
    const thisCP = ref<SVGCircleElement>();

    const dataAttr = computed(() => {
        if (!modelObject.isActive)
            return undefined;
        const hostName = hostElement instanceof NetworkLink ? `-${hostElement.name}` : hostElement.name;
        return `${hostName}:${name}`;
    });

    function updatePos()
    {
        if (!thisCP.value)
            return;
        const drawingRect = kresmer.drawingRect;
        const mountingRect = kresmer.mountPoint.getBoundingClientRect();
        let coords = {x, y};
        let rot = 0;
        if (thisCP.value.ownerSVGElement != kresmer.rootSVG) {
            const matrix = thisCP.value.getCTM()!;
            coords = {
                x: (matrix.a * x) + (matrix.c * y) + matrix.e - 
                    drawingRect.left + mountingRect.left + drawingOrigin.x,
                y: (matrix.b * x) + (matrix.d * y) + matrix.f - 
                    drawingRect.top + mountingRect.top + drawingOrigin.y,
            };        
            rot = Math.atan2(matrix.b, matrix.a) / Math.PI * 180;
        }//if
        modelObject._setPos(coords, modelObject.dir0 + rot);
    }//updatePos

    onMounted(() => {
        modelObject.restoreConnectedVertices();
        updatePos();
    });

    onBeforeUnmount(() => {
        modelObject.saveConnectedVertices();
    });

    function onRightClick()
    {
        if (isEditable) {
            modelObject.hostElement.kresmer.emit("connection-point-right-click", modelObject);
        }//if
    }//onRightClick

    watch(modelObject.posUpdateTrigger, () => {nextTick(updatePos)});
</script>

<template>
    <g v-if="modelObject.isActive" @contextmenu.stop="onRightClick()">
        <title v-if="showTooltip">{{ String(name).replace(/@[a-z0-9]+$/, "") }}</title>
        <circle :cx="x" :cy="y" :r="d/2"
            class="connection-point-padding" 
            :class="{visible: kresmer.isEditable}" 
            ref="thisCP" :data-connection-point="dataAttr"
            />
        <polygon :points="`${x-d*0.5},${y} ${x},${y-d*0.5} ${x+d*0.5},${y} ${x},${y+d*0.5}`"
            class="connection-point-marker" 
            :class="{visible: kresmer.isEditable, always: kresmer._showAllConnectionPoints.value || hostElement.isSelected}" 
            />
    </g>
    <circle v-else :cx="x" :cy="y" :r="d/2" fill="none" stroke="none" ref="thisCP"/>
</template>

<style lang="scss">
    .connection-point-marker {
        fill: black;
        stroke: black;
        fill-opacity: 0;
        stroke-opacity: 0;

        &.visible:hover, &.always.visible {
            fill-opacity: 0.4;
            stroke-opacity: 0.8;
        }
    }
    .connection-point-padding {
        fill-opacity: 0;
        stroke-opacity: 0;
    }
</style>
