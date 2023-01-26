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
        readonly _class: NetworkLinkClass,
        readonly start: ConnectionPointProxy,
        ) 
    {
        ({x: this.end.x, y: this.end.y} = start.coords);
    }//ctor

    readonly end = reactive<Position>({x: 0, y: 0});

    public extrude(event: MouseEvent)
    {
        ({x: this.end.x, y: this.end.y} = this.kresmer.applyScreenCTM(event));
    }//extrude


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown(_event: MouseEvent)
    {
        this.kresmer.deselectAllLinks();
    }//onMouseDown

    public onMouseUp(event: MouseEvent)
    {
        const elementsUnderCursor = document.elementsFromPoint(event.x, event.y);
        for (const element of elementsUnderCursor) {
            const connectionPointData = element.getAttribute("data-connection-point");
            if (connectionPointData) {
                const [componentName, connectionPointName] = connectionPointData.split(':');
                const component = this.kresmer.getComponentByName(componentName);
                const connectionPoint = component?.connectionPoints[connectionPointName];
                if (connectionPoint) {
                    this.kresmer._completeLinkCreation(connectionPoint);
                } else {
                    console.error('Reference to undefined connection point "%s"', connectionPointData);
                }//if
                return;
            }//if
        }//for
    }//onMouseUp

}//NetworkLinkBlank
