<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *     A dialog for specifying backend server connection parameters
<*************************************************************************** -->

<script lang="ts">
    import { onMounted, ref, reactive } from 'vue';
    import {Modal} from 'bootstrap';
    import i18next from 'i18next';
import { DrawingAreaClass } from 'kresmer';

    export default {
        name: "BorderClassSelectionDialog",
    }
</script>

<script setup lang="ts">

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();

    const borderClasses = reactive<string[]>([]);
    // eslint-disable-next-line prefer-const
    let selectedBorderClass: string|null = null;

    let resolvePromise!: (result: string | null) => void;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', () => {btnOk.value!.focus()})
        rootDiv.value!.addEventListener('hidden.bs.modal', () => {resolvePromise!(null)});
    })//mounted

    async function show(areaClass: DrawingAreaClass)
    {
        borderClasses.splice(0, borderClasses.length, ...areaClass.borderStyles);

        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<string | null>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show

    async function submit()
    {
        if (selectedBorderClass)
            close(selectedBorderClass);
    }//submit


    function close(result: string | null)
    {
        modal!.hide();
        resolvePromise!(result);
    }//close

    defineExpose({show});

</script>

<template>
    <div class="modal fade" tabindex="-1" ref="rootDiv">
        <div class="modal-dialog">
            <form class="modal-content" @submit.prevent="">
                <div class="modal-header">
                    <h5 class="modal-title fs-5">
                        {{ i18next.t("border-class-selection-dialog.title", "Choose a border class...") }}
                    </h5>
                    <button type="button" class="btn-close" @click="close(null)"></button>
                </div>
                <div class="modal-body">
                    <select class="form-select" v-model="selectedBorderClass" size="5" @dblclick="submit">
                        <option v-for="className in borderClasses" :key="className">{{ className }}</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>
                    <button type="button" class="btn btn-secondary" @click="close(null)">
                        {{ i18next.t("border-class-selection-dialog.cancel", "Cancel") }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

