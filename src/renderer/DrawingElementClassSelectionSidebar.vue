<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  A sidebar for drawing element class selection wnen creating a new one
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "DrawingElementClassSelectionSidebar",
    }
</script>

<script setup lang="ts">
    import { onMounted, ref, watch, reactive } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import Kresmer, { DrawingElementClass } from 'kresmer';

    let offCanvas!: Offcanvas;
    const rootDiv = ref<HTMLDivElement>();
    const selElementClass = ref<HTMLSelectElement>();
    const selCategory = ref<HTMLSelectElement>();
    const btnOk = ref<HTMLButtonElement>();
    const divPreview = ref<HTMLDivElement>();
    let resolvePromise!: (result: DrawingElementClass|null) => void;

    const result = ref<DrawingElementClass|null>(null);
    let allClasses: Array<[string, DrawingElementClass]>;
    const classesInCategory = ref<{name: string, _class: DrawingElementClass}[]>([]);
    const categories = ref<string[]>([]);
    const localizedCategories = reactive(new Map<string, string|undefined>);
    const selectedCategory = ref<string>();

    const selectSize = 10;
    const previewWidth = 400;
    const previewHeight = 400;
    let krePreview: Kresmer;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.offcanvas', () => {
            selCategory.value!.focus();
        });
    })//mounted

    watch(selectedCategory, onCategorySelection);

    function onCategorySelection()
    {
        classesInCategory.value = Array.from(allClasses)
                .map(([name, _class]) => {return {name, _class}})
                .sort((c1, c2) => c1.name < c2.name ? -1 : c1.name > c2.name ? 1 : 0)
                ;
        classesInCategory.value = classesInCategory.value.filter(({_class}) => (_class.category ?? "") == selectedCategory.value);
        result.value = classesInCategory.value[0]._class;
    }//onCategorySelection


    function init() {
        if (!krePreview) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: 'static'});
            krePreview = new Kresmer(divPreview.value!, {isEditable: false, logicalWidth: previewWidth, logicalHeight: previewHeight});
        }//if

        return krePreview;
    }//init


    async function show(classesToChooseFrom: Array<[string, DrawingElementClass]>)
    {
        allClasses = classesToChooseFrom;

        for (const [_, _class] of allClasses) {
            krePreview.registerDrawingElementClass(_class);
        }//for

        const categorySet = new Set<string>();
        let haveUncategorizedClasses = false;
        for (const [_, _class] of allClasses) {
            if (!_class.category)
                haveUncategorizedClasses = true;
            else if (!_class.category.startsWith(".")) {
                categorySet.add(_class.category);
                localizedCategories.set(_class.category, _class.localizedCategory);
            }//if
        }//for
        categories.value = Array.from(categorySet).sort();
        if (haveUncategorizedClasses)
            categories.value.unshift("");
        selectedCategory.value = categories.value[0];

        offCanvas.show();
        const promise = new Promise<DrawingElementClass|null>((resolve) => {
            resolvePromise = resolve;
        })

        return await promise;
    }//show


    function submit()
    {
        close(result.value);
    }//submit


    function close(result: DrawingElementClass|null)
    {
        offCanvas!.hide();
        resolvePromise!(result);
    }//close

    defineExpose({show, rootDiv, init, previewWidth, previewHeight, result});

</script>

<template>
    <div class="offcanvas offcanvas-end" tabindex="-1" ref="rootDiv">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title fs-5">Choose a new element class...</h5>
                    <button type="button" class="btn-close" @click="close(null)"></button>
                </div>
                <form @submit.prevent="">
                    <div class="offcanvas-body">
                        <div class="row">
                            <div class="col">
                                <select class="form-select" v-model="selectedCategory" :size="selectSize"  ref="selCategory">
                                    <option v-for="cat in categories" :value="cat" :key="`category-${cat}`">
                                        {{ localizedCategories.get(cat) || cat }}
                                    </option>
                                </select>
                            </div>
                            <div class="col">
                                <select class="form-select" v-model="result" ref="selElementClass" 
                                        :size="selectSize" @dblclick="submit">
                                    <option v-for="cl in classesInCategory" 
                                        :value="cl._class" 
                                        :key="`class[${cl.name}]`">
                                        {{ cl._class.localizedName || cl.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col">
                                <div class="w-100 h-100" ref="divPreview"></div>
                            </div>
                        </div>
                        <div class="row justify-content-end mt-3">
                            <div class="col-auto">
                                <button type="submit" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>&nbsp;
                                <button type="button" class="btn btn-secondary" @click="close(null)">Cancel</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
</template>

