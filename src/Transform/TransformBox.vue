<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box appearing at the time of a component transformation
<*************************************************************************** -->

<script lang="ts">
    export type TransformBoxZone = "tr-box" | "h-handle" | "v-handle" | "corner-handle" | "rot-handle";
</script>

<script setup lang="ts">
    import { computed, PropType } from 'vue';
    import { TransformMode } from '../NetworkComponent/NetworkComponentController';
    import { Position } from './Transform';

    const props = defineProps({
        origin: {type: Object as PropType<Position>, required: true},
        bBox: {type: Object as PropType<DOMRect>, required: true},
        transformMode: {type: String as PropType<TransformMode>},
    });

    const inRotationMode = computed(() => props.transformMode === "rotation");

    const rx = computed(() => {
        if (!inRotationMode.value)
            return undefined;
        return Math.max(Math.min(props.bBox.width * 0.2, props.bBox.height * 0.2), 5);
    });

    const center = computed(() => {
        const rect = props.bBox;
        return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
    })//center

    const handleSize = computed(() => {
        return Math.max(Math.min(props.bBox.width, props.bBox.height) * 0.15, 5);
    });//handleSize

    const emit = defineEmits<{
        (event: "mouse-down", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "mouse-up", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "mouse-move", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "mouse-leave", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "box-click", nativeEvent: MouseEvent): void,
        (event: "box-right-click", nativeEvent: MouseEvent): void,
    }>();

</script>

<template>
    <rect v-bind="bBox" class="tr-box" :class="{rotated: inRotationMode}" 
        :rx="rx" 
        @mousedown.stop="emit('mouse-down', 'tr-box', $event)"
        @mouseup.stop="emit('mouse-up', 'tr-box', $event)"
        @mousemove.stop="emit('mouse-move', 'tr-box', $event)"
        @mouseleave.stop="emit('mouse-leave', 'tr-box', $event)"
        @click.prevent.stop="emit('box-click', $event)"
        @contextmenu.prevent.stop="emit('box-right-click', $event)"
        />
    <template v-if="!inRotationMode">
        <rect :x="bBox.x" :y="bBox.y" :width="handleSize" :height="handleSize" 
            style="cursor: nwse-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width * 0.5 - handleSize * 0.5" :y="bBox.y" 
            :width="handleSize" :height="handleSize" 
            style="cursor: ns-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width - handleSize" :y="bBox.y" 
            :width="handleSize" :height="handleSize" 
            style="cursor: nesw-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x" :y="bBox.y + bBox.height * 0.5 - handleSize * 0.5" 
            :width="handleSize" :height="handleSize" 
            style="cursor: ew-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x" :y="bBox.y + bBox.height - handleSize" 
            :width="handleSize" :height="handleSize" 
            style="cursor: nesw-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width * 0.5 - handleSize * 0.5" :y="bBox.y + bBox.height - handleSize" 
            :width="handleSize" :height="handleSize" 
            style="cursor: ns-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width - handleSize" :y="bBox.y + bBox.height * 0.5 - handleSize * 0.5" 
            :width="handleSize" :height="handleSize" 
            style="cursor: ew-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width - handleSize" :y="bBox.y + bBox.height - handleSize" 
            :width="handleSize" :height="handleSize" 
            style="cursor: nwse-resize" class="handle"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
    </template>
    <template v-else>
        <rect :x="bBox.x" :y="bBox.y" :width="bBox.width * 0.25" :height="bBox.height * 0.25" 
            fill="transparent" style="cursor: nesw-resize" 
            @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
            @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
            @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
            @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width * 0.25" :y="bBox.y" :width="bBox.width * 0.5" :height="bBox.height" 
            fill="transparent" style="cursor: ew-resize" 
            @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
            @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
            @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
            @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width * 0.75" :y="bBox.y" :width="bBox.width * 0.25" :height="bBox.height * 0.25" 
            fill="transparent" style="cursor: nwse-resize" 
            @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
            @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
            @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
            @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x" :y="bBox.y + bBox.height * 0.25" :width="bBox.width" :height="bBox.height * 0.5" 
            fill="transparent" style="cursor: ns-resize" 
            @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
            @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
            @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
            @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x" :y="bBox.y + bBox.height * 0.75" :width="bBox.width * 0.25" :height="bBox.height * 0.25" 
            fill="transparent" style="cursor: nwse-resize" 
            @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
            @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
            @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
            @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <rect :x="bBox.x + bBox.width * 0.75" :y="bBox.y + bBox.height * 0.75" :width="bBox.width * 0.25" :height="bBox.height * 0.25" 
            fill="transparent" style="cursor: nesw-resize" 
            @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
            @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
            @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
            @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <circle :cx="center.x" :cy="center.y" :r="Math.min(bBox.width, bBox.height) * 0.25" 
            class="hub"
            @mousedown.stop=""
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
    </template>
</template>

<style lang="scss">
    .tr-box {
        stroke: blue;
        stroke-width: 1.5px;
        fill: lightblue;
        fill-opacity: 0.3;
        cursor: move;
    }

    .handle {
        stroke: blue;
        stroke-width: 1px;
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
