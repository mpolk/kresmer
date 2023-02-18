/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *         Class implementing a connection to the backend server 
\**************************************************************************/

import KresmerException from "./KresmerException";
import NetworkElement from "./NetworkElement";
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


    private async onNetworkElementLoaded(component: NetworkElement, type: "component"|"link")
    {
        const headers = BackendConnection.makeHeaders(this.password);
        const data = JSON.stringify(component.getData());
        try {
            const response = await fetch(`${this.serverURL}/${type}-loaded/${component.dbID}`, {
                method: "POST",
                headers,
                body: data,
            });
            if (!response.ok) {
                throw new KresmerException(`Error while sending a request to the backend server: ${response.statusText}`);
            }//if
            let result = false;
            const newData = JSON.parse(await response.text());

            if (newData.name) {
                component.name = newData.name;
                result = true;
            }//if

            if (newData.props) {
                for (const [key, value] of Object.entries(newData.props)) {
                    component.props[key] = value;
                }//for
                result = true;
            }//if
            return result;
        } catch (error) {
            throw new KresmerException(`Error while sending a request to the backend server: ${error}`);
        }//catch
    }//onNetworkElementLoaded


    async onNetworkComponentLoaded(component: NetworkComponent)
    {
        return this.onNetworkElementLoaded(component, "component");
    }//onNetworkComponentLoaded


    async onNetworkLinkLoaded(link: NetworkLink)
    {
        return this.onNetworkElementLoaded(link, "link");
    }//onNetworkLinkLoaded

}//BackendConnection