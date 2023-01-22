<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing network components properties
<*************************************************************************** -->

<script setup lang="ts">
    import { ref, reactive } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { NetworkComponent } from 'kresmer';

    let offCanvas!: Offcanvas;
    const rootDiv = ref<HTMLDivElement>();
    const data = reactive<{
        component?: NetworkComponent
    }>({});

    function show(componentToShow: NetworkComponent)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!);
        }//if

        data.component = componentToShow;
        offCanvas.show();
    }//show

    function close()
    {
        offCanvas.hide();
    }//close

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" data-bs-backdrop="static" tabindex="-1">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title">{{data.component?.name}}</h5>
            <button type="button" class="btn-close" @click="close"></button>
            <h6 class="offcanvas-title">{{data.component?.getClass()?.name}}</h6>
         </div>
        <div class="offcanvas-body">
            Component props
        </div>
    </div>
</template>