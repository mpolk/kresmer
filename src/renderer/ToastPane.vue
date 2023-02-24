/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A loader for network element class libraries
\**************************************************************************/

<script lang="ts">
    import { onMounted, ref, computed } from 'vue';
    import Toast from 'bootstrap/js/dist/toast';

    export default {
        name: "toast-pane",
    }
</script>

<script setup lang="ts">
    const message = ref(''); 
    const title = ref('');
    const subtitle = ref('');
    const severity = ref<string|null>(null);
    let toast!: Toast;
    const divToast = ref<HTMLDivElement>();

    onMounted(() => {
        toast = new Toast(divToast.value!);
    })//onMounted

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    function show(args: {message: string, title?: string, subtitle?: string, 
                         severity?: "fatal"|"error"|"warning"|"info"})
    {
        message.value = args.message;
        title.value = args.title || '';
        subtitle.value = args.subtitle || '';
        severity.value = args.severity || null;
        toast!.show();
    }//show

    const headerClass = computed((): string =>
    {
        switch (severity.value) {
            case 'error':
                return 'bg-danger text-dark';
            case 'warning':
                return 'bg-warning text-dark';
            default:
                return '';
        }//switch
    })//headerClass

    defineExpose({show});
</script>

<template>
    <div ref="divToast" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header" :class="headerClass" v-if="title">
            <strong class="me-auto">{{title}}</strong>
            <small v-if="subtitle">{{subtitle}}</small>
            <button type="button" class="btn-close btn-close-white" 
                    data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            {{message}}
        </div>
    </div>
</template>
