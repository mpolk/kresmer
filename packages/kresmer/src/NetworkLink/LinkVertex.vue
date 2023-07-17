<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, inject, computed } from 'vue';
    import Kresmer from '../Kresmer';
    import LinkVertex from './LinkVertex';
    import ConnectionPoint from '../ConnectionPoint/ConnectionPoint.vue';
import LinkBundle from './LinkBundle';

    export default {
        components: {ConnectionPoint},
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        model: {type: Object as PropType<LinkVertex>, required: true},
        dataLinkBundleVertex: {type: String},
    })

    const isEditable = inject(Kresmer.ikIsEditable);
    const circle = ref<HTMLElement>()!;
    const padding = ref<HTMLElement>()!;

    const showLinkNumber = computed(() => {
        return props.model.isAttachedToBundle && (Boolean(props.model.prevNeighbor?.isAttachedToBundle) != Boolean(props.model.nextNeighbor?.isAttachedToBundle));
    })//showLinkNumber

    const linkNumber = computed(() => {
        return showLinkNumber.value ? (props.model.anchor.bundle?.afterVertex.link as LinkBundle).getLinkNumber(props.model.link) : undefined;
    })//linkNumber

    const linkNumberPos = computed(() => {
        return {...props.model.coords};
    })//linkNumberPos

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && isEditable) {
            event.preventDefault();
            props.model.startDrag(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        isEditable && props.model.endDrag(event);
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
    <circle v-if="!model.link.isSelected"
        :cx="model.coords.x" :cy="model.coords.y" 
        class="vertex" :class="{connected: model.isConnected}"
        style="fill: transparent; stroke: transparent;"
        :data-link-bundle-vertex="dataLinkBundleVertex"
        />
    <ConnectionPoint v-if="!model.link.isBundle" :name="model.vertexNumber" :x="model.coords.x" :y="model.coords.y" :proxy="model.ownConnectionPoint"
        @click="onClick"
        />
    <text v-if="showLinkNumber" class="link-number" :x="linkNumberPos.x" :y="linkNumberPos.y">{{ linkNumber }}</text>
    <template v-if="model.link.isSelected">
        <template v-if="model.isDragged">
            <line :x1="model.coords.x" y1="0" :x2="model.coords.x" :y2="model.link.kresmer.drawingRect.height" class="crosshair" />
            <line x1="0" :y1="model.coords.y" :x2="model.link.kresmer.drawingRect.width" :y2="model.coords.y" class="crosshair" />
        </template>
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
            :data-link-bundle-vertex="dataLinkBundleVertex"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop="onMouseMove($event)"
            @mouseleave.stop="onMouseLeave($event)"
            @contextmenu="onRightClick($event)"
            @dblclick="onDoubleClick()"
            />
    </template>
    <Transition>
        <circle v-if="model.isBlinking" ref="blinker"
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

    .crosshair {
        stroke: #5b5b5b;
        stroke-width: 1;
        // stroke-dasharray: 5, 5;
    }
</style>