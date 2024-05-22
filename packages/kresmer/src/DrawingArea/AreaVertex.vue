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

    const nextVertex = computed(() => {
        const nextVertexNumber = (props.model.vertexNumber + 1) % props.model.parentElement.vertices.length;
        return props.model.parentElement.vertices[nextVertexNumber] as AreaVertex;        
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
    <template v-if="showNextVertexHandles && nextVertex.geometry.type === 'C'">
        <AreaVertexHandleVue :vertex="model" :handle-number="1" :pos="nextVertex.geometry.controlPoints[1]!" :event-target="nextVertex"/>
    </template>
    <template v-if="showThisVertexHandles && model.geometry.type === 'C'">
        <AreaVertexHandleVue :vertex="model" :handle-number="2" :pos="model.geometry.controlPoints[2]!"/>
    </template>
    <BaseVertexVue :model="model" :additional-classes="{area: true}"/>
</template>
