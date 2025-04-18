<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link - presentation code 
<*************************************************************************** -->

<script lang="ts">
    import { computed, onBeforeMount, PropType, provide, onMounted, CSSProperties } from 'vue';
    import NetworkLink from './NetworkLink';
    import DrawingElement from '../DrawingElement/DrawingElement';
    import LinkVertexVue from './LinkVertex.vue';
    import LinkBundle from './LinkBundle';
    
    export default {
        components: {LinkVertexVue}
    }
</script>

<script setup lang="ts">

    // Tunable parameters
    const minPlaceForSegmentLabel = 30;

    const props = defineProps({
        model: {type: Object as PropType<NetworkLink>, required: true},
        startLabel: {type: String, required: false},
        startLabelHref: {type: String, required: false},
        endLabel: {type: String, required: false},
        endLabelHref: {type: String, required: false},
        mirrorLabels: {type: Boolean, required: false},
        startMarker: {type: String, required: false},
        endMarker: {type: String, required: false},
        color: {type: String, required: false},
        highlightColor: {type: String, required: false},
        layingMethod: {type: String, required: false},
        nFibers: {type: Number, required: false},
        thickness: {type: String, required: false},
    });

    // eslint-disable-next-line vue/no-setup-props-destructure
    provide(DrawingElement.ikHostElement, props.model);

    // eslint-disable-next-line vue/no-setup-props-destructure
    onBeforeMount(props.model.initVertices);
    onMounted(() => {
        props.model.updateConnectionPoints();
        if (props.model instanceof LinkBundle)
            props.model.updateAttachedLinkVues();
    });

    const linkClass = computed(() => {
        return {
            [props.model.getClass().name]: true,
            link: true,
            selected: props.model.isSelected,
            highlighted: props.model.isHighlighted,
        }
    })//linkClass

    const linkStyle = computed(() => {
        return {
            "pointer-events": props.model.kresmer._allLinksFreezed || props.model.kresmer.backgroundEditingMode ? "none" : "auto",
        } as CSSProperties
    })//linkStyle

    const segmentClass = computed(() => {
        return {
            link: true,
            segment: true,
            selected: props.model.isSelected,
            highlighted: props.model.isHighlighted,
            thick: props.thickness === "thick",
            thin: props.thickness === "thin",
        }
    })//segmentClass

    const cursorStyle = computed(() => {
        return {
            cursor: props.model.isSelected ? "default" : "pointer",
        }
    })//segmentStyle

    const segmentStyle = computed(() => {
        const midMarker = 
            props.layingMethod === "in-canalization" ? "canalization" :
            props.layingMethod === "by-the-roofs" ? "roof" :
            props.layingMethod === "by-the-poles" ? "pole" :
                undefined;
        return {
            stroke: props.model.isHighlighted || props.model.isSelected ? props.highlightColor : props.color,
            cursor: cursorStyle.value.cursor,
            markerStart: props.startMarker ? `url(#kre:link-marker-${props.startMarker})` : undefined,
            markerEnd: props.endMarker ? `url(#kre:link-marker-${props.endMarker})` : undefined,
            markerMid: props.layingMethod ? `url(#kre:link-marker-${midMarker})` : undefined,
        }
    })//segmentStyle

    const segMarkStyle = computed(() => {
        return {
            fill: props.model.isHighlighted || props.model.isSelected ? props.highlightColor : props.color,
            cursor: "pointer",
        }
    })//segMarkStyle

    function path(reverse?: boolean)
    {
        const chunks: string[] = [];
        let prefix = "M";
        const vertices = reverse ? props.model.vertices.toReversed() : props.model.vertices;
        vertices.forEach(v => {
            chunks.push(`${prefix}${v.coords.x},${v.coords.y}`)
            prefix = "L";
            const bv1 = v.anchor.bundle?.baseVertex;
            const bv2 = v.nextNeighbour?.anchor.bundle?.baseVertex;
            const bundle = bv1?.parentElement;
            if (bundle && bundle === bv2?.parentElement) {
                const n1 = bv1.vertexNumber;
                const n2 = bv2.vertexNumber;
                if (n1 < n2) {
                    for (let i = n1 + 1; i <= n2; i++) {
                        const v1 = bundle.vertices[i];
                        chunks.push(`${prefix}${v1.coords.x},${v1.coords.y}`)
                    }//for
                } else if (n1 > n2) {
                    for (let i = n1; i > n2; i--) {
                        const v1 = bundle.vertices[i];
                        chunks.push(`${prefix}${v1.coords.x},${v1.coords.y}`)
                    }//for
                }//if
            }//if
        });
        return chunks.join(" ");
    }//path

    const pathID = `kre:link${props.model.id}path`;
    const reversePathID = `kre:link${props.model.id}reversePath`;
    const labelPathID = computed(() => props.mirrorLabels ? reversePathID : pathID);
    function segmentPathID(i: number) { return `kre:link${props.model.id}seg${i}path`; }

    function segmentDataAttr(i: number)
    {
        return props.model.isBundle ? `${props.model.name}:${i}` : undefined;
    }//segmentDataAttr

    function segmentHasPadding(i: number)
    {
        return !props.model.vertices[i-1].isAttachedToBundle || 
               !props.model.vertices[i-1].isAttachedToBundle || 
               props.model.vertices[i-1].anchor.bundle?.baseVertex.parentElement !== props.model.vertices[i].anchor.bundle?.baseVertex.parentElement;
    }//segmentHasPadding

    function segMarkPathData(i: number)
    {
        const p1 = props.model.vertices[i-1].coords, p2 = props.model.vertices[i].coords;
        return (p2.x < p1.x) ? `M${p2.x},${p2.y} L${p1.x},${p1.y}` : `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
    }//segMarkPathData

    function segmentLength(i: number)
    {
        const p1 = props.model.vertices[i-1].coords, p2 = props.model.vertices[i].coords;
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }//segmentLength
</script>

<template>
    <g :class="linkClass" :style="linkStyle"
        @mouseenter="model.onMouseEnter"
        @mouseleave="model.onMouseLeave"
        >
        <path :id="pathID" :d="path()" :class="segmentClass" style="fill: none;" :style="segmentStyle" />
        <path v-if="mirrorLabels" :id="reversePathID" :d="path(true)" style="fill: none; stroke: none" />
        <template v-if="startLabel">
            <a v-if="startLabelHref" class="link label href" :class="mirrorLabels ? 'end' : 'start'" 
               v-bind:href="model.kresmer.makeHref(startLabelHref)">
                <text>
                    <textPath :href="`#${labelPathID}`" :startOffset="mirrorLabels ? '100%' : undefined">
                        <template v-if="startMarker && !mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                            {{startLabel}}
                        <template v-if="startMarker && mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                    </textPath>
                </text>
            </a>
            <text v-else class="link label" :class="mirrorLabels ? 'end' : 'start'">
                <textPath :href="`#${labelPathID}`" :startOffset="mirrorLabels ? '100%' : undefined">
                    <template v-if="startMarker && !mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                        {{startLabel}}
                    <template v-if="startMarker && mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                </textPath>
            </text>
        </template>
        <template v-if="endLabel">
            <a v-if="endLabelHref" class="link label href" :class="mirrorLabels ? 'start' : 'end'" 
               v-bind:href="model.kresmer.makeHref(endLabelHref)">
                <text>
                    <textPath :href="`#${labelPathID}`" :startOffset="mirrorLabels ? undefined : '100%'">
                        <template v-if="endMarker && mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                            {{endLabel}}
                        <template v-if="endMarker && !mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                    </textPath>
                </text>
            </a>
            <text v-else class="link label" :class="mirrorLabels ? 'start' : 'end'">
                <textPath :href="`#${labelPathID}`" :startOffset="mirrorLabels ? undefined : '100%'">
                    <template v-if="endMarker && mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                        {{endLabel}}
                    <template v-if="endMarker && !mirrorLabels">&nbsp;&nbsp;&nbsp;&nbsp;</template>
                </textPath>
            </text>
        </template>
        <template v-for="(vertex, i) in model.vertices" :key="`segment${vertex.key}`">
            <template v-if="i">
                <line v-if="segmentHasPadding(i)" :x1="model.vertices[i-1].coords.x" :y1="model.vertices[i-1].coords.y" 
                    :x2="vertex.coords.x" :y2="vertex.coords.y" 
                    class="padding" style="stroke: transparent; fill: none;" 
                    @click.self="model.onClick(i - 1, $event)"
                    @contextmenu.self="model.onRightClick(i - 1, $event)"
                    @dblclick.self.prevent="model.onDoubleClick(i - 1, $event)"
                    :style="cursorStyle"
                    :data-link-bundle="segmentDataAttr(i-1)"
                    ><title>{{model.displayString}}</title>
                </line>
                <template v-if="nFibers && (!startLabel || i > 1) && (!endLabel || i < model.vertices.length-1) && segmentLength(i) > minPlaceForSegmentLabel">
                    <path :id="segmentPathID(i)" :d="segMarkPathData(i)" fill="none" stroke="none"/>
                    <text class="seg-mark" :style="segMarkStyle">
                        <textPath :href="`#${segmentPathID(i)}`" startOffset="50%"
                            @click.self="model.onClick(i - 1, $event)"
                            @contextmenu.self="model.onRightClick(i - 1, $event)"
                            @dblclick.self.prevent="model.onDoubleClick(i - 1, $event)"
                            >{{ `＊${nFibers}` }}</textPath>
                    </text>
                </template>
            </template>
        </template>
        <template v-for="(vertex, i) in model.vertices" :key="`vertex${vertex.key}`">
            <link-vertex-vue :model="vertex" :bundle-vertex-data-attr="segmentDataAttr(i)"/>
        </template>
    </g>
</template>

<style lang="scss">
    .link {
        .label {
            cursor: default; dominant-baseline: ideographic;
            &.start {text-anchor: start;}
            &.end {text-anchor: end;}
            &.href {cursor: pointer;}
        }
    }

    .seg-mark {
        dominant-baseline: ideographic; text-anchor: middle;
        cursor: default;
    }
</style>