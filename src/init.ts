/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                    Front-end initialization script
 ***************************************************************************/

import {kresmer} from "./renderer-main";
import NetworkComponent from './NetworkComponent';
import NetworkComponentClass from './NetworkComponentClass';

export default function initApp()
{
    kresmer
        .registerNetworkComponentClass(new NetworkComponentClass("Crown", {
            template: `
            <text x="0" y="0" stroke="gold" :font-size="fontSize">👑</text>
            `,
            props: {
                fontSize: {type: String},
            },
        }))
        .registerNetworkComponentClass(new NetworkComponentClass("GoldenKresmer", {
            template: `
            <rect x="0" y="0" :width="width" :height="height" 
                    stroke="gold" stroke-width="8px" stroke-opacity="0.5"/>
            <text :x="width*0.25" :y="height*0.6" stroke="gold" :font-size="fontSize">{{text}}</text>
            <Kre:Crown v--origin="{x: 10, y: height*0.6}" v--font-size="fontSize"/>
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
                props: {
                    width: 400,
                    height: 50,
                    text: "Golden Kresmer",
                    fontSize: "32"
                }
            }), 
            {x: 30, y: 310}
        )
    ;
}//initApp