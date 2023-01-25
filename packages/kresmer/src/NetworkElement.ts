/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Element - a base class for all things that can be placed 
 * on the drawing 
 ***************************************************************************/

import Kresmer from "./Kresmer";
import NetworkElementClass from "./NetworkElementClass";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import { EditorOperation } from "./UndoStack";
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
            props?: Record<string, unknown>,
        }
    ) {
        this.kresmer = kresmer;
        this._class = _class;
        this.props = args?.props ?? {};
        this.id = NetworkElement.nextID++;
        this._name = args?.name;
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

    /** A name for component lookup*/
    public _name?: string;
    get name(): string
    {
        if (this._name)
            return this._name;
        else
            return this.getDefaultName();
    }//name

    set name(newName: string|undefined)
    {
        const oldName = this.name;
        this._name = newName;
        this.kresmer._onElementRename(this, oldName);
    }//set name

    get isNamed()
    {
        return Boolean(this._name);
    }//isNamed
    abstract getDefaultName(): string;

    protected _isSelected = false;
    get isSelected() {return this._isSelected}
    set isSelected(reallyIs: boolean) {this._isSelected = reallyIs}
}//NetworkElement


export class UpdateElementOp extends EditorOperation {

    constructor(private readonly element: NetworkElement, 
                private readonly newProps: Record<string, unknown>, 
                private readonly newName?: string)
    {
        super();
        this.oldProps = {...element.props};

        if (this.newName !== undefined) {
            this.oldName = this.element._name;
        }//if
    }//ctor

    private readonly oldProps: Record<string, unknown>;
    private readonly oldName?: string;

    override exec(): void 
    {
        for (const propName in this.newProps) {
            this.element.props[propName] = this.newProps[propName];
        }//for

        if (this.newName !== undefined) {
            this.element.name = this.newName;
        }//if

        if (this.element instanceof NetworkComponent) {
            this.element.updateConnectionPoints();
        }//if
    }//exec

    override undo(): void 
    {
        for (const propName in this.oldProps) {
            this.element.props[propName] = this.oldProps[propName];
        }//for

        if (this.newName !== undefined) {
            this.element.name = this.oldName;
        }//if

        if (this.element instanceof NetworkComponent) {
            this.element.updateConnectionPoints();
        }//if
    }//undo

}//UpdateElementOp