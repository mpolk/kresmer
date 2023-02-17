/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *         Class implementing a connection to the backend server 
\**************************************************************************/

import KresmerException from "./KresmerException";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkLink from "./NetworkLink/NetworkLink";

export type BackendConnectionTestResult = {
    success: boolean,
    message?: string,
}//BackendConnectionTestResult

export default class BackendConnection {

    constructor (private serverURL: string, private password: string) {}

    private static makeHeaders(password: string)
    {
        const id = window.btoa(unescape(encodeURIComponent(`Kresmer-client:${password}`)));
        return new Headers({
            "Authorization": `Basic ${id}`,
        })//Headers
    }//makeHeaders

    static async testConnection(serverURL: string, password: string): Promise<BackendConnectionTestResult>
    {
        const headers = BackendConnection.makeHeaders(password);
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
        const headers = BackendConnection.makeHeaders(this.password);
        const data = JSON.stringify(component.props);
        try {
            const response = await fetch(`${this.serverURL}/component-loaded`, {
                method: "POST",
                headers,
                body: data,
            });
            return undefined;
        } catch (error) {
            // throw new KresmerException(`Error while sending a request to the backend server: ${error}`);
        }//catch
    }//onNetworkComponentLoaded


    async onNetworkLinkLoaded(link: NetworkLink)
    {
        return undefined;
    }//onNetworkLinkLoaded

}//BackendConnection