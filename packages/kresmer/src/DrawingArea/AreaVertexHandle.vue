<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * DrawingArea Vertex Handle - presentation code 
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType } from 'vue';
    import AreaVertex from './AreaVertex';
    import { Position } from '../Transform/Transform';

    const props = defineProps({
        handleNumber: {type: Number as PropType<1|2>},
        vertex: {type: Object as PropType<AreaVertex>, required: true},
        vertex2: {type: Object as PropType<AreaVertex>},
        eventTarget: {type: Object as PropType<AreaVertex>},
        pos: {type: Object as PropType<Position>, required: true},
    });

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1) {
            event.preventDefault();
            props.vertex.startHandleDrag(event, props.handleNumber);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        props.vertex.endHandleDrag(event, props.handleNumber);
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1) {
            props.vertex.dragHandle(event, props.handleNumber);
        }//if
    }//onMouseMove

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onMouseLeave(event: MouseEvent)
    {
    }//onMouseLeave
    
</script>

<template>
    <line :x1="pos.x" :y1="pos.y" :x2="vertex.coords.x" :y2="vertex.coords.y" class="vertex-handle"/>
    <line v-if="vertex2" :x1="pos.x" :y1="pos.y" :x2="vertex2.coords.x" :y2="vertex2.coords.y" class="vertex-handle"/>
    <circle :cx="pos.x" :cy="pos.y" class="vertex-handle"
        @mousedown.stop="onMouseDown($event)"
        @mouseup.stop="onMouseUp($event)"
        @mousemove.stop="onMouseMove($event)"
        @mouseleave.stop="onMouseLeave($event)"
        />
</template>

<style lang="scss">
    circle.vertex-handle {
        r: 5px;
        stroke: darkred; stroke-width: 2px;
        fill: wheat;
    }
    line.vertex-handle {
        stroke: darkred; stroke-width: 1px;
    }
</style>