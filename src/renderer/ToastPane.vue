/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A "toast" pane for displaying messages to the user
\**************************************************************************/

<script lang="ts">
    import { onMounted, ref, reactive } from 'vue';
    import {format} from 'date-fns';
    import Toast from 'bootstrap/js/dist/toast';
    import { statusBarData } from './renderer-main';

    export type ToastMessage = {
        seqNo?: number,
        message: string, title?: string, subtitle?: string, 
        severity?: "fatal"|"error"|"warning"|"info",
        timestamp?: Date,
    };

    const maxMessagesToShow = 100;
    const maxMessagesToKeep = 100;
    const autoHideDelay = 5000;

    export default {
        name: "toast-pane",
    }
</script>

<script setup lang="ts">
    const toastMessages = reactive<ToastMessage[]>([]);
    let messageCount = 0;
    let toast!: Toast;
    const divToast = ref<HTMLDivElement>();
    let autoHideTimer: ReturnType<typeof setTimeout>|undefined;

    onMounted(() => {
        toast = new Toast(divToast.value!, {autohide: false});
    })//onMounted

    function show(toastMessage?: ToastMessage)
    {
        if (toastMessage) {
            toastMessage.seqNo = ++messageCount;
            toastMessage.timestamp = new Date();
            toastMessages.unshift(toastMessage);
            if (toastMessages.length > maxMessagesToKeep) {
                toastMessages.pop();
            }//if
            statusBarData.notificationsCount = messageCount;
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
        if (!isEmpty()) {
            if (toast.isShown()) {
                hide();
            } else {
                show();
            }//if
        }//if
    }//toggle

    function severityClass(severity: string|undefined)
    {
        switch (severity) {
            case 'error':
                return 'bg-danger text-light';
            case 'warning':
                return 'bg-warning text-dark';
            default:
                return undefined;
        }//switch
    }//severityClass

    function isEmpty()
    {
        return toastMessages.length === 0;
    }//isEmpty

    function deleteMessage(index: number)
    {
        toastMessages.splice(index, 1);
        if (toastMessages.length === 0) {
            hide();
            statusBarData.notificationsCount = messageCount;
        }//if
    }//deleteMessage

    function clearToaster()
    {
        toastMessages.splice(0);
        hide();
        statusBarData.notificationsCount = 0;
    }//clearToaster

    defineExpose({show, hide, toggle, isEmpty});
</script>

<template>
    <div ref="divToast" class="toast hide">
        <div class="toast-header">
            <span class="m-auto">Notfications ({{toastMessages.length}})</span>
            <button type="button" class="btn" title="Clear all" @click="clearToaster">
                <span class="material-symbols-outlined">delete_sweep</span>
            </button>
        </div>
        <div class="toast-body overflow-y-scroll" style="max-height: 400px;">
            <div v-for="(tm, i) in toastMessages.slice(0, maxMessagesToShow)" :key="`tm[${tm.seqNo}]`">
                <button type="button" class="btn btn-sm btn-light" title="Delete notification" @click="deleteMessage(i)">
                    <span class="material-symbols-outlined align-bottom">close</span>
                </button>
                <span class="badge text-sm" :class="severityClass(tm.severity)">
                    {{format(tm.timestamp!, "HH:MM:ss.sss")}} {{ tm.severity }}
                </span>
                <strong class="ms-2">{{tm.title}}</strong>
                <small class="ms-2" v-if="tm.subtitle">{{tm.subtitle}}</small>
                <br/>
                <span class="ms-4">{{tm.message}}</span>
            </div>
        </div>
    </div>
</template>
