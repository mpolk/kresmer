/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Element - a base class for all things that can be placed 
 * on the drawing 
 ***************************************************************************/

import Kresmer from "./Kresmer";
import NetworkElementClass from "./NetworkElementClass";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import { EditorOperation } from "./UndoStack";
import KresmerException from "./KresmerException";
import { indent } from "./Utils";

export default abstract class NetworkElement {
    /**
     * 
     * @param _class The class this Element should belong 
     *               (either Element class instance or its name)
     * @param args Instance creation arguments:
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
        this._name = args?.name;
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

    /** A name for component lookup*/
    public _name?: string;
    get name(): string
    {
        return this.generateName(this._name);
    }//name

    set name(newName: string|undefined)
    {
        const oldName = this.name;
        if (newName) {
            this._name = newName;
        } else {
            this._name = undefined;
        }//if
        this.kresmer._onElementRename(this, oldName);
    }//set name

    public generateName(rawName: string|undefined)
    {
        if (rawName)
            return rawName;
        else
            return this.getDefaultName();
    }//generateName

    get isNamed()
    {
        return Boolean(this._name);
    }//isNamed
    abstract getDefaultName(): string;


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

        this.name = data.name;
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