<!-- **************************************************************************>
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Connection Indicator - a child container that renders highlighting of
 * the link traversing a network component
<*************************************************************************** -->

<script lang="ts">
    import { inject, computed } from 'vue';
    import DrawingElement from '../DrawingElement/DrawingElement';

    export default {
        name: "ConnectionIndicator"
    }
</script>

<script setup lang="ts">

    const {connectionId} = defineProps<{
        connectionId?: string | number,
    }>();

    const hostElement = inject(DrawingElement.ikHostElement)!;
    const highlightedConnections = inject(DrawingElement.ikHighlightedConnections)!;

    const clazz = computed(() => {
        return {
            highlighted: highlightedConnections.has(String(connectionId)),
        }
    })//clazz


    function onMouseEnter() {
        if (connectionId)
            hostElement.traceConnections(String(connectionId), true);
    }//onMouseEnter

    function onMouseLeave() {
        if (connectionId)
            hostElement.traceConnections(String(connectionId), false);
    }//onMouseLeave

</script>

<template>
    <g class="ConnectionIndicator" :data-connection-id="connectionId" :class="clazz" 
        @mouseenter.stop="onMouseEnter" @mouseleave.stop="onMouseLeave">
        <slot />
    </g>
</template>
