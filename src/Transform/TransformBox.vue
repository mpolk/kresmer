<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box showing at the time of a component transformation
<*************************************************************************** -->

<script setup lang="ts">
import { PropType } from 'vue';

    const props = defineProps({
        bBox: {type: Object as PropType<DOMRect>, required: true},
    })

</script>

<template>
    <rect v-bind="bBox" class="tr-box"/>
</template>

<style>
    .tr-box {
        stroke: blue;
        fill: none;
    }
</style>
