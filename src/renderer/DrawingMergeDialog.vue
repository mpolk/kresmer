<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *     A dialog for specifying drawing merge options upon its loading
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "DrawingMergeDialog",
    }
</script>

<script setup lang="ts">
    import { onMounted, reactive, ref } from 'vue';
    import {Modal} from 'bootstrap';
    import { DrawingMergeOptions } from 'kresmer';
    import { kresmer } from '../renderer/renderer-main';
    import {DrawingMergeDialogResult} from './DrawingMergeDialog'

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();
    let resolvePromise!: (result: DrawingMergeDialogResult|null) => void;
    const showWarning = ref(false);

    const result: DrawingMergeDialogResult = reactive({drawingMergeOption: null, saveChanges: false});

    const haveUnsavedChanges = ref(false);
    // eslint-disable-next-line prefer-const
    let cbSaveChangesClicked = false;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', shown);
    })//mounted

    function shown()
    {
        btnOk.value!.focus();
    }//shown


    async function show()
    {
        haveUnsavedChanges.value = kresmer.isDirty;
        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<DrawingMergeDialogResult|null>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show

    function setMergeOption(value: DrawingMergeOptions)
    {
        showWarning.value = false;
        if (!cbSaveChangesClicked) {
            result.saveChanges = (value === "erase-previous-content");
        }//if
        result.drawingMergeOption = value;
    }//setMergeOption

    function submit()
    {
        if (!result.drawingMergeOption) {
            showWarning.value = true;
        } else {
            close(result);
        }//if
    }//submit

    function cancel()
    {
        close(null);
    }//cancel

    function close(result: DrawingMergeDialogResult|null)
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
                    <h5 class="modal-title fs-5">Drawing merge options...</h5>
                    <button type="button" class="btn-close" @click="cancel"></button>
                </div>
                <div class="modal-body">
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="rbErasePreviousContent" name="mergeOptions"
                            @click="setMergeOption('erase-previous-content')">
                        <label class="form-check-label" for="rbErasePreviousContent">
                            Erase previous content
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="rbMergeDuplicates" name="mergeOptions"
                            @click="setMergeOption('merge-duplicates')">
                        <label class="form-check-label" for="rbMergeDuplicates">
                            Merge duplicates
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" id="rbRenameDuplicates" name="mergeOptions"
                            @click="setMergeOption('rename-duplicates')">
                        <label class="form-check-label" for="rbRenameDuplicates">
                            Rename duplicates
                        </label>
                    </div>
                    <template v-if="haveUnsavedChanges">
                        <div style="display: inline-block; width: 2rem;"/>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="cbSaveChanges" name="saveChanges"
                                v-model="result.saveChanges" @click="cbSaveChangesClicked = true">
                            <label class="form-check-label" for="cbSaveChanges">
                                ...and save the drawing before opening the new one
                            </label>
                        </div>
                    </template>
                    <div v-if="showWarning" class="text-warning text-center">
                        Please choose one of the options above
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>
                    <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</template>

