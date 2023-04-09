<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *      A dialog for link class selection wnen creating a new link
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "LinkClassSelectionDialog",
    }
</script>

<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { Modal } from 'bootstrap';
    import { NetworkLinkClass } from 'kresmer';
    import { kresmer } from './renderer-main';

    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const selLinkClass = ref<HTMLSelectElement>();
    const btnOk = ref<HTMLButtonElement>();
    let resolvePromise!: (result: NetworkLinkClass|null) => void;

    // eslint-disable-next-line prefer-const
    let result: NetworkLinkClass|null = null;
    const linkClasses = ref<{name: string, _class: NetworkLinkClass}[]>([]);
    const selectSize = computed(() => Math.min(linkClasses.value.length, 10));

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', shown);
    })//mounted

    function shown()
    {
        selLinkClass.value!.focus();
        //btnOk.value!.focus();
    }//shown


    async function show()
    {
        linkClasses.value = [...kresmer.getRegisteredLinkClasses()]
            .filter(([name, _class]) => !_class.isAbstract)
            .sort((c1, c2) => c1[0] < c2[0] ? -1 : c1[0] > c2[0] ? 1 : 0)
            .map(([name, _class]) => {return {name, _class}});
        result = linkClasses.value[0]._class;

        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<NetworkLinkClass|null>((resolve) => {
            resolvePromise = resolve;
        })

        return await promise;
    }//show


    function submit()
    {
        close(result);
    }//submit


    function close(result: NetworkLinkClass|null)
    {
        modal!.hide();
        resolvePromise!(result);
    }//close

    defineExpose({show, selectSize});

</script>

<template>
    <div class="modal fade" tabindex="-1" ref="rootDiv">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5">Choose the new link class...</h5>
                    <button type="button" class="btn-close" @click="close(null)"></button>
                </div>
                <form @submit.prevent="">
                    <div class="modal-body">
                        <select class="form-select" v-model="result" ref="selLinkClass" :size="selectSize" @dblclick="submit">
                            <option v-for="cl in linkClasses" 
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

