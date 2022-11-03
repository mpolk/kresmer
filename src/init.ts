/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Front-end initialization script
 ***************************************************************************/

import {kresmer} from "./electron/renderer-main";
import NetworkComponent from './NetworkComponent/NetworkComponent';
import NetworkComponentClass from './NetworkComponent/NetworkComponentClass';

export default function initApp()
{
    kresmer
        .registerNetworkComponentClass(new NetworkComponentClass("GoldenKresmer", {
            template: `
            <rect x="0" y="0" :width="width" :height="height" 
                    stroke="gold" stroke-width="8px" stroke-opacity="0.5"/>
            <text :x="width*0.25" :y="height*0.6" stroke="gold" :font-size="fontSize">{{text}}</text>
            <Kre:Crown  x="10" v-bind:y="height*0.6" v-bind:font-size="fontSize"/>
            <text :x="width*0.75 + i*22" :y="height*0.6" fill="gold" :font-size="fontSize" v-for="i in 3">⚜</text>
            `,
            props: {
                width: {type: Number, required: true},
                height: {type: Number, required: true},
                fill: {type: String, default: "yellow"},
                text: {type: String},
                fontSize: {type: String},
            },
        }))
        .placeNetworkComponent(new NetworkComponent("GoldenKresmer", {
                kresmer, 
                props: {
                    width: 400,
                    height: 50,
                    text: "Golden Kresmer",
                    fontSize: "32"
                }
            }), 
            {x: 30, y: 310}
        )
        .placeNetworkComponent(new NetworkComponent("SilverKresmer", {
                kresmer, 
                props: {
                    width: 400,
                    height: 50,
                    text: "Silver Kresmer",
                    fontSize: "32"
                }
            }), 
            {x: 30, y: 380}
        )
;
}//initApp