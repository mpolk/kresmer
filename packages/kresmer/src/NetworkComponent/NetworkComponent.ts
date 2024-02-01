/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element instance 
 ***************************************************************************/

import { InjectionKey, nextTick } from "vue";
import NetworkComponentClass from "./NetworkComponentClass";
import NetworkElement, {NetworkElementData} from '../NetworkElement';
import Kresmer from "../Kresmer";
import NetworkComponentController from "./NetworkComponentController";
import { EditorOperation } from "../UndoStack";
import LinkVertex from "../NetworkLink/LinkVertex";
import ConnectionPoint from "../ConnectionPoint/ConnectionPoint";
import AdjustmentHandle from "../AdjustmentHandles/AdjustmentHandle";

/**
 * Network Component - a generic network element instance 
 */
export default class NetworkComponent extends NetworkElement {
    /**
     * 
     * @param _class The class this component should belong 
     *               (either NetworkComponent class instance or its name)
     * @param args Instance creation arguments:
     *             props: translates to the vue-component props
     *             content: translates to the vue-component content (unnamed slot)
     */
    public constructor(
        kresmer: Kresmer,
        _class: NetworkComponentClass | string,
        args?: {
            name?: string,
            dbID?: number|string|null,
            props?: Record<string, unknown>,
            content?: unknown, 
        }
    ) {
        const componentClass = _class instanceof NetworkComponentClass ? _class : NetworkComponentClass.getClass(_class);
        super(kresmer, componentClass, args);
        this.content = args?.content ?? componentClass.defaultContent;
    }//ctor

    public controller?: NetworkComponentController;

    declare protected _class: NetworkComponentClass;
    override getClass(): NetworkComponentClass {
        return this._class;
    }//getClass

    /** A symbolic key for the component instance injection */
    static readonly injectionKey = Symbol() as InjectionKey<NetworkComponent>;

    /** Data passed to the vue-component content (unnamed slot) */
    readonly content: unknown;

    /** Underlying SVG element */
    svg?: SVGSVGElement;

    toString()
    {
        return `${this.name}: ${this.getClass().name}`;
    }//toString

    override checkNameUniqueness(name: string): boolean {
        return name == this.name || !this.kresmer.componentsByName.has(name);
    }//checkNameUniqueness

    propsUpdateIndicator = 0;

    override setData(data: NetworkElementData)
    {
        super.setData(data);
        this.propsUpdateIndicator++;
        this.updateConnectionPoints();
    }//setData

    /** A collection of this component connection points indexed by their names */
    private readonly connectionPoints = new Map<string, ConnectionPoint>();
    /** Returns the connection with the given name */
    getConnectionPoint(name: string|number) {return this.connectionPoints.get(String(name))}
    /** Adds a connection point with the given name or replaces the existing one */
    addConnectionPoint(name: string|number, connectionPoint: ConnectionPoint)
    {
        this.connectionPoints.set(String(name), connectionPoint);
    }//setConnectionPoint

    /** Update component's connection points position to the actual values */
    updateConnectionPoints()
    {
        this.connectionPoints.forEach(cp => cp.updatePos());
        nextTick(() => this.connectedLinks.forEach(link => link.updateConnectionPoints()));
    }//updateConnectionPoints

    /** A collection of adjustment handles used for on-the-fly editing of the numeric props */
    private readonly adjustmentHandles = new Set<AdjustmentHandle>();
    /** Adds a new AdjustmentHandle */
    addAdjustmentHandle(adjustmentHandle: AdjustmentHandle) {this.adjustmentHandles.add(adjustmentHandle)}
    /** Selects the specified adjustment handle or deselects all of them */
    selectAdjustmentHandle(handleToSelect?: AdjustmentHandle)
    {
        this.adjustmentHandles.forEach(handle => {
            if (handle === handleToSelect)
                handle.isSelected = true;
            else if (handle.isSelected)
                handle.isSelected = false;
        })//forEach
    }//selectAdjustmentHandle

    /** 
     * A collection of link vertex that were connected to this component and are temporarily disconnected
     * because of connection point deletion/recreation during the component props changing
     */
    private readonly disconnectedVertices = new Set<LinkVertex>();
    /** 
     * Saves temporarily disconnected vertex inside this component, so it would be able to reconnect when
     * its connection point is re-created
     */
    saveDisconnectedVertices(...vertices: LinkVertex[])
    {
        for (const vertex of vertices) {
            vertex.suspend();
            this.disconnectedVertices.add(vertex);
        }//for
    }//saveDisconnectedVertices
    /**
     * Restore temporarily disconnected vertices that were connected to the previous incarnation 
     * of the specified connection poiny
     * @param connectionPoint The connection for which the vertices should be restored
     */
    restoreDisconnectedVertices(connectionPoint: ConnectionPoint)
    {
        for (const vertex of this.disconnectedVertices) {
            if (vertex.initParams?.cpData?.connectionPoint == connectionPoint.name) {
                vertex.restore();
                this.disconnectedVertices.delete(vertex);
            }//if
        }//for
    }//restoreDisconnectedVertices
}//NetworkComponent


export class ChangeComponentClassOp extends EditorOperation {

    constructor(private component: NetworkComponent, private newClass: NetworkComponentClass)
    {
        super();
        this.oldClass = component.getClass();
    }//ctor

    private readonly oldClass: NetworkComponentClass;
    private detachedVertices = new Map<LinkVertex, string|number>();

    override exec(): void {
        this.component.kresmer.links.forEach(link => {
            link.vertices.forEach(vertex => {
                if (vertex.isConnected && vertex.anchor.conn!.hostElement === this.component) {
                    this.detachedVertices.set(vertex, vertex.anchor.conn!.name);
                    vertex.detach();
                }//if
            })//vertices
        })//links

        this.component.changeClass(this.newClass);
    }//exec

    override undo(): void {
        this.component.changeClass(this.oldClass);
        nextTick(() => {
            this.component.updateConnectionPoints();
            this.detachedVertices.forEach((connectionPointName, vertex) => {
                vertex.connect(this.component.getConnectionPoint(connectionPointName)!);
            });
        });
    }//undo
}//ChangeComponentClassOp

/** Network component-related functions for using in templates */
export const NetworkComponentFunctions = {
    /** Makes the full name of the port based on the unit number and the total number of units */
    $portName: function(portName: string, unitNumber?: number, nUnits?: number): string
    {
        if (!unitNumber || !nUnits || nUnits == 1)
            return portName;
        else
            return `${unitNumber}:${portName}`;
    },//$portName
}//NetworkComponentFunctions