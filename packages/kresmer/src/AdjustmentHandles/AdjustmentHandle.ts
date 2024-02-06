/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * --------------------------------------------------------------------------
 * A proxy object for generic Adjustment Handle
 * (used for component numeric props adjustment)
\***************************************************************************/

import NetworkComponent from "../NetworkComponent/NetworkComponent";

export default abstract class AdjustmentHandle {
    constructor(readonly hostComponent: NetworkComponent, readonly targetProp: string) {}

    isSelected = false;
}//AdjustmentHandle