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

    const mouseCaptureTaget = ref<SVGElement>();

    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(DrawingElement.ikHostElement, props.model);
    const isEditable = inject(Kresmer.ikIsEditable);

    // eslint-disable-next-line vue/no-setup-props-destructure
    onBeforeMount(props.model.initVertices);
    onMounted(() => {
        // eslint-disable-next-line vue/no-mutating-props
        props.model.mouseCaptureTarget = mouseCaptureTaget.value!;
        props.model.updateConnectionPoints();
    });

    const areaClass = computed(() => {
        return {
            [props.model.getClass().name]: true,
            area: true,
            selected: props.model.isSelected,
            dragged: props.model.isDragged,
        }
    })//areaClass

    const cursorStyle = computed(() => {
        return {
            cursor: props.model.isDragged ? "move" : props.model.isSelected ? "default" : "pointer",
        }
    })//segmentStyle

    const areaStyle = computed(() => {
        return {
            stroke: props.model.isSelected ? props.highlightColor : props.color,
            cursor: cursorStyle.value.cursor,
        }
    })//areaStyle

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
            selected: v.isSelected && v.geometry.type !== "S" && v.geometry.type !== "T",
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
        if (event.buttons === 1 && isEditable) {
            event.preventDefault();
            props.model.startDrag(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        if (isEditable && props.model.endDrag(event)) { 
            props.model.returnFromTop();
            return;
        }//if
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && isEditable) {
            props.model.drag(event);
        }//if
    }//onMouseMove
</script>

<template>
    <g :class="areaClass">
        <path :d="path" :class="areaClass" :style="areaStyle" ref="mouseCaptureTaget"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop.prevent="onMouseMove($event)"
            @click.self="model.onClick($event)"
            @contextmenu.self="model.onRightClick($event)"
            @dblclick.self="model.onDoubleClick($event)"
            />
        <path v-for="(border, i) in model.borders" :key="`border${i}`" 
            :d="borderPathData(border)" :class="border.clazz" style="fill: none;" />
        <template v-for="(vertex, i) in model.vertices" :key="`segment${vertex.key}`">
            <path :id="segmentPathID(i)" :d="segMarkPathData(i)" :class="segmentPathClass(i)"/>
            <text class="area seg-mark" :style="segMarkStyle">
                <textPath :href="`#${segmentPathID(i)}`" startOffset="50%">{{ i }}</textPath>
            </text>
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
    }

    .seg-mark {
        dominant-baseline: ideographic; text-anchor: middle;
        cursor: default;
    }

    .segment {
        fill: none; stroke: none;
        &.selected {
            stroke: darkred !important;
            // stroke-width: 4px !important;
        }
    }
</style>