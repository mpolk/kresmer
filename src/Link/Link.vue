<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Component - a generic network element instance 
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, onBeforeMount, PropType } from 'vue';
    import Link from './Link';

    const props = defineProps({
        model: {type: Object as PropType<Link>, required: true},
    });

    onBeforeMount(props.model.initEndPoints);

    const startPoint = computed(() => props.model.startPoint.coords);
    const endPoint = computed(() => props.model.endPoint.coords);
</script>

<template>
    <g :class="model._class.name">
    <polyline :points="`${startPoint?.x},${startPoint?.y} ${endPoint?.x},${endPoint?.y}`"
          class="segment" />
    </g>
</template>