/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Drawing Element - a base class for all things that can be placed 
 * on the drawing 
 ***************************************************************************/

import {v4 as uuidV4} from "uuid";
import { InjectionKey, reactive } from "vue";
import Kresmer from "../Kresmer";
import DrawingElementClass from "./DrawingElementClass";
import NetworkLink from "../NetworkLink/NetworkLink";
import { EditorOperation } from "../UndoStack";
import KresmerException from "../KresmerException";
import { encodeHtmlEntities, indent, toKebabCase } from "../Utils";
import ConnectionPoint from "../ConnectionPoint/ConnectionPoint";
import XMLFormatter, { XMLTag } from "../XMLFormatter";

export default abstract class DrawingElement {
    /**
     * Creates a new Drawing Element
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
        _class: DrawingElementClass,
        args?: {
            name?: string,
            dbID?: number|string|null,
            props?: Record<string, unknown>,
        }
    ) {
        this._kresmer = new WeakRef(kresmer);
        this._class = _class;
        this.props = args?.props ?? {};
        this.id = DrawingElement.nextID++;
        this._name = args?.name ? args.name : `${this._class.name}-${uuidV4()}`;
        this.dbID = (args?.dbID !== null) ? args?.dbID : undefined;
    }//ctor

    readonly _kresmer: WeakRef<Kresmer>;
    get kresmer() { return this._kresmer.deref()! }

    /** Element's class */
    protected _class: DrawingElementClass;
    /** Return the element's class */
    getClass() {return this._class}
    /** Change the element's class */
    public changeClass(newClass: DrawingElementClass)
    {
        if (newClass.constructor !== this._class.constructor) {
            throw new IncompatibleElementClassException(this, newClass);
        }//if
        this._class = newClass;
    }//changeClass

    /** Return the vue-component name corresponding to this link */
    get vueName() {return this._class.vueName}

    /** A unique ID for this component instance */
    readonly id: number;
    protected static nextID = 1;

    /** Data passed to the vue-component props */
    readonly props: Record<string, unknown>;
    /** Return the number of props (excluding "name") */
    get propCount() { return Object.getOwnPropertyNames(this.props).filter(prop => prop !== "name").length;}
    /** "Dynamic" prop values, i.e. those that came from the DB (back-end) */
    readonly dynamicPropValues = new Map<string, unknown>();
    /** Synthetic props made by merging the usual "static" props and the "dynamic" ones */
    get syntheticProps(): Record<string, unknown>
    {
        const synProps: Record<string, unknown> = {};
        for (const key in this.props) {
            synProps[key] = this.mergePropValues(key, this.props[key], this.dynamicPropValues.get(key));
        }//for
        for (const key of this.dynamicPropValues.keys()) {
            if (!(key in this.props))
                synProps[key] = this.dynamicPropValues.get(key);
        }//for
        return synProps;
    }//syntheticProps

    private mergePropValues(key: string, p1: unknown, p2: unknown)
    {
        if (typeof p2 === "undefined")
            return p1;
        if (typeof p2 !== typeof p1 || Array.isArray(p1) !== Array.isArray(p2)) {
            this.kresmer.raiseError(new KresmerException(
                `Incompatible types of the "${key}" prop static (${typeof p1}) and dynamic (${typeof p2} values)`));
            return p1;
        }//if
        if (typeof p2 !== "object" || Array.isArray(p2))
            return p2;

        const sp: Record<string, unknown> = {};
        for (const k in (<Record<string,unknown>>p1)) {
            sp[k] = this.mergePropValues(k, (<Record<string,unknown>>p1)[k], (<Record<string,unknown>>p2)[k]);
        }//for
        for (const k in (<Record<string,unknown>>p2)) {
            if (!(k in (<Record<string,unknown>>p1)))
                sp[k] = (<Record<string,unknown>>p2)[k];
        }//for

        return sp;
    }//mergePropValues

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
    static readonly ikHostElement = Symbol() as InjectionKey<DrawingElement>;

    /** Returns all connection points */
    abstract getConnectionPoints(): Array<ConnectionPoint>;
    /** Returns the connection point with the given name */
    abstract getConnectionPoint(name: string|number): ConnectionPoint|undefined;
    /** Adds a connection point with the given name or replaces the existing one */
    abstract addConnectionPoint(name: string|number, connectionPoint: ConnectionPoint): void;
    /** Update component's connection points position to the actual values */
    abstract updateConnectionPoints(): void;

    /** A collection of links connected to this drawing element */
    readonly connectedLinks = new Set<NetworkLink>();
    public registerConnectedLink(link: NetworkLink) { this.connectedLinks.add(link);}
    public unregisterConnectedLink(link: NetworkLink) { this.connectedLinks.delete(link);}


    /** Check if the name is unique (among the elements of this type) and return it if it is */
    abstract checkNameUniqueness(name: string): boolean;

    private assertNameUniqueness(name: string): string
    {
        if (!this.checkNameUniqueness(name)) {
            throw new DuplicateElementNameException(name);
        }//if
        return name;
    }//assertNameUniqueness


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
                        `DatabaseID of the drawing element must be string or integer, but got ${newDbID}!`);
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

    /** Returns the XML representation of the element props */
    public *propsToXMLOld(indentLevel: number): Generator<string>
    {
        if (Object.getOwnPropertyNames(this.props).some(prop => prop !== "name")) {
            yield `${indent(indentLevel+1)}<props>`;
            const props = this.kresmer.saveDynamicPropValuesWithDrawing ? this.syntheticProps : this.props;
            for (const propName in props) {
                let propValue: string;
                if (typeof props[propName] === "object") {
                    propValue = JSON.stringify(props[propName], undefined, 2).split("\n")
                        .map((line, i) => i ? `${indent(indentLevel+3)}${line}` : line).join("\n");
                } else {
                    propValue = String(props[propName]);
                }//if
                if (propName !== "name" && typeof propValue !== "undefined") {
                    yield `${indent(indentLevel+2)}<prop name="${toKebabCase(propName)}">${encodeHtmlEntities(propValue)}</prop>`;
                }//if
            }//for
            yield `${indent(indentLevel+1)}</props>`;
        }//if
    }//propsToXMLOld

    public propsToXML(formatter: XMLFormatter)
    {
        if (Object.getOwnPropertyNames(this.props).some(prop => prop !== "name")) {
            formatter.pushTag(new XMLTag("props"));
            const props = this.kresmer.saveDynamicPropValuesWithDrawing ? this.syntheticProps : this.props;
            for (const propName in props) {
                let propValue: string;
                if (typeof props[propName] === "object") {
                    propValue = JSON.stringify(props[propName], undefined, 2).split("\n")
                        .map((line, i) => i ? `      ${line}` : line).join("\n");
                } else {
                    propValue = String(props[propName]);
                }//if
                if (propName !== "name" && typeof propValue !== "undefined") {
                    formatter.addLine(`<prop name="${toKebabCase(propName)}">${encodeHtmlEntities(propValue)}</prop>`);
                }//if
            }//for
            formatter.popTag();
        }//if
    }//propsToXML

    /** A counter, which increment indicates that some props were changed and which may trigger some derived data updates*/
    propsUpdateIndicator = 0;

    /** Returns the element "mutable" data, i.e. the data meant to updatable from outside of Kresmer */
    public getData(): DrawingElementData
    {
        return {
            name: this._name,
            dbID: this._dbID,
            props: {...this.props},
        }
    }//getData

    /** Sets the element "mutable" data, i.e. the data meant to be updatable from outside of Kresmer */
    public setData(data: DrawingElementData)
    {
        for (const propName in data.props) {
            this.props[propName] = data.props[propName];
            this.dynamicPropValues.delete(propName);
        }//for

        if (data.props) {
            for (const propName in this.props) {
                if (data.props[propName] === undefined) {
                    delete this.props[propName];
                }//if
            }//for
        }//if

        if (data.name !== undefined) {
            this.name = data.name;
        }//if
        this.dbID = data.dbID;
        this.propsUpdateIndicator++;
    }//setData

    protected _isSelected = false;
    /** Indicates if the element is currently selected */
    get isSelected(): boolean {return this._isSelected}
    set isSelected(reallyIs: boolean) {
        this._isSelected = reallyIs;
        this.kresmer.selectedElement = reallyIs ? this : undefined;
    }//isSelected

    selectThis() {this.isSelected = true}
    /** Overridable handler for the (un)selection event (for internal use)*/
    abstract _onSelection(willBeSelected: boolean): true;

    /** References to the central collections of this type of elements (for internal use)*/
    abstract get _byNameIndex(): Map<string, number>;

    static readonly ikHighlightedConnection = Symbol() as InjectionKey<string[]>;
    readonly highlightedConnections = reactive<string[]>([]);

    propagateLinkHighlighting(connectionID: string, isHighlighted: boolean)
    {
        for (const cp of this.getConnectionPoints()) {
            cp.propagateLinkHighlightingOut(connectionID, isHighlighted);
        }//for
        if (isHighlighted)
            this.highlightedConnections.push(connectionID);
        else {
            const i = this.highlightedConnections.indexOf(connectionID);
            if (i >= 0)
                this.highlightedConnections.splice(i, 1);
        }//if
    }//propagateLinkHighlighting
}//DrawingElement


/** Element's mutable data, i.e. the data meant to updatable by the host process */
export interface DrawingElementData {
    name?: string,
    dbID?: number|string,
    props?: Record<string, unknown>, 
}//DrawingElementData


export class UpdateElementOp extends EditorOperation {

    constructor(private readonly element: DrawingElement, 
                private newData?: DrawingElementData, 
                )
    {
        super();
        this.oldData = element.getData();
    }//ctor

    private readonly oldData: DrawingElementData;

    override onCommit(): void 
    {
        if (!this.newData)
            this.newData = this.element.getData();
    }//onCommit

    override exec(): void 
    {
        if (this.newData)
            this.element.setData(this.newData);
    }//exec

    override undo(): void 
    {
        this.element.setData(this.oldData);
        this.element.propsUpdateIndicator++;
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

export class IncompatibleElementClassException extends KresmerException {
    constructor(element: DrawingElement, newClass: DrawingElementClass) {
        super(`Trying to change the element'class to the incompatible one (${newClass.name})!`,
            {source: `Element ${element.name} (${element.getClass().name})`});
    }//ctor
}//IncompatibleElementClassException