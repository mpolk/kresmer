<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * The main window status bar
<*************************************************************************** -->

<script lang="ts">
    export default {
        name: "StatusBar",
    }
</script>

<script setup lang="ts">
    import { computed, onMounted, PropType, ref } from 'vue';
    import {StatusBarDisplayData, vueToastPane} from './renderer-main';

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

    const drawingScale = computed(() => {
        if (props.displayData.drawingScale >= 1) {
            return `${Math.round(props.displayData.drawingScale * 100) / 100} : 1`;
        } else {
            return `1 : ${Math.round(100 / props.displayData.drawingScale) / 100}`;
        }//if
    })//drawingScale

    const haveNotifications = computed(() => props.displayData.notificationsCount > 0);

    defineExpose({getHeight});
</script>

<template>
    <div class="status-bar" :style="{bottom}" ref="divStatusBar">
        <div class="pane selected-element">
            {{displayData.selectedElement}}
        </div>
        <div class="pane hint">
            {{displayData.hint}}
        </div>
        <div>
            <div class="pane" title="Backend server URL currently connected">
                {{displayData.serverURL}}
            </div>
            <div class="pane" title="Drawing display scale" style="cursor: default">
                {{drawingScale}}
            </div>
            <div class="pane" :title="`Notifications (${displayData.notificationsCount})`" style="cursor: pointer">
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0.2rem 0;
        font: status-bar; 
        font-size: 0.85rem;
        color: white;
        background-color: rgb(52, 122, 250);

        .pane {
            display: inline-block;
            padding: 0 0.5rem;

            &.selected-element {
                min-width: 15rem;
            }

            &.hint {
                color: yellow;
            }

            &.right {
                float: right;
            }
        }
    }
</style>