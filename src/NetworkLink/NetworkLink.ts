/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey } from "vue";
import Kresmer from "../Kresmer";
import NetworkLinkClass from "./NetworkLinkClass";
import LinkVertex, { LinkVertexInitParams } from "./LinkVertex";
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
            from?: LinkVertexInitParams,
            to?: LinkVertexInitParams,
            vertices?: LinkVertexInitParams[],
        }
    ) {
        super(kresmer, _class instanceof NetworkLinkClass ? _class : NetworkLinkClass.getClass(_class), args);
        this.vertices.push(new LinkVertex(this, args?.from));
        args?.vertices?.forEach(initParams => this.vertices.push(new LinkVertex(this, initParams)));
        this.vertices.push(new LinkVertex(this, args?.to));
    }//ctor

    vertices: LinkVertex[] = [];

    readonly initVertices = () => {
        this.vertices.forEach(vertex => vertex.init());
    }//initVertices

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkLink>;

    override getDefaultName()
    {
        return `Link${this.id}`;
    }//getDefaultName

    public selectLink()
    {
        this.kresmer.deselectAllLinks(this);
        this.isSelected = true;
    }//selectComponent

    override set isSelected(reallyIs: boolean) {
        const shouldNotify = reallyIs != this.isSelected;
        this._isSelected = reallyIs;
        if (shouldNotify) {
            this.kresmer.onLinkSelected(this, this.isSelected);
        }//if
    }//isSelected
}//NetworkLink
