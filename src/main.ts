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
    .registerNetworkComponentClass(
        new NetworkComponentClass(
            "YellowRectangle", 
            '<rect x="20" y="20" width="400" height="100" fill="yellow" stroke="black" stroke-width="5px" stroke-opacity="0.5"/>'
        ))
    .registerNetworkComponentClass(
        new NetworkComponentClass(
            "Text", 
            '<text x="30" y="40">Вот такой вот Кресмер</text>'
            ))
    .addNetworkComponent(new NetworkComponent("YellowRectangle"))
    .addNetworkComponent(new NetworkComponent("Text"))
    ;
