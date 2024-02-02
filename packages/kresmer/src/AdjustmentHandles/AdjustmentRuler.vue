<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for rendering Adjustment Rulers 
 * (ruler-like handles for component numeric props adjustment)
<*************************************************************************** -->

<script lang="ts">
    import { inject, reactive } from 'vue';
    import AdjustmentRuler from './AdjustmentRuler';
    import { NetworkComponent } from '../Kresmer';

    export default {
        name: "adjustment-ruler",
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        targetProp: {type: String, required: true},
        x1: {type: Number, required: true},
        y1: {type: Number, required: true},
        x2: {type: Number, required: true},
        y2: {type: Number, required: true},
        fixedEnd: {type: [Number, String]},
    });//props

    const hostComponent = inject(NetworkComponent.injectionKey)!;
    const proxy = reactive(new AdjustmentRuler(hostComponent, props.targetProp)) as unknown as AdjustmentRuler;
    hostComponent.addAdjustmentHandle(proxy);

    function markerID(forEnd: 1 | 2)
    {
        return `kre:adjustment-ruler-marker${forEnd == props.fixedEnd ? "-fixed" : ""}`;
    }//markerID

    function markerCenter(forEnd: 1 | 2)
    {
        return forEnd === 1 ? {cx: props.x1, cy: props.y1} : {cx: props.x2, cy: props.y2};
    }//markerCenter

    function markerPaddingStyle(forEnd: 1 | 2)
    {
        return forEnd != props.fixedEnd && proxy.isSelected ? "cursor: move" : "";
    }//markerPaddingStyle
</script>

<template>
    <template v-if="hostComponent?.controller?.isInAdjustmentMode">
        <g class="adjustment-ruler" :class="{selected: proxy.isSelected}" @click="hostComponent.selectAdjustmentHandle(proxy)">
            <line :x1="x1" :y1="y1" :x2="x2" :y2="y2"
                :marker-start="`url(#${markerID(1)})`" :marker-end="`url(#${markerID(2)})`" />
            <circle v-for="i in 2" :key="`padding${i}`" v-bind="markerCenter(i as 1|2)" 
                class="marker-padding" style="fill: transparent; stroke: transparent;" 
                :style="markerPaddingStyle(i as 1|2)"/>
        </g>
    </template>
</template>
