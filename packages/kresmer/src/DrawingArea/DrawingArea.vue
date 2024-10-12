<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * DrawingArea - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import Kresmer from '../Kresmer';
    import { computed, onBeforeMount, PropType, provide, inject, onMounted, ref } from 'vue';
    import DrawingArea, { AreaBorder } from './DrawingArea';
    import DrawingElement from '../DrawingElement/DrawingElement';
    import DrawingVertexVue from './AreaVertex.vue';
    import AreaVertex from './AreaVertex';
    import MouseEventCapture from '../MouseEventCapture';
    
    export default {
        components: { DrawingVertexVue }
    }
</script>

<script setup lang="ts">

    const props = defineProps({
        model: {type: Object as PropType<DrawingArea>, required: true},
        color: {type: String, required: false},
        highlightColor: {type: String, required: false},
    });

    const mouseCaptureTarget = ref<SVGElement>();

    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(DrawingElement.ikHostElement, props.model);
    const isEditable = inject(Kresmer.ikIsEditable);

    // eslint-disable-next-line vue/no-setup-props-destructure
    onBeforeMount(props.model.initVertices);
    onMounted(() => {
        // eslint-disable-next-line vue/no-mutating-props
        props.model.mouseCaptureTarget = mouseCaptureTarget.value!;
        props.model.updateConnectionPoints();
    });

    const areaClass = computed(() => {
        return {
            [props.model.getClass().name]: true,
            area: true,
            selected: props.model.isSelected && !props.model.borderBeingCreated.value,
            dragged: props.model.isDragged,
        }
    })//areaClass

    const highlightColor = computed(() => {
        return props.highlightColor ?? props.color;
    })//highlightColor

    const highlightFilter = computed(() => {
        return props.highlightColor ? undefined : "brightness(0.95) saturate(3)";
    })//highlightFilter

    const areaStyle = computed(() => {
        return {
            cursor: cursorStyle.value.cursor,
            stroke: props.model.isSelected ? highlightColor.value : props.color,
            strokeOpacity: props.model.isSelected ? 0.4 : 1,
            fill: props.model.isSelected ? highlightColor.value : props.color,
            fillOpacity: props.model.isSelected ? 0.7 : 1,
            filter: props.model.isSelected ? highlightFilter.value : undefined,
        }
    })//areaStyle

    const cursorStyle = computed(() => {
        return {
            cursor: props.model.isDragged ? "move" : "default",
        }
    })//segmentStyle

    const segMarkStyle = computed(() => {
        return {
            fill: props.model.isSelected ? props.highlightColor : props.color,
        }
    })//segMarkStyle

    const path = computed(() => {
        const chunks: string[] = [];
        chunks.push(`M${props.model.vertices[0].coords.x},${props.model.vertices[0].coords.y}`);

        const n = props.model.vertices.length;
        for (let i = 1; i <= n; i++) {
            const v = props.model.vertices[i%n];
            chunks.push(v.toPath());
        }//for
        // chunks.push(props.model.vertices[0].toPath());
        chunks.push("Z");
        return chunks.join(" ");
    })//path

    function segmentPathID(i: number) 
    { 
        return `kre:area${props.model.id}seg${i}path`; 
    }//segmentPathID

    function segmentPathClass(i: number) 
    {
        const i1 = (i+1) % props.model.vertices.length;
        const v = props.model.vertices[i1];
        return {
            segment: true, 
            selected: v.isSelected,
        };
    }//segmentPathClass

    function segMarkPathData(i: number)
    {
        const v1 = props.model.vertices[i], v2 = props.model.vertices[(i+1)%props.model.vertices.length];
        return `M${v1.coords.x},${v1.coords.y} ${v2.toPath(v1)}`;
    }//segMarkPathData

    function borderPathData(border: AreaBorder)
    {
        const chunks: string[] = [];
        let i = border.from;
        let v0: AreaVertex|undefined = props.model.vertices[i];
        chunks.push(`M${v0.coords.x},${v0.coords.y}`);

        const n = border.to > border.from ? border.to : border.to + props.model.vertices.length;
        for (i++; i <= n; i++) {
            const v = props.model.vertices[i % props.model.vertices.length];
            chunks.push(v.toPath(v0));
            v0 = undefined;
        }//for
        return chunks.join(" ");
    }//borderPathData

    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && isEditable && (props.model.isSelected || props.model.kresmer.selectAreasWithClick)) {
            event.preventDefault();
            props.model.kresmer.deselectAllElements(props.model).resetAllComponentModes();
            props.model.startDrag(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        if (isEditable && props.model.endDrag(event)) { 
            props.model.returnFromTop();
            return;
        }//if

        if (!props.model.isSelected && !props.model.kresmer.selectAreasWithClick)
            return;

        // eslint-disable-next-line vue/no-mutating-props
        props.model.isGoingToBeDragged = false;
        MouseEventCapture.release();
        props.model.selectThis();
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && isEditable && (props.model.isSelected || props.model.kresmer.selectAreasWithClick)) {
            props.model.drag(event);
        }//if
    }//onMouseMove

    function onSegmentClick(event: MouseEvent, segmentNumber: number)
    {
        if (props.model.borderBeingCreated.value)
            props.model.completeSettingBorder();
        else if (event.ctrlKey)
            props.model.kresmer.edAPI.addAreaVertex(props.model.id, segmentNumber, event);
        else
            // eslint-disable-next-line vue/no-mutating-props
            props.model.vertices[(segmentNumber + 1)%props.model.vertices.length].isSelected = true;
    }//onSegmentClick

    function onMouseEnterSegment(segmentNumber: number)
    {
        if (props.model.borderBeingCreated.value) {
            // eslint-disable-next-line vue/no-mutating-props
            props.model.borderBeingCreated.value.to = (segmentNumber+ 1)%props.model.vertices.length;
        }//if
    }//onMouseEnterSegment

    function onMouseLeaveSegment(segmentNumber: number)
    {
        if (props.model.borderBeingCreated.value) {
            // eslint-disable-next-line vue/no-mutating-props
            props.model.borderBeingCreated.value.to = (props.model.borderBeingCreated.value.from + 1)%props.model.vertices.length;
        }//if
    }//onMouseLeaveSegment
</script>

<template>
    <g :class="areaClass">
        <path :d="path" :class="areaClass" :style="areaStyle" ref="mouseCaptureTarget"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop.prevent="onMouseMove($event)"
            @click.self="model.onClick($event)"
            @contextmenu.self="model.onRightClick($event)"
            @dblclick.self="model.onDoubleClick($event)"
            />
        <path v-for="(border, i) in model.borders" :key="`border${i}`" 
            :d="borderPathData(border)" class="border" :class="border.clazz.name" style="fill: none;" />
        <path v-if="model.borderBeingCreated.value"
            :d="borderPathData(model.borderBeingCreated.value)" class="border" :class="model.borderBeingCreated.value.clazz.name" 
            style="fill: none;" />
        <template v-if="model.isSelected">
            <template v-for="(vertex, i) in model.vertices" :key="`segment${vertex.key}`">
                <template v-if="!model.borderBeingCreated.value">
                    <path :id="segmentPathID(i)" :d="segMarkPathData(i)" :class="segmentPathClass(i)" style="stroke-opacity: 0.2;"/>
                    <text class="area seg-mark middle" :style="segMarkStyle">
                        <textPath :href="`#${segmentPathID(i)}`" 
                            startOffset="50%">{{ i+1 }}({{ model.vertices[(i+1)%props.model.vertices.length].geometry.type }})</textPath>
                    </text>
                </template>
                <path :d="segMarkPathData(i)" class="segment-padding" 
                    @click="onSegmentClick($event, i)"
                    @contextmenu.stop="model.onRightClick($event, i)"
                    @mouseenter="onMouseEnterSegment(i)"
                    @mouseleave="onMouseLeaveSegment(i)"
                    />
            </template>
        </template>
        <template v-for="vertex in model.vertices" :key="`vertex${vertex.key}`">
            <DrawingVertexVue :model="vertex"/>
        </template>
    </g>
</template>

<style lang="scss">
    .area {
        .label {
            cursor: default; dominant-baseline: ideographic;
        }

        .seg-mark {
            dominant-baseline: ideographic;
            cursor: default;
            &.middle {
                text-anchor: middle;
            }
            &.end {
                text-anchor: end;
            }
        }

        .segment {
            fill: none; //stroke: transparent;
            // &.selected {
            //     stroke: darkred;
            //     stroke-width: 4px !important;
            // }
        }

        .segment-padding {
            fill: transparent; stroke: transparent; stroke-width: 8px;
            cursor: pointer;
        }
    }
</style>