<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Component - a generic network element instance 
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, PropType } from 'vue';
    import Link from './Link';

    const props = defineProps({
        model: {type: Object as PropType<Link>, required: true},
    });

    const startPoint = computed(() => {
        if (props.model.startPoint) {
            return props.model.startPoint;
        } else if (props.model.startPointConnection) {
            return props.model.startPointConnection.connectionCoords;
        } else {
            return {x: props.model.kresmer.drawingRect.width/2, y: props.model.kresmer.drawingRect.height/2};
        }//if
    });

    const endPoint = computed(() => {
        if (props.model.endPoint) {
            return props.model.endPoint;
        } else if (props.model.endPointConnection) {
            return props.model.endPointConnection.connectionCoords;
        } else {
            return {x: props.model.kresmer.drawingRect.width/2, y: props.model.kresmer.drawingRect.height/2};
        }//if
    });
</script>

<template>
    <g :class="model._class.name">
    <polyline :points="`${startPoint?.x},${startPoint?.y} ${endPoint?.x},${endPoint?.y}`"
          class="segment" />
    </g>
</template>