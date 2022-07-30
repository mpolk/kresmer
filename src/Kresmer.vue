<!-- eslint-disable vue/multi-word-component-names -->
<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *                          The main component
<*************************************************************************** -->

<script setup lang="ts">
</script>

<template>
    <svg class="kresmer" ref="svg">
        <rect x="20" y="20" width="400" height="100" 
                fill="yellow" stroke="black" stroke-width="5px" stroke-opacity="0.5"/>
        <text x="30" y="40">Вот такой вот Кресмер</text>
</svg>
</template>


<style>
    svg.kresmer {
        width: 100%;
        height: 100%;
    }
</style>