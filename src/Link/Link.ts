/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import LinkClass from "./LinkClass";
import { NetworkElement } from '../NetworkElement';
import { Position } from "../Transform/Transform";
import ConnectionPoint from "../ConnectionPoint/ConnectionPoint";
import Kresmer from "../Kresmer";
import KresmerException from "../KresmerException";

/**
 * Network Component - a generic network element instance 
 */
export default class Link extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Lonk class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        kresmer: Kresmer,
        _class: LinkClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
            from?: string,
            to?: string,
        }
    ) {
        super(kresmer, _class instanceof LinkClass ? _class : LinkClass.getClass(_class), args);

        if (args?.from) {
            ({freeEnd: this.startPoint, connectedEnd: this.startPointConnection} = this.parseEndpoint(args.from));
        }//if
        if (args?.to) {
            ({freeEnd: this.endPoint, connectedEnd: this.endPointConnection} = this.parseEndpoint(args.to));
        }//if
    }//ctor


    private parseEndpoint(strEndpoint: string): {freeEnd?: Position, connectedEnd?: ConnectionPoint}
    {
        let matches = strEndpoint.match(/^\s*(\d+),\s*(\d+)\s*$/);
        if (matches) {
            return {freeEnd: {x: parseFloat(matches[1]), y: parseFloat(matches[2])}, connectedEnd: undefined};
        } else {
            matches = strEndpoint.match(/^(\w+):(\w+)$/);
            if (matches) {
                const component = this.kresmer.getComponentByName(matches[1]);
                if (!component) {
                    throw new KresmerException(
                        `Attempt to connect a link "${this.name}" to the non-existing component ${matches[1]}`);
                }//if
                const connectionPoint = component.connectionPoints[matches[2]];
                if (!connectionPoint) {
                    throw new KresmerException(
                        `Attempt to connect a link "${this.name}" to the non-existing connection point ${strEndpoint}`);
                }//if
                return {freeEnd: undefined, connectedEnd: connectionPoint};
            } else {
                throw new KresmerException(
                    `Invalid link endpoint specification for the link "${this.name}": "${strEndpoint}"`);
            }//if
        }//if
    }//parseEndpoint


    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<Link>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

    // Endpoints (either connected or hanging)
    startPoint?: Position; startPointConnection?: ConnectionPoint;
    endPoint?: Position;   endPointConnection?: ConnectionPoint;

}//Link