<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main window status bar
<*************************************************************************** -->

<script lang="ts">
    import { computed, onMounted, PropType, ref } from 'vue';
    import {StatusBarDisplayData, vueToastPane} from './renderer-main';
    import i18next from 'i18next';

    export default {
        name: "StatusBar",
    }
</script>

<script setup lang="ts">
    const props = defineProps({
        displayData: {type: Object as PropType<StatusBarDisplayData>, required: true},
    });

    const divStatusBar = ref<HTMLDivElement>()!;
    const bottom = ref(0);
    let height = 0;
    function getHeight() {return height}

    function stickToBottom()
    {
        bottom.value = document.body.scrollHeight;
        height = divStatusBar.value!.clientHeight;
    }//stickToBottom

    onMounted(() => {
        stickToBottom();
        addEventListener("resize", stickToBottom);
    });

    const drawingScaleDispl = computed(() => {
        if (props.displayData.drawingScale >= 1) {
            return `${Math.round(props.displayData.drawingScale * 100) / 100} : 1`;
        } else {
            return `1 : ${Math.round(100 / props.displayData.drawingScale) / 100}`;
        }//if
    })//drawingScaleDispl

    const haveNotifications = computed(() => props.displayData.notificationsCount > 0);
    const notificationsTitle = computed(() => i18next.t("status-bar.notifications", {
        defaultValue: "Notifications",
        notificationCount: props.displayData.notificationsCount,
    }));
    const backendURLTitle = computed(() => i18next.t("status-bar.backend-url", "Backend server URL we are currently connected"));
    const drawingScaleTitle = computed(() => i18next.t("status-bar.drawing-scale", "Drawing display scale (\"ctrl-scroll\" to change)"));
    const autoAlignmentTitle = computed(() => {
        const state = props.displayData.autoAlignVertices ? 
            i18next.t("status-bar.on", "on") : 
            i18next.t("status-bar.off", "off");
        return i18next.t("status-bar.auto-alignment", {defaultValue: "Vertex auto-alignment", state});
    });

    defineExpose({getHeight});
</script>

<template>
    <div class="status-bar row gx-0 justify-content-between" :style="{bottom, left: 0}" ref="divStatusBar">
        <div class="pane selected-element col-2">
            {{displayData.selectedElement}}
        </div>
        <div class="pane hint col-6">
            {{displayData.hint}}
        </div>
        <div class="col-auto d-flex justify-content-end" :title="backendURLTitle">
            <div class="pane">
                <span class="material-symbols-outlined align-bottom" 
                    :style="`visibility: ${displayData.backendRequested ? 'visible' : 'hidden'}`"
                    >swap_vert</span>
                {{displayData.serverURL}}
            </div>
            <div class="pane" :title="autoAlignmentTitle">
                <span class="material-symbols-outlined align-bottom" :class="{disabled: !displayData.autoAlignVertices}"
                    >hdr_auto</span>
            </div>
            <div class="pane" :title="drawingScaleTitle">
                <span class="align-bottom">{{drawingScaleDispl}}</span>
            </div>
            <div class="pane" :title="notificationsTitle" style="cursor: pointer">
                <span class="material-symbols-outlined align-bottom" 
                    :class="{filled: haveNotifications}"
                    @click="vueToastPane.toggle">notifications</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    .status-bar {
        position: fixed;
        width: 100%;
        padding: 0.2rem 0;
        font: status-bar; 
        font-size: 0.85rem;
        color: white;
        background-color: rgb(52, 122, 250);

        .pane {
            position:relative;
            display: inline-block;
            padding: 0 0.5rem;
            text-overflow: ellipsis;
            text-wrap: nowrap;
            overflow: hidden;
            cursor: default;

            &.hint {
                color: yellow;
            }

            .disabled {
                color: rgb(57, 57, 192);
            }
        }
    }
</style>