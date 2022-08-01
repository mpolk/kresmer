/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                     Electron renderer main script
 ***************************************************************************/

import { createApp } from 'vue';
// import App from './App.vue';
import Kresmer from './Kresmer.vue';
import NetworkComponent from './NetworkComponent';
import NetworkComponentClass from './NetworkComponentClass';

export const kresmer = createApp(Kresmer).mount('#app') as InstanceType<typeof Kresmer>;
kresmer
    .registerNetworkComponentClass(new NetworkComponentClass("YellowRectangle", {
            template: '<rect :x="x" :y="y" :width="width" :height="height" :fill="fill" stroke="black" stroke-width="5px" stroke-opacity="0.5"/>',
            props: {
                width: {type: Number, required: true},
                height: {type: Number, required: true},
                fill: {type: String, default: "yellow"}
            },
        }))
    .registerNetworkComponentClass(new NetworkComponentClass("Text", {
            template: '<text :x="x" :y="y"><slot></slot></text>',
        }))
    .placeNetworkComponent(new NetworkComponent("YellowRectangle", {
            props: {
                width: 700,
                height: 50,
                fill: "lightgreen"
            }
        }), 
        {x: 30, y: 30}
    )
    .placeNetworkComponent(new NetworkComponent("Text", {
            content: 'Вот такой вот Кресмер...\n(почему-то зеленый, а не желтый)',
        }),
        {x: 50, y: 60}
    )
    ;
