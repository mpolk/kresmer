<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
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
        x: {type: [Number, String] as PropType<number|string>, default: 0},
        y: {type: [Number, String] as PropType<number|string>, default: 0},
        transform: {type: [Object, String] as PropType<ITransform|string>},
        transformOrigin: {type: [Object, String] as PropType<Position|string>},
    });

    const transform = computed(() => {
        let {x, y} = props;
        typeof x === "string" && (x = parseFloat(x));
        typeof y === "string" && (y = parseFloat(y));
        if (typeof props.transform === "string") {
            return `translate(${x} ${y}) ${props.transform}`;
        }//if

        const chunks: string[] = [];
        if (props.x || props.y) {
            chunks.push(`translate(${x} ${y})`);
        }//if

        if (props.transform?.rotation) {
            // eslint-disable-next-line prefer-const
            let {angle, x, y} = props.transform.rotation;
            x || (x = 0);
            y || (y = 0);
            chunks.push(`rotate(${angle} ${x} ${y})`);
        }//if

        if (props.transform?.scale) {
            let {x, y} = props.transform.scale;
            x || (x = 1);
            y || (y = x);
            chunks.push(`scale(${x} ${y})`);
        }//if

        return chunks.join(" ");
    })//transform

    const transformOrigin = computed(() => {
        if (typeof props.transformOrigin === "string")
            return props.transformOrigin;

        return props.transformOrigin ? 
            `${props.transformOrigin.x} ${props.transformOrigin.y}` : null;
    })//transformOrigin
</script>

<template>
    <g :transform="transform" :transform-origin="transformOrigin" :class="componentClass">
        <slot></slot>
    </g>
</template>
