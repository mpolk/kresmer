/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                             MessageBox
 *   an improved replacement for the JS built-ins "alert" and "confirm"
 ***************************************************************************/

<script lang="ts">
    import { onMounted, ref, computed } from 'vue';
    import {Modal} from 'bootstrap';
    import { MessageBoxButtons, MessageBoxOptions, MessageBoxSeverity, MessageBoxResult } from './message-box.d';
import i18next from 'i18next';

    export default {
        name: 'message-box',
    }
</script>

<script setup lang="ts">
    const message = ref('');
    const showOkButton = ref(false);
    const showCancelButton = ref(false);
    const showYesButton = ref(false);
    const showNoButton = ref(false);
    const options = ref<MessageBoxOptions>({buttons: MessageBoxButtons.YES_NO});
    let modal!: Modal;
    const rootDiv = ref<HTMLDivElement>();
    const btnYes = ref<HTMLButtonElement>();
    const btnNo = ref<HTMLButtonElement>();
    const btnOk = ref<HTMLButtonElement>();
    const btnCancel = ref<HTMLButtonElement>();
    let resolvePromise!: (result: MessageBoxResult) => void;

    onMounted(() =>
    {
        rootDiv.value!.addEventListener('shown.bs.modal', shown);
    })//mounted

    function shown()
    {
        const buttonToFocus = options.value.defaultIsNo ? (
            btnNo.value ? btnNo.value :
            btnCancel.value ? btnCancel.value :
            btnOk.value!
        ) : (
            btnYes.value ? btnYes.value :
            btnOk.value!
        );
        buttonToFocus.focus();
    }//shown


    const title = computed(() =>
    {
        return options.value.title ? options.value.title : 'Stat-NG';
    })//title

    const headerClass = computed(() =>
    {
        return {
            'bg-warning': options.value?.severity === MessageBoxSeverity.WARNING,
            'bg-danger': options.value?.severity === MessageBoxSeverity.CRITICAL,
            'text-dark': options.value?.severity === MessageBoxSeverity.WARNING,
        };
    })//headerClass


    async function say(msg: string, opts: MessageBoxOptions = {})
    {
        message.value = msg;
        options.value = opts;
        showOkButton.value = true;
        showCancelButton.value = false;
        showYesButton.value = false;
        showNoButton.value = false;
        await show();
    }//say


    async function ask(msg: string, opts: MessageBoxOptions = {}): Promise<MessageBoxResult>
    {
        message.value = msg;
        options.value = {buttons: MessageBoxButtons.YES_NO, ...opts};
        showOkButton.value = options.value.buttons === MessageBoxButtons.OK_CANCEL;
        showCancelButton.value = options.value.buttons === MessageBoxButtons.OK_CANCEL || 
                                 options.value.buttons === MessageBoxButtons.YES_NO_CANCEL;
        showYesButton.value = 
        showNoButton.value = options.value.buttons === MessageBoxButtons.YES_NO || 
                             options.value.buttons === MessageBoxButtons.YES_NO_CANCEL;
        return await show();
    }//ask


    async function show(): Promise<MessageBoxResult>
    {
        if (!modal)
            modal = new Modal(rootDiv.value!, {backdrop: 'static'});
        modal.show();
        const promise = new Promise<MessageBoxResult>((resolve) => {
            resolvePromise = resolve;
        })
        const result = await promise;
        return result;
    }//show


    function close(result: MessageBoxResult | 'close')
    {
        modal!.hide();
        if (result === 'close') {
            switch (options.value.buttons) {
                case MessageBoxButtons.OK_CANCEL:
                case MessageBoxButtons.YES_NO_CANCEL: 
                    result = MessageBoxResult.CANCEL; 
                break;
            default:
                    result = MessageBoxResult.NO;
            }//switch
        }//if
        resolvePromise!(result);
    }//close

    defineExpose({say, ask});
</script>

<template>
    <div class="modal fade" tabindex="-1" ref="rootDiv">
        <div id="messageBox" class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header" :class="headerClass">
                    <h6 class="modal-title">{{title}}</h6>
                    <button type="button" class="btn-close" 
                            @click="close('close')"></button>
                </div>
                <div class="modal-body">
                    <span v-if="options.rawHtml" v-html="message"></span>
                    <span v-else>{{message}}</span>
                </div>
                <div class="modal-footer">
                    <button type="button" v-if="showOkButton" 
                        id="btnMessageBoxOk"
                        ref="btnOk"
                        class="btn btnOk"
                        :class="{'btn-primary': !options.defaultIsNo, 'btn-secondary': options.defaultIsNo}"
                        @click="close(MessageBoxResult.OK)"
                        >
                        {{ i18next.t("message-box.ok", "Ok") }}
                    </button>
                    <button type="button" v-if="showCancelButton"
                        id="btnMessageBoxCancel"
                        ref="btnCancel"
                        class="btn btnCancel"
                        :class="{'btn-primary': options.defaultIsNo, 'btn-secondary': !options.defaultIsNo}"
                        @click="close(MessageBoxResult.CANCEL)"
                        >
                        {{ i18next.t("message-box.cancel", "Cancel") }}
                    </button>
                    <button type="button" v-if="showYesButton"
                        id="btnMessageBoxYes"
                        ref="btnYes"
                        class="btn btnYes"
                        :class="{'btn-primary': !options.defaultIsNo, 'btn-secondary': options.defaultIsNo}"
                        @click="close(MessageBoxResult.YES)"
                        >
                        {{ i18next.t("message-box.yes", "Yes") }}
                    </button>
                    <button type="button" v-if="showNoButton"
                        id="btnMessageBoxNo"
                        ref="btnNo"
                        class="btn btnNo"
                        :class="{'btn-primary': options.defaultIsNo, 'btn-secondary': !options.defaultIsNo}"
                        @click="close(MessageBoxResult.NO)"
                        >
                        {{ i18next.t("message-box.no", "No") }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
