<!-- **************************************************************************>
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 *    Ephemeral box appearing at the time of a component transformation
<*************************************************************************** -->

<script lang="ts">
    const rotationArrowSvg = `\
<svg xmlns="http://www.w3.org/2000/svg" 
    width="24px" height="24px" viewBox="0 0 24 24" fill="#000000">
    <path d="M0 0h24v24H0V0z" fill="none"/>
    <path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
</svg>`;

    const rotationArrowSvgCursor = `url("${svgToTinyDataUri(rotationArrowSvg)}") 12 12, move`;
</script>

<script setup lang="ts">
    import { computed, PropType } from 'vue';
    import svgToTinyDataUri from 'mini-svg-data-uri';
    import { TransformMode } from '../NetworkComponent/NetworkComponentController';
    import { Position, Transform } from './Transform';
    import { TransformBoxZone } from "../Transform/TransformBox";

    const props = defineProps({
        origin: {type: Object as PropType<Position>, required: true},
        bBox: {type: Object as PropType<DOMRect>, required: true},
        center: {type: Object as PropType<Position>, required: true},
        transform: {type: Object as PropType<Transform>, required: true},
        transformMode: {type: String as PropType<TransformMode>},
        applyRotation: {type: Boolean, required: true},
    });

    const inRotationMode = computed(() => props.transformMode === "rotation");

    const rx = computed(() => {
        if (!inRotationMode.value)
            return undefined;
        return Math.max(Math.min(props.bBox.width * 0.2, props.bBox.height * 0.2), 5);
    });

    const handleSize = computed(() => {
        return Math.max(Math.min(props.bBox.width, props.bBox.height) * 0.15, 5);
    });//handleSize

    const handleWidth = computed(() => {
        return handleSize.value / props.transform.scale.x;
    });//handleWidth

    const handleHeight = computed(() => {
        return handleSize.value / props.transform.scale.y;
    });//handleHeight

    function bidirArrowCursor(rotationAngle: number) {
        rotationAngle += props.transform.rotate.angle;
        
        const svg = `\
<svg
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   version="1.1"
   viewBox="0 0 24 24"
   height="24px"
   width="24px">
  <g
     fill-rule="evenodd"
     fill="none"
     stroke-width="1"
     stroke="none"
     transform="rotate(${rotationAngle} 12 12)"
     >
    <g
       fill-rule="nonzero"
       fill="#212121">
      <path
         style="fill:#212121;fill-opacity:1"
         d="M15.001,8.999 L9.004,8.999 L9.00498491,6.74982882 C9.00498491,6.09013561 8.21462601,5.75179761 7.73729401,6.20715384 L2.23356691,11.4574962 C1.92381447,11.752988 1.92382252,12.2473813 2.23358458,12.542863 L7.73731168,17.792863 L7.81957701,17.8614839 C8.30002573,18.2096102 9.00498491,17.8732037 9.00498491,17.2501712 L9.004,15 L15.001,15 L15.0015761,17.2501712 C15.0015761,17.9100665 15.792351,18.2483191 16.2695726,17.7925545 L21.7667386,12.5425545 C22.0760697,12.2471317 22.0760778,11.7532376 21.7667563,11.4578047 L16.2695902,6.20746235 C15.792375,5.75167418 15.0015761,6.08992183 15.0015761,6.74982882 L15.001,8.999 Z M3.837,12 L7.504,8.501 L7.50498491,9.74962317 C7.50498491,10.1638367 7.84077135,10.4996232 8.25498491,10.4996232 L15.7515761,10.4996232 L15.8533467,10.4927766 C16.2194222,10.4431141 16.5015761,10.1293189 16.5015761,9.74962317 L16.501,8.503 L20.162,12 L16.501,15.496 L16.5015761,14.2507192 C16.5015761,13.8365056 16.1657897,13.5007192 15.7515761,13.5007192 L8.25498491,13.5007192 L8.15321435,13.5075658 C7.78713879,13.5572282 7.50498491,13.8710234 7.50498491,14.2507192 L7.504,15.498 L3.837,12 Z" />
      <path
         d="m 16.515254,14.661606 c 0,-0.657669 -0.03033,-0.783463 -0.235368,-0.976083 -0.233472,-0.219335 -0.267782,-0.221116 -4.25992,-0.221116 -4.7723068,0 -4.4731769,-0.07452 -4.5555592,1.134891 L 7.4135598,15.345763 5.6629689,13.673953 3.912378,12.002143 5.3070367,10.665845 C 6.0740985,9.9308809 6.8733051,9.1797258 7.0830508,8.9966114 l 0.381356,-0.3329352 v 0.6578373 c 0,0.5115303 0.046877,0.7174315 0.2107708,0.9257885 l 0.2107709,0.267952 h 4.1112635 c 4.837601,0 4.518042,0.07912 4.518042,-1.1186438 0,-0.3915255 0.03432,-0.7094952 0.07627,-0.7065996 0.04195,0.0029 0.845639,0.7488236 1.785979,1.6576174 l 1.709707,1.652353 -1.785978,1.708295 -1.785979,1.708296 z"
         style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:0.10189831;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" />
    </g>
  </g>
</svg>
`;
        const url = svgToTinyDataUri(svg);
        return `url("${url}") 12 12, move`;
    }//bidirArrowCursor

    const emit = defineEmits<{
        (event: "mouse-down", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "mouse-up", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "mouse-move", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "mouse-leave", zone: TransformBoxZone, nativeEvent: MouseEvent): void,
        (event: "box-click", nativeEvent: MouseEvent): void,
        (event: "box-right-click", nativeEvent: MouseEvent): void,
    }>();
</script>

<template>
    <g  :transform="transform?.toAttr(applyRotation)">
        <rect v-bind="bBox" class="tr-box" :class="{rotated: inRotationMode}" 
            :rx="rx" vector-effect="non-scaling-stroke"
            @mousedown.stop="emit('mouse-down', 'tr-box', $event)"
            @mouseup.stop="emit('mouse-up', 'tr-box', $event)"
            @mousemove.stop="emit('mouse-move', 'tr-box', $event)"
            @mouseleave.stop="emit('mouse-leave', 'tr-box', $event)"
            @click.prevent.stop="emit('box-click', $event)"
            @contextmenu.prevent.stop="emit('box-right-click', $event)"
            />
        <template v-if="!inRotationMode">
            <rect :x="bBox.x" :y="bBox.y" :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(45)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'nw-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'nw-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'nw-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'nw-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x + bBox.width * 0.5 - handleWidth * 0.5" :y="bBox.y" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(90)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'n-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'n-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'n-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'n-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x + bBox.width - handleWidth" :y="bBox.y" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(-45)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'ne-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'ne-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'ne-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'ne-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x" :y="bBox.y + bBox.height * 0.5 - handleHeight * 0.5" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(0)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'w-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'w-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'w-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'w-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x" :y="bBox.y + bBox.height - handleHeight" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(-45)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'sw-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'sw-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'sw-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'sw-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x + bBox.width * 0.5 - handleWidth * 0.5" :y="bBox.y + bBox.height - handleHeight" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(90)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 's-handle', $event)"
                @mouseup.stop="emit('mouse-up', 's-handle', $event)"
                @mousemove.stop="emit('mouse-move', 's-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 's-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x + bBox.width - handleWidth" :y="bBox.y + bBox.height * 0.5 - handleHeight * 0.5" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(0)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'e-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'e-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'e-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'e-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <rect :x="bBox.x + bBox.width - handleWidth" :y="bBox.y + bBox.height - handleHeight" 
                :width="handleWidth" :height="handleHeight" 
                :style="{cursor: bidirArrowCursor(45)}" class="handle"
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'se-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'se-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'se-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'se-handle', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
        </template>
        <template v-else>
            <rect :x="bBox.x" :y="bBox.y" :width="bBox.width" :height="bBox.height" 
                fill="transparent" :style="{cursor: rotationArrowSvgCursor}" 
                vector-effect="non-scaling-stroke"
                @mousedown.stop="emit('mouse-down', 'rot-handle', $event)"
                @mouseup.stop="emit('mouse-up', 'rot-handle', $event)"
                @mousemove.stop="emit('mouse-move', 'rot-handle', $event)"
                @mouseleave.stop="emit('mouse-leave', 'rot-handle', $event)"
                @click.prevent.stop="emit('box-click', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
            <circle :cx="center.x" :cy="center.y" :r="Math.min(bBox.width, bBox.height) * 0.15" 
                class="hub"
                @mousedown.stop=""
                @click.prevent.stop="emit('box-click', $event)"
                @contextmenu.prevent.stop="emit('box-right-click', $event)"
                />
        </template>
    </g>
</template>

<style lang="scss">
    .tr-box {
        stroke: blue;
        stroke-width: 1.5px;
        fill: lightblue;
        fill-opacity: 0.3;
        cursor: move;
    }

    .handle {
        stroke: blue;
        stroke-width: 1px;
        fill: lightblue;
        fill-opacity: 0.3;
    }

    .hub {
        stroke: none;
        //stroke-width: 1.5px;
        fill: rgb(1, 89, 119);
        fill-opacity: 0.5;
    }
</style>
