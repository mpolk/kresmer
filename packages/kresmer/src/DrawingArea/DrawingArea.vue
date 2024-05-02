<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * DrawingArea - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import { computed, onBeforeMount, PropType, provide, onMounted } from 'vue';
    import DrawingArea from './DrawingArea';
    import DrawingElement from '../DrawingElement/DrawingElement';
    import DrawingVertexVue from './AreaVertex.vue';
    
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

    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(DrawingElement.ikHostElement, props.model);

    // eslint-disable-next-line vue/no-setup-props-destructure
    onBeforeMount(props.model.initVertices);
    onMounted(() => {
        props.model.updateConnectionPoints();
    });

    const areaClass = computed(() => {
        return {
            [props.model.getClass().name]: true,
            area: true,
            selected: props.model.isSelected,
        }
    })//areaClass

    const cursorStyle = computed(() => {
        return {
            cursor: props.model.isSelected ? "default" : "pointer",
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
        let prefix = "M";
        props.model.vertices.forEach(v => {
            chunks.push(`${prefix}${v.coords.x},${v.coords.y}`)
            prefix = "L";
        });
        chunks.push("Z");
        return chunks.join(" ");
    })//path

    function segmentPathID(i: number) { return `kre:area${props.model.id}seg${i}path`; }

    function segMarkPathData(i: number)
    {
        const p1 = props.model.vertices[i].coords, p2 = props.model.vertices[(i+1)%props.model.vertices.length].coords;
        return (p2.x < p1.x) ? `M${p2.x},${p2.y} L${p1.x},${p1.y}` : `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
    }//segMarkPathData
</script>

<template>
    <g :class="areaClass">
        <path :d="path" :class="areaClass" :style="areaStyle" 
            @click.self="model.onClick($event)"
            @contextmenu.self="model.onRightClick($event)"
            @dblclick.self="model.onDoubleClick($event)"
            />
        <template v-for="(vertex, i) in model.vertices" :key="`segment${vertex.key}`">
            <line 
                :x1="vertex.coords.x" :y1="vertex.coords.y" 
                :x2="model.vertices[(i+1)%model.vertices.length].coords.x" :y2="model.vertices[(i+1)%model.vertices.length].coords.y" 
                class="padding" style="stroke: transparent; fill: none;" 
                @click.self="model.onClick($event, i)"
                @contextmenu.self="model.onRightClick($event, i)"
                @dblclick.self="model.onDoubleClick($event, i)"
                :style="cursorStyle"
                >
                <title>{{model.displayString}}</title>
            </line>
            <path :id="segmentPathID(i)" :d="segMarkPathData(i)" fill="none" stroke="none"/>
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
</style>