<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A dialog for component class selection wnen creating a new component
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "ComponentClassSelectionDialog",
    }
</script>

<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { Modal } from 'bootstrap';
    import { NetworkComponentClass } from 'kresmer';
    import { kresmer } from './renderer-main';

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const selComponentClass = ref<HTMLSelectElement>();
    const btnOk = ref<HTMLButtonElement>();
    let resolvePromise!: (result: NetworkComponentClass|null) => void;

    // eslint-disable-next-line prefer-const
    let result: NetworkComponentClass|null = null;
    const componentClasses = ref<{name: string, _class: NetworkComponentClass}[]>([]);

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', shown);
    })//mounted

    function shown()
    {
        // selComponentClass.value!.focus();
        btnOk.value!.focus();
    }//shown


    async function show()
    {
        componentClasses.value = [...kresmer.getRegisteredComponentClasses()]
            .map(([name, _class]) => {return {name, _class}});
        result = componentClasses.value[0]._class;

        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<NetworkComponentClass|null>((resolve) => {
            resolvePromise = resolve;
        })

        return await promise;
    }//show


    function submit()
    {
        close(result);
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
                        <select class="form-select" v-model="result" ref="selComponentClass">
                            <option v-for="cl in componentClasses" 
                                :value="cl._class" 
                                :key="`class[${cl.name}]`">
                                {{ cl.name }}
                            </option>
                        </select>
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

