/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 * Network Component - a generic network element class
 * (either an equipment unit or a link)
 ***************************************************************************/

export default class NetworkComponentClass {
    private _name: string;
    public get name() {return this._name}
    private _template: string;
    public get template() {return this._template}

    public constructor(name: string, template: string)
    {
        this._name = name;
        this._template = template;
    }//ctor

    static readonly registeredClasses: Record<string, NetworkComponentClass> = {};
    getVueName() {return "NetworkComponent_" + this.name}
}//NetworkComponentClass