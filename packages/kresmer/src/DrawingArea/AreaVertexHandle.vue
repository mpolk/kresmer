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

    defineProps({
        vertex: {type: Object as PropType<AreaVertex>, required: true},
        pos: {type: Object as PropType<Position>, required: true},
    });
    
</script>

<template>
    <line :x1="pos.x" :y1="pos.y" :x2="vertex.coords.x" :y2="vertex.coords.y" class="vertex-handle"/>
    <circle :cx="pos.x" :cy="pos.y" class="vertex-handle"/>
</template>

<style lang="scss">
    circle.vertex-handle {
        r: 4px;
        stroke: darkred; stroke-width: 2px;
        fill: wheat;
    }
    line.vertex-handle {
        stroke: darkred; stroke-width: 1px;
    }
</style>