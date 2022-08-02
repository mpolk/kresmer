/**************************************************************************\
 *                          👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * ------------------------------------------------------------------------
 *                          The main class
\**************************************************************************/

import { createApp } from "vue";
import KresmerVue from "./Kresmer.vue";

export default class Kresmer {

    readonly vueKresmer: InstanceType<typeof KresmerVue>;

    constructor(mountPoint: string|HTMLElement)
    {
        this.vueKresmer = createApp(KresmerVue)
            .mount(mountPoint) as InstanceType<typeof KresmerVue>;
    }//ctor

}//Kresmer