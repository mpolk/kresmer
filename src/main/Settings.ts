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

type Options<T> = {
    fileName: string,
    defaults: T
};

export default class Settings<T extends Record<string, unknown>>
{
    protected fileName: string;
    protected data: T;

    public constructor(options: Options<T>)
    {
        this.fileName = path.join(app.getPath("userData"), options.fileName);
        
        try {
            this.data = JSON.parse(fs.readFileSync(this.fileName, "utf8"));
        } catch (error) {
            this.data = options.defaults;
        }//catch
    }//ctor


    public get(key: keyof T) {
        return this.data[key];
    }//get

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public set(key: keyof T, value: any) {
        this.data[key] = value;
        fs.writeFileSync(this.fileName, JSON.stringify(this.data));
    }//set

}//Settings
