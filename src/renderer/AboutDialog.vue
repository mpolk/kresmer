<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *           A dialog for displaying application info
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "AboutDialog",
    }
</script>

<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { Modal } from 'bootstrap';

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();
    let resolvePromise!: (result: void) => void;

    const appVersion = ref("");

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', shown);
    })//mounted

    function shown()
    {
        btnOk.value!.focus();
    }//shown


    async function show(version: string)
    {
        appVersion.value = version;

        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise((resolve) => {
            resolvePromise = resolve;
        })

        return await promise;
    }//show


    function close()
    {
        modal!.hide();
        resolvePromise!();
    }//close

    defineExpose({show});

</script>

<template>
    <div class="modal fade" tabindex="-1" ref="rootDiv">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5">About Kresmer...</h5>
                    <button type="button" class="btn-close" @click="close()"></button>
                </div>
                <form @submit.prevent="">
                    <div class="modal-body">
                        Kresmer {{ appVersion }}
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary" ref="btnOk" @click="close()">Ok</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

