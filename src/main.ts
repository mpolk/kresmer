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

export const kresmer = createApp(Kresmer).mount('#app');
