<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject, onMounted, ref, watch, nextTick, computed, PropType, onBeforeUnmount } from 'vue';
    import Kresmer from '../Kresmer';
    import DrawingElement from '../DrawingElement/DrawingElement';
    import NetworkLink from '../NetworkLink/NetworkLink';
    import ConnectionPoint from './ConnectionPoint';

    const props = defineProps({
        name: {type: [String, Number], required: true},
        x: {type: Number, default: 0}, 
        y: {type: Number, default: 0}, 
        d: {type: Number, default: 10}, 
        dir: {type: [Number, String], default: 90},
        proxy: {type: Object as PropType<ConnectionPoint>},
        showTooltip: {type: Boolean, default: true},
        connectionId: {type: String},
    });

    const hostElement = inject(DrawingElement.ikHostElement)!;
    const proxy = props.proxy ?? new ConnectionPoint(hostElement, props.name, props.dir, props.connectionId);
    if (!props.proxy)
        // eslint-disable-next-line vue/no-setup-props-destructure
        hostElement.addConnectionPoint(props.name, proxy);

    const kresmer = inject(Kresmer.ikKresmer)!;
    const isEditable = inject(Kresmer.ikIsEditable);
    const drawingOrigin = inject(Kresmer.ikDrawingOrigin)!;
    const thisCP = ref<SVGCircleElement>();

    const dataAttr = computed(() => {
        if (!proxy.isActive)
            return undefined;
        const hostName = hostElement instanceof NetworkLink ? `-${hostElement.name}` : hostElement.name;
        return `${hostName}:${props.name}`;
    });

    function updatePos()
    {
        if (!thisCP.value)
            return;
        const drawingRect = kresmer.drawingRect;
        const mountingRect = kresmer.mountPoint.getBoundingClientRect();
        let coords = {x: props.x, y: props.y};
        let rot = 0;
        if (thisCP.value.ownerSVGElement != kresmer.rootSVG) {
            const matrix = thisCP.value.getCTM()!;
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

    onMounted(() => {
        proxy.restoreConnectedVertices();
        updatePos();
    });

    onBeforeUnmount(() => {
        proxy.saveConnectedVertices();
    });

    function onRightClick()
    {
        if (isEditable) {
            proxy.hostElement.kresmer.emit("connection-point-right-click", proxy);
        }//if
    }//onRightClick

    watch(proxy.posUpdateTrigger, () => {nextTick(updatePos)});
</script>

<template>
    <g v-if="proxy.isActive" @contextmenu.stop="onRightClick()">
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
