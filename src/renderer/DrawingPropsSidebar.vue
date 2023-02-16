<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *       A sidebar for displaying and editing drawing properties
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "DrawingPropsSidebar",
    }
</script>

<script setup lang="ts">
    import { ref } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { kresmer, updateWindowTitle } from './renderer-main';

    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>()!;
    const form = ref<HTMLFormElement>()!;
    const formEnabled = ref(false);
    const formValidated = ref(false);

    let drawingName: string|undefined;
    let drawingBox: {width: number, height: number};

    function show()
    {
        drawingName = kresmer.drawingName;
        drawingBox = {...kresmer.logicalBox};
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: "static", scroll: true});
        }//if

        formEnabled.value = true;
        offCanvas.show();
    }//show

    function save()
    {
        if (!form.value!.checkValidity()) {
            formValidated.value = true;
            return;
        }//if

        close();
        kresmer.drawingName = drawingName;
        kresmer.logicalBox.width = drawingBox.width;
        kresmer.logicalBox.height = drawingBox.height;
        updateWindowTitle();
    }//save

    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" tabindex="-1">
        <div class="offcanvas-header align-items-baseline">
            <h5 class="offcanvas-title">Drawing "{{drawingName}}"</h5>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}' ref="form">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td>name</td>
                            <td>
                                <input class="form-control form-control-sm" v-model="drawingName"/>
                            </td>
                        </tr>
                        <tr>
                            <td>width</td>
                            <td>
                                <input type="number" class="form-control form-control-sm text-end" 
                                       v-model="drawingBox.width"/>
                            </td>
                        </tr>
                        <tr>
                            <td>height</td>
                            <td>
                                <input type="number" class="form-control form-control-sm text-end" 
                                       v-model="drawingBox.height"/>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" @click.prevent="save">Save</button>
                </div>
            </form>
        </div>
    </div>
</template>