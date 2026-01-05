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
import { AreaBorderClass, DrawingAreaClass } from 'kresmer';

    export default {
        name: "BorderClassSelectionDialog",
    }
</script>

<script setup lang="ts">

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();

    const borderClasses = reactive<AreaBorderClass[]>([]);
     
    let selectedClassIndex: number|null = null;

    let resolvePromise!: (result: AreaBorderClass | null) => void;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', () => {btnOk.value!.focus()})
        rootDiv.value!.addEventListener('hidden.bs.modal', () => {resolvePromise!(null)});
    })//mounted

    async function show(areaClass: DrawingAreaClass)
    {
        borderClasses.splice(0, borderClasses.length, ...Object.values(areaClass.borderClasses));

        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<AreaBorderClass | null>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show

    async function submit()
    {
        if (typeof selectedClassIndex === "number")
            close(borderClasses[selectedClassIndex]);
    }//submit


    function close(result: AreaBorderClass | null)
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
                    <select class="form-select" v-model="selectedClassIndex" size="5" @dblclick="submit">
                        <option v-for="(borderClass, i) in borderClasses" :key="borderClass.name" :value="i">
                            {{ borderClass.localizedName ?? borderClass.name }}
                        </option>
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

