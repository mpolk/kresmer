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
export default abstract class NetworkElement {
    /**
     * 
     * @param _class The class this Link should belong 
     *               (either Lonk class instance or its name)
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
        this.props = args?.props;
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
    readonly props?: Record<string, unknown>;

    /** A name for component lookup*/
    readonly _name?: string;
    get name()
    {
        if (this._name)
            return this._name;
        else
            return this.getDefaultName();
    }//name
    abstract getDefaultName(): string;

    protected _isSelected = false;
    get isSelected() {return this._isSelected}
    set isSelected(reallyIs: boolean) {this._isSelected = reallyIs}
}//NetworkElement
