/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A "toast" pane for displaying messages to the user
\**************************************************************************/

<script lang="ts">
    import { onMounted, ref, reactive } from 'vue';
    import Toast from 'bootstrap/js/dist/toast';
    import { statusBarData } from './renderer-main';

    export type ToastMessage = {message: string, title?: string, subtitle?: string, 
                                severity?: "fatal"|"error"|"warning"|"info"};
    const maxMessages = 5;
    const autoHideDelay = 5000;

    export default {
        name: "toast-pane",
    }
</script>

<script setup lang="ts">
    const toastMessages = reactive<ToastMessage[]>([]);
    let toast!: Toast;
    const divToast = ref<HTMLDivElement>();
    let autoHideTimer: ReturnType<typeof setTimeout>|undefined;

    onMounted(() => {
        toast = new Toast(divToast.value!, {autohide: false});
    })//onMounted

    function show(toastMessage?: ToastMessage)
    {
        if (toastMessage) {
            toastMessages.push(toastMessage);
            if (toastMessages.length > maxMessages) {
                toastMessages.shift();
            }//if
            statusBarData.haveNotifications = true;
            autoHideTimer = setTimeout(() => hide(), autoHideDelay);
        } else if (autoHideTimer) {
            clearTimeout(autoHideTimer);
            autoHideTimer = undefined;
        }//if
        toast.show();
    }//show

    function hide()
    {
        toast.hide();
    }//hide

    function toggle()
    {
        if (toast.isShown()) {
            hide();
        } else {
            show();
        }//if
    }//toggle

    function headerClass(severity: string|undefined)
    {
        switch (severity) {
            case 'error':
                return 'bg-danger text-light';
            case 'warning':
                return 'bg-warning text-dark';
            default:
                return '';
        }//switch
    }//headerClass

    function isEmpty()
    {
        return toastMessages.length === 0;
    }//isEmpty

    defineExpose({show, hide, toggle, isEmpty});
</script>

<template>
    <div ref="divToast" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
        <template  v-for="(tm, i) in toastMessages" :key="`tm[${i}]`">
            <div class="toast-header" :class="headerClass(tm.severity)" v-if="tm.title">
                <strong class="me-auto">{{tm.title}}</strong>
                <small v-if="tm.subtitle">{{tm.subtitle}}</small>
            </div>
            <div class="toast-body">
                {{tm.message}}
            </div>
        </template>
    </div>
</template>
