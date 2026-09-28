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
</script>

<template>
    <div class="options">
        <h1>KresMer Options <span v-if="isDirty" class="dirty-indicator" title="Unsaved changes">*</span></h1>
        <h2>Library paths:</h2>
        <p>
            The list of URLs where the extension will look for library files.
            The paths may be relative to the currently opened drawing location or absolute URLs.
            Each path may contain a protocol (http:, https:, file:). If no protocol
            is specified, the protocol of the current page will be used.
        </p>
        <table border="0">
            <tr v-for="(path, index) in libraryPaths" :key="index">
                <td style="width: 100%;">
                    <input v-model="libraryPaths[index]" style="width: 100%;" @input="isDirty = true"/>
                </td>
                <td>
                    <button @click="libraryPaths.splice(index, 1); isDirty = true;" title="Remove this path">
                        <div class="material-symbols-outlined">delete</div>
                    </button>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="libraryPaths.push(''); isDirty = true;" title="Add a new library path">
                        <div class="material-symbols-outlined">add</div>
                    </button>
                    <div display="inline-block" style="float: right;">
                        <button @click="loadOptions()" title="Reset to default values">Reset</button>&nbsp;
                        <button @click="saveOptions()" title="Save current options">Save Options</button>
                    </div>
                </td>
            </tr>
        </table>
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