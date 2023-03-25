<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, inject } from 'vue';
    import Kresmer from '../Kresmer';
    import LinkVertex from './LinkVertex';
    import ConnectionPoint from '../ConnectionPoint/ConnectionPoint.vue';

    export default {
        components: {ConnectionPoint},
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        model: {type: Object as PropType<LinkVertex>, required: true},
        isEndpoint: {type: Boolean, default: false},
    })

    const isEditable = inject(Kresmer.ikIsEditable);
    const circle = ref<HTMLElement>()!;
    const padding = ref<HTMLElement>()!;

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && isEditable) {
            event.preventDefault();
            props.model.startDrag(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        if (isEditable && props.model.endDrag(event)) { 
            props.model.link.restoreZPosition();
            return;
        }//if

        // props.model.link.selectLink();
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && isEditable) {
            props.model.drag(event);
        }//if
    }//onMouseMove

    function onMouseLeave(event: MouseEvent)
    {
        event.relatedTarget !== circle.value &&
        event.relatedTarget !== padding.value &&
        isEditable &&
        props.model.endDrag(event) && 
        props.model.link.restoreZPosition();
    }//onMouseLeave

    function onRightClick(event: MouseEvent)
    {
        props.model.onRightClick(event);
    }//onRightClick

    function onClick()
    {
        props.model.link.selectLink();
    }//onClick

    function onDoubleClick()
    {
        props.model.align();
    }//onDoubleClick

    
</script>

<template>
    <ConnectionPoint :name="model.vertexNumber" :x="model.coords.x" :y="model.coords.y" 
        @click="onClick"
        />
    <template v-if="model.link.isSelected">
        <circle v-if="model.isDragged" ref="padding"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex padding"
            style="cursor: move; stroke: none;"
            :is-editable="isEditable"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop="onMouseMove($event)"
            @mouseleave.stop="onMouseLeave($event)"
            />
        <circle ref="circle"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex" :class="{connected: model.isConnected}"
            style="cursor: move;"
            :is-editable="isEditable"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop="onMouseMove($event)"
            @mouseleave.stop="onMouseLeave($event)"
            @contextmenu="onRightClick($event)"
            @dblclick="onDoubleClick()"
            />
    </template>
    <Transition>
        <circle v-if="model.showBlinker" ref="blinker"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex blinker"
            />
    </Transition>
</template>

<style lang="scss" scoped>
    .connected {
        opacity: 0.8;
        &:hover {
            opacity: 1;
        }
    }

    .v-enter-active {
        transition: opacity 0.3s ease;
    }
    .v-leave-active {
        transition: opacity 2s ease;
    }
    .v-enter-from, .v-leave-to {
        opacity: 0;
    }
</style>