/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A loader for network element class libraries
\**************************************************************************/

<script lang="ts">
    import { onMounted, ref, reactive, computed } from 'vue';
    import Toast from 'bootstrap/js/dist/toast';

    export type ToastMessage = {message: string, title?: string, subtitle?: string, 
                                severity?: "fatal"|"error"|"warning"|"info"};
    const maxMessages = 5;

    export default {
        name: "toast-pane",
    }
</script>

<script setup lang="ts">
    const toastMessages = reactive<ToastMessage[]>([]);
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
    function show(toastMessage: ToastMessage)
    {
        toastMessages.push(toastMessage);
        if (toastMessages.length > maxMessages) {
            toastMessages.shift();
        }//if
        message.value = toastMessage.message;
        title.value = toastMessage.title || '';
        subtitle.value = toastMessage.subtitle || '';
        severity.value = toastMessage.severity || null;
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
        <template  v-for="(tm, i) in toastMessages" :key="`tm[${i}]`">
            <div class="toast-header" :class="headerClass" v-if="tm.title">
                <strong class="me-auto">{{tm.title}}</strong>
                <small v-if="tm.subtitle">{{tm.subtitle}}</small>
                <button type="button" class="btn-close btn-close-white" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                {{tm.message}}
            </div>
        </template>
    </div>
</template>
