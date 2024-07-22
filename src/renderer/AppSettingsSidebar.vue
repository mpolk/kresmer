<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *   A sidebar for displaying and editing application settings
<*************************************************************************** -->

<script lang="ts">
    import { nextTick, ref } from 'vue';
    import { Modal, Offcanvas } from 'bootstrap';
    import {t} from 'i18next';
    import { updateAppSettings } from './renderer-main';
    import { AppSettings } from '../main/main';
    import { StreetAddressFormat, LibDataPriority } from 'kresmer';

    export default {
        name: "AppSettingsSidebar",
    }
</script>

<script setup lang="ts">
    let offCanvas: Offcanvas | undefined;
    const rootDiv = ref<HTMLDivElement>();
    const formEnabled = ref(false);
    const formValidated = ref(false);
    const appSettings = ref<AppSettings>();

    /**
     * Displays the sidebars and allows to edit application settings
     */
     function show(inSettings: AppSettings)
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
        updateAppSettings(appSettings.value!);
        close();
    }//save

    /** Closes (hides) the sidebar */
    function close()
    {
        offCanvas!.hide();
        formEnabled.value = false;
    }//close

    /**
     * Adds a new management protocol
     */
    function addProtocol()
    {
        if (!dlgNewProtocol) {
            const el = document.querySelector("#dlgNewProtocol")!;
            el.addEventListener("shown.bs.modal", () => inpNewProtocolName.value!.focus());
            dlgNewProtocol = new Modal(el, {backdrop: "static", keyboard: true});
        }//if
        dlgNewProtocol.show();
    }//addProtocol

    /** Callback for completing adding a new field or the Object-type prop */
    function completeAddingProtocol()
    {
        if (!newProtocolName.value) {
            alert("Protocol name cannot be empty!");
            return;
        }//if

        if (appSettings.value!.customManagementProtocols.find(proto => proto.name === newProtocolName.value) ) {
            alert(`Protocol "${newProtocolName.value}" already exists"`);
            return;
        }//if

        appSettings.value!.customManagementProtocols.push({name: newProtocolName.value, cmd: ""});

        dlgNewProtocol.hide();
        nextTick(() => {
            const i = appSettings.value!.customManagementProtocols.length - 1;
            const inpToFocus = document.getElementById(protocolInputID(i)) as HTMLInputElement;
            inpToFocus.focus();
        });
    }//completeAddingProtocol

    /**
     * Deletes the specified management protocol
     * @param i An index of the protocol to delete
     */
    function deleteProtocol(i: number)
    {
        appSettings.value!.customManagementProtocols.splice(i, 1);
    }//deleteProtocol

    let dlgNewProtocol!: Modal;
    const newProtocolName = ref("");
    const inpNewProtocolName = ref<HTMLInputElement>();

    function protocolInputID(i: number)
    {
        return `inpProtocol[${appSettings.value?.customManagementProtocols[i]?.name}]`;
    }//protocolInputID

    function addLibDir()
    {
        appSettings.value!.libDirs.push("");
    }//addLibDir

    /**
     * Deletes the specified library directory
     * @param i An index of the directory to delete
     */
     function deleteLibDir(i: number)
    {
        appSettings.value!.libDirs.splice(i, 1);
    }//deleteLibDir

    defineExpose({show});
</script>

<template>
    <div ref="rootDiv" class="offcanvas offcanvas-end" tabindex="-1">
        <!-- Sidebar header -->
        <div class="offcanvas-header align-items-baseline">
            <div>
                <h5 class="offcanvas-title">{{ t("renderer:app-settings._", "Settings") }}</h5>
            </div>
            <button type="button" class="btn-close" @click="close"></button>
        </div>
        <!-- Sidebar body -->
        <div class="offcanvas-body">
            <form v-if="formEnabled" :class='{"was-validated": formValidated}'>
                <div class="row">
                    <div class="col">
                        <label class="form-label" for="selUILanguage">UI language <span class="text-secondary">(requires restart)</span></label>
                        <select id="selUILanguage" class="form-select" v-model="appSettings!.uiLanguage">
                            <option value="">default</option>
                            <option value="en">English</option>
                            <option value="uk">Українська</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col d-flex justify-content-between">
                        <span>Library directory(-ies)</span>
                        <button type="button" class="btn btn-sm btn-outline-secondary ms-1" 
                            title="Add library directory" @click="addLibDir">
                        <span class="material-symbols-outlined align-top">add</span>
                    </button>
                    </div>
                </div>
                <div class="row"><div class="col">
                    <table class="table table-bordered">
                        <tbody>
                            <tr v-for="(dir, i) in appSettings?.libDirs" :key="`dir[${i}]`">
                                <td class="p-1 d-flex justify-content-between align-items-center">
                                    <input class="form-control form-control-sm border-0" v-model="appSettings!.libDirs[i]"/>
                                    <button type="button" class="btn btn-sm btn-outline-light" 
                                            title="Delete library directory" @click="deleteLibDir(i)">
                                        <span class="material-symbols-outlined align-top">close</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div></div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbAutoloadLastDrawing">Autoload the last opened drawing</label>
                            <input type="checkbox" id="cbAutoloadLastDrawing" class="form-check-input" v-model="appSettings!.autoloadLastDrawing" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbAutoconnectToServer">Automatically connect to the server</label>
                            <input type="checkbox" id="cbAutoconnectToServer" class="form-check-input" v-model="appSettings!.server.autoConnect" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check d-inline-block">
                            <label class="form-check-label" for="cbSnapToGrid">Snap to grid,</label>
                            <input type="checkbox" id="cbSnapToGrid" class="form-check-input" v-model="appSettings!.snapToGrid" />
                        </div>
                        &nbsp;<label class="form-label me-1" for="cbSnappingGranularity">step</label>
                        <input type="number" id="cbSnappingGranularity" class="form-control form-control-sm text-end d-inline-block"
                            style="width: 4rem" v-model="appSettings!.snappingGranularity" />
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbAutoAlignVertices">Automatically align vertices</label>
                            <input type="checkbox" id="cbAutoAlignVertices" class="form-check-input" v-model="appSettings!.autoAlignVertices" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbSaveDynamicPropsWithDrawing">Save dynamic props with the drawing</label>
                            <input type="checkbox" id="cbSaveDynamicPropsWithDrawing" class="form-check-input" v-model="appSettings!.saveDynamicPropValuesWithDrawing" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbEmbedLibDataInDrawing">Embed library data in the drawing</label>
                            <input type="checkbox" id="cbEmbedLibDataInDrawing" class="form-check-input" v-model="appSettings!.embedLibDataInDrawing" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <label class="form-label" for="selLibDataPriority">Library data priority</label>
                        <select id="selLibDataPriority" class="form-select" v-model="appSettings!.libDataPriority">
                            <option>{{LibDataPriority.preferSystem}}</option>
                            <option>{{LibDataPriority.preferEmbedded}}</option>
                            <option>{{LibDataPriority.useVersioning}}</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbAnimateComponentDragging">Animate component dragging</label>
                            <input type="checkbox" id="cbAnimateComponentDragging" class="form-check-input" v-model="appSettings!.animateComponentDragging" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <div class="form-check">
                            <label class="form-check-label" for="cbAnimateLinkBundleDragging">Animate link bundle dragging</label>
                            <input type="checkbox" id="cbAnimateLinkBundleDragging" class="form-check-input" v-model="appSettings!.animateLinkBundleDragging" />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <label class="form-label" for="selStreetAddressFormat">Street address format</label>
                        <select id="selStreetAddressFormat" class="form-select" v-model="appSettings!.streetAddressFormat">
                            <option>{{StreetAddressFormat.BuildingFirst}}</option>
                            <option>{{StreetAddressFormat.StreetFirst}}</option>
                        </select>
                    </div>
                </div>
                <div class="row pt-2">
                    <div class="col d-flex justify-content-between">
                        <span>Management protocols</span>
                        <button type="button" class="btn btn-sm btn-outline-secondary ms-1" 
                            title="Add protocol" @click="addProtocol">
                        <span class="material-symbols-outlined align-top">add</span>
                    </button>
                    </div>
                </div>
                <div class="row"><div class="col">
                    <table class="table table-bordered">
                        <tbody>
                            <tr v-for="(proto, i) in appSettings?.customManagementProtocols" :key="`proto[${i}]`">
                                <td class="p-1 d-flex justify-content-between align-items-center">
                                    <label class="form-label text-secondary mb-0" :for="protocolInputID(i)">
                                        {{ proto.name }}
                                    </label>
                                    <button type="button" class="btn btn-sm btn-outline-light" 
                                            title="Delete protocol" @click="deleteProtocol(i)">
                                        <span class="material-symbols-outlined align-top">close</span>
                                    </button>
                                </td>
                                <td class="p-1">
                                    <input class="form-control form-control-sm border-0" :id="protocolInputID(i)" v-model="proto.cmd"/>
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