<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A Vue component for rendering Network Connection Points 
<*************************************************************************** -->

<script setup lang="ts">

    const props = defineProps({
        name: {type: String, required: true},
        x: {type: Number, default: 0},
        y: {type: Number, default: 0},
        d: {type: Number, default: 0},
    });
</script>

<template>
    <circle :x="x" :y="y" :r="d/2" style="cursor: pointer" />
</template>