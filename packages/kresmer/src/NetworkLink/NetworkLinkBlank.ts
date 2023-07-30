/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Link Blank (temporary object for a link creation) - data object 
 ***************************************************************************/

import { reactive } from "vue";
import Kresmer, { KresmerException } from "../Kresmer";
import ConnectionPointProxy, { parseConnectionPointData } from "../ConnectionPoint/ConnectionPointProxy";
import NetworkLinkClass, { LinkBundleClass } from "./NetworkLinkClass";
import { Position } from "../Transform/Transform";
import { LinkVertexAnchor } from "./LinkVertex";

/**
 * Network Link Blank (temporary object for a link creation)
 */
export default class NetworkLinkBlank {
    /**
     * @param _class The class this Link should belong 
     *               (either Link class instance or its name)
     */
    public constructor(
        protected readonly kresmer: Kresmer,
        readonly _class: NetworkLinkClass,
        readonly start: LinkVertexAnchor,
    ) {
        ({x: this.end.x, y: this.end.y} = start.conn ? start.conn.coords : {...start.pos!});
    }//ctor

    readonly end = reactive<Position>({x: 0, y: 0});

    public extrude(event: MouseEvent)
    {
        ({x: this.end.x, y: this.end.y} = this.kresmer.applyScreenCTM(event));
    }//extrude


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown(_event: MouseEvent)
    {
        this.kresmer.deselectAllElements(this);
    }//onMouseDown

    public onMouseUp(event: MouseEvent)
    {
        const elementsUnderCursor = document.elementsFromPoint(event.x, event.y);
        for (const element of elementsUnderCursor) {
            const connectionPointData = element.getAttribute("data-connection-point");
            if (connectionPointData) {
                const {elementName, elementType, connectionPointName} = parseConnectionPointData(connectionPointData);
                let connectionPoint: ConnectionPointProxy | undefined;
                switch (elementType) {
                    case "component": {
                        const component = this.kresmer.getComponentByName(elementName);
                        connectionPoint = component?.getConnectionPoint(connectionPointName);
                    } break;
                    case "link": {
                        const linkToConnectTo = this.kresmer.getLinkByName(elementName);
                        const vertexToConnectTo = linkToConnectTo?.vertices[connectionPointName as number];
                        connectionPoint = vertexToConnectTo?.ownConnectionPoint;
                    } break;
                }//switch
                if (connectionPoint) {
                    if (!connectionPoint.isActive)
                        continue;
                    this.kresmer._completeLinkCreation(connectionPoint);
                } else {
                    this.kresmer.raiseError(new KresmerException(
                        `Reference to undefined connection point "${connectionPointData}"`));
                }//if
                return;
            }//if
        }//for

        if (this._class instanceof LinkBundleClass)
            this.kresmer._completeLinkCreation();
    }//onMouseUp

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDoubleClick(event: MouseEvent)
    {
        this.kresmer._completeLinkCreation();
    }//onDoubleClick

}//NetworkLinkBlank
