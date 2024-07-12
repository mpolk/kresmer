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

    const props = defineProps({
        connectionId: {type: String, required: true},
    });

    const highlightedConnection = inject(DrawingElement.ikHighlightedConnection)!;

    const clazz = computed(() => {
        return {
            highlighted: props.connectionId == highlightedConnection.id,
        }
    })
</script>

<template>
    <g :class="clazz">
        <slot />
    </g>
</template>
