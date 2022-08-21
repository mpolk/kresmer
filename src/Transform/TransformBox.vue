<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box showing at the time of a component transformation
<*************************************************************************** -->

<script setup lang="ts">
    import { computed, inject, PropType, ref } from 'vue';
    import Kresmer from '../Kresmer';
    import { TransformMode } from '../NetworkComponent/NetworkComponentController';
    import { Position } from './Transform';

    const props = defineProps({
        bBox: {type: Object as PropType<DOMRect>, required: true},
        transformMode: {type: String as PropType<TransformMode>},
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const kresmer = inject(Kresmer.injectionKey)!;

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

    const center = computed(() => {
        const rect = props.bBox;
        return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
    })//center

    const mousePos = ref<Position>();
    function onMouseMove(event: MouseEvent)
    {
        mousePos.value =  {x: event.clientX, y: event.clientY};
    }//onMouseMove

    const cursor = computed(() => {
        const rect = props.bBox;
        const pos = mousePos.value;
        if (!pos)
            return 'default';
        if (pos.x >= rect.width * 0.25 && pos.x <= rect.width * 0.75 &&
            pos.y >= rect.height * 0.25 && pos.y <= rect.height * 0.75)
            return 'default';
        if (pos.x >= rect.width * 0.25 && pos.x <= rect.width * 0.75)
            return 'ew-resize';
        if (pos.y >= rect.height * 0.25 && pos.y <= rect.height * 0.75)
            return 'ns-resize';
        return 'default';
    })//cursor

    const emit = defineEmits<{
        (event: "box-clicked", nativeEvent: MouseEvent): void,
        (event: "box-right-clicked", nativeEvent: MouseEvent): void,
    }>();
</script>

<template>
    <rect v-bind="bBox" class="tr-box" :class="{rotated: inRotationMode}" 
          :style="`cursor: ${cursor}`"
          :rx="rx" 
          @click.prevent.stop="emit('box-clicked', $event)"
          @contextmenu.prevent.stop="emit('box-right-clicked', $event)"
          @mousedown.stop=""
          @mousemove="onMouseMove"
          />
    <circle v-if="inRotationMode" 
            :cx="center.x" :cy="center.y" :r="Math.min(bBox.width, bBox.height) * 0.25" 
            class="hub"/>
</template>

<style>
    .tr-box {
        stroke: blue;
        stroke-width: 1.5px;
        fill: lightblue;
        fill-opacity: 0.3;
    }

    .hub {
        stroke: blue;
        stroke-width: 1.5px;
        fill: lightblue;
        fill-opacity: 0.3;
    }
</style>
