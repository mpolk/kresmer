<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject } from 'vue';
    import NetworkComponent from '../NetworkComponent/NetworkComponent';
    import ConnectionPoint from './ConnectionPoint';


    const props = defineProps({
        name: {type: [String,Number], required: true},
        x: {type: Number, default: 0},
        y: {type: Number, default: 0},
        d: {type: Number, default: 0},
        dir: {type: Number, default: 90},
    });

    const model = new ConnectionPoint();
    const component = inject(NetworkComponent.injectionKey)!;

    component.connectionPoints[props.name] = model;
</script>

<template>
    <circle :cx="x" :cy="y" :r="d/2" class="connection-point"/>
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