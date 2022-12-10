<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Component - a generic network element instance 
<*************************************************************************** -->

<script setup lang="ts">
    import { onBeforeMount, PropType } from 'vue';
    import NetworkLink from './NetworkLink';
    import LinkEndPoint from './LinkEndPoint';

    const props = defineProps({
        model: {type: Object as PropType<NetworkLink>, required: true},
        startPoint: {type: Object as PropType<LinkEndPoint>, required: true},
        endPoint: {type: Object as PropType<LinkEndPoint>, required: true},
    });

    onBeforeMount(props.model.initEndPoints);
</script>

<template>
    <g :class="model._class.name">
    <polyline :points="`${startPoint.coords.x},${startPoint.coords.y} ${endPoint.coords.x},${endPoint.coords.y}`"
          class="segment" />
    </g>
</template>