<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main window status bar
<*************************************************************************** -->

<script lang="ts">
    import { computed, onMounted, PropType, ref } from 'vue';
    import {StatusBarDisplayData, vueToastPane, toggleAutoAlignment, toggleSnappingToGrid, setSnappingGranularity} from './renderer-main';
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

    const drawingScaleDisplay = computed(() => {
        if (props.displayData.drawingScale >= 1) {
            return `${Math.round(props.displayData.drawingScale * 100) / 100} : 1`;
        } else {
            return `1 : ${Math.round(100 / props.displayData.drawingScale) / 100}`;
        }//if
    })//drawingScaleDisplay

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

    const snappingToGridTitle = computed(() => {
        const state = props.displayData.snapToGrid ? 
            i18next.t("status-bar.on", "on") : 
            i18next.t("status-bar.off", "off");
        return i18next.t("status-bar.snap-to-grid", {defaultValue: "Snap to grid", state});
    });

    
    function onGridControlClick(event: MouseEvent)
    {
        if (!event.ctrlKey)
            // eslint-disable-next-line vue/no-mutating-props
            props.displayData.snappingSliderVisible = !props.displayData.snappingSliderVisible;
        else {
            toggleSnappingToGrid();
            // eslint-disable-next-line vue/no-mutating-props
            props.displayData.snappingSliderVisible = false;
        }//if
    }//onGridControlClick
    
    function onSnapGranularityChange(event: Event)
    {
        const newValue = Number((event.target as HTMLInputElement).value);
        // eslint-disable-next-line vue/no-mutating-props
        props.displayData.snappingGranularity = newValue;
        setSnappingGranularity(newValue);
    }//onSnapGranularityChange

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
            <div class="pane" :title="autoAlignmentTitle" style="cursor: pointer" @click="toggleAutoAlignment">
                <span class="material-symbols-outlined align-bottom" :class="{disabled: !displayData.autoAlignVertices}"
                    >hdr_auto</span>
            </div>
            <div class="pane" :title="snappingToGridTitle" style="cursor: pointer; overflow: visible;" 
                 @click="onGridControlClick($event)">
                <span class="material-symbols-outlined align-bottom" :class="{disabled: !displayData.snapToGrid}" 
                    >grid_4x4</span>
                <div v-show="displayData.snappingSliderVisible"
                    style="position: absolute; top: -10.5rem; left: 0.3rem; height: 10rem; width: 2rem"
                    >
                    <input type="range" style="writing-mode: vertical-lr; height: 100%; vertical-align: bottom;" 
                        min="1" max="20" step="1" list="snappingValues"
                        :title="String(displayData.snappingGranularity)"
                        :value="displayData.snappingGranularity" 
                        @change="onSnapGranularityChange($event)"/>
                    <datalist id="snappingValues" class="snapping-datalist"
                        style="display: inline-flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <option value="0" label="0"></option>
                        <option value="5" label="5"></option>
                        <option value="10" label="10"></option>
                        <option value="15" label="15"></option>
                        <option value="20" label="20"></option>
                    </datalist>
                </div>
                <span class="align-bottom">{{ displayData.snappingGranularity }}</span>
            </div>
            <div class="pane" :title="drawingScaleTitle">
                <span class="align-bottom">{{drawingScaleDisplay}}</span>
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

            .snapping-datalist {
                color: rgb(69, 69, 69);
            }
        }
    }
</style>