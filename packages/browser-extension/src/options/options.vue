<!-- ***********************************************************************>
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 *   -----------------------------------------------------------------------
 *                    Browser extension options UI
 <   ******************************************************************** -->

<script lang="ts">
    import { reactive, onMounted } from "vue";
    import browser from "webextension-polyfill";
    import { loadLibraryPaths } from "./options";

    export default {
        name: "ExtensionOptions",
    }
</script>

<script setup lang="ts">
    const libraryPaths = reactive<string[]>([]);

    onMounted(loadOptions);

    async function loadOptions() {
        libraryPaths.length = 0;
        libraryPaths.push(...await loadLibraryPaths());
    }//loadOptions

    async function saveOptions() {
        try {
            await browser.storage.local.set({libraryPaths: libraryPaths});
        } catch  {
            console.error("Failed to save options");
        }
    }//saveOptions
</script>

<template>
    <div class="options">
        <h1>KresMer Options</h1>
        <h2>Library paths:</h2>
        <p>
            The list of URLs where the extension will look for library files.
            The paths may be relative to the currently opened drawing location or absolute URLs.
            Each path may contain a protocol (http:, https:, file:). If no protocol
            is specified, the protocol of the current page will be used.
        </p>
        <table border="0">
            <tr v-for="(path, index) in libraryPaths" :key="index">
                <td style="width: 100%;"><input v-model="libraryPaths[index]" style="width: 100%;"/></td>
                <td><button @click="libraryPaths.splice(index, 1)">Remove</button></td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="libraryPaths.push('')">Add Path</button>
                    <div display="inline-block" style="float: right;">
                        <button @click="loadOptions()">Reset</button>&nbsp;
                        <button @click="saveOptions()">Save Options</button>
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
        padding: 8px;
        text-align: left;
    }
</style>