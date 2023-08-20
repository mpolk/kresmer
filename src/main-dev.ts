/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2023 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                  Front-end main script for development
 ***************************************************************************/

import Kresmer, {NetworkComponent, NetworkComponentClass} from 'kresmer';

const kresmer = new Kresmer('#kresmer');

async function init() {
    for (const libPath of ["stdlib.krel", "lib/kresmer-art.krel", "lib/extreme.krel", "lib/cisco.krel", "lib/juniper.krel", "lib/servers.krel", "lib/patch-panels.krel"]) {
        const lib = await (await fetch(libPath)).text();
        kresmer.loadLibrary(lib!);
    }//for
    kresmer.connectToBackend("http://localhost:3333", "thegreatestsecret2");
    const autoload = await (await fetch("network-core.kre")).text();
    await kresmer.loadDrawing(autoload!);

    kresmer
        .registerNetworkComponentClass(new NetworkComponentClass("GoldenKresmer", {
            template: `
            <rect x="0" y="0" :width="width" :height="height" 
                    stroke="gold" stroke-width="8px" stroke-opacity="0.5"/>
            <text :x="width*0.25" :y="height*0.6" stroke="gold" :font-size="fontSize">{{text}}</text>
            <Kre:Crown  x="10" v-bind:y="height*0.6" v-bind:font-size="fontSize"/>
            <text :x="width*0.95" :y="height*0.6" fill="gold" :font-size="fontSize" text-anchor="end"><template v-for="i in 3">⚜</template></text>
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
                    width: 550,
                    height: 50,
                    text: "Golden Kresmer",
                    fontSize: "32"
                }
            }), 
            {x: 300, y: 585}
        )
}
init();
