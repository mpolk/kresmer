<!-- ***********************************************************************>
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 *   -----------------------------------------------------------------------
 *                    Browser extension options UI
 <   ******************************************************************** -->

<script lang="ts">
    import { reactive, ref, onMounted, toRaw } from "vue";
    import browser from "webextension-polyfill";
    import { loadLibraryPaths } from "./options";

    export default {
        name: "ExtensionOptions",
    }
</script>

<script setup lang="ts">
    const isDirty = ref(false);
    const libraryPaths = reactive<string[]>([]);

    onMounted(loadOptions);

    async function loadOptions() {
        libraryPaths.length = 0;
        libraryPaths.push(...await loadLibraryPaths());
        isDirty.value = false;
    }//loadOptions

    async function saveOptions() {
        try {
            await browser.storage.local.set({libraryPaths: toRaw(libraryPaths)});
            isDirty.value = false;
        } catch (exc)  {
            console.error("Failed to save options", exc);
        }
    }//saveOptions

    function onDragStart(event: DragEvent, index: number) {
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', index.toString());
            const rowRect =(event.target as HTMLElement).getBoundingClientRect();
            const buttonRect =(event.currentTarget as HTMLElement).getBoundingClientRect();
            event.dataTransfer.setDragImage(event.currentTarget as Element, 
                rowRect.left - buttonRect.left + event.offsetX, 
                buttonRect.top - rowRect.top + event.offsetY);
        }//if
    }//onDragStart

    function onDragOver(event: DragEvent) {
        event.preventDefault();
    }//onDragOver

    function onDrop(event: DragEvent, index: number) {
        event.preventDefault();
        const fromIndex = parseInt(event.dataTransfer?.getData('text/plain') || '-1');
        if (fromIndex !== -1 && fromIndex !== index) {
            const movedPath = libraryPaths.splice(fromIndex, 1)[0];
            libraryPaths.splice(index, 0, movedPath);
            isDirty.value = true;
        }
    }//onDrop
</script>

<template>
    <div class="options">
        <h1>{{browser.i18n.getMessage("kresmer_options")}} <span v-if="isDirty" class="dirty-indicator" title="Unsaved changes">*</span></h1>
        <h2>{{browser.i18n.getMessage("library_paths")}}</h2>
        <p>
            {{browser.i18n.getMessage("library_paths_description")}}
        </p>
        <form @submit.prevent="saveOptions()">
        <table border="0">
            <tr v-for="(path, index) in libraryPaths" :key="index" 
                @dragstart="onDragStart($event, index)" 
                @dragover="onDragOver($event)" @drop="onDrop($event, index)">
                <td style="width: 100%;">
                    <input v-model="libraryPaths[index]" style="width: 100%;" @input="isDirty = true"/>
                </td>
                <td nowrap style="width: 1%;">
                    <button title="Move this path" draggable="true">
                        <div class="material-symbols-outlined" style="display: inline-block;">open_with</div>
                    </button>&nbsp;
                    <button @click="libraryPaths.splice(index, 1); isDirty = true;" title="Remove this path">
                        <div class="material-symbols-outlined" style="display: inline-block;">delete</div>
                    </button>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="libraryPaths.push(''); isDirty = true;" title="Add a new library path">
                        <div class="material-symbols-outlined">add</div>
                    </button>
                    <div display="inline-block" style="float: right;">
                        <button @click="loadOptions()" :disabled="!isDirty" title="Reset to default values">Reset</button>&nbsp;
                        <button type="submit" @click="saveOptions()" :disabled="!isDirty" title="Save current options">Save Options</button>
                    </div>
                </td>
            </tr>
        </table>
        </form>
    </div>
</template>

<style scoped lang="scss">
    .options {
        font-family: Arial, sans-serif;
        padding: 1rem 2rem;
        width: 30rem;
    }

    h1 {
        color: #333;
    }

    table {
        border-collapse: collapse;
        width: 100%;
    }

    th, td {
        padding: 0.25rem 0.5rem;
        text-align: left;
    }

    .dirty-indicator {
        color: red;
        font-weight: bold;
        cursor: default;
    }

    // Include Material Design Icons
    @font-face {
        font-family: 'Material Symbols Outlined';
        src: url("../fonts/MaterialSymbolsOutlined.woff2") format("woff2");
    }

    .material-symbols-outlined {
        font-family: 'Material Symbols Outlined';
        font-variation-settings:
            'FILL' 0,
            'wght' 400,
            'GRAD' 200,
            'opsz' 48;

        &.filled {
            font-variation-settings:
                'FILL' 1,
                'wght' 400,
                'GRAD' 200,
                'opsz' 48;
        }
    }
</style>