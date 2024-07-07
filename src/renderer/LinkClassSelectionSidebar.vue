<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  A sidebar for link class selection wnen creating a new link
<*************************************************************************** -->

<script lang="ts">
    import { onMounted, ref, watch } from 'vue';
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
        base.rootDiv!.addEventListener('shown.bs.offcanvas', () => {
            showPreview();
            // selCategory.value!.focus();
        });
        watch(() => base.result, showPreview);
    })//mounted


    function showPreview()
    {
        krePreview.eraseContent();
        krePreview.logicalWidth = base.previewWidth;
        krePreview.logicalHeight = base.previewHeight;

        if (base.result) {
            const _class = base.result as NetworkLinkClass;
            const link = new NetworkLink(krePreview, _class, {
                from: {pos: {x: base.previewWidth*0.2, y: base.previewHeight*0.5}},
                to:   {pos: {x: base.previewWidth*0.8, y: base.previewHeight*0.5}},
            });
            link.name = _class.name;
            krePreview.addLink(link);
            link.selectThis();
        }//if
    }//showPreview


    async function show(forBundle: boolean)
    {
        krePreview = base.init();
        return base.show(Array.from([...kresmer.getRegisteredLinkClasses()].filter(([name, _class]) => !_class.isAbstract && (_class instanceof LinkBundleClass == forBundle)))) as Promise<NetworkLinkClass>;
    }//show

    defineExpose({show});

</script>

<template>
    <DrawingElementClassSelectionSidebar ref="baseSidebar" />
</template>

