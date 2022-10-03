<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main window status bar
<*************************************************************************** -->
<script setup lang="ts">
    import { computed, onMounted, PropType, ref } from 'vue';

    type DisplayData = {
        drawingScale: number,
    };

    const props = defineProps({
        displayData: {type: Object as PropType<DisplayData>, required: true},
    });

    const bottom = ref(0);
    function stickToBottom()
    {
        bottom.value = document.body.scrollHeight;
    }//stickToBottom

    onMounted(() => {
        stickToBottom();
        addEventListener("resize", stickToBottom);
    });

    const drawingScale = computed(() => {
        if (props.displayData.drawingScale >= 1) {
            return `${Math.round(props.displayData.drawingScale * 10) / 10} : 1`;
        } else {
            return `1 : ${Math.round(10 / props.displayData.drawingScale) / 10}`;
        }//if
    })//drawingScale
</script>

<template>
    <div class="status-bar" :style="{bottom}">
        Scale: ({{drawingScale}})
    </div>
</template>

<style>
    .status-bar {
        position: fixed;
        width: 100%;
        padding: 0.2rem 0.5rem;
        font: status-bar;
        color: white;
        background-color: rgb(52, 122, 250);
    }
</style>