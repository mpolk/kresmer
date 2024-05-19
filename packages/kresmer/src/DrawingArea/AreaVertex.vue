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
    
</script>

<template>
    <template v-if="nextVertex.geometry.type === 'C'">
        <AreaVertexHandleVue :vertex="model" :pos="nextVertex.geometry.cp1!" :event-target="nextVertex"/>
    </template>
    <template v-if="model.geometry.type === 'C'">
        <AreaVertexHandleVue :vertex="model" :pos="model.geometry.cp2!"/>
    </template>
    <BaseVertexVue :model="model" :additional-classes="{area: true}"/>
</template>
