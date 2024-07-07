<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  A sidebar for component class selection wnen creating a new component
<*************************************************************************** -->

<script lang="ts">
    import { onMounted, ref, watch, nextTick } from 'vue';
    import Kresmer, { NetworkComponent, NetworkComponentClass, NetworkComponentController } from 'kresmer';
    import DrawingElementClassSelectionSidebar from './DrawingElementClassSelectionSidebar.vue';

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


    async function showPreview()
    {
        krePreview.eraseContent();
        krePreview.logicalWidth = base.previewWidth;
        krePreview.logicalHeight = base.previewHeight;

        if (base.result) {
            const _class = base.result as NetworkComponentClass;
            const component = new NetworkComponent(krePreview, _class);
            const controller = new NetworkComponentController(krePreview, component, 
                {origin: {x: base.previewWidth/2, y: base.previewHeight/2}});
            component.name = _class.name;
            krePreview.addPositionedNetworkComponent(controller);
            await nextTick();

            const bBox = component.svg?.getBBox();
            const clRect = component.svg?.getBoundingClientRect();
            if (bBox && bBox.width && bBox.height && clRect) {
                const d = Math.max(bBox.width, bBox.height) * 1.2;
                krePreview.logicalWidth = d;
                krePreview.logicalHeight = d;
                const componentPos = krePreview.applyScreenCTM(clRect);
                controller.origin.x = base.previewWidth/2 + d/2 - (componentPos.x + bBox.width/2);
                controller.origin.y = base.previewHeight/2 + d/2 - (componentPos.y + bBox.height/2);
            }//if
        }//if
    }//showPreview

    async function show()
    {
        krePreview = base.init();
        return base.show() as Promise<NetworkComponentClass>;
    }//show

    defineExpose({show});

</script>

<template>
    <DrawingElementClassSelectionSidebar ref="baseSidebar" />
</template>

