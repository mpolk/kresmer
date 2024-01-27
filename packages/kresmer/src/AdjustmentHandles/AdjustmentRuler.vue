<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for rendering Adjustment Rulers 
 * (ruler-like handles for component numeric props adjustment)
<*************************************************************************** -->

<script lang="ts">
    import { inject } from 'vue';
    import { NetworkComponent } from '../Kresmer';

    export default {
        name: "adjustment-ruler",
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        x1: {type: Number, required: true},
        y1: {type: Number, required: true},
        x2: {type: Number, required: true},
        y2: {type: Number, required: true},
        fixedEnd: {type: [Number, String]},
    });//props

    const hostComponent = inject(NetworkComponent.injectionKey);

    function markerID(forEnd: 1 | 2)
    {
        return `kre:adjustment-ruler-marker${forEnd == props.fixedEnd ? "-fixed" : ""}`;
    }//markerID
</script>

<template>
    <template v-if="hostComponent?.isSelected">
        <line v-bind="props" class="ruler" :marker-start="`url(#${markerID(1)})`" :marker-end="`url(#${markerID(2)})`" />
    </template>
</template>

<style lang="scss">
    .ruler {
        stroke: brown;
        stroke-width: 4px;
        opacity: 0.5;

        &:hover {
            opacity: 1;
        }
    }
</style>
