/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import Kresmer from "../Kresmer";
import KresmerException from "../KresmerException";
import NetworkLinkClass from "./NetworkLinkClass";
import LinkVertex from "./LinkVertex";
import NetworkElement from '../NetworkElement';

/**
 * Network Component - a generic network element instance 
 */
export default class NetworkLink extends NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Link class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     */
    public constructor(
        kresmer: Kresmer,
        _class: NetworkLinkClass | string,
        args?: {
            name?: string,
            props?: Record<string, unknown>,
            from?: string,
            to?: string,
        }
    ) {
        super(kresmer, _class instanceof NetworkLinkClass ? _class : NetworkLinkClass.getClass(_class), args);
        this.from = args?.from;
        this.to = args?.to;

        for (let i = 0; i < 2; i++) {
            this.vertices.push(new LinkVertex(this));
        }//for
    }//ctor

    readonly from?: string;
    readonly to?: string;
    vertices: LinkVertex[] = [];

    readonly initVertices = () => {
        this.from && this.initVertex(this.from, this.vertices[0]);
        this.to && this.initVertex(this.to, this.vertices[this.vertices.length - 1]);
    }//initVertices

    private initVertex(strData: string, vertex: LinkVertex)
    {
        let matches = strData.match(/^\s*(\d+),\s*(\d+)\s*$/);
        if (matches) {
            vertex.pinUp({x: parseFloat(matches[1]), y: parseFloat(matches[2])});
        } else {
            matches = strData.match(/^([-A-Za-z0-9_]+):([-A-Za-z0-9_]+)$/);
            if (matches) {
                const component = this.kresmer.getComponentByName(matches[1]);
                if (!component) {
                    throw new KresmerException(
                        `Attempt to connect a link "${this.name}" to the non-existing component ${matches[1]}`);
                }//if
                const connectionPoint = component.connectionPoints[matches[2]];
                if (!connectionPoint) {
                    throw new KresmerException(
                        `Attempt to connect a link "${this.name}" to the non-existing connection point ${strData}`);
                }//if
                vertex.connect(connectionPoint);
            } else {
                throw new KresmerException(
                    `Invalid link vertex specification for the link "${this.name}": "${strData}"`);
            }//if
        }//if
    }//initVertex


    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkLink>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

}//NetworkLink
