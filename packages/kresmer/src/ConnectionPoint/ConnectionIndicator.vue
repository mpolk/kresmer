<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
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
        connectionId: string | number,
    }>();

    const hostElement = inject(DrawingElement.ikHostElement)!;
    const highlightedConnection = inject(DrawingElement.ikHighlightedConnection)!;

    const clazz = computed(() => {
        return {
            highlighted: highlightedConnection.includes(String(connectionId)),
        }
    })//clazz


    function onMouseEnter() {
        hostElement.propagateLinkHighlighting(String(connectionId), true);
    }//onMouseEnter

    function onMouseLeave() {
        hostElement.propagateLinkHighlighting(String(connectionId), false);
    }//onMouseLeave

</script>

<template>
    <g :class="clazz" @mouseenter.stop="onMouseEnter" @mouseleave.stop="onMouseLeave">
        <slot />
    </g>
</template>
