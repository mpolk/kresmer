<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Markers (definitions to use on the ends of the link instances) 
<*************************************************************************** -->

<script setup lang="ts">
    import { linkMarkers } from './NetworkLink';
</script>

<template>
    <marker :id="linkMarkers.circle" markerWidth="3" markerHeight="3" refX="5" refY="5" viewBox="0 0 10 10">
        <circle r="5" cx="5" cy="5" fill="context-stroke" stroke="context-stroke" class="marker"/>
    </marker>
</template>