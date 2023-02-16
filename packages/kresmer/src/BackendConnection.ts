/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *         Class implementing a connection to the backend server 
\**************************************************************************/

import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkLink from "./NetworkLink/NetworkLink";

export type BackendConnectionTestResult = {
    success: boolean,
    message?: string,
}//BackendConnectionTestResult

export default class BackendConnection {

    constructor (private serverURL: string, private password: string) {}

    static async testConnection(serverURL: string, password: string): Promise<BackendConnectionTestResult>
    {
        const id = btoa(`Kresmer-client:${password}`);
        const headers = new Headers({
            "Authorization": `Basic ${id}`,
        })
        try {
            const response = await fetch(`${serverURL}/test-connection`, {headers});
            if (response.ok) {
                return {success: true};
            } else {
                return {success: false, message: response.statusText}
            }//if
        } catch (error) {
            return {success: false, message: error as string};
        }//catch
    }//testConnection


    async onNetworkComponentLoaded(component: NetworkComponent)
    {
        return undefined;
    }//onNetworkComponentLoaded


    async onNetworkLinkLoaded(link: NetworkLink)
    {
        return undefined;
    }//onNetworkLinkLoaded

}//BackendConnection