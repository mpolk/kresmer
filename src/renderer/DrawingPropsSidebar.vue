<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *       A sidebar for displaying and editing drawing properties
<*************************************************************************** -->

<script lang="ts">
    import { ref, reactive, computed } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import { kresmer, selectOrLoadGraphicsFile, updateWindowTitle } from './renderer-main';
    import { URLType, getURLType, urlTypeDescriptions } from './URLType';
    import { BackgroundImageData, BackgroundImageAlignment } from 'kresmer';
    import i18next from 'i18next';

    export default {
        name: "DrawingPropsSidebar",
    }
</script>

<script setup lang="ts">
    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>()!;
    const form = ref<HTMLFormElement>()!;
    const formEnabled = ref(false);
    const formValidated = ref(false);

    let drawingName: string|undefined;
    let drawingBox: {width: number, height: number};
    let hrefBase: string|undefined;
    const backgroundImage = reactive(new BackgroundImageData);
    let backgroundColor: string|undefined;

    const backgroundImageUrlType = ref(getURLType(backgroundImage.url));

    function show()
    {
        drawingName = kresmer.drawingName;
        hrefBase = kresmer.hrefBase.value;
        drawingBox = {width: kresmer.logicalWidth, height: kresmer.logicalHeight};
        backgroundImage.copy(kresmer.backgroundImage);
        backgroundColor = kresmer.backgroundColor;

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
            hrefBase,
            backgroundImage,
            backgroundColor
        });
        updateWindowTitle();
    }//save

    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    async function selectBackgroundImage()
    {
        const newURL = await selectOrLoadGraphicsFile(backgroundImageUrlType.value)
        if (newURL !== undefined)
            backgroundImage.url = newURL;
    }//selectBackgroundImage

    function clearBackgroundImage()
    {
        backgroundImage.url = "";
    }//clearBackgroundImage

    const bgImageVisibilityTitle = computed(() => i18next.t('drawing-props-sidebar.background-image-visibility', 'Background image visibility'));

    function backgroundImageAlignmentDispl(alignment: BackgroundImageAlignment)
    {
        switch (alignment) {
            case BackgroundImageAlignment.CENTER: return i18next.t("drawing-props-sidebar.background-image-alignment.center", "center");
            case BackgroundImageAlignment.COVER: return i18next.t("drawing-props-sidebar.background-image-alignment.cover", "cover");
            case BackgroundImageAlignment.SCALE: return i18next.t("drawing-props-sidebar.background-image-alignment.scale", "scale");
            case BackgroundImageAlignment.STRECH: return i18next.t("drawing-props-sidebar.background-image-alignment.strech", "strech");
            case BackgroundImageAlignment.TILE: return i18next.t("drawing-props-sidebar.background-image-alignment.tile", "tile");
        }//switch
    }//backgroundImageAlignmentDispl

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end w-50" tabindex="-1">
        <div class="offcanvas-header align-items-baseline">
            <h5 class="offcanvas-title">{{i18next.t("drawing-props-sidebar.title", "Drawing")}} "{{drawingName}}"</h5>
            <button type="button" class="btn-close" @click="close"></button>
         </div>
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}' ref="form">
                <table class="table table-bordered">
                    <tbody>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpDrawingName">{{i18next.t("drawing-props-sidebar.name", "name")}}</label>
                            </td>
                            <td class="p-1">
                                <input class="form-control form-control-sm border-0" id="inpDrawingName" v-model="drawingName"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpDrawingWidth">{{i18next.t("drawing-props-sidebar.width", "width")}}</label>
                            </td>
                            <td class="p-1">
                                <input type="number" class="form-control form-control-sm text-end border-0" 
                                    id="inpDrawingWidth" v-model="drawingBox.width"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpDrawingHeight">{{i18next.t("drawing-props-sidebar.height", "height")}}</label>
                            </td>
                            <td class="p-1">
                                <input type="number" class="form-control form-control-sm text-end border-0" 
                                    id="inpDrawingHeight" v-model="drawingBox.height"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpBackgroundImage">
                                    {{i18next.t("drawing-props-sidebar.background-image", "background image")}}
                                </label>
                            </td>
                            <td class="p-1">
                                <div class="input-group input-group-sm">
                                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        {{ backgroundImageUrlType }}
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li v-for="ut in URLType" :key="ut" :title="urlTypeDescriptions[ut]">
                                            <a class="dropdown-item" href="#" @click="backgroundImageUrlType = ut">{{ ut }}</a>
                                        </li>
                                    </ul>
                                    <button v-if="backgroundImageUrlType !== 'href'" class="btn btn-outline-secondary btn-sm" type="button" 
                                        @click="selectBackgroundImage()">
                                        <span class="material-symbols-outlined">file_open</span>
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" type="button" 
                                        @click="clearBackgroundImage()">
                                        <span class="material-symbols-outlined">close</span>
                                    </button>
                                    <input ref="propInputs" id="inpBackgroundImage"
                                        class="form-control form-control-sm" :disabled="backgroundImageUrlType !== URLType.href" 
                                        v-model="backgroundImage.url"/>
                                </div>
                                <div class="input-group input-group-sm flex-nowrap">
                                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        {{ backgroundImageAlignmentDispl(backgroundImage.alignment) }}
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li v-for="alignment in BackgroundImageAlignment" :key="alignment">
                                            <a class="dropdown-item" href="#" @click="backgroundImage.alignment = alignment">
                                                {{ backgroundImageAlignmentDispl(alignment) }}
                                            </a>
                                        </li>
                                    </ul>
                                    <input type="range" min="0" max="1" step="0.05" class="form-range ms-2" 
                                        :title="bgImageVisibilityTitle" v-model="backgroundImage.visibility" />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpBackgroundColor">
                                    {{i18next.t("drawing-props-sidebar.background-color", "background color")}}
                                </label>
                            </td>
                            <td class="p-1">
                                <input type="color" id="inpBackgroundColor" class="form-control form-control-sm border-0"
                                    v-model="backgroundColor"/>
                            </td>
                        </tr>
                        <tr>
                            <td class="p-1 align-middle">
                                <label class="form-label text-secondary mb-0" for="inpHrefBase">
                                    {{i18next.t("drawing-props-sidebar.href-base", "href base")}}
                                </label>
                            </td>
                            <td class="p-1">
                                <input type="text" class="form-control form-control-sm border-0" 
                                    id="inpHrefBase" v-model="hrefBase"/>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" @click.prevent="save">
                        {{i18next.t("drawing-props-sidebar.save", "Save")}}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>./URLType