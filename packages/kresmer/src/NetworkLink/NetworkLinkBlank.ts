/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Blank (temporary object for a link creation) - data object 
 ***************************************************************************/

import { reactive } from "vue";
import Kresmer from "../Kresmer";
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPointProxy";
import NetworkLinkClass from "./NetworkLinkClass";
import { Position } from "../Transform/Transform";

/**
 * Network Link Blank (temporary object for a link creation)
 */
export default class NetworkLinkBlank {
    /**
     * @param _class The class this Link should belong 
     *               (either Link class instance or its name)
     */
    public constructor(
        private readonly kresmer: Kresmer,
    ) {}

    public _class?: NetworkLinkClass;
    public start?: ConnectionPointProxy;
    public end = reactive<Position>({x: 0, y: 0});

    public activate(_class: NetworkLinkClass, start: ConnectionPointProxy)
    {
        this._class = _class;
        this.start = start;
        ({x: this.end.x, y: this.end.y} = start.coords);
    }//activate

    public extrude(event: MouseEvent)
    {
        ({x: this.end.x, y: this.end.y} = this.kresmer.applyScreenCTM(event));
    }//extrude

}//NetworkLinkBlank
