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
    <g :class="{[model._class.name]: true}">
        <line class="blank line" 
            :x1="start.x" :y1="start.y"
            :x2="model.end.x" :y2="model.end.y"
            />
        <circle class="blank origin" :cx="start.x" :cy="start.y" r="20" />
        <circle class="blank origin-center" :cx="start.x" :cy="start.y" r="4" />
        <circle class="blank header" style="cursor: move;"
            :cx="model.end.x" :cy="model.end.y" r="20"
            @mousemove.self="onMouseMove($event)"
            @mousedown="onMouseDown($event)"
            @mouseup="onMouseUp($event)"
            @dblclick="onDoubleClick($event)"
            />
        <circle class="blank header-center" style="cursor: move;"
            :cx="model.end.x" :cy="model.end.y" r="4"
            @mousemove.self="onMouseMove($event)"
            @mousedown="onMouseDown($event)"
            @mouseup="onMouseUp($event)"
            @dblclick="onDoubleClick($event)"
            />
    </g>
</template>
