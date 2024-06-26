/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2024 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *         Class implementing a connection to the backend server 
\**************************************************************************/

import KresmerException from "./KresmerException";
import DrawingElement, {DrawingElementData} from "./DrawingElement/DrawingElement";
import NetworkComponent from "./NetworkComponent/NetworkComponent";
import NetworkLink from "./NetworkLink/NetworkLink";
import Kresmer from "Kresmer";

export type BackendConnectionTestResult = {
    success: boolean,
    message?: string,
}//BackendConnectionTestResult

export default class BackendConnection {

    constructor (private readonly kresmer: Kresmer, 
                 private serverURL: string, 
                 private password?: string) {}

    private static makeHeaders(password: string|undefined)
    {
        const headers: Record<string, string> = {"Content-Type": "application/json"};

        if (password) {
            const id = window.btoa(unescape(encodeURIComponent(`Kresmer-client:${password}`)));
            headers.Authorization = `Basic ${id}`;
        }//if
        return headers;
    }//makeHeaders

    private static makeURI(...parts: (string|number)[])
    {
        return "/kresmer-api/1.0/" + parts.map(part => encodeURIComponent(String(part))).join("/");
    }//makeURI

    private makeURL(...parts: (string|number)[]) {
        return this.serverURL + BackendConnection.makeURI(...parts);
    }//makeURL

    static async testConnection(serverURL: string, password: string): Promise<BackendConnectionTestResult>
    {
        const headers = BackendConnection.makeHeaders(password);
        try {
            const response = await fetch(serverURL + BackendConnection.makeURI("test-connection"), {headers});
            if (response.ok) {
                return {success: true};
            } else {
                return {success: false, message: response.statusText}
            }//if
        } catch (error) {
            return {success: false, message: error as string};
        }//catch
    }//testConnection


    private async onDrawingElementLoaded(element: DrawingElement, type: "component"|"link")
    {
        const headers = BackendConnection.makeHeaders(this.password);
        const data = JSON.stringify(element.getData());
        this.kresmer.emit("backend-request", "started");
        try {
            const response = await fetch(this.makeURL(type, "loaded", element.dbID!, element.getClass().name), {
                method: "POST",
                headers,
                body: data,
            });
            if (!response.ok) {
                throw new KresmerException(`Error while sending a request to the backend server: ${response.statusText}`);
            }//if
            let result = false;
            const newData = await response.json() as DrawingElementData;
            if (!newData) return result;

            if (newData.name) {
                element.name = newData.name;
                result = true;
            }//if

            if (newData.props) {
                for (const [key, value] of Object.entries(newData.props)) {
                    element.props[key] = value;
                    element.dynamicPropValues.add(key);
                }//for
                result = true;
            }//if
            return result;
        } catch (error) {
            throw new KresmerException(`Error while sending a request to the backend server: ${error}`);
        } finally {
            this.kresmer.emit("backend-request", "completed");
        }//finally
    }//onDrawingElementLoaded


    async onNetworkComponentLoaded(component: NetworkComponent)
    {
        return this.onDrawingElementLoaded(component, "component");
    }//onNetworkComponentLoaded


    async onNetworkLinkLoaded(link: NetworkLink)
    {
        return this.onDrawingElementLoaded(link, "link");
    }//onNetworkLinkLoaded

}//BackendConnection