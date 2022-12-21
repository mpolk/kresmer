<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *     A dialog for specifying drawing merge options upon its loading
<*************************************************************************** -->

<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import {Modal} from 'bootstrap';
    import { DrawingMergeOptions } from '../Kresmer';

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();
    let resolvePromise!: (result: boolean) => void;

    let result: DrawingMergeOptions

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
        const promise = new Promise<boolean>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show


    function close(button: string)
    {
        modal!.hide();
        const result = button === 'ok' || button === 'yes';
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
                <button type="button" class="btn-close" @click="close('close')"></button>
            </div>
            <div class="modal-body">
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbErasePreviousContent" 
                           value="erase-previous-content" v-model="result">
                    <label class="form-check-label" for="rbErasePreviousContent">
                        Erase previous content
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbMergeDuplicates" 
                           value="merge-duplicates" v-model="result">
                    <label class="form-check-label" for="rbMergeDuplicates">
                        Merge duplicates
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbDeclineDuplicates" 
                           value="decline-duplicates" v-model="result">
                    <label class="form-check-label" for="rbMergeDuplicates">
                        Decline duplicates
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" id="rbIgnoreDuplicates" 
                           value="ignore-duplicates" v-model="result">
                    <label class="form-check-label" for="rbMergeDuplicates">
                        Ignore duplicates
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" ref="btnOk">Ok</button>
                <button type="button" class="btn btn-secondary" @click="close('cancel')">Cancel</button>
            </div>
            </div>
        </div>
    </div>
</template>

