<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing application settings
<*************************************************************************** -->

<script lang="ts">
    import { nextTick, ref, watch } from 'vue';
    import { Modal, Offcanvas } from 'bootstrap';
    import { kresmer, updateWindowTitle } from './renderer-main';
    import { LocalSettings } from '../main/main';

    export default {
        name: "AppSettingsSidebar",
    }
</script>

<script setup lang="ts">
    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>();
    const formEnabled = ref(false);
    const formValidated = ref(false);
    const appSettings = ref<LocalSettings>();

    /**
     * Displays the sidebars and allows to edit application settings
     */
     function show(inSettings: LocalSettings)
    {
        if (!offCanvas) {
            offCanvas = new Offcanvas(rootDiv.value!, {backdrop: "static", scroll: true});
        }//if

        appSettings.value = inSettings;

        formEnabled.value = true;
        formValidated.value = false;
        offCanvas.show();
    }//show


    /**
     * Saves the updated data to the element
     */
    function save()
    {
        close();
    }//save

    /** Closes (hides) the sidebar */
    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    /**
     * Adds a new subprop (field) to the given pop
     * @param propName A prop to add the subprop to
     * @param type A type of the new subprop
     */
    // function addSubprop(propName: string, type: "string"|"number"|"boolean")
    // {
    //     propToAddSubpropTo.value = propName;
    //     newSubpropType.value = type;
    //     if (!dlgNewSubprop) {
    //         const el = document.querySelector("#dlgNewSubprop")!;
    //         el.addEventListener("shown.bs.modal", () => inpNewSubpropName.value!.focus());
    //         dlgNewSubprop = new Modal(el, {backdrop: "static", keyboard: true});
    //     }//if
    //     dlgNewSubprop.show();
    // }//addSubprop

    /** Callback for completing adding a new field or the Object-type prop */
    function completeAddingProtocol()
    {
    //     if (!newSubpropName.value) {
    //         alert("Subproperty name cannot be empty!");
    //         return;
    //     }//if

    //     const i = elementProps.value.findIndex(prop => prop.name == propToAddSubpropTo.value);
    //     const prop = elementProps.value[i];
    //     if (!prop.value) {
    //         prop.value = {};
    //     }//if
    //     const propValue = prop.value as Record<string, unknown>;

    //     if (Object.hasOwn(propValue, newSubpropName.value)) {
    //         alert(`Subprop "${newSubpropName.value}" already exists in the prop "${prop.name}"`);
    //         return;
    //     }//if

    //     switch (newSubpropType.value) {
    //         case "string":
    //             propValue[newSubpropName.value] = "";
    //             break;
    //         case "number":
    //             propValue[newSubpropName.value] = 0;
    //             break;
    //         case "boolean":
    //             propValue[newSubpropName.value] = false;
    //             break;
    //     }//switch

    //     dlgNewSubprop.hide();
    //     prop.isExpanded = true;
    //     nextTick(() => {
    //         const inpToFocus = document.getElementById(subpropInputID(prop.name, newSubpropName.value)) as HTMLInputElement;
    //         inpToFocus.focus();
    //     });
    }//completeAddingProtocol

    /**
     * Deletes the specified subprop from the given property
     * @param propName Prop to delete the subprop from
     * @param subpropName Subprop to delete
     */
    // function deleteSubprop(propName: string, subpropName: string)
    // {
    //     const i = elementProps.value.findIndex(prop => prop.name == propName);
    //     const prop = elementProps.value[i];
    //     delete (prop.value as Record<string, unknown>)[subpropName];
    // }// deleteSubprop

    let dlgNewProtocol!: Modal;
    const newProtocolName = ref("");
    const inpNewProtocolName = ref<HTMLInputElement>();

    function protocolInputID(protocolName: string)
    {
        return `inpProtocol[${protocolName}]`;
    }//protocolInputID

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" tabindex="-1">
        <!-- Sidebar header -->
        <div class="offcanvas-header align-items-baseline">
            <div>
                <h5 class="offcanvas-title">Settings</h5>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
        </div>
        <!-- Sidebar body -->
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}'>
                <div class="row"><div class="col">Management protocols</div></div>
                <div class="row"><div class="col">
                    <table class="table table-bordered">
                        <tbody>
                            <tr v-for="proto in appSettings?.customManagementProtocols" :key="`proto[${proto}]`">
                                <td class="p-1 align-middle">
                                    <label class="form-label text-secondary mb-0" :for="protocolInputID(proto.name)">
                                        {{ proto.name }}
                                    </label>
                                </td>
                                <td class="p-1">
                                    <input class="form-control form-control-sm" :id="protocolInputID(proto.name)" v-model="proto.cmd"/>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div></div>
                <div class="d-flex justify-content-end">
                    <button type="submit" class="btn btn-primary" @click.prevent="save">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Dialog for adding protocols -->
    <div class="modal" tabindex="-1" id="dlgNewProtocol">
        <div class="modal-dialog">
            <form class="modal-content">
                <div class="modal-header">
                    Adding new protocol
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <label class="form-label" for="inpNewProtocolName">Name</label>
                    <input type="text" class="form-control" id="inpNewProtocolName" ref="inpNewProtocolName" v-model="newProtocolName"/>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-sm btn-primary" @click.prevent="completeAddingProtocol">Ok</button>
                    <button type="button" class="btn btn-sm btn-secondary" @click="dlgNewProtocol.hide">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</template>