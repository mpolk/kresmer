<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->

<script setup lang="ts">
    import { PropType } from 'vue';
    import LinkVertex from './LinkVertex';

    const props = defineProps({
        model: {type: Object as PropType<LinkVertex>, required: true}
    })
</script>

<template>
    <circle :cx="model.coords.x" :cy="model.coords.y" class="vertex"/>
</template>