<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType, ref } from 'vue';
    import LinkVertex from './LinkVertex';

    const props = defineProps({
        model: {type: Object as PropType<LinkVertex>, required: true},
        isEditable: {type: Boolean, required: true},
        isEndpoint: {type: Boolean, default: false},
    })

    const circle = ref<HTMLElement>()!;
    const padding = ref<HTMLElement>()!;

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && props.isEditable) {
            event.preventDefault();
            props.model.startDrag(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        if (props.isEditable && props.model.endDrag(event)) { 
            props.model.link.restoreZPosition();
            return;
        }//if

        // props.model.link.selectLink();
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && props.isEditable) {
            props.model.drag(event);
        }//if
    }//onMouseMove

    function onMouseLeave(event: MouseEvent)
    {
        event.relatedTarget !== circle.value &&
        event.relatedTarget !== padding.value &&
        props.isEditable &&
        props.model.endDrag(event) && 
        props.model.link.restoreZPosition();
    }//onMouseLeave

    function onRightClick(event: MouseEvent)
    {
        props.model.onRightClick(event);
    }//onRightClick

    function onDoubleClick()
    {
        props.model.align();
    }//onDoubleClick
</script>

<template>
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
    <Transition>
        <circle v-if="model.showBlinker" ref="blinker"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex blinker"
            />
    </Transition>
</template>

<style lang="scss">
    .connected {
        opacity: 0.5;
        filter: invert(100%);

        &:hover {
            opacity: 0.9;
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