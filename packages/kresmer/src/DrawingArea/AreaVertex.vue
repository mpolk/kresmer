<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * DrawingArea Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType, computed } from 'vue';
    import AreaVertex from './AreaVertex';
    import BaseVertexVue from '../Vertex/BaseVertex.vue';
    import AreaVertexHandleVue from './AreaVertexHandle.vue';

    export default {
        components: {BaseVertexVue, AreaVertexHandleVue},
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        model: {type: Object as PropType<AreaVertex>, required: true},
    });

    const prevVertex = computed(() => {
        let i = props.model.vertexNumber - 1;
        if (i < 0)
            i += props.model.parentElement.vertices.length;
        return props.model.parentElement.vertices[i];
    });

    const nextVertex = computed(() => {
        const nextVertexNumber = (props.model.vertexNumber + 1) % props.model.parentElement.vertices.length;
        return props.model.parentElement.vertices[nextVertexNumber];
    });

    const showThisVertexHandles = computed(() => {
        return props.model.parentElement.kresmer.isEditable && 
               props.model.isSelected && 
               props.model.parentElement.isSelected;
    })//showThisVertexHandles

    const showNextVertexHandles = computed(() => {
        return props.model.parentElement.kresmer.isEditable && 
               nextVertex.value.isSelected && 
               nextVertex.value.parentElement.isSelected;
    })//showNextVertexHandles
    
</script>

<template>
    <AreaVertexHandleVue v-if="showNextVertexHandles && nextVertex.geometry.type === 'C'" 
        :vertex="model" :handle-number="1" :pos="nextVertex.geometry.controlPoints[0]!" :event-target="nextVertex"/>
    <template v-if="showThisVertexHandles">
        <AreaVertexHandleVue v-if="model.geometry.type === 'C'" 
            :vertex="model" :handle-number="2" :pos="model.geometry.controlPoints[1]!"/>
        <AreaVertexHandleVue v-if="model.geometry.type === 'S'" 
            :vertex="model" :handle-number="1" :pos="model.geometry.controlPoints[0]!"/>
        <AreaVertexHandleVue v-else-if="model.geometry.type === 'Q'" 
            :vertex="model" :handle-number="1" :pos="model.geometry.controlPoints[0]!" :vertex2="prevVertex"/>
    </template>
    <BaseVertexVue :model="model" :additional-classes="{area: true, 'selected-vertex': model.isSelected}"/>
</template>
