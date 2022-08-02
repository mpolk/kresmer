/***************************************************************************\
 *                            👑 KresMer 👑
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                        Front-end main script
 ***************************************************************************/

import { createApp } from 'vue';
import initApp from './init';
import Kresmer from './Kresmer.vue';

export const kresmer = createApp(Kresmer).mount('#kresmer') as InstanceType<typeof Kresmer>;
initApp();