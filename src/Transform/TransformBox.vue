<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box showing at the time of a component transformation
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, PropType } from 'vue';
    import { TransformMode } from '../NetworkComponent/NetworkComponentController';

    const props = defineProps({
        bBox: {type: Object as PropType<DOMRect>, required: true},
        transformMode: {type: String as PropType<TransformMode>},
    })

    const inRotationMode = computed(() => props.transformMode === "rotation");

    const rx = computed(() => {
        if (!inRotationMode.value)
            return undefined;
        let rx = Math.min(props.bBox.width, props.bBox.height);
        if (rx < 5)
            rx = 5;
        if (rx > 8)
            rx = 8;
        return rx;
    });

    const emit = defineEmits<{
        (event: "box-clicked", nativeEvent: MouseEvent): void,
        (event: "box-right-clicked", nativeEvent: MouseEvent): void,
    }>();
</script>

<template>
    <rect v-bind="bBox" class="tr-box" :class="{rotated: inRotationMode}" :rx="rx" 
          @click.prevent.stop="emit('box-clicked', $event)"
          @contextmenu.prevent.stop="emit('box-right-clicked', $event)"
          @mousedown.stop=""
          />
</template>

<style>
    .tr-box {
        stroke: blue;
        stroke-width: 2px;
        fill: lightblue;
        fill-opacity: 0.3;
    }
</style>
