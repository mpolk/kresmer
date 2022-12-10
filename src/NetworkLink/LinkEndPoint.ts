/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Link EndPoint (either connected or free)
 ***************************************************************************/

import { Position } from "../Transform/Transform";
import NetworkLink from "./NetworkLink";
import ConnectionPointProxy from "../ConnectionPoint/ConnectionPointProxy";

/** Link EndPoint (either connected or free) */

export default class LinkEndPoint {
    private _isPinnedUp = false;
    private _isConnected = false;
    pos?: Position;
    conn?: ConnectionPointProxy; 
    link: NetworkLink;

    constructor(link: NetworkLink)
    {
        this.link = link;
    }//ctor

    pinUp(pos: Position)
    {
        this.pos = {...pos};
        this._isPinnedUp = true;
        this._isConnected = false;
    }//pinUp

    connect(connectionPoint: ConnectionPointProxy)
    {
        this.conn = connectionPoint;
        this._isPinnedUp = false;
        this._isConnected = true;
    }//connect

    get coords(): Position
    {
        if (this._isPinnedUp) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.pos!;
        } else if (this._isConnected) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.conn!.coords;
        } else {
            return {x: this.link.kresmer.drawingRect.width/2, y: this.link.kresmer.drawingRect.height/2};
        }//if
    }//endPointCoords
}//LinkEndPoint
