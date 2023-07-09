<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Blank (temporary object for a link creation) - presentation code 
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType, computed } from 'vue';
    import NetworkLinkBlank from './NetworkLinkBlank';

    const props = defineProps({
        model: {type: Object as PropType<NetworkLinkBlank>, required: true},
    });

    const start = computed(() => {
        return props.model.start.conn ? props.model.start.conn.coords : props.model.start.pos!;
    })//start

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1) {
            props.model.extrude(event);
        }//if
    }//onMouseMove

    function onMouseDown(event: MouseEvent)
    {
        props.model.onMouseDown(event);
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        props.model.onMouseUp(event);
    }//onMouseUp

    function onDoubleClick(event: MouseEvent)
    {
        props.model.onDoubleClick(event);
    }//onDoubleClick
</script>

<template>
    <line class="line" 
        :x1="start.x" :y1="start.y"
        :x2="model.end.x" :y2="model.end.y"
        />
    <circle class="origin" :cx="start.x" :cy="start.y" r="20" />
    <circle class="origin-center" :cx="start.x" :cy="start.y" r="4" />
    <circle class="header"
        :cx="model.end.x" :cy="model.end.y" r="20"
        @mousemove.self="onMouseMove($event)"
        @mousedown="onMouseDown($event)"
        @mouseup="onMouseUp($event)"
        @dblclick="onDoubleClick($event)"
        />
    <circle class="header-center"
        :cx="model.end.x" :cy="model.end.y" r="4"
        @mousemove.self="onMouseMove($event)"
        @mousedown="onMouseDown($event)"
        @mouseup="onMouseUp($event)"
        @dblclick="onDoubleClick($event)"
        />
</template>


<style lang="scss" scoped>
    .line {
        stroke: red;
        stroke-width: 2px;
    }

    .origin {
        stroke: orange;
        stroke-width: 2px;
        fill: orange;
        fill-opacity: 0.5;
    }

    .origin-center {
        fill: red;
    }

    .header {
        stroke: rgb(255, 88, 88);
        stroke-width: 2px;
        fill: pink;
        fill-opacity: 0.5;
        cursor: move;
    }

    .header-center {
        fill: red;
        cursor: move;
    }
</style>