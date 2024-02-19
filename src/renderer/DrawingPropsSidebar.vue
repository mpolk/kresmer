<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
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
    import { UrlType, getURLType, urlTypeDescriptions } from './UrlType';

    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>()!;
    const form = ref<HTMLFormElement>()!;
    const formEnabled = ref(false);
    const formValidated = ref(false);

    let drawingName: string|undefined;
    let drawingBox: {width: number, height: number};
    let hrefBase: string|undefined;
    const backgroundImageURL = ref<string|undefined>();

    const backgroundImageUrlType = ref(getURLType(backgroundImageURL.value));

    function show()
    {
        drawingName = kresmer.drawingName;
        hrefBase = kresmer.hrefBase.value;
        drawingBox = {width: kresmer.logicalWidth, height: kresmer.logicalHeight};
        backgroundImageURL.value = kresmer.backgroundImageURL.value;
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
        kresmer.edAPI.updateDrawingProperties({
            name: drawingName, 
            logicalWidth: drawingBox.width, 
            logicalHeight: drawingBox.height,
            hrefBase: hrefBase,
            backgroundImageURL: backgroundImageURL.value,
        });
        updateWindowTitle();
    }//save

    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    async function selectOrLoadGraphicsFile()
    {
        const filters = [{name: "Graphics files", extensions: ["png", "jpg", "jpeg"]}];
        const {filePath, data} = await window.electronAPI.selectOrLoadFile(backgroundImageUrlType.value, filters);

        if (!filePath)
            return;

        if (backgroundImageUrlType.value !== UrlType.data) {
            backgroundImageURL.value = `file:${filePath}`;
        } else {
            const ext = filePath.slice(filePath.lastIndexOf('.')+1).toLowerCase();
            let mimeType = "";
            switch (ext) {
                case "jpeg": case "jpg":
                    mimeType = "image/jpeg";
                    break;
                case "png":
                    mimeType = "image/png";
                    break;
            }//switch
            backgroundImageURL.value = `data:${mimeType};base64,${data}`;
        }//if
    }//selectOrLoadGraphicsFile


    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end w-50" tabindex="-1">
        <div class="offcanvas-header align-items-baseline">
            <h5 class="offcanvas-title">Drawing "{{drawingName}}"</h5>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}' ref="form">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpDrawingName">name</label>
                            </td>
                            <td class="p-1">
                                <input class="form-control form-control-sm border-0" id="inpDrawingName" v-model="drawingName"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpDrawingWidth">width</label>
                            </td>
                            <td class="p-1">
                                <input type="number" class="form-control form-control-sm text-end border-0" 
                                    id="inpDrawingWidth" v-model="drawingBox.width"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpDrawingHeight">height</label>
                            </td>
                            <td class="p-1">
                                <input type="number" class="form-control form-control-sm text-end border-0" 
                                    id="inpDrawingHeight" v-model="drawingBox.height"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpBackgroundImage">background image</label>
                            </td>
                            <td class="p-1">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    {{ backgroundImageUrlType }}
                                </button>
                                <ul class="dropdown-menu">
                                    <li v-for="ut in UrlType" :key="ut" :title="urlTypeDescriptions[ut]">
                                        <a class="dropdown-item" href="#" @click="backgroundImageUrlType = ut">{{ ut }}</a>
                                    </li>
                                </ul>
                                <button v-if="backgroundImageUrlType !== 'href'" class="btn btn-outline-secondary btn-sm" type="button" 
                                    @click="selectOrLoadGraphicsFile()">
                                    <span class="material-symbols-outlined">file_open</span>
                                </button>
                                <input ref="propInputs" id="inpBackgroundImage"
                                    class="form-control form-control-sm" :readonly="backgroundImageUrlType === UrlType.data" 
                                    v-model="backgroundImageURL"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpHrefBase">href base</label>
                            </td>
                            <td class="p-1">
                                <input type="text" class="form-control form-control-sm border-0" 
                                    id="inpHrefBase" v-model="hrefBase"/>
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