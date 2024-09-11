<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  A sidebar for area class selection when creating a new area
<*************************************************************************** -->

<script lang="ts">
    import { onMounted, ref } from 'vue';
    import Kresmer, { DrawingArea, DrawingAreaClass } from 'kresmer';
    import DrawingElementClassSelectionSidebar from './DrawingElementClassSelectionSidebar.vue';
    import { kresmer } from './renderer-main';

    export default {
        name: "AreaClassSelectionSidebar",
        components: {DrawingElementClassSelectionSidebar},
    }
</script>

<script setup lang="ts">

    const baseSidebar = ref<InstanceType<typeof DrawingElementClassSelectionSidebar>>();
    let base: InstanceType<typeof DrawingElementClassSelectionSidebar>;
    let krePreview: Kresmer;

    onMounted(() =>
    {
        base = baseSidebar.value!;
    })//mounted


    function showPreview()
    {
        krePreview.eraseContent();
        krePreview.logicalWidth = base.previewWidth;
        krePreview.logicalHeight = base.previewHeight;

        if (base.result) {
            const _class = base.result as DrawingAreaClass;
            const area = new DrawingArea(krePreview, _class, {
                vertices: [
                    {pos: {x: base.previewWidth*0.2, y: base.previewHeight*0.2}},
                    {pos: {x: base.previewWidth*0.6, y: base.previewHeight*0.2}},
                    {pos: {x: base.previewWidth*0.6, y: base.previewHeight*0.6}},
                    {pos: {x: base.previewWidth*0.6, y: base.previewHeight*0.2}},
                ],
            });
            area.name = _class.name;
            krePreview.addArea(area);
        }//if
    }//showPreview


    async function show(forBundle: boolean)
    {
        krePreview = base.init();
        const classes = Array.from([...kresmer.getRegisteredAreaClasses()]);
        return base.show(classes) as Promise<DrawingAreaClass>;
    }//show

    defineExpose({show});

</script>

<template>
    <DrawingElementClassSelectionSidebar ref="baseSidebar" @show-preview="showPreview"/>
</template>

