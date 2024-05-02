<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * DrawingArea Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType } from 'vue';
    import AreaVertex from './AreaVertex';
    import BaseVertexVue from '../Vertex/BaseVertex.vue';

    export default {
        components: {BaseVertexVue},
    }
</script>

<script setup lang="ts">

    defineProps({
        model: {type: Object as PropType<AreaVertex>, required: true},
    });
    
</script>

<template>
    <BaseVertexVue :model="model" :additional-classes="{area: true}"/>
</template>
