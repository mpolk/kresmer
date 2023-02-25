/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *        A "toast" pane for displaying messages to the user
\**************************************************************************/

<script lang="ts">
    import { onMounted, ref, reactive, computed } from 'vue';
    import {format} from 'date-fns';
    import Toast from 'bootstrap/js/dist/toast';
    import { statusBarData } from './renderer-main';

    export type ToastMessage = {
        seqNo?: number,
        message: string, title?: string, subtitle?: string, 
        severity?: "fatal"|"error"|"warning"|"info",
        timestamp?: Date,
    };

    let messageCount = 0;
    const maxMessagesToShow = 5;
    const maxMessagesToKeep = 100;
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
            toastMessage.seqNo = ++messageCount;
            toastMessage.timestamp = new Date();
            toastMessages.unshift(toastMessage);
            if (toastMessages.length > maxMessagesToKeep) {
                toastMessages.pop();
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
        if (!isEmpty()) {
            if (toast.isShown()) {
                hide();
            } else {
                show();
            }//if
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

    function deleteMessage(index: number)
    {
        toastMessages.splice(index, 1);
        if (toastMessages.length === 0) {
            hide();
            statusBarData.haveNotifications = false;
        }//if
    }//deleteMessage

    function clearToaster()
    {
        toastMessages.splice(0);
        hide();
        statusBarData.haveNotifications = false;
    }//clearToaster

    const toastMessagesToShow = computed(() => {
        return toastMessages.slice(0, Math.min(toastMessages.length, maxMessagesToShow));
    })//toastMessagesToShow

    defineExpose({show, hide, toggle, isEmpty});
</script>

<template>
    <div ref="divToast" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex justify-content-between align-items-center">
            <span class="m-auto">Notfications ({{toastMessages.length}})</span>
            <button type="button" class="btn" title="Clear all" @click="clearToaster">
                <span class="material-symbols-outlined">delete_sweep</span>
            </button>
        </div>
        <template  v-for="(tm, i) in toastMessagesToShow" :key="`tm[${tm.seqNo}]`">
            <div class="toast-header" :class="headerClass(tm.severity)" v-if="tm.title">
                <strong class="me-auto">{{tm.title}}</strong>
                <small v-if="tm.subtitle">{{tm.subtitle}}</small>
                <small class="text-dark">{{format(tm.timestamp!, "HH:MM:ss.sss")}}</small>
                <button type="button" class="btn-close" :class='{"btn-close-white": tm.severity === "error"}'
                        aria-label="Close" @click="deleteMessage(i)"></button>
            </div>
            <div class="toast-body">
                {{tm.message}}
            </div>
        </template>
        <div class="toast-header" v-if="toastMessages.length > maxMessagesToShow"
             :class="headerClass(toastMessages[maxMessagesToShow].severity)">
        </div>
    </div>
</template>
