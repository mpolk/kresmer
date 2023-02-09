<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *     A dialog for specifying backend server connection parameters
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "BackendConnectionDialog",
    }
</script>

<script setup lang="ts">
    import { onMounted, ref, reactive } from 'vue';
    import {Modal} from 'bootstrap';
    import {BackendConnectionParams} from "./renderer-main";

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnOk = ref<HTMLButtonElement>();

    const data: BackendConnectionParams = reactive({
        serverURL: "",
        password: "",
        autoConnect: true,
        savePassword: false,
    });

    let resolvePromise!: (result: BackendConnectionParams | null) => void;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', () => {btnOk.value!.focus()});
    })//mounted

    async function show(args: {serverURL: string, password: string, autoConnect: boolean})
    {
        data.serverURL = args.serverURL;
        data.password = args.password;
        data.autoConnect = args.autoConnect;
        data.savePassword = Boolean(args.password);

        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<BackendConnectionParams | null>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show


    function onSavePasswordChange(event: Event)
    {
        if (data.savePassword && 
            !confirm("Keep in mind that the password is stored in plain text.\n" + 
                     "Are you sure you want to save the password?")) 
        {
            data.savePassword = false;
        }//if
    }//onSavePasswordChange


    function submit()
    {
        close(data);
    }//submit


    function close(result: BackendConnectionParams | null)
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
                    <h5 class="modal-title fs-5">Connect to the backend server...</h5>
                    <button type="button" class="btn-close" @click="close(null)"></button>
                </div>
                <div class="modal-body">
                    <label for="inpServerURL" class="form-label">Server URL:</label>
                    <input id="inpServerURL" class="form-control" v-model="data.serverURL" />
                    <label for="inpBackendPassword" class="form-label">Password:</label>
                    <input id="inpBackendPassword" type="password" class="form-control" v-model="data.password" />
                    <div class="form-check mt-2">
                        <input id="cbSavePassword" type="checkbox" class="form-check-input" v-model="data.savePassword" 
                               @change="onSavePasswordChange($event)"/>
                        <label for="cbSavePassword" class="form-check-label">Save password</label>
                    </div>
                    <div class="form-check">
                        <input id="cbAutoConnect" type="checkbox" class="form-check-input" v-model="data.autoConnect" />
                        <label for="cbAutoConnect" class="form-check-label">Connect to the server automatically</label>
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

