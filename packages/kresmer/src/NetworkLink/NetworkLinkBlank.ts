/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Blank (temporary object for a link creation) - data object 
 ***************************************************************************/
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPointProxy";
import NetworkLinkClass from "./NetworkLinkClass";
import Kresmer from "../Kresmer";

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
        readonly _class: NetworkLinkClass | string,
        readonly start: ConnectionPointProxy,
        public endX: number,
        public endY: number,
    ) {}


    public extrude(event: MouseEvent)
    {
        ({x: this.endX, y: this.endY} = this.kresmer.applyScreenCTM(event));
    }//extrude

}//NetworkLinkBlank
