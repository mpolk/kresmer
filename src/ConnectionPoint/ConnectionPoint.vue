<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Connection Point (the location for a Link-to-Component or 
 * Component-to-Component attachment) - presentation layer
<*************************************************************************** -->

<script setup lang="ts">
    import { inject, onMounted, ref, toRefs } from 'vue';
    import Kresmer from '../Kresmer';
    import NetworkComponent from '../NetworkComponent/NetworkComponent';
    import ConnectionPoint from './ConnectionPoint';

    export interface ConnectionPointProps {
        name: string|number,
        x?: number,
        y?: number,
        d?: number,
        dir?: number,
    }//ConnectionPointProps

    const props = withDefaults(defineProps<ConnectionPointProps>(), {x: 0, y: 0, d: 0, dir: 90});

    const model = new ConnectionPoint(toRefs(props));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const component = inject(NetworkComponent.injectionKey)!;
    component.connectionPoints[props.name] = model;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const kresmer = inject(Kresmer.injectionKey)!;
    const circle = ref<SVGCircleElement>();

    onMounted(updatePos);
    function updatePos()
    {
        const drawingRect = kresmer.drawingRect;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const matrix = circle.value!.getCTM()!;
        const connectionCoords = {
            x: (matrix.a * props.x) + (matrix.c * props.y) + matrix.e - drawingRect.left,
            y: (matrix.b * props.x) + (matrix.d * props.y) + matrix.f - drawingRect.top,
        };        
        model.setCoords(connectionCoords);
    }//updatePos
</script>

<template>
    <circle :cx="x" :cy="y" :r="d/2" class="connection-point" ref="circle"/>
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