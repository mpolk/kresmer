/* eslint-disable @typescript-eslint/no-non-null-assertion */
/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                  Front-end main script for development
 ***************************************************************************/

import Kresmer from './Kresmer';
import NetworkComponent from './NetworkComponent/NetworkComponent';
import NetworkComponentClass from './NetworkComponent/NetworkComponentClass';

const kresmer = new Kresmer('#kresmer');

async function init() {
    const stdlib = await (await fetch("stdlib.krel")).text();
    kresmer.loadLibrary(stdlib!);
    const autoload = await (await fetch("autoload.kre")).text();
    kresmer.loadDrawing(autoload!);

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
        .placeNetworkComponent(new NetworkComponent(kresmer, "GoldenKresmer", {
                props: {
                    width: 400,
                    height: 50,
                    text: "Golden Kresmer",
                    fontSize: "32"
                }
            }), 
            {x: 30, y: 310}
        )
}
init();
