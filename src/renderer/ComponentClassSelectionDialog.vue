<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A dialog for component class selection wnen creating a new component
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "ComponentClassSelectionDialog",
    }
</script>

<script setup lang="ts">
    import { onMounted, ref, computed, watch, nextTick } from 'vue';
    import { Modal } from 'bootstrap';
    import Kresmer, { NetworkComponentClass, NetworkComponent, NetworkComponentController } from 'kresmer';
    import { kresmer } from './renderer-main';

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const selComponentClass = ref<HTMLSelectElement>();
    const btnOk = ref<HTMLButtonElement>();
    const divPreview = ref<HTMLDivElement>();
    let resolvePromise!: (result: NetworkComponentClass|null) => void;

    const result = ref<NetworkComponentClass|null>(null);
    const componentClasses = ref<{name: string, _class: NetworkComponentClass}[]>([]);
    const selectSize = computed(() => Math.min(componentClasses.value.length, 10));
    let krePreview: Kresmer;
    const previewWidth = 400;
    const previewHeight = 400;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', () => {
            scalePreview();
            selComponentClass.value!.focus();
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

    async function show()
    {
        if (!modal) {
            componentClasses.value = [...kresmer.getRegisteredComponentClasses()]
                .sort((c1, c2) => c1[0] < c2[0] ? -1 : c1[0] > c2[0] ? 1 : 0)
                .map(([name, _class]) => {return {name, _class}});

            krePreview = new Kresmer(divPreview.value!, {isEditable: false, 
                logicalWidth: previewWidth, logicalHeight: previewHeight});
            componentClasses.value.forEach(item => {krePreview.registerNetworkComponentClass(item._class)});
            componentClasses.value = componentClasses.value
                .filter(({name, _class}) => !_class.isAbstract);
            result.value = componentClasses.value[0]._class;
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        }//if

        modal.show();
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
        modal!.hide();
        resolvePromise!(result);
    }//close

    defineExpose({show});

</script>

<template>
    <div class="modal fade" tabindex="-1" ref="rootDiv">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5">Choose the new component class...</h5>
                    <button type="button" class="btn-close" @click="close(null)"></button>
                </div>
                <form @submit.prevent="">
                    <div class="modal-body">
                        <div class="row">
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
                            <div class="col">
                                <div class="w-100 h-100" ref="divPreview"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>
                        <button type="button" class="btn btn-secondary" @click="close(null)">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

