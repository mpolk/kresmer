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

    export default {
        name: "ExtensionOptions",
    }
</script>

<script setup lang="ts">

    const libraryPaths = reactive<string[]>(["lib"]);

    onMounted(async () => {
        try {
            const result = await browser.storage.local.get("libraryPaths") as {libraryPaths: string[]};
            libraryPaths.length = 0;
            for (const path of result.libraryPaths)
                libraryPaths.push(path);
        } catch  {/* ignore */}
    });
</script>

<template>
    <div class="options">
        <h1>KresMer Options</h1>
        <h2>Library paths:</h2>
        <p>
            The list of URLs where the extension will look for library files.
            The paths may be relative to the currently opened file location or absolute URLs
            Each path may contain a protocol (http:, https:, file:). If no protocol
            is specified, the protocol of the current page will be used.
        </p>
        <table border="0">
            <tr v-for="(path, index) in libraryPaths" :key="index">
                <td><input v-model="libraryPaths[index]" style="width: 100%;"/></td>
                <td><button @click="libraryPaths.splice(index, 1)">Remove</button></td>
            </tr>
            <tr>
                <td colspan="2"><button @click="libraryPaths.push('')">Add Path</button></td>
            </tr>
        </table>
    </div>
</template>

<style scoped lang="scss">
    .options {
        font-family: Arial, sans-serif;
        font-size: 1rem;
        padding: 1rem 2rem;
        width: 50%;
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