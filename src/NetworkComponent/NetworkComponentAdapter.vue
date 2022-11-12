<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for embedding a NetworkComponent into another Component
 * This is a simplified version of the NetworkComponentHolder.
 * Unlike the full Holder, the Adapter does not handle any events, has no
 * the controller nor the transform box, since it doesn't support its own
 * movements
<*************************************************************************** -->

<script lang="ts">
    import { PropType, computed } from 'vue';
    import { ITransform, Position } from '../Transform/Transform';
</script>

<script setup lang="ts">
    const props = defineProps({
        componentClass: {type: String, required: true},
        x: {type: Number, default: 0},
        y: {type: Number, default: 0},
        transform: {type: Object as PropType<ITransform>},
        transformOrigin: {type: Object as PropType<Position>},
    });

    const transform = computed(() => {
        let tr = `translate(${props.x} ${props.y})`;

        if (props.transform?.rotation) {
            tr += ` rotation(${props.transform.rotation.angle} ${props.transform.rotation.x} ${props.transform.rotation.y})`;
        }//if

        if (props.transform?.scale) {
            tr += ` scale(${props.transform.scale.x} ${props.transform.scale.y})`;
        }//if
        return tr;
    })//transform

    const transformOrigin = computed(() => props.transformOrigin ? 
        `${props.transformOrigin.x} ${props.transformOrigin.y}` : null);
</script>

<template>
    <g :transform="transform" :transform-origin="transformOrigin" :class="componentClass">
        <slot></slot>
    </g>
</template>
