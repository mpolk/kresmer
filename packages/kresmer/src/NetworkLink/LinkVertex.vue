<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType, computed, onUpdated, onBeforeMount, onMounted, toRef, watch } from 'vue';
    import LinkVertex from './LinkVertex';
    import {Position} from '../Transform/Transform';
    import useVertex from '../Vertex/useVertex';
    import BaseVertexVue from '../Vertex/BaseVertex.vue';

    export default {
        components: {BaseVertexVue},
    }
</script>

<script setup lang="ts">
    const linkNumberOffset = 4; //Tunable parameters

    const props = defineProps({
        model: {type: Object as PropType<LinkVertex>, required: true},
        bundleVertexDataAttr: {type: String},
    });


    const {
        padding,
        onMouseDown,
        onMouseUp,
        onMouseMove,
        onMouseLeave,
        onRightClick,
        onDoubleClick
    } = useVertex(toRef(props, "model"));

    onBeforeMount(() => props.model._updateSegmentVector());
    onMounted(() => {
        props.model._updateSegmentVector();
        props.model._setMouseCaptureTarget(padding.value!);
    });
    onUpdated(() => {
        if ((!props.model.isDragged || props.model.parentElement.kresmer.animateLinkBundleDragging) && props.model.parentElement.isBundle)
            props.model.updateSegmentVector();
    });
    watch(props.model.updateIndicator, () => {
        if ((!props.model.isDragged || props.model.parentElement.kresmer.animateLinkBundleDragging) && props.model.parentElement.isBundle)
            props.model.updateSegmentVector();
    })

    type LinkNumber = {
        number: number,
        pos: Position,
        clazz: LinkNumberCSSClass,
        debugInfo?: string,
    }//LinkNumber

    type LinkNumberCSSClass = Partial<Record<"top-aligned"|"bottom-aligned"|"left-aligned"|"right-aligned", boolean>>;

    const linkNumber = computed((): LinkNumber|undefined => {
        const thisVertex = props.model;
        const prevNeighbour = props.model.prevNeighbour;
        const nextNeighbour = props.model.nextNeighbour;
        if (!thisVertex.isAttachedToBundle || !prevNeighbour || !nextNeighbour)
            return undefined;
        const bundle = thisVertex.bundleDefinitelyAttachedTo;
        const prevNeighbourIsBundled = prevNeighbour.bundleAttachedTo === bundle;
        const nextNeighbourIsBundled = nextNeighbour.bundleAttachedTo === bundle;
        if (prevNeighbourIsBundled === nextNeighbourIsBundled)
            return undefined;
        if (thisVertex.parentElement.head.bundleAttachedTo == thisVertex.bundleDefinitelyAttachedTo ||
            thisVertex.parentElement.tail.bundleAttachedTo == thisVertex.bundleDefinitelyAttachedTo)
            return undefined;

        let avoidThisDirection: number|undefined;
        for (const v of thisVertex.anchor.bundle!.baseVertex.attachedVertices) {
            if (v === thisVertex)
                continue;
            if (!thisVertex.parentElement.isHighlighted && areAttachedNear(v, thisVertex) && (
                (prevNeighbour.anchor.bundle?.baseVertex.parentElement !== bundle &&
                    (areAttachedNear(v.prevNeighbour, prevNeighbour) || areAttachedNear(v.nextNeighbour, prevNeighbour))) || 
                (nextNeighbour.anchor.bundle?.baseVertex.parentElement !== bundle &&
                    (areAttachedNear(v.nextNeighbour, nextNeighbour) || areAttachedNear(v.prevNeighbour, nextNeighbour)))
                ))
                return undefined;
            if (areAttachedNotSoNear(v, thisVertex)) {
                if (v.anchor.bundle!.distance > thisVertex.anchor.bundle!.distance)
                    avoidThisDirection = 1;
            }//if
        }//for
        
        const number = bundle.getLinkNumber(thisVertex.parentElement);
        if (!number)
            return undefined;

        const {x: x1, y: y1} = thisVertex.coords;
        const {x: x0, y: y0} = prevNeighbourIsBundled ? nextNeighbour.coords : prevNeighbour.coords;
        const bundledNeighbour = prevNeighbourIsBundled ? prevNeighbour : nextNeighbour;
        const {x: x2, y: y2, bundleDirection} = 
            bundledNeighbour.anchor.bundle!.baseVertex.vertexNumber >= thisVertex.anchor.bundle!.baseVertex.vertexNumber ? 
                {...thisVertex.anchor.bundle!.baseVertex.nextNeighbour!.coords, bundleDirection: 1} :
            thisVertex.anchor.bundle!.distance ? 
                {...thisVertex.anchor.bundle!.baseVertex.coords, bundleDirection: -1} :
                {...thisVertex.anchor.bundle!.baseVertex.prevNeighbour!.coords, bundleDirection: -1};
        const r1 = {x: x0 - x1, y: y0 - y1};
        // if (r1.x === 0 && r1.y === 0)
        //     return undefined;
        const r2 = {x: x2 - x1, y: y2 - y1};
        // if (r2.x === 0 && r2.y === 0)
        //     return undefined;
        if (bundleDirection === avoidThisDirection) {
            r2.x = -r2.x; r2.y = -r2.y;
        }//if
        let fi1 = Math.atan2(r1.y, r1.x);
        let fi2 = Math.atan2(r2.y, r2.x);
        if (Math.abs(fi1) == Math.PI && Math.sign(fi2) !== Math.sign(fi1))
            fi1 = -fi1;
        else if (Math.abs(fi2) == Math.PI && Math.sign(fi2) !== Math.sign(fi1))
            fi2 = -fi2;
        const deltaFi = fi2 - fi1;
        let theta: number;
        if (Math.abs(deltaFi) < Math.PI/2.05) 
            theta = fi2 + (Math.PI-deltaFi)/2;
        else
            theta = fi1 + deltaFi/2;
        let clazz: LinkNumberCSSClass;
        if (theta >= Math.PI/2) 
            clazz = {"top-aligned": true, "right-aligned": true};
        else if (theta < 0 && theta >= -Math.PI/2)
            clazz = {"left-aligned": true, "bottom-aligned": true};
        else if (theta < -Math.PI/2)
            clazz = {"right-aligned": true, "bottom-aligned": true};
        else
            clazz = {"left-aligned": true, "top-aligned": true};

        const pos = {x: x1 + linkNumberOffset*Math.cos(theta), y: y1 + linkNumberOffset*Math.sin(theta)};

        const debugInfo = `\
φ1=${fi1/Math.PI*180}
φ2=${fi2/Math.PI*180}
θ=${theta/Math.PI*180}
class=${JSON.stringify(clazz)}`;
        return {number, pos, clazz, debugInfo};
    })//linkNumber

    function areAttachedNear(v1: LinkVertex|undefined, v2: LinkVertex|undefined)
    {
        const b1 = v1?.anchor.bundle;
        const b2 = v2?.anchor.bundle;
        return b1 && b2 && b1.baseVertex === b2.baseVertex && Math.abs(b1.distance - b2.distance) <= linkNumberOffset;
    }//areAttachedNear

    function areAttachedNotSoNear(v1: LinkVertex|undefined, v2: LinkVertex|undefined)
    {
        const b1 = v1?.anchor.bundle;
        const b2 = v2?.anchor.bundle;
        return b1 && b2 && b1.baseVertex === b2.baseVertex && Math.abs(b1.distance - b2.distance) <= linkNumberOffset*2.5;
    }//areAttachedNotSoNear
    
</script>

<template>
    <circle v-if="!model.parentElement.isSelected && bundleVertexDataAttr"
        :cx="model.coords.x" :cy="model.coords.y" 
        class="vertex" :class="{connected: model.isConnected}"
        style="fill: transparent; stroke: transparent;"
        :data-link-bundle-vertex="bundleVertexDataAttr"
        @mousedown.stop="onMouseDown($event)"
        @mouseup.stop="onMouseUp($event)"
        @mousemove.stop="onMouseMove($event)"
        @mouseleave.stop="onMouseLeave($event)"
        @contextmenu="onRightClick($event)"
        @dblclick="onDoubleClick()"
        />
    <BaseVertexVue :model="model" :has-connection-point="!model.parentElement.isBundle" 
                   :additional-classes="{link: true, connected: model.isConnected}"
                   :additional-attrs="{'data-link-bundle-vertex': props.bundleVertexDataAttr}"
                   >
        <text v-if="linkNumber?.number" class="link link-number" :class="linkNumber.clazz" :x="linkNumber.pos.x" :y="linkNumber.pos.y">
            {{ linkNumber.number }}
            <title>{{ linkNumber.debugInfo }}</title>
        </text>
    </BaseVertexVue>
</template>

<style lang="scss">
    .connected {
        opacity: 0.8;
        &:hover {
            opacity: 1;
        }
    }

    .link-number {
        cursor: default;
        &.top-aligned { dominant-baseline: text-before-edge;}
        // &.bottom-aligned { dominant-baseline: ideographic;}
        &.right-aligned { text-anchor: end;}
        &.left-aligned { text-anchor: start;}
    }
</style>