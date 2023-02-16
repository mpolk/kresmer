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
    import { onMounted, ref } from 'vue';
    import {Modal} from 'bootstrap';
    import { DrawingMergeOptions } from 'kresmer';

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();
    let resolvePromise!: (result: DrawingMergeOptions|null) => void;
    const showWarning = ref(false);

    // eslint-disable-next-line prefer-const
    let result: DrawingMergeOptions|null = null;

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
        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<DrawingMergeOptions|null>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show


    function submit()
    {
        if (!result) {
            showWarning.value = true;
        } else {
            close(result);
        }//if
    }//submit


    function close(result: DrawingMergeOptions|null)
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
                <h5 class="modal-title fs-5">Drawing merge options...</h5>
                <button type="button" class="btn-close" @click="close(null)"></button>
            </div>
            <div class="modal-body">
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbErasePreviousContent" name="mergeOptions"
                           value="erase-previous-content" v-model="result" @click="showWarning = false">
                    <label class="form-check-label" for="rbErasePreviousContent">
                        Erase previous content
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbMergeDuplicates" name="mergeOptions"
                           value="merge-duplicates" v-model="result" @click="showWarning = false">
                    <label class="form-check-label" for="rbMergeDuplicates">
                        Merge duplicates
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbRenameDuplicates" name="mergeOptions"
                           value="rename-duplicates" v-model="result" @click="showWarning = false">
                    <label class="form-check-label" for="rbRenameDuplicates">
                        Rename duplicates
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbIgnoreDuplicates" name="mergeOptions"
                           value="ignore-duplicates" v-model="result" @click="showWarning = false">
                    <label class="form-check-label" for="rbIgnoreDuplicates">
                        Ignore duplicates
                    </label>
                </div>
                <div v-if="showWarning" class="text-warning text-center">
                    Please choose one of the options above
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>
                <button type="button" class="btn btn-secondary" @click="close(null)">Cancel</button>
            </div>
            </div>
        </div>
    </div>
</template>

