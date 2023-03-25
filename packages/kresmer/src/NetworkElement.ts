/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Element - a base class for all things that can be placed 
 * on the drawing 
 ***************************************************************************/

import {v4 as uuidV4} from "uuid";
import { InjectionKey } from "vue";
import Kresmer from "./Kresmer";
import NetworkElementClass from "./NetworkElementClass";
import { EditorOperation } from "./UndoStack";
import KresmerException from "./KresmerException";
import { indent } from "./Utils";
import ConnectionPointProxy from "./ConnectionPoint/ConnectionPointProxy";

export default abstract class NetworkElement {
    /**
     * Creates a new Network Element
     * @param kresmer The Kresmer instance this element belongs to
     * @param _class The class this Element should belong 
     *               (either Element class instance or its name)
     * @param args Instance creation arguments:
     *             name: the name of the element
     *             dbID: the ID of the corresponding database entity
     *             props: translates to the vue-component props
     */
     public constructor(
        kresmer: Kresmer,
        _class: NetworkElementClass,
        args?: {
            name?: string,
            dbID?: number|string|null,
            props?: Record<string, unknown>,
        }
    ) {
        this.kresmer = kresmer;
        this._class = _class;
        this.props = args?.props ?? {};
        this.id = NetworkElement.nextID++;
        this._name = args?.name ? 
            this.assertNameUniqueness(args.name) : 
            `${this.getNamePrefix()}-${uuidV4()}`;
        this.dbID = (args?.dbID !== null) ? args?.dbID : undefined;
    }//ctor

    readonly kresmer: Kresmer;
    /** Element class */
    readonly _class: NetworkElementClass;
    getClass() {return this._class}
    /** Return the vue-component name corresponding to this link */
    get vueName() {return this._class.vueName}

    /** A unique ID for this component instance */
    readonly id: number;
    protected static nextID = 1;

    /** Data passed to the vue-component props */
    readonly props: Record<string, unknown>;
    /** Return the number of props (excluding "name") */
    get propCount() { return Object.getOwnPropertyNames(this.props).filter(prop => prop !== "name").length;}

    private _name: string;
    /** A name for component lookup*/
    get name(): string
    {
        return this._name;
    }//name

    set name(newName: string)
    {
        const oldName = this.name;
        if (newName == oldName) {
            return;
        }//if

        if (!newName) {
            throw new EmptyElementNameException();
        }//if
        
        this._name = this.assertNameUniqueness(newName);
        this.kresmer._onElementRename(this, oldName);
    }//set name

    /** A symbolic key for the component instance injection */
    static readonly ikHostElement = Symbol() as InjectionKey<NetworkElement>;

    /** A collection of this component connection points indexed by their names */
    protected readonly connectionPoints: Record<string|number, ConnectionPointProxy> = {};
    /** Returns the connection with the given name */
    getConnectionPoint(name: string|number) {return this.connectionPoints[name]}
    /** Adds a connection point with the given name or replaces the existing one */
    setConnectionPoint(name: string|number, connectionPoint: ConnectionPointProxy)
    {
        this.connectionPoints[name] = connectionPoint;
    }//setConnectionPoint

    /** Update component's connection points position to the actual values */
    public updateConnectionPoints()
    {
        for (const name in this.connectionPoints) {
            this.connectionPoints[name].updatePos();
        }//for
    }//updateConnectionPoints

    /** Check if the name is unique (among the elements of this type) and return it if it is */
    abstract checkNameUniqueness(name: string): boolean;

    private assertNameUniqueness(name: string): string
    {
        if (!this.checkNameUniqueness(name)) {
            throw new DuplicateElementNameException(name);
        }//if
        return name;
    }//assertNameUniqueness

    /** Returns the prefix for the automatic name generation for the elements of this type v*/
    protected abstract getNamePrefix(): string;


    protected _dbID?: number|string;
    /** A unique element ID for binding to the matching database entity */
    public get dbID() {return this._dbID}
    public set dbID(newDbID: number|string|undefined)
    {
        switch (typeof newDbID) {
            case "string": {
                if (!newDbID) {
                    newDbID = undefined;
                } else {
                    const n = parseInt(newDbID);
                    if (!isNaN(n)) {
                        newDbID = n;
                    }//if
                }//if
                break;
            }
            case "undefined":
                break;
            default:
                if (!Number.isInteger(newDbID)) {
                    throw new KresmerException(
                        `DatabaseID of the network element must be string or integer, but got ${newDbID}!`);
                }//if
        }//switch

        const isDup = newDbID !== undefined && (
            Array.from(this.kresmer.networkComponents.values())
                .find(controller => controller.component._dbID == newDbID && controller.component.id !== this.id) ||
            Array.from(this.kresmer.links.values())
                .find(link => link._dbID == newDbID && link.id !== this.id));
        if (isDup) {
            throw new KresmerException(`Duplicate dbID: ${newDbID}`);
        }//if
        
        this._dbID = newDbID;
    }//dbID


    public *propsToXML(indentLevel: number)
    {
        if (Object.getOwnPropertyNames(this.props).filter(prop => prop !== "name").length) {
            yield `${indent(indentLevel+1)}<props>`;
            for (const propName in this.props) {
                const propValue = this.props[propName];
                if (propName !== "name" && typeof propValue !== "undefined") {
                    yield `${indent(indentLevel+2)}<prop name="${propName}">${propValue}</prop>`;
                }//if
            }//for
            yield `${indent(indentLevel+1)}</props>`;
        }//if
    }//propsToXML

    public getData(): NetworkElementData
    {
        return {
            name: this._name,
            dbID: this._dbID,
            props: {...this.props},
        }
    }//getData

    public setData(data: NetworkElementData)
    {
        for (const propName in data.props) {
            this.props[propName] = data.props[propName];
        }//for

        if (data.name !== undefined) {
            this.name = data.name;
        }//if
        this.dbID = data.dbID;
    }//setData

    protected _isSelected = false;
    get isSelected() {return this._isSelected}
    set isSelected(reallyIs: boolean) {
        this._isSelected = reallyIs;
        this.kresmer.selectedElement = reallyIs ? this : undefined;
    }//isSelected
}//NetworkElement


export interface NetworkElementData {
    name?: string,
    dbID?: number|string,
    props?: Record<string, unknown>, 
}//NetworkElementData


export class UpdateElementOp extends EditorOperation {

    constructor(private readonly element: NetworkElement, 
                private readonly newData: NetworkElementData, 
                )
    {
        super();
        this.oldData = element.getData();
    }//ctor

    private readonly oldData: NetworkElementData;

    override exec(): void 
    {
        this.element.setData(this.newData);
    }//exec

    override undo(): void 
    {
        this.element.setData(this.oldData);
    }//undo

}//UpdateElementOp


export class EmptyElementNameException extends KresmerException {
    constructor() {
        super("Element name cannot be empty!");
    }//ctor
}//EmptyElementNameException

export class DuplicateElementNameException extends KresmerException {
    constructor(name: string) {
        super(`Duplicate element name: ${name}`);
    }//ctor
}//DuplicateElementNameException