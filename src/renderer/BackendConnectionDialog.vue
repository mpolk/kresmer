<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
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
    import {kresmer, BackendConnectionParams} from "./renderer-main";

    let modal!: Modal;
    const diagMessage = ref("");
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
        rootDiv.value!.addEventListener('shown.bs.modal', () => {btnOk.value!.focus()})
        rootDiv.value!.addEventListener('hide.bs.modal', () => {resolvePromise!(null)});
    })//mounted

    async function show(args: BackendConnectionParams, message: string|undefined)
    {
        data.serverURL = args.serverURL;
        data.password = args.password;
        data.autoConnect = args.autoConnect;
        data.savePassword = Boolean(args.password);
        diagMessage.value = message ?? "";

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


    async function submit()
    {
        const {success, message} = await kresmer.testBackendConnection(data.serverURL, data.password);
        if (!success) {
            diagMessage.value = message ? message : "<Some hidden error, probably CORS-related>";
            return;
        }//if

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
            <form class="modal-content" @submit.prevent="">
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
                    <div v-if="diagMessage" class="text-danger text-center">
                        Cannot connect to the backend. Message is following:<br/>
                        {{ diagMessage }}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary" ref="btnOk" @click="submit">Ok</button>
                    <button type="button" class="btn btn-secondary" @click="close(null)">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</template>

