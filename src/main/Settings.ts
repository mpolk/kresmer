/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *  Dictionary for holding various setting collections and persisting them
 *  in the plain JSON files
 ***************************************************************************/

import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

type Options = {
    window: {
        width: number,
        height: number,
    },
    server: {
        url: string,
        password: string,
        autoConnect: boolean,
    },
};

type RegValue = string | number | boolean;
interface RegData {[key: string]: RegValue|RegData}

export default class Settings
{
    private fileName: string;
    private data: RegData;

    public constructor(fileName: string, private defaults: Options)
    {
        this.fileName = path.join(app.getPath("userData"), fileName);
        
        try {
            this.data = JSON.parse(fs.readFileSync(this.fileName, "utf8"));
        } catch (error) {
            this.data = defaults;
        }//catch
    }//ctor

    public get<K1 extends keyof Options, V1 extends Options[K1]>(key1: K1)
    {
        if (key1 in this.data) {
            return this.data[key1] as V1;
        } else {
            return this.defaults[key1];
        }//if
    }//get

    public get2<K1 extends keyof Options, K2 extends keyof Options[K1]>(key1: K1, key2: K2) 
    {
        if (key1 in this.data && typeof this.data[key1] === "object" && key2 in (this.data[key1] as object)) {
            return (this.data[key1] as Options[K1])[key2];
        } else {
            return this.defaults[key1][key2];
        }//if
    }//get2


    public set<K1 extends keyof Options, V1 extends Options[K1]>(key1: K1, value: V1)
    {
        this.data[key1] = value;
        this.persist();
    }//set

    public set2<K1 extends keyof Options, K2 extends keyof Options[K1], V2 extends Options[K1][K2]>
        (key1: K1, key2: K2, value: V2) 
    {
        if (key1 in this.data && typeof this.data[key1] === "object") {
            (this.data[key1] as Options[K1])[key2] = value;
        } else {
            this.data[key1] = {key2: value as RegData};
        }//if
        this.persist();
    }//set

    private persist()
    {
        fs.writeFileSync(this.fileName, JSON.stringify(this.data));
    }//persist
}//Settings
