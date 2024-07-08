<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  A sidebar for link class selection wnen creating a new link
<*************************************************************************** -->

<script lang="ts">
    import { onMounted, ref } from 'vue';
    import Kresmer, { NetworkLink, NetworkLinkClass, LinkBundleClass } from 'kresmer';
    import DrawingElementClassSelectionSidebar from './DrawingElementClassSelectionSidebar.vue';
    import { kresmer } from './renderer-main';

    export default {
        name: "ComponentClassSelectionSidebar",
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
            const _class = base.result as NetworkLinkClass;
            const link1 = new NetworkLink(krePreview, _class, {
                from: {pos: {x: base.previewWidth*0.2, y: base.previewHeight*0.2}},
                vertices: [
                    {pos: {x: base.previewWidth*0.6, y: base.previewHeight*0.2}},
                    {pos: {x: base.previewWidth*0.6, y: base.previewHeight*0.6}},
                ],
                to:   {pos: {x: base.previewWidth*0.8, y: base.previewHeight*0.6}},
            });
            const link2 = new NetworkLink(krePreview, _class, {
                from: {pos: {x: base.previewWidth*0.2, y: base.previewHeight*0.4}},
                vertices: [
                    {pos: {x: base.previewWidth*0.4, y: base.previewHeight*0.4}},
                    {pos: {x: base.previewWidth*0.4, y: base.previewHeight*0.8}},
                ],
                to:   {pos: {x: base.previewWidth*0.8, y: base.previewHeight*0.8}},
            });
            link1.name = _class.name;
            krePreview.addLink(link1);
            krePreview.addLink(link2);
            link2.selectThis();
        }//if
    }//showPreview


    async function show(forBundle: boolean)
    {
        krePreview = base.init();
        const classes = Array.from([...kresmer.getRegisteredLinkClasses()]
            .filter(([name, _class]) => !_class.isAbstract && (_class instanceof LinkBundleClass == forBundle)));
        return base.show(classes) as Promise<NetworkLinkClass>;
    }//show

    defineExpose({show});

</script>

<template>
    <DrawingElementClassSelectionSidebar ref="baseSidebar" @show-preview="showPreview"/>
</template>

