<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Blank (temporary object for a link creation) - presentation code 
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType } from 'vue';
    import NetworkLinkBlank from './NetworkLinkBlank';

    const props = defineProps({
        model: {type: Object as PropType<NetworkLinkBlank>, required: true},
    });

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1) {
            props.model.extrude(event);
        }//if
    }//onMouseMove
</script>

<template>
    <line class="line" 
        :x1="model.start?.coords.x" :y1="model.start?.coords.y"
        :x2="model.end.x" :y2="model.end.y"
        />
    <circle class="header"
        :cx="model.end.x" :cy="model.end.y" r="20"
        @mousemove.self="onMouseMove($event)"
        />
</template>


<style lang="scss" scoped>
    .line {
        stroke: red;
        stroke-width: 2px;
    }

    .header {
        stroke: red;
        stroke-width: 2px;
        fill: pink;
        fill-opacity: 0.5;
    }
</style>