<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * Network Link Vertex - presentation code 
<*************************************************************************** -->
<script lang="ts">
    import { PropType, ref, inject, computed } from 'vue';
    import Kresmer from '../Kresmer';
    import LinkVertex from './LinkVertex';
    import ConnectionPoint from '../ConnectionPoint/ConnectionPoint.vue';
    import LinkBundle from './LinkBundle';
    import {Position} from '../Transform/Transform';

    export default {
        components: {ConnectionPoint},
    }
</script>

<script setup lang="ts">
    const linkNumberOffset = 6; //Tunable parameters

    const props = defineProps({
        model: {type: Object as PropType<LinkVertex>, required: true},
        dataLinkBundleVertex: {type: String},
    })

    const isEditable = inject(Kresmer.ikIsEditable);
    const circle = ref<HTMLElement>()!;
    const padding = ref<HTMLElement>()!;

    type LinkNumber = {
        number: number,
        pos: Position,
        clazz: LinkNumberCSSClass,
        debugInfo?: string,
    }//LinkNumber

    type LinkNumberCSSClass = Partial<Record<"top-aligned"|"bottom-aligned"|"left-aligned"|"right-aligned", boolean>>;


    const linkNumber = computed((): LinkNumber|undefined => {
        const thisVertex = props.model;
        const prevNeighbor = props.model.prevNeighbor;
        const nextNeighbor = props.model.nextNeighbor;
        if (!thisVertex.isAttachedToBundle || !prevNeighbor || !nextNeighbor)
            return undefined;
        const prevNeighborIsBundled = prevNeighbor.anchor.bundle?.baseVertex.link === thisVertex.anchor.bundle!.baseVertex.link;
        const nextNeighborIsBundled = nextNeighbor.anchor.bundle?.baseVertex.link === thisVertex.anchor.bundle!.baseVertex.link;
        if (prevNeighborIsBundled === nextNeighborIsBundled)
            return undefined;

        const bundle = props.model.anchor.bundle!.baseVertex.link as LinkBundle;
        if (!thisVertex.link.isHighlighted) {
            for (const anotherLink of bundle.getAttachedLinks()) {
                if (anotherLink !== thisVertex.link) {
                    for (const v of anotherLink.vertices) {
                        if (areAttachedNear(v, thisVertex) && 
                            (prevNeighbor.anchor.bundle?.baseVertex.link !== bundle &&
                             (areAttachedNear(v.prevNeighbor, prevNeighbor) || 
                              areAttachedNear(v.nextNeighbor, prevNeighbor)))|| 
                            (nextNeighbor.anchor.bundle?.baseVertex.link !== bundle &&
                             (areAttachedNear(v.nextNeighbor, nextNeighbor) || 
                              areAttachedNear(v.prevNeighbor, nextNeighbor) )))
                            return undefined;
                    }//for
                }//if
            }//for
        }//if
        
        const number = bundle.getLinkNumber(props.model.link);
        if (!number)
            return undefined;

        const {x: x1, y: y1} = thisVertex.coords;
        const {x: x0, y: y0} = prevNeighborIsBundled ? nextNeighbor.coords : prevNeighbor.coords;
        const bundledNeighbor = prevNeighborIsBundled ? prevNeighbor : nextNeighbor;
        const {x: x2, y: y2} = bundledNeighbor.anchor.bundle!.baseVertex.vertexNumber >= thisVertex.anchor.bundle!.baseVertex.vertexNumber ? 
                thisVertex.anchor.bundle!.baseVertex.nextNeighbor!.coords :
            thisVertex.anchor.bundle!.distance ? 
                thisVertex.anchor.bundle!.baseVertex.coords :
                thisVertex.anchor.bundle!.baseVertex.prevNeighbor!.coords;
        const r1 = {x: x0 - x1, y: y0 - y1};
        if (r1.x === 0 && r1.y === 0)
            return undefined;
        const r2 = {x: x2 - x1, y: y2 - y1};
        if (r2.x === 0 && r2.y === 0)
            return undefined;
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
        return b1 && b2 && b1.baseVertex === b2.baseVertex && Math.abs(b1.distance - b2.distance) <= 4;
    }//areAttachedNear


    function onMouseDown(event: MouseEvent)
    {
        if (event.buttons === 1 && isEditable) {
            event.preventDefault();
            props.model.startDrag(event);
        }//if
    }//onMouseDown

    function onMouseUp(event: MouseEvent)
    {
        isEditable && props.model.endDrag(event);
    }//onMouseUp

    function onMouseMove(event: MouseEvent)
    {
        if (event.buttons & 1 && isEditable) {
            props.model.drag(event);
        }//if
    }//onMouseMove

    function onMouseLeave(event: MouseEvent)
    {
        event.relatedTarget !== circle.value &&
        event.relatedTarget !== padding.value &&
        isEditable &&
        props.model.endDrag(event) && 
        props.model.link.restoreZPosition();
    }//onMouseLeave

    function onRightClick(event: MouseEvent)
    {
        props.model.onRightClick(event);
    }//onRightClick

    function onClick()
    {
        props.model.link.selectLink();
    }//onClick

    function onDoubleClick()
    {
        props.model.onDoubleClick();
    }//onDoubleClick
    
</script>

<template>
    <circle v-if="!model.link.isSelected"
        :cx="model.coords.x" :cy="model.coords.y" 
        class="vertex" :class="{connected: model.isConnected}"
        style="fill: transparent; stroke: transparent;"
        :data-link-bundle-vertex="dataLinkBundleVertex"
        />
    <ConnectionPoint v-if="!model.link.isBundle" :name="model.vertexNumber" :x="model.coords.x" :y="model.coords.y" :proxy="model.ownConnectionPoint"
        @click="onClick"
        />
    <text v-if="linkNumber?.number" class="link link-number" :class="linkNumber.clazz" :x="linkNumber.pos.x" :y="linkNumber.pos.y">
        {{ linkNumber.number }}
        <title>{{ linkNumber.debugInfo }}</title>
    </text>
    <template v-if="model.link.isSelected">
        <template v-if="model.isDragged">
            <line :x1="model.coords.x" y1="0" :x2="model.coords.x" :y2="model.link.kresmer.drawingRect.height" class="crosshair" />
            <line x1="0" :y1="model.coords.y" :x2="model.link.kresmer.drawingRect.width" :y2="model.coords.y" class="crosshair" />
        </template>
        <circle v-if="model.isDragged" ref="padding"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex padding"
            style="cursor: move; stroke: none;"
            :is-editable="isEditable"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop="onMouseMove($event)"
            @mouseleave.stop="onMouseLeave($event)"
            />
        <circle ref="circle"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="link vertex" :class="{connected: model.isConnected}"
            style="cursor: move;"
            :is-editable="isEditable"
            :data-link-bundle-vertex="dataLinkBundleVertex"
            @mousedown.stop="onMouseDown($event)"
            @mouseup.stop="onMouseUp($event)"
            @mousemove.stop="onMouseMove($event)"
            @mouseleave.stop="onMouseLeave($event)"
            @contextmenu="onRightClick($event)"
            @dblclick="onDoubleClick()"
            />
    </template>
    <Transition>
        <circle v-if="model.isBlinking" ref="blinker"
            :cx="model.coords.x" :cy="model.coords.y" 
            class="vertex blinker"
            />
    </Transition>
</template>

<style lang="scss" scoped>
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

    .v-enter-active {
        transition: opacity 0.3s ease;
    }
    .v-leave-active {
        transition: opacity 2s ease;
    }
    .v-enter-from, .v-leave-to {
        opacity: 0;
    }

    .crosshair {
        stroke: #5b5b5b;
        stroke-width: 1;
        // stroke-dasharray: 5, 5;
    }
</style>