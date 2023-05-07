/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *  Dictionary for holding various setting collections and persisting them
 *  in the plain JSON files
 ***************************************************************************/

import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

type RegValue = string | number | boolean | Record<string, string>[];
interface RegData {[key: string]: RegValue|RegData}

export default class Settings<Registry extends RegData>
{
    private fileName: string;
    private _data: Registry;
    get data() {return this._data}

    public constructor(fileName: string, private defaults: Registry)
    {
        this.fileName = path.join(app.getPath("userData"), fileName);
        
        try {
            this._data = JSON.parse(fs.readFileSync(this.fileName, "utf8"));
        } catch (error) {
            this._data = defaults;
        }//catch
    }//ctor

    public get<K1 extends keyof Registry, V extends Registry[K1]>(key1: K1): V;
    public get<K1 extends keyof Registry, K2 extends keyof Registry[K1], V extends Registry[K1][K2]>(key1: K1, key2: K2): V;
    public get(...keys: string[])
    {
        return this._get(this._data, keys, this.defaults);
    }//if

    private _get(data: RegData, keys: string[], defaults: RegData): RegData|RegValue
    {
        if (!(keys[0] in data) || (keys.length > 1 && typeof data[keys[0]] !== "object")) {
            return this._get(defaults, keys, defaults);
        } else if (keys.length == 1) {
            return data[keys[0]];
        } else {
            return this._get(data[keys[0]] as RegData, keys.slice(1), defaults[keys[0]] as RegData);
        }
    }//_get


    public set<K1 extends keyof Registry, V extends Registry[K1]>(key1: K1, value: V): Settings<Registry>;
    public set<K1 extends keyof Registry, K2 extends keyof Registry[K1], 
               V extends Registry[K1][K2]>(key1: K1, key2: K2, value: V): Settings<Registry>;
    public set(...args: (string|RegData|RegValue)[])
    {
        this._set(this._data, args.slice(0, -1) as string[], args[args.length - 1] as RegData|RegValue);
        this.save();
        return this;
    }//set

    private _set(data: RegData, keys: string[], newValue: RegData|RegValue)
    {
        if (keys.length == 1 || !(keys[0] in data)) {
            data[keys[0]] = newValue;
        } else {
            this._set(data[keys[0]] as RegData, keys.slice(1), newValue);
        }//if
    }//_set

    public save()
    {
        fs.writeFileSync(this.fileName, JSON.stringify(this._data));
    }//save
}//Settings
