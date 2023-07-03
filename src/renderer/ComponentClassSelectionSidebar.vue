<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *  A sidebar for component class selection wnen creating a new component
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "ComponentClassSelectionSidebar",
    }
</script>

<script setup lang="ts">
    import { onMounted, ref, watch, nextTick } from 'vue';
    import { Offcanvas } from 'bootstrap';
    import Kresmer, { NetworkComponentClass, NetworkComponent, NetworkComponentController } from 'kresmer';
    import { kresmer } from './renderer-main';

    let offCanvas!: Offcanvas;
    const rootDiv = ref<HTMLDivElement>();
    const selComponentClass = ref<HTMLSelectElement>();
    const selCategory = ref<HTMLSelectElement>();
    const btnOk = ref<HTMLButtonElement>();
    const divPreview = ref<HTMLDivElement>();
    let resolvePromise!: (result: NetworkComponentClass|null) => void;

    const result = ref<NetworkComponentClass|null>(null);
    const componentClasses = ref<{name: string, _class: NetworkComponentClass}[]>([]);
    const categories = ref<string[]>([]);
    const selectedCategory = ref<string>();

    const selectSize = 10;
    const previewWidth = 400;
    const previewHeight = 400;
    let krePreview: Kresmer;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.offcanvas', () => {
            scalePreview();
            selCategory.value!.focus();
        });
    })//mounted

    watch(result, scalePreview);

    async function scalePreview()
    {
        krePreview.eraseContent();
        krePreview.logicalWidth = previewWidth;
        krePreview.logicalHeight = previewHeight;

        if (result.value) {
            const _class = result.value;
            const component = new NetworkComponent(krePreview, _class);
            const controller = new NetworkComponentController(krePreview, component, 
                {origin: {x: previewWidth/2, y: previewHeight/2}});
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
                controller.origin.x = previewWidth/2 + d/2 - (componentPos.x + bBox.width/2);
                controller.origin.y = previewHeight/2 + d/2 - (componentPos.y + bBox.height/2);
            }//if
        }//if
    }//scalePreview

    function onCategorySelection()
    {
        componentClasses.value = Array.from(kresmer.getRegisteredComponentClasses())
                .map(([name, _class]) => {return {name, _class}})
                .sort((c1, c2) => c1.name < c2.name ? -1 : c1.name > c2.name ? 1 : 0)
                ;
        componentClasses.value = componentClasses.value.filter(({name, _class}) => (_class.category ?? "") == selectedCategory.value);
        result.value = componentClasses.value[0]._class;
    }//onCategorySelection

    async function show()
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: 'static'});
            krePreview = new Kresmer(divPreview.value!, {isEditable: false, logicalWidth: previewWidth, logicalHeight: previewHeight});
            for (const [_, _class] of kresmer.getRegisteredComponentClasses()) {
                krePreview.registerNetworkComponentClass(_class);
            }//for
        }//if

        const categorySet = new Set<string>();
        let haveUncategorizedClasses = false;
        for (const [_, _class] of kresmer.getRegisteredComponentClasses()) {
            if (!_class.category)
                haveUncategorizedClasses = true;
            else if (!_class.category.startsWith("."))
                categorySet.add(_class.category);
        }//for
        categories.value = Array.from(categorySet).sort();
        if (haveUncategorizedClasses)
            categories.value.unshift("");
        selectedCategory.value = categories.value[0];

        onCategorySelection();

        offCanvas.show();
        const promise = new Promise<NetworkComponentClass|null>((resolve) => {
            resolvePromise = resolve;
        })

        return await promise;
    }//show


    function submit()
    {
        close(result.value);
    }//submit


    function close(result: NetworkComponentClass|null)
    {
        offCanvas!.hide();
        resolvePromise!(result);
    }//close

    defineExpose({show});

</script>

<template>
    <div class="offcanvas offcanvas-end" tabindex="-1" ref="rootDiv">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title fs-5">Choose a new component class...</h5>
                    <button type="button" class="btn-close" @click="close(null)"></button>
                </div>
                <form @submit.prevent="">
                    <div class="offcanvas-body">
                        <div class="row">
                            <div class="col">
                                <select class="form-select" v-model="selectedCategory" :size="selectSize"  ref="selCategory" 
                                        @change="onCategorySelection">
                                    <option v-for="cat in categories" :value="cat" :key="`category-${cat}`">
                                        {{ cat }}
                                    </option>
                                </select>
                            </div>
                            <div class="col">
                                <select class="form-select" v-model="result" ref="selComponentClass" 
                                        :size="selectSize" @dblclick="submit">
                                    <option v-for="cl in componentClasses" 
                                        :value="cl._class" 
                                        :key="`class[${cl.name}]`">
                                        {{ cl.name }}
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
                                <button type="submit" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
</template>

