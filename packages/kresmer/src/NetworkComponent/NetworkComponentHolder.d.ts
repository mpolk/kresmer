/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 * A Vue component for placing and positioning Network Components 
 * to the drawing
 * Definitions
\***************************************************************************/
import { PropType } from "vue";
import Transform, {TransformMode} from "../Transform/Transform";

export const NetworkComponentHolderProps = {
    origin: {type: Object as PropType<Position>, required: true},
    transform: {type: Object as PropType<Transform>},
    svg: {type: Object as PropType<SVGSVGElement>},
    isSelected: {type: Boolean, default: false},
    isHighlighted: {type: Boolean, default: false},
    isDragged: {type: Boolean, default: false},
    isBeingTransformed: {type: Boolean, default: false},
    transformMode: {type: String as PropType<TransformMode>},
}//NetworkComponentHolderProps
