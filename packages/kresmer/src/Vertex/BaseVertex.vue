<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType, computed, onUpdated, toRef } from 'vue';
    import Vertex from './Vertex';
    import ConnectionPointVue from '../ConnectionPoint/ConnectionPoint.vue';
    import useVertex from '../Vertex/useVertex';

    export default {
        components: {ConnectionPointVue},
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        model: {type: Object as PropType<Vertex>, required: true},
        hasConnectionPoint: {type: Boolean, default: true},
        additionalClasses: {type: Object as PropType<Record<string, boolean>>},
        additionalAttrs: {type: Object as PropType<Record<string, string|undefined>>},
        base: {type: Object as PropType<ReturnType<typeof useVertex>>},
        showConnectionPointTooltips: {type: Boolean, default: true},
    });

    const {
        isEditable,
        padding,
        circle,
        draggingCursor,
        onMouseDown,
        onMouseUp,
        onMouseMove,
        onMouseLeave,
        onRightClick,
        onClick,
        onDoubleClick
     } = props.base ?? useVertex(toRef(props, "model"));

     const vertexClass = computed(() => { return {"first-vertex": props.model.vertexNumber == 0, ...props.additionalClasses}});

     const emit = defineEmits<{
        (event: "updated"): void
     }>();

     onUpdated(() => {
        emit("updated");
    });
</script>

<template>
    <ConnectionPointVue v-if="hasConnectionPoint && model.parentElement.kresmer.isEditable" :name="model.vertexNumber" 
        :x="model.coords.x" :y="model.coords.y" :model="model.ownConnectionPoint" :show-tooltip="showConnectionPointTooltips"
        @click="onClick" class="vertex-connection-point"
        />
    <slot/>
    <template v-if="model.parentElement.isSelected && model.isDragged">
        <line :x1="model.coords.x" y1="0" :x2="model.coords.x" :y2="model.parentElement.kresmer.drawingRect.height" class="crosshair" />
        <line x1="0" :y1="model.coords.y" :x2="model.parentElement.kresmer.drawingRect.width" :y2="model.coords.y" class="crosshair" />
    </template>
    <circle v-show="model.parentElement.isSelected && (model.isDragged || model.isGoingToBeDragged)" 
        ref="padding"
        :cx="model.coords.x" :cy="model.coords.y" 
        class="vertex padding"
        :style="draggingCursor" style="stroke: none;"
        :is-editable="isEditable"
        @mouseup.stop="onMouseUp($event)"
        @mousemove.stop="onMouseMove($event)"
        @mouseleave.stop="onMouseLeave($event)"
        />
    <circle v-if="model.parentElement.isSelected" ref="circle"
        :cx="model.coords.x" :cy="model.coords.y" 
        class="vertex" :class="vertexClass"
        :style="draggingCursor"
        :is-editable="isEditable"
        v-bind="additionalAttrs"
        @mousedown.stop="onMouseDown($event)"
        @mouseup.stop="onMouseUp($event)"
        @mousemove.stop="onMouseMove($event)"
        @mouseleave.stop="onMouseLeave($event)"
        @contextmenu="onRightClick($event)"
        @dblclick="onDoubleClick()"
        />
    <Transition>
        <circle v-if="model.isBlinking" ref="blinker"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex blinker"
            />
    </Transition>
</template>

<style lang="scss">
    .vertex, .vertex-connection-point {
        cursor: pointer;
    }

    .vertex.selected-vertex {
        fill: rgb(255, 91, 50)!important;
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