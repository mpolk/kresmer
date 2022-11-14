<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for rendering Network Connection Points 
<*************************************************************************** -->

<script setup lang="ts">

    const props = defineProps({
        name: {type: [String,Number], required: true},
        x: {type: Number, default: 0},
        y: {type: Number, default: 0},
        d: {type: Number, default: 0},
        dir: {type: Number, default: 90},
    });
</script>

<template>
    <circle :cx="x" :cy="y" :r="d/2" class="connection-point"/>
</template>

<style lang="scss">
    .connection-point {
        cursor: pointer; 
        fill: yellow;
        opacity: 0;

        &:hover {
            opacity: 0.5;
            filter: url(#kre:fltCPHover);
        }
    }
</style>